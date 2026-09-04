import { expect, test } from '@playwright/test';
import { PUBLIC_PAGES } from './pages';

/**
 * Посилання всередині речення видно, що воно посилання (WCAG 2.2 SC 1.4.1).
 *
 * ## Дефект, через який ця перевірка з'явилася
 *
 * 2026-09-04, новина про сімнадцять студентів: чотирнадцять імен були
 * посиланнями на сторінки випускників, і жодне з них не відрізнялося від
 * звичайного слова. Заміряно на сторінці — колір посилання дорівнював кольору
 * сусіднього тексту (`rgb(229, 247, 253)` обидва), `text-decoration: none`,
 * вага 400.
 *
 * Причина була не в новині: стилю `.prose a` в проєкті НЕ ІСНУВАЛО взагалі, бо
 * жодна сторінка досі не мала посилання в тексті — усі вони були кнопками з
 * власним класом. Тобто дефект чекав на першого, хто напише звичайне посилання,
 * і чекав би далі.
 *
 * Автор поставив питання ширше: «це треба перевірити і на інших сторінках, бо це
 * може стосуватися багатьох місць». Обхід руками показав, що більше ніде цього
 * немає — а ця перевірка робить так, щоб і не з'явилося.
 *
 * ## Що саме вважається порушенням
 *
 * Прапорець ставиться, лише якщо збіглися ВСІ ознаки:
 *
 *   • у посилання є текст (значок без тексту розпізнають не за кольором);
 *   • немає підкреслення;
 *   • колір ДОРІВНЮЄ кольору батьківського елемента;
 *   • немає фону, рамки й тіні — тобто це не кнопка, не чип і не картка;
 *   • поруч у тому самому батьку є ІНШИЙ текст, тобто посилання стоїть у
 *     реченні.
 *
 * Остання умова головна. Пункт навігації й посилання в підвалі теж не
 * підкреслені й того ж кольору, що сусіди, — і це нормально: там ознакою є
 * місце й групування, а не колір. Заміряно на `/about`: три таких посилання, усі
 * `header__nav-link` і `footer__link`, і жодне не стоїть у реченні.
 *
 * ## Чому саме e2e, а не гейт по джерелах
 *
 * Ознака тут — ОБЧИСЛЕНИЙ колір, а він народжується з каскаду: змінна теми,
 * успадкування, порядок правил. Жоден розбір `.css` цього не дає — саме тому
 * дефект і жив у проєкті, повному гейтів.
 *
 * ## Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1)
 *
 * Проведений синтетично, і саме тут — перевіркою «розбір живий» нижче: у
 * сторінку додається абзац із двома посиланнями, одне непомітне, друге
 * підкреслене. Обхід мусить назвати рівно перше. Спроба зробити той самий
 * експеримент на живій сторінці (скасувати `.prose a` вставленим `<style>`)
 * нічого не дала: у прихованій панелі браузера перерахунок стилів відкладається,
 * і `getComputedStyle` віддавав старі значення.
 */
const ОБХІД = `(() => {
	const bad = [];
	for (const a of document.querySelectorAll('a')) {
		const text = (a.textContent || '').replace(/\\s+/g, ' ').trim();
		if (!text) continue;
		const cs = getComputedStyle(a);
		const parent = a.parentElement;
		if (!parent || cs.display === 'none' || cs.visibility === 'hidden') continue;
		if (cs.textDecorationLine !== 'none') continue;
		if (
			cs.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
			cs.borderTopWidth !== '0px' ||
			cs.borderBottomWidth !== '0px' ||
			cs.boxShadow !== 'none'
		) continue;
		if (a.querySelector('h1,h2,h3,h4,img,svg,picture')) continue;
		if (cs.color !== getComputedStyle(parent).color) continue;
		const siblingText = [...parent.childNodes]
			.filter((n) => n !== a)
			.map((n) => (n.textContent || '').trim())
			.join('');
		if (!siblingText) continue;
		bad.push(text.slice(0, 60) + '  [' + (a.className || '(без класу)').toString().slice(0, 40) + ']');
	}
	return bad;
})()`;

test('розбір живий: непомітне посилання в реченні знаходиться', async ({ page }) => {
	await page.goto('/');
	const знайдено = await page.evaluate(`(() => {
		const host = document.createElement('div');
		host.style.color = 'rgb(200, 200, 200)';
		host.innerHTML =
			'<p style="color:inherit">Текст із <a href="/about" style="color:inherit;text-decoration:none">непомітним</a> усередині.</p>' +
			'<p style="color:inherit">І з <a href="/about" style="color:rgb(0,181,236);text-decoration:underline">підкресленим</a> теж.</p>';
		document.body.appendChild(host);
		const bad = ${ОБХІД};
		host.remove();
		return bad;
	})()`);

	expect(
		знайдено.length,
		'обхід не знайшов навмисно зламаного посилання — тобто перевірка нижче зеленіла б ' +
			'на порожньому місці'
	).toBe(1);
	expect(String(знайдено[0])).toContain('непомітним');
});

for (const path of PUBLIC_PAGES) {
	test(`${path} — посилання в тексті видно`, async ({ page }) => {
		await page.goto(path);
		const bad = (await page.evaluate(ОБХІД)) as string[];
		expect(
			bad,
			`посилання не відрізняється від звичайного слова — той самий колір і без ` +
				`підкреслення:\n  ${bad.join('\n  ')}`
		).toEqual([]);
	});
}
