import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { gotoReady, openStageMenu } from './ready';

/**
 * Навчальні заклади — `/projects/galaxy-graduates/institutions/`.
 *
 * ## Що саме тут стережеться
 *
 * Розділ з'явився на прохання автора: «на сторінці буде список тих наших
 * випускників, які вступили до цього навчального закладу, і рік вступу». Доти
 * заклад існував лише рядком у полі «Після випуску» окремої анкети — «КНУТКіТ,
 * акторський, курс Д. Богомазова», — і з такого рядка не було видно, що до
 * КНУТКіТ вступили СЕМЕРО.
 *
 * Тому перевіряється не «сторінка відкривається», а чотири речі, кожна з яких
 * ламається окремо:
 *
 *   1. У переліку РІВНО стільки карток, скільки закладів у реєстрі. Число
 *      береться з тих самих даних, що й сторінка: вписане сюди, воно застаріло
 *      б на першому ж новому закладі й почало брехати.
 *   2. Вхід із галактики існує. Без нього сторінка стає недосяжною, і — на
 *      наступній збірці — просто зникає: `prerender` знаходить її ПО
 *      ПОСИЛАННЮ, у `svelte.config.js` її немає (як немає й вистав із
 *      фестивалями).
 *   3. На сторінці закладу стоять усі його студенти, і в кожного видно рік
 *      вступу — те саме, що просив автор.
 *   4. Картка людини відкривається НА МІСЦІ, а не переходом у галактику: читач
 *      прийшов дивитися заклад, і перехід забирав би його зі сторінки, з якої
 *      він щойно почав. Адреса при цьому змінюється — і це не суперечність, а
 *      поверхневий перехід; розбір біля самої перевірки.
 *
 * ## Чому ще й «незіставлені»
 *
 * Троє зі сімнадцяти студентів реєстру випускників невідомі
 * (`DATA-QUESTIONS.md` § 8.3), і сторінка ОТХФК показує двох таких ТЕКСТОМ. Це
 * і є та перевірка, яку легко втратити: викинути незіставлених — і сторінка
 * покаже нуль людей, хоч ми знаємо двох, причому без жодної помилки в даних.
 *
 * ## Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1)
 *
 * Прибрати посилання «Навчальні заклади» з панелі сцени — впаде друга
 * перевірка. Показати в переліку лише заклади зі студентами реєстру (тобто
 * викинути ОТХФК і ОФКМ) — упаде перша й назве обидва числа. Замінити
 * `openGraduateModal` на звичайне посилання в галактику — впаде четверта:
 * заголовок закладу зникне з екрана. Прибрати рік із підпису — впаде третя.
 */

/*
 * Дані читаються з ФАЙЛУ, а не імпортуються, — так само, як у переліку вистав:
 * Playwright виконує специфікації як ESM, і статичний імпорт JSON вимагав би
 * `with { type: 'json' }`, синтаксису, якого решта проєкту не вживає. Сам
 * `data/institutions.ts` тут узагалі недосяжний: він імпортує `$app/types`.
 */
const ЗАКЛАДИ = JSON.parse(readFileSync('src/lib/data/institutions.data.json', 'utf8')) as
	ReadonlyArray<{
		slug: string;
		name: string;
		students: ReadonlyArray<{ id: string; year: number }>;
		unlistedStudents?: ReadonlyArray<{ name: string; year: number }>;
	}>;

const ПЕРЕЛІК = '/projects/galaxy-graduates/institutions';

/*
 * Посилання на заклад у БУДЬ-ЯКОМУ режимі показу: у хронології та списку це
 * рядок, у плитці — картка. Перевірки міряють досяжність сторінок, а не обраний
 * вигляд, тож і добірка мусить бути спільною — те саме рішення, що в переліку
 * вистав.
 */
const ПОСИЛАННЯ =
	'[data-testid^="galaxy-institutions-row-link-"], [data-testid^="galaxy-institutions-card-"]';
const НАЙБІЛЬШИЙ = [...ЗАКЛАДИ].sort(
	(a, b) =>
		b.students.length +
		(b.unlistedStudents?.length ?? 0) -
		(a.students.length + (a.unlistedStudents?.length ?? 0))
)[0];

