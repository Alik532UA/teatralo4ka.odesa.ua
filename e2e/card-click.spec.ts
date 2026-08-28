import { expect, test } from '@playwright/test';
import { gotoReady, waitForAnimations } from './ready';

/**
 * Клікабельна ВСЯ картка, а не лише кнопка «Детальніше»
 * (UI-ELEMENTS-v8 § 1 — однакові за призначенням елементи поводяться однаково).
 *
 * Еталон у проєкті — картки відділень на головній: там уся картка є `<a>`, а
 * кнопка всередині лише намальована. Картки вмісту (`ContentCard`) дають те
 * саме іншим механізмом: у розмітці рівно один `<a>`, і він розтягується на всю
 * картку через `::after` з `inset: 0`. Так зроблено навмисно — кнопка відео
 * мусить лежати ПОЗА посиланням, інакше це вкладений інтерактивний елемент, і
 * axe завалює збірку правилом `nested-interactive`.
 *
 * ## Чому це потрібен саме прогін
 *
 * Механізм тримається на трьох речах одночасно: `position: relative` на картці,
 * `::after` з `inset: 0` на посиланні й z-index, який не перекривають сусіди.
 * Кожна ламається окремо, і жоден інший гейт цього не бачить: розмітка та сама,
 * типи цілі, axe задоволений, `svelte-check` мовчить. Видно лише попаданням у
 * пікселі.
 *
 * ## Міряється покриття, а не навігація — і це рішення, а не спрощення
 *
 * Перша редакція клікала й перевіряла адресу. Вона падала, і падала НЕ на сайті:
 * бокс картки міряли одним викликом, а клікали іншим, між ними віджет
 * перемальовувався (налаштування приїжджають окремим запитом), і клік ішов у
 * панель. Той самий кадр, зміряний атомарно, показував посилання — тобто тест
 * доводив стан свого власного таймінгу, а не поведінку картки.
 *
 * Тому перевірка робить те, що можна зміряти без гонки: у ОДНОМУ `evaluate`
 * проходить кілька точок по вертикалі картки й вимагає, щоб у кожній найвищим
 * елементом було посилання цієї картки. Це рівно та властивість, яку дає
 * `::after`; навігація з неї випливає, бо це звичайний `<a href>`.
 *
 * ## Чому `/projects` і чому Firestore відрізаний
 *
 * Сторінка показує статичні проєкти зі `config/static-projects.ts` незалежно від
 * бази. Обрізаний запит завершується відмовою одразу, `Promise.allSettled`
 * віддає керування, і картки з'являються детерміновано — без залежності від
 * живого Firestore, яку решта прогону має.
 *
 * Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1): прибрати `.card-link::after`
 * у `ContentCard.svelte` — перевірка мусить назвати панель замість посилання.
 */

test('уся площа картки належить її посиланню, а не лише кнопка', async ({ page }) => {
	await page.route('**/*.googleapis.com/**', (route) => route.abort());
	await gotoReady(page, '/projects');
	await waitForAnimations(page);

	/*
	 * Чекаємо на КОНТЕЙНЕР віджета, а не на першу картку. Причина конкретна: у
	 * вигляді «список» `ContentCard` віддає два вузли — десктопний і мобільний, —
	 * і CSS ховає один. `.first()` на вузькому екрані влучав саме в прихований,
	 * і чекання на його видимість не завершувалося ніколи.
	 */
	await expect(
		page.locator('[data-testid$="-widget-container"]').first(),
		'віджет вмісту не з\'явився — перевіряти нема що'
	).toBeVisible({ timeout: 20_000 });

	const probe = await page.evaluate(() => {
		const visible = (el: Element) => {
			const box = el.getBoundingClientRect();
			const style = getComputedStyle(el);
			return box.height > 40 && box.width > 40 && style.display !== 'none';
		};
		const card = [...document.querySelectorAll('.focus-card, .grid-card, .list-item')].find(
			(el) => visible(el) && (el.matches('a') || el.querySelector('a.card-link'))
		);
		if (!card) return null;

		const link = (card.tagName === 'A' ? card : card.querySelector('a.card-link'))!;
		const box = card.getBoundingClientRect();

		/* Точки по вертикалі: зображення, метадані, заголовок, опис, кнопка. */
		const misses: string[] = [];
		const sampled: number[] = [];
		for (let f = 0.1; f < 1; f += 0.15) {
			const x = box.left + box.width * 0.6;
			const y = box.top + box.height * f;
			sampled.push(Number(f.toFixed(2)));
			const at = document.elementFromPoint(x, y);
			if (at === link || link.contains(at)) continue;
			const name = at
				? `${at.tagName}/${at.getAttribute('data-testid') ?? (at.className || '').toString().split(' ')[0]}`
				: 'none';
			misses.push(`${(f * 100).toFixed(0)}% висоти → ${name}`);
		}

		return {
			cardTestid: card.getAttribute('data-testid'),
			linkTestid: link.getAttribute('data-testid'),
			href: link.getAttribute('href'),
			sampledCount: sampled.length,
			misses
		};
	});

	expect(probe, 'картки з посиланням не знайдено — перевіряти нема на чому').not.toBeNull();
	expect(probe!.sampledCount, 'жодної точки не зміряно — перевірка мертва').toBeGreaterThan(4);
	expect(
		probe!.misses,
		`картка ${probe!.cardTestid}: у цих точках найвищим елементом є не її посилання ` +
			`(${probe!.linkTestid} → ${probe!.href}), тобто клік туди нічого не відкриє:\n` +
			probe!.misses.join('\n')
	).toEqual([]);
});
