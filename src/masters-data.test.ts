// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
	masterSection,
	pluralKey,
	yearsOfService,
	type MasterCategory,
	type MasterSection,
	type MasterStatus
} from './lib/data/masters';
import { isHiddenMasterPath, isMasterRecordPublic } from './lib/config/mastersVisibility';

/**
 * Три осі даних майстрів і два поля, доданих 2026-08-24.
 *
 * ## Що саме тут стережеться
 *
 * `category` (роль), `status` (життєвий цикл) і повнота даних — ТРИ різних
 * питання, які до 2026-08-24 відповідалися одним полем. Ціна була заміряна:
 * значення `needsClarification` стояло в 77 зі 118 записів і стирало в них роль.
 * Роз'єднання тримається лише доти, доки хтось не допише в `category` значення
 * на кшталт `history` — воно виглядатиме природно, бо розділ так і зветься, і
 * тихо поверне змішування. Саме це ловить перша перевірка.
 *
 * ## Індекс і профіль — ДВА файли з тими самими полями
 *
 * `masters.index.json` читає сторінка-список, `static/masters/profiles/*.json` —
 * сторінка людини, і розійтися вони можуть без жодної помилки: людина буде в
 * розділі «Історія школи» і водночас «працює» на власній сторінці. Для
 * випускників такий гейт уже є (`faculty-relations.test.ts`), для майстрів не
 * було — а файлів тут 119.
 *
 * ## Зворотний експеримент проведено (AI-AGENT-PITFALLS-v8 § 1.1)
 *
 * Перевірка осей червоніє, якщо повернути `"category": "needsClarification"` в
 * будь-який запис; перевірка дзеркала — якщо змінити `status` в індексі й не
 * змінити у профілі; `periods` в індексі — якщо додати поле туди, куди воно
 * навмисно не кладеться.
 */

const ROOT = '.';
const INDEX_PATH = join(ROOT, 'src/lib/data/masters.index.json');
const PROFILES_DIR = join(ROOT, 'static/masters/profiles');

interface MasterRecord {
	id: string;
	slug: string;
	fullName: string;
	status?: MasterStatus;
	category?: MasterCategory;
	departments?: string[];
	visible?: boolean;
	photo?: string;
	unconfirmed?: true;
	periods?: unknown;
	isHonorary?: unknown;
}

const index = JSON.parse(readFileSync(INDEX_PATH, 'utf8')) as MasterRecord[];

const profiles = readdirSync(PROFILES_DIR)
	.filter((f) => f.endsWith('.json'))
	.map((f) => ({
		file: `static/masters/profiles/${f}`,
		data: JSON.parse(readFileSync(join(PROFILES_DIR, f), 'utf8')) as MasterRecord
	}));

/** Роль — лише ці шість. Розділи «Світла пам'ять», «Історія школи» та
 * «Потребують уточнення» — це НЕ роль, вони обчислюються. */
const ROLES: readonly MasterCategory[] = ['administration', 'heads', 'directors', 'speech', 'artists', 'choreographers', 'vocalists', 'musicians', 'accompanists', 'teachers', 'production', 'it', 'support'];
const STATUSES: readonly MasterStatus[] = ['active', 'former', 'honorary'];

/** Розділи сторінки — той самий перелік, що в `categoryConfigs`. */
const SECTIONS: readonly MasterSection[] = [...ROLES, 'honorary', 'history', 'needsClarification'];

describe('перевірка жива', () => {
	it('дані прочитано з обох джерел', () => {
		expect(index.length).toBeGreaterThan(100);
		expect(profiles.length).toBe(index.length);
	});
});

