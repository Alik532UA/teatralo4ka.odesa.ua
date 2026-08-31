import { describe, expect, it } from 'vitest';
import { nextScrollHide, type ScrollHideState } from './hideOnScrollDown.svelte';

/**
 * Рішення «сховати плашку, бо читач іде вниз».
 *
 * Перевіряється саме воно, а не реактивна обгортка: у цьому оточенні браузерна
 * панель прокрутку не диспетчить і має нульову ширину, тож поведінку в ній не
 * заміряти — `window.scrollTo(0, 600)` лишає `scrollY` нулем. Тому логіка живе
 * чистою функцією, і перевіряється таблицею станів.
 */
const START: ScrollHideState = { hidden: false, last: 0 };
const step = (from: ScrollHideState, y: number) => nextScrollHide(from, y, 120, 8);

describe('приховування плашки за напрямком прокрутки', () => {
	it('угорі сторінки не ховається, скільки б не гортали вниз', () => {
		// 100 < showAbove(120): напрямок вниз, але зона ще «верх сторінки»
		expect(step(START, 100).hidden).toBe(false);
	});

	it('нижче порогової зони і вниз — ховається', () => {
		expect(step(START, 400).hidden).toBe(true);
	});

	it('назад угору — повертається, навіть глибоко на сторінці', () => {
		const down = step(START, 900);
		expect(down.hidden).toBe(true);
		expect(step(down, 700).hidden).toBe(false);
	});

	it('зсув менший за поріг НЕ рухає нічого — це дрижання тачпада', () => {
		const down = step(START, 400);
		const jitter = step(down, 405);
		expect(jitter).toBe(down);
		expect(jitter.last).toBe(400);
	});

	it('пам\'ять рухається лише разом із рішенням', () => {
		// Три дрижання підряд не мусять накопичитися у зміну напрямку.
		let s = step(START, 400);
		for (const y of [403, 399, 402]) s = step(s, y);
		expect(s.last).toBe(400);
		expect(s.hidden).toBe(true);
	});

	it('перевірка жива: функція справді розрізняє напрямки', () => {
		expect(step(START, 500).hidden).not.toBe(step(step(START, 500), 200).hidden);
	});
});
