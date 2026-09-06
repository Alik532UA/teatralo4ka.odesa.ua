// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { LOCAL_IMAGE_SIZES, imageSize, type LocalImage } from './localImages';
import { розмірФайла, type Розмір } from '../../../scripts/image-header';

/**
 * Кожне число в мапі звіряється із ЗАГОЛОВКОМ файлу на диску.
 *
 * Без цього мапа була б просто другим місцем, де числа старіють, — тим самим,
 * від чого вона й рятує. Клас відомий: `HeroSection` роками заявляв
 * `width="1200" height="900"` на знімки 1280×804 і 4068×3070, тобто одне число
 * на дві різні пропорції, і жодна перевірка цього не бачила
 * (AI-AGENT-PITFALLS-v8 § 5.5).
 *
 * Заголовки читаються самотужки, без бібліотеки — розбір у
 * `scripts/image-header.ts`, куди він переїхав разом із причиною.
 */

const STATIC = join(process.cwd(), 'static');

/**
 * Читачі заголовків живуть у `scripts/image-header.ts`.
 *
 * Вони переїхали звідси, коли розмір знадобився ще й конвертерові новин: той
 * вписує в цю ж мапу розміри щойно завантажених знімків, і друга копія розбору
 * заголовків розійшлася б із цією мовчки.
 */
function sizeOnDisk(path: string): Розмір | null {
	const file = join(STATIC, path);
	return existsSync(file) ? розмірФайла(file) : null;
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