describe('три осі даних майстрів', () => {
	it('`category` — лише роль, без розділів і без стану даних', () => {
		const bad = index
			.filter((m) => m.category !== undefined && !ROLES.includes(m.category))
			.map((m) => `${m.id}: category = ${JSON.stringify(m.category)}`);
		expect(
			bad,
			'`honorary`, `history`, `needsClarification` — це РОЗДІЛИ, і вони обчислюються з ролі,\n' +
				'статусу й повноти даних (`masterSection`). Значення в полі повертає змішування трьох осей'
		).toEqual([]);
	});

	it('`status` — лише життєвий цикл людини', () => {
		const bad = index
			.filter((m) => m.status !== undefined && !STATUSES.includes(m.status))
			.map((m) => `${m.id}: status = ${JSON.stringify(m.status)}`);
		// `history` тут — типова описка: розділ зветься «Історія школи», і значення
		// звалося так само до 2026-08-24.
		expect(bad, 'статус — `active` | `former` | `honorary`').toEqual([]);
	});

	it('завідувач має відділення — інакше роль ні про що', () => {
		/*
		 * `heads` відрізняється від `administration` рівно цим: директорка й
		 * заступниця керують ШКОЛОЮ і відділення не мають, завідувачка веде своє.
		 * Перевірка не декоративна: до 2026-08-24 завідувачка МУЗИЧНИМ відділенням
		 * стояла з `departments: ['theatre']`, тобто помилку такого роду тут уже
		 * знаходили — і бачив її лише той, хто читав посаду рядком поруч.
		 */
		const heads = index.filter((m) => m.category === 'heads');
		expect(heads.length, 'жодного завідувача — перевірка мертва').toBeGreaterThan(0);
		const withoutDept = heads.filter((m) => !m.departments?.length).map((m) => m.id);
		expect(withoutDept, 'завідувач без відділення').toEqual([]);
	});

	it('`isHonorary` не повертається — цей факт живе в `status`', () => {
		const withFlag = [...index, ...profiles.map((p) => p.data)].filter((m) => m.isHonorary !== undefined);
		expect(
			withFlag.length,
			'поле дублювало `status === "honorary"`, і три компоненти перевіряли один факт тричі'
		).toBe(0);
	});
});

describe('індекс і профіль — те саме про ту саму людину', () => {
	const byId = new Map(index.map((m) => [m.id, m]));

	it('кожному профілю відповідає запис в індексі', () => {
		const orphans = profiles.filter((p) => !byId.has(p.data.id)).map((p) => p.file);
		expect(orphans, 'профіль без запису в індексі не показується ніде').toEqual([]);
	});

	it('осі та видимість збігаються', () => {
		const problems: string[] = [];
		for (const { file, data } of profiles) {
			const entry = byId.get(data.id);
			if (!entry) continue;
			for (const field of ['status', 'category', 'visible', 'unconfirmed'] as const) {
				if (JSON.stringify(entry[field]) !== JSON.stringify(data[field])) {
					problems.push(`${file} → ${field}: профіль ${JSON.stringify(data[field])}, індекс ${JSON.stringify(entry[field])}`);
				}
			}
		}
		expect(
			problems,
			'розбіжність тиха: у розділі «Історія школи» людина, яка на власній сторінці «працює»'
		).toEqual([]);
	});

	it('`periods` лежать лише у профілі, не в індексі', () => {
		// Індекс імпортується модулем і їде в клієнтський бандл ЦІЛКОМ, тобто
		// терміни всіх 118 людей везлися б на кожну сторінку сайту заради одного
		// рядка на сторінці профілю.
		const inIndex = index.filter((m) => m.periods !== undefined).map((m) => m.id);
		expect(inIndex, 'терміни роботи — поле профілю, як `bio` і `socials`').toEqual([]);
	});
});

describe('розділ обчислюється, а не зберігається', () => {
	it('кожен запис попадає рівно в один відомий розділ', () => {
		const unknown = index
			.map((m) => ({ id: m.id, section: masterSection(m) }))
			.filter((r) => !SECTIONS.includes(r.section));
		expect(unknown, 'розділ, якого немає в `categoryConfigs`, не покаже нікого').toEqual([]);
	});

	it('«Світла пам\'ять» не залежить від повноти даних', () => {
		// Розділ про людей, а не про повноту анкети: посади немає ні в кого з
		// трьох, і умова з `roleTitle` спорожнила б його цілком.
		const honorary = index.filter((m) => m.status === 'honorary');
		expect(honorary.length).toBeGreaterThan(0);
		for (const m of honorary) {
			expect(masterSection(m), `${m.id} мусить лишатися у «Світлій памʼяті»`).toBe('honorary');
		}
	});

	it('запис без ролі їде в технічний розділ — роль невідома, розділ ролі невідомий', () => {
		expect(masterSection({ status: 'active' })).toBe('needsClarification');
	});
});

