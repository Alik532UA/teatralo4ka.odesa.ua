import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { POSTERS_LIST, POSTER_GROUPS, POSTER_THEMES } from '$lib/data/posters';
import { ANNIVERSARY_BOOKLET_DATA } from '$lib/data/anniversaryBooklet';

describe('Ювілейний буклет «ДНК — ДТШ» до 30-річчя школи (12 сторінок)', () => {
	it('зареєстрований у загальному реєстрі афіш школи POSTERS_LIST', () => {
		const meta = POSTERS_LIST.find((p) => p.id === 'anniversary-booklet');
		expect(meta).toBeDefined();
		expect(meta?.titleUk).toContain('ДНК — ДТШ');
		expect(meta?.format).toBe('a4-landscape');
		expect(meta?.dateBadgeUk).toContain('1 грудня');
	});

	it('входить до групи 2026–2027 років у POSTER_GROUPS', () => {
		const group = POSTER_GROUPS.find((g) => g.id === '2026-2027');
		expect(group?.ids).toContain('anniversary-booklet');
	});

	it('має фірмові теми оформлення (жовту, темну, ощадну білу, золото)', () => {
		const yellow = POSTER_THEMES.find((t) => t.id === 'yellow-brand');
		const dark = POSTER_THEMES.find((t) => t.id === 'uart-dark');
		const white = POSTER_THEMES.find((t) => t.id === 'paper-white');

		expect(yellow?.forPosters).toContain('anniversary-booklet');
		expect(dark?.forPosters).toContain('anniversary-booklet');
		expect(white?.forPosters).toContain('anniversary-booklet');
	});

	it('містить рівно 12 послідовних сторінок', () => {
		expect(ANNIVERSARY_BOOKLET_DATA.pages).toHaveLength(12);
		const numbers = ANNIVERSARY_BOOKLET_DATA.pages.map((p) => p.pageNumber);
		expect(numbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
	});

	it('1 сторінка — це ювілейна обкладинка «ДНК — ДТШ»', () => {
		const p1 = ANNIVERSARY_BOOKLET_DATA.pages[0];
		expect(p1.pageNumber).toBe(1);
		expect(p1.type).toBe('cover');
		expect(p1.titleUk).toContain('ДНК — ДТШ');
		expect(p1.subtitleUk).toContain('30-річчя');
		expect(p1.photos.length).toBeGreaterThanOrEqual(1);
	});

	it('сторінки 2-4, 8-9, 11 містять історичні пʼятирічки 1996–2026', () => {
		const periods = [
			{ page: 2, badge: '1996 — 2001' },
			{ page: 3, badge: '2001 — 2006' },
			{ page: 4, badge: '2006 — 2011' },
			{ page: 8, badge: '2011 — 2016' },
			{ page: 9, badge: '2016 — 2021' },
			{ page: 11, badge: '2021 — 2026' }
		];

		for (const { page, badge } of periods) {
			const p = ANNIVERSARY_BOOKLET_DATA.pages[page - 1];
			expect(p.yearsBadge).toBe(badge);
			expect(p.type).toBe('history');
			expect(p.paragraphsUk.length).toBeGreaterThan(0);
			expect(p.photos.length).toBeGreaterThan(0);
		}
	});

	it('5 сторінка містить перший гімн школи («Сабанєєв міст»)', () => {
		const p5 = ANNIVERSARY_BOOKLET_DATA.pages[4];
		expect(p5.pageNumber).toBe(5);
		expect(p5.type).toBe('hymn');
		expect(p5.titleUk).toContain('Перший гімн');
		const hymn = p5.hymnLyrics;
		expect(hymn).toBeDefined();
		const allLines = hymn!.verses.flatMap((v) => v.linesUk).join(' ');
		expect(allLines).toContain('Сабонеев мост');
	});

	it('6 і 7 сторінки формують панорамний центральний розворот колективу викладачів', () => {
		const p6 = ANNIVERSARY_BOOKLET_DATA.pages[5];
		const p7 = ANNIVERSARY_BOOKLET_DATA.pages[6];
		expect(p6.pageNumber).toBe(6);
		expect(p7.pageNumber).toBe(7);
		expect(p6.type).toBe('centerfold');
		expect(p7.type).toBe('centerfold');
		expect(p6.photos[0]?.src).toContain('teachers-centerfold.webp');
		expect(p7.photos[0]?.src).toContain('teachers-centerfold.webp');
	});

	it('10 сторінка містить другий гімн школи («Світло ДТШ»)', () => {
		const p10 = ANNIVERSARY_BOOKLET_DATA.pages[9];
		expect(p10.pageNumber).toBe(10);
		expect(p10.type).toBe('hymn');
		expect(p10.titleUk).toContain('Другий гімн');
		const hymn = p10.hymnLyrics;
		expect(hymn).toBeDefined();
		const allLines = hymn!.verses.flatMap((v) => v.linesUk).join(' ');
		expect(allLines).toContain('Свет ДТШ');
		expect(allLines).toContain('Софиевской');
	});

	it('12 сторінка — це задня обкладинка з третім гімном школи («Театралка — the best!»)', () => {
		const p12 = ANNIVERSARY_BOOKLET_DATA.pages[11];
		expect(p12.pageNumber).toBe(12);
		expect(p12.type).toBe('back-cover');
		expect(p12.titleUk).toContain('Третій гімн');
		const hymn = p12.hymnLyrics;
		expect(hymn).toBeDefined();
		const allLines = hymn!.verses.flatMap((v) => v.linesUk).join(' ');
		expect(allLines).toContain('the best');
		expect(allLines).toContain('Блазень і Король');
	});

	it('усі зображення сторінок буклету існують у static/', () => {
		const photos = ANNIVERSARY_BOOKLET_DATA.pages.flatMap((p) => p.photos.map((ph) => ph.src));
		expect(photos.length).toBeGreaterThanOrEqual(15);

		for (const src of photos) {
			const diskPath = join(process.cwd(), 'static', src.replace(/^\//, ''));
			expect(existsSync(diskPath), `Файл ${src} має існувати на диску`).toBe(true);
		}
	});

	it('спуск смуг (imposition) коректно розкладає 12 сторінок на 3 аркуші A4', () => {
		// 3 двосторонні аркуші:
		// Аркуш 1: Лице (12, 1), Зворот (2, 11)
		// Аркуш 2: Лице (10, 3), Зворот (4, 9)
		// Аркуш 3: Лице (8, 5), Зворот (6, 7) — центральний розворот
		const sheets = [
			{ sheet: 1, front: [12, 1], back: [2, 11] },
			{ sheet: 2, front: [10, 3], back: [4, 9] },
			{ sheet: 3, front: [8, 5], back: [6, 7] }
		];

		const allPages = sheets.flatMap((s) => [...s.front, ...s.back]);
		expect(allPages).toHaveLength(12);
		expect(new Set(allPages).size).toBe(12);
		expect(allPages.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
	});
});
