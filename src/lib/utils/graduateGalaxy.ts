import type { GraduateIndexEntry } from '$lib/data/graduates';

/**
 * Чиста логіка галактики випускників: розкладка доріжок, ротація та фільтр.
 *
 * Винесено з компонентів не заради розміру файлу, хоч саме межа § 7 і змусила
 * подивитися: усі три функції не мають нічого спільного з DOM, а перевірити їх у
 * складі `.svelte` неможливо — компонентних тестів у проєкті немає за рішенням
 * (PROJECT-CONTEXT, «середовище КОМПОНЕНТНИХ тестів ще не обрано»). Тут вони
 * покриваються звичайним юніт-тестом.
 *
 * `random` приходить параметром, а не береться з `Math.random()`: інакше
 * перевірити розкладку можна було б лише «на око».
 */

export interface Lane {
	/** Відсоток висоти галактики. */
	top: number;
	/** Тривалість прольоту екрана, секунди. */
	duration: number;
	/**
	 * Від'ємна затримка, секунди.
	 *
	 * Саме від'ємна: вона зсуває анімацію в МИНУЛЕ, тож зірки на першому кадрі
	 * уже розкидані по всій ширині. З нульовою затримкою всі шістдесят
	 * вилетіли б із лівого краю одночасно — щільною хвилею, а не галактикою.
	 */
	delay: number;
}

/**
 * Доріжки для `count` зірок.
 *
 * Висота роздається рівномірно, а не випадково: чистий випадок збирає зірки
 * плямами й лишає пусті смуги. Зсув у межах кроку прибирає видиму сітку.
 */
export function makeLanes(count: number, minSeconds: number, random: () => number): Lane[] {
	if (count <= 0) return [];
	const step = 100 / count;

	return Array.from({ length: count }, (_, index) => ({
		top: step * index + random() * step * 0.7,
		duration: minSeconds + random() * minSeconds,
		delay: -random() * minSeconds * 2
	}));
}

/**
 * Індекс наступного випускника, якого зараз немає на екрані.
 *
 * `null` означає «пул вичерпано» — тоді доріжка лишає того, хто вже в ній. Без
 * цієї перевірки на пулі, меншому за кількість доріжок, ротація видавала б
 * дублікати, і той самий портрет летів би у двох місцях одночасно.
 */
export function pickFree(
	poolSize: number,
	assigned: readonly number[],
	random: () => number
): number | null {
	const shown = new Set(assigned);
	const free: number[] = [];
	for (let index = 0; index < poolSize; index++) {
		if (!shown.has(index)) free.push(index);
	}
	if (free.length === 0) return null;
	return free[Math.floor(random() * free.length)];
}

/**
 * Фільтр переліку за роком і фрагментом імені.
 *
 * Пошук регістронезалежний і за підрядком: на 482 записах людина шукає «Поляк»,
 * а не точне «Ольга Полякова». Порівняння через `toLowerCase()` обох боків —
 * `localeCompare` тут не потрібен, бо це не сортування.
 */
export function filterGraduates(
	graduates: readonly GraduateIndexEntry[],
	options: { year: number | 'all'; query: string }
): GraduateIndexEntry[] {
	const needle = options.query.trim().toLowerCase();

	return graduates.filter((graduate) => {
		if (options.year !== 'all' && graduate.graduationYear !== options.year) return false;
		if (needle === '') return true;
		return graduate.name.toLowerCase().includes(needle);
	});
}