describe('сторінка показує всі розділи, які обчислюються', () => {
	/*
	 * Розмітку тут не змонтувати (компонентних тестів у проєкті немає — плагін дає
	 * лише компіляцію рун), тож перелік розділів читається з ДЖЕРЕЛА сторінки.
	 * Без цього нова роль додається в тип, дані під неї правляться, а розділ у
	 * `categoryConfigs` забувають — і люди зникають зі сторінки, не зламавши
	 * нічого: ні типи, ні тести не побачили б різниці, бо `masterSection` віддає
	 * правильне значення, якому просто немає куди потрапити.
	 */
	const PAGE = 'src/routes/residents/adults/+page.svelte';
	const source = readFileSync(PAGE, 'utf8');
	const configured = [...source.matchAll(/^\t\t\tkey: '([^']+)'/gm)].map((m) => m[1]);

	it('перелік розділів у `categoryConfigs` знайдено', () => {
		expect(configured.length, `не розпізнано жодного key: у ${PAGE}`).toBeGreaterThan(0);
	});

	it('кожен обчислюваний розділ має свій блок на сторінці', () => {
		const missing = SECTIONS.filter((s) => !configured.includes(s));
		expect(missing, 'розділ обчислюється, але сторінка його не малює — люди зникають').toEqual([]);
	});

	it('на сторінці немає розділів, яких не буває', () => {
		const extra = configured.filter((k) => !SECTIONS.includes(k as MasterSection));
		expect(extra, 'мертвий розділ: заголовок, під який ніколи нікого не буде').toEqual([]);
	});

	it('фіксований перелік порядку не містить мертвих записів', () => {
		// `liliia-velychko` колись лишилася в `ADMIN_ORDER` після переїзду в іншу
		// категорію, і рядок просто нічого не робив: `indexOf` віддавав −1.
		//
		// Умова — РОЗДІЛ, а не поле `category`, і різниця не теоретична.
		// 2026-08-27 `liubov-frankovska` переїхала в «Історію школи» через
		// `status: 'former'`, а роль лишилася адміністрацією — правдиво, бо
		// `category` каже, ЧИМ людина займалася. Сортування ж бачить лише записи
		// СВОГО розділу, тож рядок став мертвим, а перевірка по `category` його
		// пропускала: обидві сторони й далі казали «administration».
		// `masterSection` відповідає на те саме питання, що й сама сторінка.
		const byId = new Map(index.map((m) => [m.id, m]));
		const problems: string[] = [];
		// Перелік один — керівництво. Фіксований порядок у завідувачів і в службі
		// турботи прибрано 2026-08-24: решта розділів рахує учнів.
		for (const [name, category] of [['ADMIN_ORDER', 'administration']] as const) {
			const listed = [...(new RegExp(`const ${name} = \\[([^\\]]*)\\]`, 's').exec(source)?.[1] ?? '').matchAll(/'([^']+)'/g)].map((m) => m[1]);
			expect(listed.length, `${name} не знайдено у ${PAGE}`).toBeGreaterThan(0);
			for (const id of listed) {
				const m = byId.get(id);
				if (!m) problems.push(`${name}: «${id}» — такого запису немає`);
				else if (masterSection(m) !== category) problems.push(`${name}: «${id}» тепер у розділі «${masterSection(m)}», рядок мертвий`);
			}
		}
		expect(problems).toEqual([]);
	});
});

