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
