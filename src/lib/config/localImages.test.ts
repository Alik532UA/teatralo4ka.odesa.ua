// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { LOCAL_IMAGE_SIZES, imageSize, type LocalImage } from './localImages';

/**
 * Кожне число в мапі звіряється із ЗАГОЛОВКОМ файлу на диску.
 *
 * Без цього мапа була б просто другим місцем, де числа старіють, — тим самим,
 * від чого вона й рятує. Клас відомий: `HeroSection` роками заявляв
 * `width="1200" height="900"` на знімки 1280×804 і 4068×3070, тобто одне число
 * на дві різні пропорції, і жодна перевірка цього не бачила
 * (AI-AGENT-PITFALLS-v8 § 5.5).
 *
 * Заголовки читаються самотужки, без бібліотеки: PNG тримає розмір у фіксованих
 * байтах IHDR, JPEG — у сегменті SOFn, SVG — в атрибутах кореневого тега. Три
 * формати, десяток рядків, нуль нових залежностей (DEPENDENCIES-v8 § 1).
 */

const STATIC = join(process.cwd(), 'static');

function pngSize(buffer: Buffer): [number, number] {
	// IHDR стоїть одразу за 8-байтовим підписом: довжина, тип, далі ширина й висота.
	return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
}

function jpegSize(buffer: Buffer): [number, number] | null {
	let i = 2; // за SOI
	while (i < buffer.length - 8) {
		if (buffer[i] !== 0xff) {
			i += 1;
			continue;
		}
		const marker = buffer[i + 1];
		// SOFn — усе з 0xC0..0xCF, крім таблиць Хаффмана (C4), RSTn (C8) і DAC (CC).
		const isFrame = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
		if (isFrame) return [buffer.readUInt16BE(i + 7), buffer.readUInt16BE(i + 5)];
		i += 2 + buffer.readUInt16BE(i + 2);
	}
	return null;
}

function svgSize(text: string): [number, number] | null {
	const start = text.indexOf('<svg');
	if (start === -1) return null;
	const tag = text.slice(start, text.indexOf('>', start) + 1);
	const width = tag.match(/\bwidth="([\d.]+)/);
	const height = tag.match(/\bheight="([\d.]+)/);
	if (width && height) return [Math.round(+width[1]), Math.round(+height[1])];
	// Без явних атрибутів пропорцію задає viewBox — саме її й читає браузер.
	const box = tag.match(/viewBox="[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)"/);
	return box ? [Math.round(+box[1]), Math.round(+box[2])] : null;
}

function webpSize(buffer: Buffer): [number, number] | null {
	if (buffer.length < 30) return null;
	const riff = buffer.toString('ascii', 0, 4);
	const webp = buffer.toString('ascii', 8, 12);
	if (riff !== 'RIFF' || webp !== 'WEBP') return null;

	const chunk = buffer.toString('ascii', 12, 16);
	if (chunk === 'VP8X') {
		const width = 1 + (buffer[24] | (buffer[25] << 8) | (buffer[26] << 16));
		const height = 1 + (buffer[27] | (buffer[28] << 8) | (buffer[29] << 16));
		return [width, height];
	}
	if (chunk === 'VP8 ') {
		const width = buffer.readUInt16LE(26) & 0x3fff;
		const height = buffer.readUInt16LE(28) & 0x3fff;
		return [width, height];
	}
	if (chunk === 'VP8L') {
		const b1 = buffer[21];
		const b2 = buffer[22];
		const b3 = buffer[23];
		const b4 = buffer[24];
		const width = 1 + (((b2 & 0x3f) << 8) | b1);
		const height = 1 + (((b4 & 0xf) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6));
		return [width, height];
	}
	return null;
}

function sizeOnDisk(path: string): [number, number] | null {
	const file = join(STATIC, path);
	if (!existsSync(file)) return null;
	if (path.endsWith('.svg')) return svgSize(readFileSync(file, 'utf8'));
	if (path.endsWith('.png')) return pngSize(readFileSync(file));
	if (path.endsWith('.webp')) return webpSize(readFileSync(file));
	return jpegSize(readFileSync(file));
}

const entries = Object.keys(LOCAL_IMAGE_SIZES) as LocalImage[];

describe('розміри власних зображень', () => {
	it('перевірка жива: мапа не порожня', () => {
		expect(entries.length, 'мапа порожня — звіряти нема чого').toBeGreaterThan(0);
	});

	it('перевірка жива: читач заголовків справді читає', () => {
		// Якщо розбір зламається, усі перевірки нижче отримають `null` і мовчки
		// перетворяться на «файлу немає» замість «розмір не збігся».
		const known = sizeOnDisk('/png/History3.png');
		expect(known, 'заголовок PNG не розібрано').toEqual([1200, 1200]);
	});

	it.each(entries)('%s існує й має саме той розмір, що записано', (path) => {
		const onDisk = sizeOnDisk(path);
		expect(onDisk, `файлу немає у static/ або формат не розібрано: ${path}`).not.toBeNull();

		const declared = LOCAL_IMAGE_SIZES[path];
		expect(
			onDisk,
			`розмір розійшовся з файлом — атрибут відводить під зображення не ту ` +
				`пропорцію, і розкладка стрибне саме на завантаженні: ${path}`
		).toEqual([declared.width, declared.height]);
	});

	it('imageSize віддає копію, придатну для розгортання в атрибути', () => {
		const size = imageSize('/png/History3.png');
		expect(size).toEqual({ width: 1200, height: 1200 });
		expect(size, 'повернуто сам запис мапи — його не можна віддавати в розмітку').not.toBe(
			LOCAL_IMAGE_SIZES['/png/History3.png']
		);
	});
});