describe('явний виняток «запис не підтверджений»', () => {
	/*
	 * `unconfirmed: true` — ручне знання, якого в даних немає: 2026-08-24 автор
	 * назвав дванадцять записів для технічного розділу, і спільного ПОЛЯ в них не
	 * виявилося (Пирогова і Стельмах — так само лише прізвища — лишилися в
	 * «Історії школи», а Пруба із записаним предметом поїхала).
	 *
	 * Ручне поле старіє, і перевірка нижче саме про це: прапорець мусить ЩОСЬ
	 * ЗМІНЮВАТИ. На записі, який і без нього лежить у технічному розділі (скажімо
	 * без ролі), він стає мертвим рядком — рівно так помер запис `liliia-velychko`
	 * у переліку порядку керівництва. Один такий уже був і прибраний того ж дня:
	 * Ткач Ганна мала `unconfirmed: false`, поки розділ залежав від фотографії.
	 */
	/** Розділ, який вийшов би БЕЗ прапорця. */
	const sectionWithout = (m: MasterRecord): MasterSection => masterSection({ ...m, unconfirmed: undefined });

	it('прапорці є, і кожен веде в технічний розділ', () => {
		const flagged = index.filter((m) => m.unconfirmed !== undefined);
		expect(flagged.length, 'жодного винятку — перевірки нижче мертві').toBeGreaterThan(0);
		for (const m of flagged) {
			expect(m.unconfirmed, `${m.id}: лише true — «підтверджений» каже ВІДСУТНІСТЬ поля`).toBe(true);
			expect(masterSection(m), `${m.id} мусить лежати в технічному розділі`).toBe('needsClarification');
		}
	});

	it('жодного мертвого прапорця — кожен справді змінює розділ', () => {
		const dead = index
			.filter((m) => m.unconfirmed && sectionWithout(m) === 'needsClarification')
			.map((m) => `${m.id} (${m.fullName})`);
		expect(dead, 'запис і без прапорця в технічному розділі: рядок нічого не робить').toEqual([]);
	});

	it("«Світла пам'ять» прапорцем не виноситься", () => {
		// Порядок умов у `masterSection`: honorary перевіряється ПЕРШИМ.
		expect(masterSection({ status: 'honorary', unconfirmed: true })).toBe('honorary');
	});
});

describe('фотографія на розділ НЕ впливає', () => {
	/*
	 * Правило «всі без фотографії — в «Потребують уточнення»» діяло 2026-08-24 і
	 * того ж дня прибране на пряме рішення автора: це було умовне правило для
	 * розбору купи, а не факт про людей. Перевірка тримає рішення, бо спокуса
	 * повернути його велика — технічний розділ тоді виглядав охайніше.
	 */
	it('запис без фотографії, але з роллю, стоїть у розділі своєї ролі', () => {
		expect(masterSection({ category: 'directors', status: 'active' })).toBe('directors');
		expect(masterSection({ category: 'teachers', status: 'active' })).toBe('teachers');
		expect(masterSection({ category: 'accompanists', status: 'active' })).toBe('accompanists');
		expect(masterSection({ category: 'support', status: 'active' })).toBe('support');
		expect(masterSection({ status: 'former' })).toBe('history');
	});

	it('у змістових розділах справді є люди без фотографії', () => {
		// Інакше перевірка вище була б теоретичною: правило прибрано саме для того,
		// щоб такі записи стояли поруч із рештою.
		const withoutPhoto = index.filter((m) => !m.photo && masterSection(m) !== 'needsClarification');
		expect(withoutPhoto.length, 'жодного — отже правило десь усе ще діє').toBeGreaterThan(0);
	});
});

describe('коротке ПІБ не виганяє зі змістового розділу', () => {
	/*
	 * До 2026-08-24 умовою повноти було ще й «прізвище, імʼя та по батькові», і
	 * вона вигнала з «Історії школи» Рибакову Надію В., Шевчука Олега В. і
	 * Надопту Світлану, а Ганбарова Ельміра — з педагогів. Коротке імʼя — це те,
	 * як людину записали (іноді свідомо), а не ознака зіпсованого запису; що
	 * картка когось показує, вирішує фотографія.
	 */
	const SHORT_NAMES = ['nadiia-rybakova', 'oleh-shevchuk', 'svitlana-nadopta', 'elmir-hanbarov', 'stelmakh'];

	it('записи з коротким ПІБ стоять там, куди ведуть роль і статус', () => {
		const byId = new Map(index.map((m) => [m.id, m]));
		const misplaced: string[] = [];
		for (const id of SHORT_NAMES) {
			const m = byId.get(id);
			expect(m, `${id} — запису немає, перевірка мертва`).toBeDefined();
			if (!m?.photo) continue; // без фотографії технічний розділ правильний
			if (masterSection(m) === 'needsClarification') misplaced.push(`${id} (${m.fullName})`);
		}
		expect(misplaced, 'фотографія є, а запис усе одно в технічному розділі').toEqual([]);
	});
});

