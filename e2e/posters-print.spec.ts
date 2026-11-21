import { test, expect } from './fixtures';

test.describe('Друк афіш школи (формат, роздруківка без відрізань)', () => {
	test('anniversary-30: повноекранний A4 portrait друк без темної обводки та відрізань', async ({ page }) => {
		await page.setViewportSize({ width: 794, height: 1123 });
		await page.goto('/posters?poster=anniversary-30&mode=paper');
		await page.waitForSelector('[data-testid="poster-active-container"]');
		await page.waitForTimeout(300);

		await page.emulateMedia({ media: 'print' });

		const metrics = await page.evaluate(() => {
			const viewport = document.querySelector('[data-testid="poster-active-container"]') as HTMLElement;
			const poster = document.querySelector('[data-testid="anniversary-30-poster-card"]') as HTMLElement;
			const footer = document.querySelector('.poster-footer') as HTMLElement;
			const charityCard = document.querySelector('[data-testid="anniversary-30-charity-card"]') as HTMLElement;
			const qrImg = document.querySelector('.qr-thumb-img') as HTMLElement;

			const vpRect = viewport.getBoundingClientRect();
			const pRect = poster ? poster.getBoundingClientRect() : null;
			const footerRect = footer ? footer.getBoundingClientRect() : null;
			const charityRect = charityCard ? charityCard.getBoundingClientRect() : null;
			const qrRect = qrImg ? qrImg.getBoundingClientRect() : null;

			return {
				viewport: {
					width: vpRect.width,
					height: vpRect.height,
					scrollHeight: viewport.scrollHeight,
					clientHeight: viewport.clientHeight
				},
				poster: pRect ? { width: pRect.width, height: pRect.height } : null,
				footer: footerRect ? { bottom: footerRect.bottom } : null,
				charity: charityRect ? { bottom: charityRect.bottom } : null,
				qr: qrRect ? { width: qrRect.width, height: qrRect.height } : null
			};
		});

		// Аркуш A4 відповідає стандарту (~794px x ~1123px)
		expect(metrics.viewport.width).toBeGreaterThanOrEqual(790);
		expect(metrics.viewport.width).toBeLessThanOrEqual(800);
		expect(metrics.viewport.height).toBeGreaterThanOrEqual(1120);
		expect(metrics.viewport.height).toBeLessThanOrEqual(1125);

		// Жодного вертикального переповнення або відрізання (scrollHeight дорівнює clientHeight)
		expect(metrics.viewport.scrollHeight).toBeLessThanOrEqual(metrics.viewport.clientHeight + 2);

		// Постер займає весь аркуш (210mm x 297mm)
		expect(metrics.poster).not.toBeNull();
		expect(metrics.poster!.width).toBeGreaterThanOrEqual(790);
		expect(metrics.poster!.height).toBeGreaterThanOrEqual(1120);

		// Нижній колонтитул та блок збору повністю всередині аркуша
		expect(metrics.footer!.bottom).toBeLessThanOrEqual(metrics.viewport.height + 2);
		expect(metrics.charity!.bottom).toBeLessThanOrEqual(metrics.viewport.height + 2);

		// QR-код присутній та видимий, великого розміру (~175-190px) для зручного сканування з паперу
		expect(metrics.qr!.width).toBeGreaterThanOrEqual(170);
		expect(metrics.qr!.height).toBeGreaterThanOrEqual(170);

		await page.screenshot({
			path: 'C:/Users/alik5/.gemini/antigravity/brain/e69a2bda-bb07-4a72-aa17-69d7698bf894/print-preview-anniversary-30-v4.png',
			fullPage: true
		});
	});
});
