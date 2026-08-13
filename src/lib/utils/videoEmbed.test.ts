import { describe, expect, it } from 'vitest';
import { cardImageUrl, parseVideoUrl } from './videoEmbed';

/**
 * Перевіряється передусім те, що адреса розбирається як АДРЕСА, а не пошуком
 * підрядка: саме тут наївна реалізація пропускає чужий хост із назвою
 * платформи в параметрах запиту.
 */

describe('parseVideoUrl — YouTube', () => {
	const ID = 'dQw4w9WgXcQ';

	it('усі форми посилання, які копіюють з адресного рядка', () => {
		const forms = [
			`https://www.youtube.com/watch?v=${ID}`,
			`https://youtube.com/watch?v=${ID}&t=42s`,
			`https://m.youtube.com/watch?v=${ID}`,
			`https://youtu.be/${ID}`,
			`https://youtu.be/${ID}?t=42`,
			`https://www.youtube.com/embed/${ID}`,
			`https://www.youtube.com/shorts/${ID}`,
			`https://www.youtube.com/live/${ID}`
		];
		for (const url of forms) {
			const info = parseVideoUrl(url);
			expect(info?.platform, url).toBe('youtube');
			expect(info?.id, url).toBe(ID);
		}
	});

	it('плеєр — nocookie, кадр — статична адреса без API', () => {
		const info = parseVideoUrl(`https://youtu.be/${ID}`)!;
		expect(info.embeddable).toBe(true);
		expect(info.embedUrl).toBe(`https://www.youtube-nocookie.com/embed/${ID}`);
		expect(info.posterUrl).toBe(`https://img.youtube.com/vi/${ID}/hqdefault.jpg`);
	});

	it('чужий хост із «youtube.com» у параметрах не вважається відео', () => {
		// Пошук підрядка тут дав би false positive і вставив би iframe із
		// чужого домену — а CSP заблокувала б його мовчки.
		expect(parseVideoUrl('https://evil.example/?x=youtube.com/watch?v=dQw4w9WgXcQ')).toBeNull();
		expect(parseVideoUrl('https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ')).toBeNull();
	});

	it('ідентифікатор неправильної довжини відкидається', () => {
		expect(parseVideoUrl('https://youtu.be/short')).toBeNull();
		expect(parseVideoUrl('https://www.youtube.com/watch?v=tooooooooolong')).toBeNull();
	});
});

describe('parseVideoUrl — Vimeo', () => {
	it('пряме посилання й посилання з каналу', () => {
		for (const url of ['https://vimeo.com/123456789', 'https://vimeo.com/channels/staffpicks/123456789']) {
			const info = parseVideoUrl(url);
			expect(info?.platform, url).toBe('vimeo');
			expect(info?.id, url).toBe('123456789');
			expect(info?.embedUrl, url).toBe('https://player.vimeo.com/video/123456789');
		}
	});

	it('кадру немає — Vimeo не віддає його без API', () => {
		// Це не недогляд: картка тоді лишається без зображення, і так і має бути.
		expect(parseVideoUrl('https://vimeo.com/123456789')!.posterUrl).toBeUndefined();
	});
});

describe('parseVideoUrl — Instagram і Facebook', () => {
	it('розпізнаються, але НЕ вбудовуються', () => {
		const urls = [
			'https://www.instagram.com/p/Cabcdefghij/',
			'https://www.instagram.com/reel/Cabcdefghij/',
			'https://www.facebook.com/watch/?v=123456789',
			'https://fb.watch/abcdefg/'
		];
		for (const url of urls) {
			const info = parseVideoUrl(url);
			expect(info, url).not.toBeNull();
			expect(info!.embeddable, url).toBe(false);
			expect(info!.embedUrl, url).toBeUndefined();
			expect(info!.url, url).toBe(url);
		}
	});
});

describe('parseVideoUrl — не відео', () => {
	it('порожнє, не-адреса й чужі схеми', () => {
		for (const bad of [
			'',
			'   ',
			null,
			undefined,
			'просто текст',
			'/news/1',
			'mailto:a@b.ua',
			'ftp://example.com/a.mp4',
			'https://example.com/video.mp4'
		]) {
			expect(parseVideoUrl(bad as string), JSON.stringify(bad)).toBeNull();
		}
	});
});

describe('cardImageUrl', () => {
	const YT = 'https://youtu.be/dQw4w9WgXcQ';

	it('є і зображення, і відео — на картці ЗОБРАЖЕННЯ', () => {
		expect(cardImageUrl('https://example.com/cover.jpg', YT)).toBe('https://example.com/cover.jpg');
	});

	it('є лише відео — підставляється кадр із YouTube', () => {
		expect(cardImageUrl('', YT)).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
		expect(cardImageUrl(undefined, YT)).toContain('img.youtube.com');
	});

	it('лише Vimeo без зображення — картка без зображення', () => {
		expect(cardImageUrl(undefined, 'https://vimeo.com/123456789')).toBe('');
	});

	it('немає нічого — порожньо', () => {
		expect(cardImageUrl(undefined, undefined)).toBe('');
		expect(cardImageUrl('   ', '   ')).toBe('');
	});
});
