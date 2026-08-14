import { describe, it, expect } from 'vitest';
import { REDIRECT_PAGES, isRedirectPage } from './redirects';
import { LOCALES } from '../i18n/routing';

describe('реєстр сторінок-перенаправлень', () => {
	it('кожен запис має мовне дзеркало', () => {
		// Виведення дзеркал — уся суть реєстру. Якби вони перелічувалися руками,
		// наступна заглушка потрапила б в один список і забулася в другому: E2E
		// обходив би її українською, а в sitemap поїхала б англійська — порожня.
		const bare = new Set(
			Object.keys(REDIRECT_PAGES).filter((p) => !LOCALES.some((l) => p.startsWith(`/${l}/`)))
		);
		expect(bare.size).toBeGreaterThan(0);

		for (const path of bare) {
			for (const locale of LOCALES) {
				const mirror = locale === 'uk' ? path : `/${locale}${path}`;
				expect(REDIRECT_PAGES, `немає дзеркала ${mirror}`).toHaveProperty([mirror]);
			}
		}
	});

	it('зовнішні мають повну адресу, внутрішні — хвіст шляху', () => {
		for (const [path, entry] of Object.entries(REDIRECT_PAGES)) {
			if (entry.external) {
				expect(entry.target, `${path}: зовнішня ціль мусить бути повною адресою`).toMatch(
					/^https?:\/\//
				);
			} else {
				// Саме хвіст: resolve() віддає відносні адреси, тож у розмітці стоїть
				// `../projects/teatr-pro/` для кореня і `../../…` для /en/. Кількість
				// `../` залежить від глибини, і вписувати її в реєстр означало б
				// правити його щоразу, коли сторінка переїде рівнем глибше.
				expect(entry.target, `${path}: внутрішня ціль не мусить бути абсолютною`).not.toMatch(
					/^(https?:\/\/|\/)/
				);
			}
		}
	});

	it('isRedirectPage не залежить від хвостової риски', () => {
		const first = Object.keys(REDIRECT_PAGES)[0];
		expect(isRedirectPage(first)).toBe(true);
		expect(isRedirectPage(`${first}/`)).toBe(true);
		expect(isRedirectPage('/about')).toBe(false);
	});
});
