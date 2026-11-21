import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { POSTERS_LIST, POSTER_GROUPS, POSTER_THEMES } from '$lib/data/posters';
import {
	ANNIVERSARY_30_POSTER,
	ANNIVERSARY_30_EVENTS,
	ANNIVERSARY_30_CHARITY
} from '$lib/data/anniversary30';
import { LOCAL_IMAGE_SIZES } from '$lib/config/localImages';

describe('Афіша «30-річчя Одеської театральної школи»', () => {
	it('зареєстрована в загальному реєстрі POSTERS_LIST на першій позиції', () => {
		const meta = POSTERS_LIST.find((p) => p.id === 'anniversary-30');
		expect(meta).toBeDefined();
		expect(meta?.titleUk).toContain('30-річчя');
		expect(meta?.dateBadgeUk).toBe('25 лист – 5 груд');
		expect(POSTERS_LIST[0].id).toBe('anniversary-30');
		expect(meta?.format).toBe('a4-portrait');
	});

	it('входить до групи 2026–2027 років у POSTER_GROUPS', () => {
		const group = POSTER_GROUPS.find((g) => g.id === '2026-2027');
		expect(group?.ids).toContain('anniversary-30');
	});

	it('окремий постер збору для ЗСУ зареєстрований у POSTERS_LIST та POSTER_GROUPS', () => {
		const charityPoster = POSTERS_LIST.find((p) => p.id === 'anniversary-30-charity');
		expect(charityPoster).toBeDefined();
		expect(charityPoster?.format).toBe('a4-portrait');
		expect(POSTERS_LIST[1].id).toBe('anniversary-30-charity');

		const group = POSTER_GROUPS.find((g) => g.id === '2026-2027');
		expect(group?.ids).toContain('anniversary-30-charity');
	});

	it('має фірмові теми оформлення (жовту, темну, ощадну білу, крем, золото)', () => {
		const brandYellow = POSTER_THEMES.find((t) => t.id === 'yellow-brand');
		const dark = POSTER_THEMES.find((t) => t.id === 'uart-dark');
		const paperWhite = POSTER_THEMES.find((t) => t.id === 'paper-white');

		expect(brandYellow?.forPosters).toContain('anniversary-30');
		expect(dark?.forPosters).toContain('anniversary-30');
		expect(paperWhite?.forPosters).toContain('anniversary-30');
	});

	it('містить 10 обовʼязкових святкових подій', () => {
		expect(ANNIVERSARY_30_EVENTS).toHaveLength(10);

		const titles = ANNIVERSARY_30_EVENTS.map((e) => e.titleUk + ' ' + (e.subtitleUk ?? ''));
		expect(titles.some((t) => t.includes('Відео-дайджест'))).toBe(true);
		expect(titles.some((t) => t.includes('Квіти для іменинниці'))).toBe(true);
		expect(titles.some((t) => t.includes('Святковий концерт'))).toBe(true);
		expect(titles.some((t) => t.includes('Кіно-Зум'))).toBe(true);
		expect(titles.some((t) => t.includes('Тепер тобі тридцять'))).toBe(true);
		expect(titles.some((t) => t.includes('The coolfest people'))).toBe(true);
		expect(titles.some((t) => t.includes('Інтерв’ю з випускниками'))).toBe(true);
		expect(titles.some((t) => t.includes('Дитяче свято з дискотекою'))).toBe(true);
		expect(titles.some((t) => t.includes('Ювілейне шоу'))).toBe(true);
		expect(titles.some((t) => t.includes('Мирославом Гринишиним'))).toBe(true);
	});

	it('святковий концерт містить пряме посилання на квитки concert.ua та бейдж concert.ua', () => {
		const concert = ANNIVERSARY_30_EVENTS.find((e) => e.id === 'festive-concert');
		expect(concert).toBeDefined();
		expect(concert?.url).toBe('https://concert.ua/uk/event/muzichnii-koncert');
		expect(concert?.badgeUk).toBe('concert.ua');
	});

	it('інтервʼю з випускниками веде на внутрішній розділ галактики', () => {
		const interview = ANNIVERSARY_30_EVENTS.find((e) => e.id === 'graduates-interview');
		expect(interview).toBeDefined();
		expect(interview?.isInternalUrl).toBe(true);
		expect(interview?.url).toBe('/projects/galaxy-graduates');
	});

	it('містить повні дані благодійного збору на пікапи для 14 ОРБ', () => {
		const charity = ANNIVERSARY_30_CHARITY;
		expect(charity.targetUk).toContain('14 ОРБ');
		expect(charity.descriptionUk).toContain('Я Лю Україну');
		expect(charity.jarUrl).toBe('https://send.monobank.ua/jar/4FvXthaHVH');
		expect(charity.cardNumber).toBe('4874 1000 3561 4919');
		expect(charity.cardRaw).toBe('4874100035614919');
	});

	it('зображення QR-коду банки є в static/posters/ та зареєстровано в LOCAL_IMAGE_SIZES', () => {
		const qrPath = ANNIVERSARY_30_CHARITY.qrImage;
		expect(LOCAL_IMAGE_SIZES).toHaveProperty(qrPath);

		const filePath = join(process.cwd(), 'static', qrPath);
		expect(existsSync(filePath)).toBe(true);
	});

	it('містить реквізити 30-го сезону', () => {
		expect(ANNIVERSARY_30_POSTER.schoolUk).toContain('30 сезонів: Гра триває!');
	});

	it('окрема веб-сторінка /anniversary-30 існує та зареєстрована в пререндері й чеклисті', () => {
		expect(existsSync(join(process.cwd(), 'src/routes/anniversary-30/+page.svelte'))).toBe(true);
		expect(existsSync(join(process.cwd(), 'src/routes/anniversary-30/+page.ts'))).toBe(true);
	});
});