describe('роки роботи', () => {
	it('терміни складаються, а не беруться крайніми датами', () => {
		// «2012–2016, 2022 — дотепер» на 2026 рік — це вісім років, а не чотирнадцять.
		expect(
			yearsOfService(
				[
					{ from: 2012, to: 2016 },
					{ from: 2022, to: null }
				],
				2026
			)
		).toBe(8);
	});

	it('незакритий термін міряється до переданого року', () => {
		expect(yearsOfService([{ from: 2020, to: null }], 2026)).toBe(6);
	});

	it('немає термінів — `null`, а не нуль', () => {
		// Нуль — теж відповідь («менше року»), і плутати її з відсутністю даних не
		// можна: від цього залежить, чи рядок узагалі показувати.
		expect(yearsOfService(undefined, 2026)).toBeNull();
		expect(yearsOfService([], 2026)).toBeNull();
		expect(yearsOfService([{ from: 2026, to: 2026 }], 2026)).toBe(0);
	});

	it('зіпсований термін не додає відʼємного', () => {
		expect(yearsOfService([{ from: 2030, to: 2020 }], 2026)).toBe(0);
	});

	it('українська форма слова «рік» — три варіанти', () => {
		expect(pluralKey(1)).toBe('One');
		expect(pluralKey(21)).toBe('One');
		expect(pluralKey(2)).toBe('Few');
		expect(pluralKey(34)).toBe('Few');
		expect(pluralKey(5)).toBe('Many');
		// 11–14 — саме той випадок, який ламає наївне правило «закінчується на 1».
		expect(pluralKey(11)).toBe('Many');
		expect(pluralKey(112)).toBe('Many');
		expect(pluralKey(0)).toBe('Many');
	});

	it('усі три підписи є в обох словниках', () => {
		for (const locale of ['uk', 'en']) {
			const dict = JSON.parse(readFileSync(`src/lib/i18n/locales/${locale}.json`, 'utf8')) as {
				galaxy: Record<string, unknown>;
			};
			for (const form of ['One', 'Few', 'Many']) {
				const key = `yearsInSchool${form}`;
				expect(dict.galaxy[key], `${locale}.json → galaxy.${key}`).toBeTruthy();
				expect(String(dict.galaxy[key])).toContain('{count}');
			}
		}
	});
});

describe('«Відображаємо на сайті»', () => {
	it('поля немає = показуємо', () => {
		expect(isMasterRecordPublic({})).toBe(true);
		expect(isMasterRecordPublic({ visible: true })).toBe(true);
		expect(isMasterRecordPublic({ visible: false })).toBe(false);
	});

	it('приховані адреси знає ОДИН модуль — і обома мовами', () => {
		const hidden = index.filter((m) => !isMasterRecordPublic(m));
		for (const m of hidden) {
			for (const path of [
				`/residents/adults/${m.slug}`,
				`/residents/adults/${m.slug}/`,
				`/en/residents/adults/${m.slug}/`
			]) {
				expect(isHiddenMasterPath(path), `${path} мусить бути поза індексом`).toBe(true);
			}
		}
		// Публічний запис — навпаки: інакше «нікого не приховано» виглядало б так
		// само, як «правило зіставляє все».
		const shown = index.find((m) => isMasterRecordPublic(m));
		expect(shown, 'жодного публічного запису — перевірка мертва').toBeDefined();
		expect(isHiddenMasterPath(`/residents/adults/${shown!.slug}/`)).toBe(false);
	});

	it('чужі адреси правило не зіставляє', () => {
		expect(isHiddenMasterPath('/residents/adults/')).toBe(false);
		expect(isHiddenMasterPath('/residents/children/')).toBe(false);
		expect(isHiddenMasterPath('/')).toBe(false);
	});
});
