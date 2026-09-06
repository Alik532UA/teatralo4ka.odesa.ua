import { readFileSync } from 'node:fs';

/**
 * Розмір зображення — із ЗАГОЛОВКА файлу, без жодної бібліотеки.
 *
 * ## Чому це окремий модуль
 *
 * Читачі жили всередині `config/localImages.test.ts`, і там їм було добре, поки
 * розмір знадобився рівно одному місцю. Тепер їх двоє: перевірка звіряє мапу з
 * диском, а конвертер новин (`scripts/news-from-firestore.ts`) вписує в ту саму
 * мапу розміри щойно завантажених знімків. Друга копія цих же сорока рядків
 * розійшлася б із першою мовчки — і найгірше, що розійтися вона могла б саме на
 * рідкісному форматі, тобто там, де ніхто не дивиться.
 *
 * ## Чому без бібліотеки
 *
 * PNG тримає розмір у фіксованих байтах IHDR, JPEG — у сегменті SOFn, WebP — у
 * заголовку VP8/VP8X/VP8L, SVG — в атрибутах кореневого тега. Чотири формати,
 * десяток рядків, нуль нових залежностей (DEPENDENCIES-v8 § 1).
 */

export type Розмір = [number, number];

export function pngSize(buffer: Buffer): Розмір {
	// IHDR стоїть одразу за 8-байтовим підписом: довжина, тип, далі ширина й висота.
	return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
}

export function jpegSize(buffer: Buffer): Розмір | null {
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

export function svgSize(text: string): Розмір | null {
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

export function webpSize(buffer: Buffer): Розмір | null {
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

/**
 * Формат — за ПІДПИСОМ у самих байтах, а не за розширенням у назві.
 *
 * Розширення бреше рівно там, де це найдорожче: знімок новини приходить із
 * стороннього хостингу адресою на кшталт `.../image?token=…`, де розширення
 * немає взагалі, а буває й `.jpg`, під яким лежить PNG. Заміряно на першому ж
 * прогоні конвертера: файл назвали `01.jpg`, розбирали як JPEG і отримали
 * `null` — тобто «розмір не читається» замість «це PNG».
 */
export type Формат = 'png' | 'jpg' | 'webp' | 'svg';

export function формат(байти: Buffer): Формат | null {
	if (байти.length >= 8 && байти.toString('ascii', 1, 4) === 'PNG') return 'png';
	if (байти.length >= 2 && байти[0] === 0xff && байти[1] === 0xd8) return 'jpg';
	if (байти.length >= 12 && байти.toString('ascii', 0, 4) === 'RIFF' && байти.toString('ascii', 8, 12) === 'WEBP') {
		return 'webp';
	}
	// SVG — текст, і підпису в нього немає: шукаємо кореневий тег на початку.
	if (байти.toString('utf8', 0, 512).includes('<svg')) return 'svg';
	return null;
}

/** Розмір із байтів, формат визначається підписом. `null` — не розібрано. */
export function розмірБайтів(байти: Buffer): Розмір | null {
	switch (формат(байти)) {
		case 'png':
			return pngSize(байти);
		case 'jpg':
			return jpegSize(байти);
		case 'webp':
			return webpSize(байти);
		case 'svg':
			return svgSize(байти.toString('utf8'));
		default:
			return null;
	}
}

/** Те саме для файла на диску за ПОВНИМ шляхом. */
export function розмірФайла(файл: string): Розмір | null {
	return розмірБайтів(readFileSync(файл));
}
