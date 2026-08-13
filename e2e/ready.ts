import { expect, type Page } from '@playwright/test';

/**
 * Перейти на сторінку і дочекатися, поки застосунок справді готовий.
 *
 * Сама лише подія `load` тут не годиться: словники svelte-i18n вантажаться
 * асинхронно, і до їхнього приходу сторінка показує англійський фолбек та
 * «Loading…». Перша версія тестів саме на це й натрапила — і виглядало це як
 * поламані сторінки, хоча зламаними були очікування.
 *
 * `networkidle` теж не годиться у зворотний бік: Firebase тримає довге
 * з'єднання, тож мережа не затихає ніколи і чекання впирається в таймаут.
 *
 * Сигнал готовності — заголовок сторінки. Він є на кожній публічній сторінці
 * і з'являється рівно тоді, коли компонент отримав свій текст.
 */
export async function gotoReady(page: Page, path: string) {
	const response = await page.goto(path);
	await page.waitForLoadState('load');
	await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 });
	return response;
}

/**
 * Дочекатися, поки скінченні анімації добіжать до кінця.
 *
 * Потрібне перед axe. `.page-content` з'являється через
 * `animation: fadeInUp 0.6s`, а `fadeInUp` починається з `opacity: 0` — тож
 * поки анімація триває, увесь текст сторінки НАПІВПРОЗОРИЙ. axe рахує колір із
 * урахуванням прозорості й бачить те, чого на екрані вже за півсекунди немає.
 *
 * Це давало нестабільний тест: `/admission` і `/departments/music` падали з
 * «insufficient color contrast 3.18 (foreground #509ab1)», де #509ab1 — це
 * `--text-main` (#006c8d) під альфою 0.69, тобто кадр посеред появи. Різні
 * елементи давали різну альфу, бо анімації в них зміщені. Більшість прогонів
 * проходила, і саме тому дефект прожив довго: зелений тест читався як доказ.
 *
 * Нескінченні анімації (пульсація логотипа, фонові полотна) відкидаються —
 * їх чекати нема сенсу, вони не закінчаться ніколи.
 */
export async function waitForAnimations(page: Page) {
	await page.waitForFunction(
		() =>
			document
				.getAnimations()
				.filter((a) => (a.effect?.getTiming().iterations ?? 1) !== Infinity)
				.every((a) => a.playState === 'finished' || a.playState === 'idle'),
		undefined,
		{ timeout: 10_000 }
	);
}
