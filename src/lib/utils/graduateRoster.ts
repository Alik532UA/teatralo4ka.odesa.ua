import type { GraduateIndexEntry } from '$lib/data/graduates';

/**
 * Чиста логіка переліку випускників: порядок і розкладка сітки.
 *
 * Окремим файлом, бо `GraduateRoster.svelte` тримається впритул до канонічної
 * межі 300 рядків (PROJECT-STRUCTURE-v8 § 7), а розкладку однаково треба
 * перевіряти без DOM: помилка на одну клітинку з розмітки не видна.
 */

/**
 * Порядок: роки від новіших, у межах року спершу ті, хто заповнив анкету, далі
 * решта, а всередині кожної підгрупи — довільний випадковий порядок.
 *
 * Анкети наперед — не про красу, а про користь: із понад 500 випускників сторінку про
 * себе мають 80, і саме їх у переліку є куди відкрити.
 */
export function sortRoster(
	graduates: readonly GraduateIndexEntry[],
	random: () => number = Math.random
): GraduateIndexEntry[] {
	const weighted = graduates.map((g) => ({
		graduate: g,
		weight: random()
	}));

	weighted.sort((a, b) => {
		const yearA = a.graduate.graduationYear ?? Number.NEGATIVE_INFINITY;
		const yearB = b.graduate.graduationYear ?? Number.NEGATIVE_INFINITY;
		if (yearA !== yearB) return yearB - yearA;

		const filledA = a.graduate.hasPhoto === true;
		const filledB = b.graduate.hasPhoto === true;
		if (filledA !== filledB) return filledA ? -1 : 1;

		return a.weight - b.weight;
	});

	return weighted.map((w) => w.graduate);
}

/** Клітинка сітки: номери рядка й колонки, обидва від одиниці, як у CSS Grid. */
export interface Cell {
	row: number;
	column: number;
}

/**
 * Скільки людей у кожному рядку смуги.
 *
 * Рівномірно, а не «набивати по `perRow`, доки не скінчаться». Набивання давало
 * останній рядок на одну-дві людини: 21 при шести в рядку — це 6+6+6+3, а 19 —
 * узагалі 6+6+6+1. Тут кількість рядків беруть одразу (`ceil(count / perRow)`),
 * а людей ділять між ними якомога рівніше, тож найбільший і найменший рядок
 * різняться не більше ніж на одного.
 *
 * Надлишок роздається ЧЕРЕЗ рядок, щоб сусідні рядки лишалися різними: саме
 * різниця в одного й дає шахівницю після центрування.
 */
export function rowSizes(count: number, perRow: number): number[] {
	if (count <= 0) return [];
	const cap = Math.max(1, Math.floor(perRow));

	const rows = Math.ceil(count / cap);
	const base = Math.floor(count / rows);
	let extra = count - base * rows;

	return Array.from({ length: rows }, (_, index) => {
		// Друга умова — коли надлишку лишилося стільки ж, скільки рядків: далі
		// пропускати не можна, інакше частина людей не отримає місця.
		const take = (index % 2 === 0 && extra > 0) || extra >= rows - index ? 1 : 0;
		extra -= take;
		return base + take;
	});
}

/**
 * Клітинки для однієї смуги рядків, починаючи з рядка `firstRow`.
 *
 * Кожен рядок центрується. Колонок у сітці ДВІЧІ більше, ніж людей у повному
 * рядку, а людина займає дві колонки — тому рядок із `k` людей починається з
 * колонки `perRow - k + 1` і має рівно по `perRow - k` півклітинок вільного
 * місця з кожного боку. Повний рядок починається з першої колонки, рядок на
 * одного менший — з другої (це й є зсув на півклітинки), і так далі.
 *
 * Саме тому центрування й шахівниця — це одна формула, а не дві.
 */
function stripeCells(sizes: readonly number[], perRow: number, firstRow: number): Cell[] {
	const cells: Cell[] = [];
	sizes.forEach((size, index) => {
		const start = Math.max(1, perRow - size + 1);
		for (let i = 0; i < size; i++) cells.push({ row: firstRow + index, column: start + i * 2 });
	});
	return cells;
}

/** Рік у переліку: скільки в ньому заповнених анкет і скільки решти. */
export interface RosterGroup {
	filled: number;
	plain: number;
}

/** Розкладка всього переліку: клітинки людей і рядки заголовків років. */
export interface RosterLayout {
	/** По одній клітинці на людину, у тому самому порядку, що й перелік. */
	cells: Cell[];
	/** Рядок заголовка кожної групи — по одному на рік, включно з першим. */
	headingRows: number[];
}