test.describe('навчальні заклади', () => {
	test('перелік показує всі заклади реєстру, найбільший перший', async ({ page }) => {
		await gotoReady(page, ПЕРЕЛІК);

		await expect(page.getByTestId('galaxy-institutions-title')).toBeVisible();

		/*
		 * Типовий режим — ПЛИТКА, як просив автор: рік у закладів слабка вісь (у
		 * другого поспіль його немає взагалі), а записів 38 — поле карток
		 * читається цілком. Перевірка тут, а не в гейті: типовий режим живе в
		 * сховищі, і побачити його можна лише в чистому браузері.
		 */
		await expect(
			page.getByTestId('galaxy-institutions-view-btn-tiles'),
			'перелік закладів відкрився не плиткою'
		).toHaveAttribute('aria-pressed', 'true');

		const карток = await page.locator(ПОСИЛАННЯ).count();
		expect(
			карток,
			`у переліку ${карток} закладів, а в реєстрі ${ЗАКЛАДИ.length} — ` +
				'частина сторінок недосяжна з переліку'
		).toBe(ЗАКЛАДИ.length);

		await expect(page.getByTestId('galaxy-institutions-total-count')).toHaveText(
			String(ЗАКЛАДИ.length)
		);

		/*
		 * Порядок — за кількістю людей, а не за абеткою: заклад із сімома
		 * вступниками й заклад з одним мають різну вагу в історії школи. Абетка
		 * поставила б першим «École de culture générale» з одним.
		 */
		/*
		 * Порядок перевіряється в ПЛИТЦІ — і саме нею перелік і відкривається:
		 * у хронології рядки стоять за роком вступу, і «найбільший перший» там не
		 * діє й не мусить.
		 */
		await expect(
			page.locator('[data-testid^="galaxy-institutions-card-"]').first(),
			'перелік не починається з найбільшого закладу — порядок став абеткою'
		).toHaveAttribute('data-testid', `galaxy-institutions-card-${НАЙБІЛЬШИЙ.slug}`);
	});

	test('вхід у розділ є на сцені галактики', async ({ page }) => {
		await gotoReady(page, '/projects/galaxy-graduates');
		await openStageMenu(page);

		const посилання = page.getByTestId('galaxy-institutions-link');
		await expect(
			посилання,
			'на сцені немає входу в заклади — розділ недосяжний, а збірка його не знайде'
		).toBeVisible();

		await посилання.click();
		await expect(page.getByTestId('galaxy-institutions-title')).toBeVisible();
	});

	test('сторінка закладу показує всіх студентів із роком вступу', async ({ page }) => {
		await gotoReady(page, `${ПЕРЕЛІК}/${НАЙБІЛЬШИЙ.slug}`);

		await expect(page.getByTestId('institution-title')).toHaveText(НАЙБІЛЬШИЙ.name);

		const картки = page.locator('[data-testid^="institution-student-card-"]');
		expect(
			await картки.count(),
			`студентів на сторінці менше, ніж у реєстрі закладу (${НАЙБІЛЬШИЙ.students.length})`
		).toBe(НАЙБІЛЬШИЙ.students.length);

		/*
		 * Рік — головне, чого просив автор, і саме він губиться найтихіше: підпис
		 * складається з чотирьох частин, і достатньо переставити місцями поля,
		 * щоб лишилися напрям і майстер.
		 */
		const роки = new Set(НАЙБІЛЬШИЙ.students.map((s) => String(s.year)));
		const текст = (await картки.first().innerText()).replace(/\s+/g, ' ');
		expect(
			[...роки].some((рік) => текст.includes(рік)),
			`у підписі студента немає року вступу: «${текст}»`
		).toBe(true);
	});

	/*
	 * «На місці» — це про СТОРІНКУ, а не про адресу, і перша редакція цього
	 * тесту переплутала одне з одним: вона вимагала, щоб адреса не змінилася, і
	 * впала. Адреса змінюється навмисно — `openGraduateModal` робить `pushState`
	 * на особисту сторінку людини, щоб посилання на відкриту картку можна було
	 * скопіювати, а «назад» її закривало (розбір — у докблоці
	 * `services/graduateModal.svelte.ts`). Так само поводяться сторінки груп,
	 * майстрів і фестивалів.
	 *
	 * Тому міряється те, що відрізняє поверхневий перехід від справжнього:
	 * заголовок закладу мусить лишитися НА ЕКРАНІ, поки картка відкрита.
	 * Справжній перехід у галактику зняв би його разом зі сторінкою.
	 */
	test('картка студента відкривається на місці, а не переходом у галактику', async ({ page }) => {
		await gotoReady(page, `${ПЕРЕЛІК}/${НАЙБІЛЬШИЙ.slug}`);

		await page.locator('[data-testid^="institution-student-card-"]').first().click();

		await expect(
			page.getByTestId('galaxy-card-modal'),
			'картка не відкрилася — натискання нікуди не веде'
		).toBeVisible();
		await expect(
			page.getByTestId('institution-title'),
			'сторінка закладу зникла — натискання виявилося справжнім переходом'
		).toHaveText(НАЙБІЛЬШИЙ.name);

		/* Назад — картка зникає, сторінка закладу лишається тією самою. */
		await page.goBack();
		await expect(page.getByTestId('galaxy-card-modal')).toBeHidden();
		await expect(page.getByTestId('institution-title')).toHaveText(НАЙБІЛЬШИЙ.name);
	});

	test('незіставлені студенти показані текстом, а не викинуті', async ({ page }) => {
		const заклад = ЗАКЛАДИ.find((i) => (i.unlistedStudents?.length ?? 0) > 0);
		expect(заклад, 'у реєстрі немає незіставлених студентів — перевіряти нема що').toBeTruthy();

		await gotoReady(page, `${ПЕРЕЛІК}/${заклад!.slug}`);

		const перелік = page.getByTestId('institution-unlisted-list');
		await expect(перелік).toBeVisible();
		for (const person of заклад!.unlistedStudents ?? []) {
			await expect(перелік, `${заклад!.slug}: «${person.name}» зник зі сторінки`).toContainText(
				person.name
			);
		}
	});
});
