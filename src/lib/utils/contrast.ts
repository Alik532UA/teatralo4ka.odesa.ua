/**
 * Контраст за WCAG 2.x — ОДНА реалізація на гейт і на живий інструмент.
 *
 * ## Чому винесено з `vitest/support/tokens.ts`
 *
 * Ці тридцять рядків жили в тестовому шарі, і поки їх читав лише гейт, це було
 * правильно. 2026-09-08 з'явилася лабораторія кольорів (`services/themeLab`):
 * дизайнер вписує колір і одразу бачить, пройде він поріг чи ні. Написати
 * формулу вдруге означало б завести ДВІ правди про те саме число — і найгірший
 * можливий наслідок: інструмент каже «пройде», а гейт у CI каже «ні».
 *
 * Тому формула тут, а тестовий шар її імпортує. Перевірки на неї вже написані
 * (`vitest/support/tokens.test.ts`), включно зі звіркою з живим заміром у
 * браузері, і вони лишилися там, де були.
 */

export type Rgb = [number, number, number];

/**
 * Поріг AA для звичайного тексту. Великий текст (≥ 18.66px bold або ≥ 24px)
 * має власний, м'якший поріг 3.0 — але в цьому проєкті майже все, що читають,
 * дрібніше, тож інструмент міряє за суворішим і не вгадує розмір.
 */
export const AA_NORMAL = 4.5;

/**
 * `transparent` тут НЕ колір і не чорний.
 *
 * Перша версія цього коду мала його як `[0, 0, 0]`, і перевірка контрасту
 * видала близько двадцяти хибних дефектів: `.btn-outline { background:
 * transparent }` читалося як «чорне тло», і будь-який темний текст на ньому
 * ставав «нечитним». Насправді `transparent` означає «те, що під ним», а це
 * статично невідомо — отже НЕПОКРИТО, а не дефект.
 */
const NAMED: Record<string, Rgb> = {
	white: [255, 255, 255],
	black: [0, 0, 0]
};

/** Розбирає `#abc`, `#aabbcc`, `rgb(...)`, `white`. Інше — `null`. */
export function parseColor(value: string): Rgb | null {
	const v = value.trim().toLowerCase();
	if (v in NAMED) return NAMED[v];
	const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(v);
	if (hex) {
		const h = hex[1];
		const full =
			h.length === 3
				? h
						.split('')
						.map((c) => c + c)
						.join('')
				: h;
		return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as Rgb;
	}
	const rgb = /^rgba?\(([^)]+)\)$/.exec(v);
	if (rgb) {
		const parts = rgb[1]
			.split(/[\s,/]+/)
			.filter(Boolean)
			.map(Number);
		// Напівпрозоре не розв'язується без знання того, що під ним.
		if (parts.length >= 4 && parts[3] < 0.999) return null;
		if (parts.slice(0, 3).some(Number.isNaN)) return null;
		return parts.slice(0, 3) as Rgb;
	}
	return null;
}

/** Відносна яскравість за WCAG, від 0 (чорний) до 1 (білий). */
export function luminance([r, g, b]: Rgb): number {
	const f = (v: number) => {
		const c = v / 255;
		return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
	};
	return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** Коефіцієнт контрасту за WCAG 2.x, від 1 до 21. */
export function contrast(a: Rgb, b: Rgb): number {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
}