/**
 * Рядки з анкетами навмисно просторіші за решту: у них на одного меншу, тобто
 * кожна картка ширша. Це не декор — у тих людей є що відкрити, і їхній ярус має
 * читатися як окремий, а не як початок того самого списку.
 */
const VIP_LESS_PER_ROW = 1;

/**
 * Розкладка переліку: рік за роком, у кожному спершу просторіша смуга анкет,
 * далі щільніша смуга решти, і перед кожним роком — рядок під заголовок.
 *
 * Порядок клітинок точно повторює порядок людей після `sortRoster`: спершу
 * заповнені анкети року, потім решта року, і так далі.
 */
export function layoutRoster(groups: readonly RosterGroup[], perRow: number): RosterLayout {
	const full = Math.max(1, Math.floor(perRow));
	const vip = Math.max(1, full - VIP_LESS_PER_ROW);

	const cells: Cell[] = [];
	const headingRows: number[] = [];
	let nextRow = 1;

	for (const group of groups) {
		if (group.filled + group.plain <= 0) continue;
		headingRows.push(nextRow++);

		for (const [count, cap] of [
			[group.filled, vip],
			[group.plain, full]
		] as const) {
			const sizes = rowSizes(count, cap);
			cells.push(...stripeCells(sizes, full, nextRow));
			nextRow += sizes.length;
		}
	}

	return { cells, headingRows };
}

/**
 * Відмінює слово «випускник» під число: 1 випускник, 2 випускники,
 * 5 випускників, 11–19 випускників.
 *
 * Тут, а не в компоненті: це чиста функція без розмітки, її сусіди по файлу —
 * такі самі помічники того самого реєстру. Мова приходить аргументом, бо
 * `svelte-i18n` доступний лише всередині компонента, а рахувати форму слова
 * можна й без нього.
 */
export function formatGraduateNoun(count: number, locale: string): string {
	if (locale.startsWith('en')) {
		return count === 1 ? 'graduate' : 'graduates';
	}
	const mod10 = count % 10;
	const mod100 = count % 100;
	// 11–19 — виняток: там завжди «випускників», хоч остання цифра будь-яка.
	if (mod100 >= 11 && mod100 <= 19) return 'випускників';
	if (mod10 === 1) return 'випускник';
	if (mod10 >= 2 && mod10 <= 4) return 'випускника';
	return 'випускників';
}

/**
 * Куди прокрутити список, щоб обрана група року стала ПОСЕРЕДИНІ вікна.
 *
 * Доти група ставала верхнім рядком: за прямим посиланням `?at=2015` рік
 * опинявся під самою межею, а з кліку по шкалі частина групи лишалася за
 * нижнім краєм.
 *
 * Групи бувають вищі за саме вікно (2014-й — це 31 людина), і «центрувати»
 * таку означало б завести її заголовок ЗА верхній край: людина побачила б
 * середину списку й не побачила, який це рік. Тому центрується те, що
 * вміщається, а зависокій групі дається спокійний відступ згори — щоб
 * заголовок не лип до межі.
 */
export function centeredScrollTop(card: HTMLElement, grid: HTMLElement): number {
	const viewport = grid.clientHeight;
	const lead =
		card.offsetHeight <= viewport
			? (viewport - card.offsetHeight) / 2
			: Math.min(viewport * 0.12, 56);
	const maxTop = Math.max(0, grid.scrollHeight - viewport);
	return Math.min(maxTop, Math.max(0, card.offsetTop - grid.offsetTop - lead));
}

/**
 * У скільки разів збільшити єдину групу року, щоб вона зайняла вільний екран.
 *
 * Коли ввімкнено жорсткий фільтр по одному року, список часто займає верхню
 * третину аркуша, а решта — порожнеча. Збільшувати самі відступи безглуздо:
 * зростати мають імена, портрети й самі рядки, тобто те, заради чого сюди
 * прийшли. Саме тому в компоненті це властивість `zoom`, а не `transform`:
 * друга малює більше, але місця займає стільки ж, і порожнеча лишається.
 *
 * Стеля потрібна, щоб один випускник не роздувся на пів екрана.
 *
 * КОРІНЬ, а не пряме відношення. Збільшений вміст живе у власній системі
 * координат, тож у ту саму смугу вміщається менше колонок — і група росте
 * не лише вгору, а й у рядках. Пряме відношення (тут 807/388 ≈ 2.1)
 * перестрибувало б висоту вікна й повертало прокрутку, якої й позбувалися.
 */
export function fitZoom(natural: number, available: number, max = 1.6): number {
	if (natural <= 0 || available <= 0) return 1;
	return Math.min(max, Math.max(1, Math.sqrt(available / natural)));
}
