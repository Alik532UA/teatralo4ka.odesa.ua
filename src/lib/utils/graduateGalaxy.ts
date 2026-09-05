import type { Department, GraduateIndexEntry } from '$lib/data/graduates';
import { matchesQuery } from '$lib/utils/searchQuery';

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
	year?: number | 'all' | readonly number[];
	years?: readonly number[];
	query?: string;
	photo?: 'all' | 'with' | 'without';
	department?: 'all' | Department;
	departments?: readonly Department[];
	/**
	 * Майстри курсу — за `id` зв'язку, а не за іменем.
	 *
	 * Порожній перелік означає «усі», як і в решти фільтрів: інакше типовий стан
	 * сторінки мусив би перелічувати всіх двадцятьох сімох.
	 */
	masters?: readonly string[];
}

/**
 * `id` майстра з обох можливих форм зв'язку.
 *
 * У полі `masters` лежить або обʼєкт `{ id }`, або сам рядок — стара форма з
 * перенесення, коли ідентифікатора ще не було. Рядок повертається як є: у
 * реєстрі майстрів такого `id` не знайдеться, і фільтр просто не спрацює на
 * ньому, що правильніше, ніж упасти.
 */
function masterId(link: string | { id?: string }): string {
	return typeof link === 'string' ? link : (link.id ?? '');
}

/**
 * Фільтр переліку за роком (або декількома роками), анкетою, відділеннями і фрагментом імені.
 */
export function filterGraduates(
	graduates: readonly GraduateIndexEntry[],
	options: GraduateFilterOptions
): GraduateIndexEntry[] {
	const rawYear = options.years ?? options.year;
	const selectedYears = Array.isArray(rawYear)
		? rawYear
		: typeof rawYear === 'number'
			? [rawYear]
			: [];
	const photo = options.photo ?? 'all';
	const department = options.department ?? 'all';
	const departments = options.departments ?? [];
	const masters = options.masters ?? [];
	const effectiveDepts = departments.length > 0
		? departments.flatMap((d) => {
			if (d === 'music') return ['music', 'vocal', 'piano', 'guitar'] as const;
			if (d === 'theatre') return ['theatre', 'intensive'] as const;
			return [d];
		})
		: [];

	return graduates.filter((graduate) => {
		if (selectedYears.length > 0 && (!graduate.graduationYear || !selectedYears.includes(graduate.graduationYear))) {
			return false;
		}
		if (photo === 'with' && !graduate.hasPhoto) return false;
		if (photo === 'without' && graduate.hasPhoto) return false;
		if (effectiveDepts.length > 0 && !effectiveDepts.some((d) => graduate.departments?.includes(d))) {
			return false;
		}
		/*
		 * Достатньо ОДНОГО збігу: у 27 випускників майстрів курсу декілька (у
		 * Романа Арабаджі четверо), і людина належить кожному з них однаково.
		 */
		if (masters.length > 0 && !(graduate.masters ?? []).some((m) => masters.includes(masterId(m)))) {
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
		/*
		 * Ім'я звіряється спільним правилом, а не власним `includes`.
		 *
		 * Доти тут стояло просте порівняння підрядків, і поле «пошук за
		 * прізвищем» — найімовірніше місце, де прізвище набирають з пам'яті, —
		 * не знаходило ні «Тункевіч» замість «Тункевич», ні «Дар'я» з прямим
		 * апострофом, ні «Тункевич Аліса» в іншому порядку. Правило для цього
		 * в проєкті вже було (`utils/searchQuery`), просто цей фільтр його не
		 * знав.
		 */
		return matchesQuery([graduate.name], options.query ?? '');
	});
}

/**
 * Площа екрана, на якій зірки з фото стоять просторо, і летіти можуть УСІ.
 *
 * Число не з голови: зірка — коло 56px, а щоб сусіди не збігалися в купу, їй
 * потрібно приблизно два з половиною діаметри в кожен бік — 140×140, тобто
 * ≈19 600 px². На 89 портретів це 1.74 Мпкс, тобто десь 1920×910.
 */
const COMFORT_AREA = 1_750_000;

/**
 * Яку частку галактики показувати на екрані такої площі.
 *
 * Доти летіли всі, скільки б місця не було, і на телефоні 375×812 ті самі 89
 * портретів налазили один на одного суцільним килимом — заміряно, це 0.30 Мпкс
 * проти 1.75 потрібних, тобто вшестеро щільніше за задумане.
 *
 * Понад одиницю частка не росте: більше людей, ніж є, галактика не вигадає.
 */
export function galaxyShare(width: number, height: number): number {
	const area = width * height;
	if (area <= 0) return 1;
	return Math.min(1, area / COMFORT_AREA);
}

/**
 * Перемішує список на місці за Фішером–Йейтсом.
 *
 * Саме він, а не `sort(() => Math.random() - 0.5)`: той дає НЕрівномірний
 * розподіл (порівняння має бути стабільним, а тут воно випадкове), і частина
 * випускників систематично опинялася б у хвості — тобто на малому екрані не
 * потрапляла б у галактику взагалі.
 */
export function shuffled<T>(items: readonly T[], random: () => number): T[] {
	const out = [...items];
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[out[i], out[j]] = [out[j], out[i]];
	}
	return out;
}

/**
 * Майстри курсів, у яких є хоч один випускник, — від найбільшого до найменшого.
 *
 * ## Чому за КІЛЬКІСТЮ, а не за абеткою
 *
 * У переліку 27 імен, і розподіл у них крутий: у Світлани Риськіної 103
 * випускники, у Федора Ткача 95, у Тетяни Ісачкіної 67 — а в семи майстрів по
 * одному. Абеткою читач шукав би трьох найпотрібніших очима по всьому списку;
 * за кількістю вони перші три рядки.
 *
 * ## Чому лише ті, у кого хтось є
 *
 * У реєстрі майстрів 145 записів, але майстром КУРСУ значиться 27. Показати всі
 * 145 означало б фільтр, у якому 118 варіантів гарантовано дають порожньо.
 *
 * Ідентифікатор, а не ім'я: імена міняються (за одну сесію їх виправили тричі),
 * а `id` — ключ зв'язку, і саме він їде в адресу сторінки як `?master=`.
 */
export function courseMasterCounts(
	graduates: readonly GraduateIndexEntry[]
): { id: string; count: number }[] {
	const скільки = new Map<string, number>();
	for (const graduate of graduates) {
		for (const link of graduate.masters ?? []) {
			const id = masterId(link);
			if (!id) continue;
			скільки.set(id, (скільки.get(id) ?? 0) + 1);
		}
	}
	return [...скільки]
		.map(([id, count]) => ({ id, count }))
		.sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
}
