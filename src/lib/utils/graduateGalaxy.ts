import type { Department, GraduateIndexEntry } from '$lib/data/graduates';

/**
 * Чиста логіка галактики випускників: розкладка доріжок і фільтр переліку.
 *
 * Винесено з компонентів не заради розміру файлу, хоч саме межа § 7 і змусила
 * подивитися: обидві функції не мають нічого спільного з DOM, а перевірити їх у
 * складі `.svelte` неможливо — компонентних тестів у проєкті немає за рішенням
 * (PROJECT-CONTEXT, «середовище КОМПОНЕНТНИХ тестів ще не обрано»). Тут вони
 * покриваються звичайним юніт-тестом.
 *
 * `random` приходить параметром, а не береться з `Math.random()`: інакше
 * перевірити розкладку можна було б лише «на око».
 */

export interface Lane {
	/**
	 * Позиція по висоті, 0..100 — БЕЗ одиниць.
	 *
	 * Не відсоток: у CSS це число множиться на `(100% - 56px)`, тобто на висоту
	 * галактики без висоти самої зірки. Інакше зірки з `top` під сотнею
	 * обрізаються нижнім краєм — заміряно, таких було 27 із 402.
	 */
	top: number;
	/** Тривалість прольоту екрана, секунди. */
	duration: number;
	/**
	 * Від'ємна затримка, секунди.
	 *
	 * Саме від'ємна: вона зсуває анімацію в МИНУЛЕ, тож зірки на першому кадрі
	 * уже розкидані по всій ширині. З нульовою затримкою всі 482 вилетіли б із
	 * лівого краю одночасно — щільною хвилею, а не галактикою.
	 */
	delay: number;
}

/**
 * Доріжки для `count` зірок.
 *
 * Висота роздається рівномірно, а не випадково: чистий випадок збирає зірки
 * плямами й лишає пусті смуги. Зсув у межах кроку прибирає видиму сітку.
 *
 * Тут стояв ще й параметр `spread`, який розкладав зірки кількома проходами по
 * висоті — я додав його, вважаючи, що при 482 зірках рівномірний крок дає одну
 * щільну стрічку. Це було з голови й було неправдою: крок НАКОПИЧУЄТЬСЯ, тож
 * рівномірна розкладка вже вкриває всю висоту. Заміряно на 402 і 80 зірках:
 * без `spread` найбільша пуста смуга 0.4% і 2.0%, з ним — 1.9% і 7.8%, і при
 * `spread` одна смуга з двадцяти лишалася порожньою взагалі. Тобто параметр
 * робив саме те, від чого мав захищати. Прибраний.
 */
export function makeLanes(count: number, minSeconds: number, random: () => number): Lane[] {
	if (count <= 0) return [];
	const step = 100 / count;

	return Array.from({ length: count }, (_, index) => ({
		top: index * step + random() * step * 0.7,
		duration: minSeconds + random() * minSeconds,
		delay: -random() * minSeconds * 2
	}));
}

export interface GraduateFilterOptions {
	year?: number | 'all';
	query?: string;
	photo?: 'all' | 'with' | 'without';
	department?: 'all' | Department;
	departments?: readonly Department[];
}

/**
 * Фільтр переліку за роком, анкетою, відділеннями (одним або декількома) і фрагментом імені.
 */
export function filterGraduates(
	graduates: readonly GraduateIndexEntry[],
	options: GraduateFilterOptions
): GraduateIndexEntry[] {
	const needle = (options.query ?? '').trim().toLowerCase();
	const year = options.year ?? 'all';
	const photo = options.photo ?? 'all';
	const department = options.department ?? 'all';
	const departments = options.departments ?? [];
	const effectiveDepts = departments.length > 0
		? departments.flatMap((d) => {
			if (d === 'music') return ['music', 'vocal', 'piano', 'guitar'] as const;
			if (d === 'theatre') return ['theatre', 'intensive'] as const;
			return [d];
		})
		: [];

	return graduates.filter((graduate) => {
		if (year !== 'all' && graduate.graduationYear !== year) return false;
		if (photo === 'with' && !graduate.hasPhoto) return false;
		if (photo === 'without' && graduate.hasPhoto) return false;
		if (effectiveDepts.length > 0 && !effectiveDepts.some((d) => graduate.departments?.includes(d))) {
			return false;
		}
		if (department !== 'all') {
			const targetDepts = department === 'music'
				? ['music', 'vocal', 'piano', 'guitar']
				: department === 'theatre'
					? ['theatre', 'intensive']
					: [department];
			if (!targetDepts.some((d) => graduate.departments?.includes(d as Department))) return false;
		}
		if (needle === '') return true;
		return graduate.name.toLowerCase().includes(needle);
	});
}
