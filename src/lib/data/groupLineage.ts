import lineageData from './group-lineage.data.json';
import { GROUPS, type GraduateGroup } from './groups';

/**
 * Родовід груп: що з чого стало.
 *
 * ## Задача
 *
 * «FreeStyle» 2014 року перформатували, і далі та сама історія продовжилася під
 * назвою «ТУ-154». Дві сторінки, між якими не було нічого: читач бачив дві
 * незнайомі групи з однією людиною в спільному складі й не мав звідки дізнатися,
 * що це одна лінія.
 *
 * Але зв'язок груп НЕ буває лише «одна до одної». Кілька груп зливаються в одну,
 * одна розпадається на кілька, кілька перерозподіляються в кілька, одна
 * перетікає в іншу. Механізм, розрахований на пару, довелося б переписувати на
 * першому ж злитті — а такі в школі вже є.
 *
 * ## Чому ОКРЕМИЙ реєстр, а не поле в групі
 *
 * Зв'язок належить ДВОМ групам одночасно. Поле в одній із них — довільний вибір
 * («де записувати, у попередниці чи в наступниці?»), а поля в обох — та сама
 * копія двічі, тобто спосіб розійтися. Проєкт цим уже колись обпікся: зв'язок
 * «вистава ↔ група» був однобічним, сторінка групи показ показувала, а сторінка
 * показу групу — ні, і довелося ставити окремий гейт симетрії.
 *
 * Тут зв'язок записаний ОДИН раз, а обидві сторінки виводять свій бік із того
 * самого рядка. Розійтися нема чому.
 *
 * ## Чому напрямлені ребра, а не поле «різновид»
 *
 * Усі чотири випадки, які треба вміти, — це та сама пара `from → to`, лише в
 * різній кількості:
 *
 *   A → B ................... одна перетекла в іншу
 *   A → C, B → C ............ кілька злилися в одну
 *   A → B, A → C ............ одна розпалася на кілька
 *   A → C, A → D, B → C ..... кілька перерозподілилися в кілька
 *
 * Тому різновид тут не ЗАПИСУЮТЬ, а виводять із самих ребер. Записаний
 * `kind: 'merge'` у групи, у якої попередниця одна, був би неправдою, яку не
 * розв'язати нічим, окрім того самого підрахунку — тобто полем, що вміє
 * суперечити даним поруч.
 */
export interface GroupLineageEdge {
	/** Група, ЯКА стала. `slug` із реєстру груп. */
	from: string;
	/** Група, ЯКОЮ стала. `slug` із реєстру груп. */
	to: string;
	/**
	 * Одним рядком — що саме сталося: «групу перформатували», «курс перетік, а
	 * не набирався заново». Це не назва різновиду (той виводиться), а те, чого з
	 * чисел не видно. Немає поля — сторінка покаже зв'язок без пояснення.
	 *
	 * НАПРЯМКУ в тексті бути НЕ ПОВИННО. Один рядок рендериться на ДВОХ
	 * сторінках — під назвою наступниці в попередниці й навпаки, — тож «перетік
	 * у цю групу» на одній зі сторінок вказує не на ту. Напрямок і так несе
	 * підпис («Далі стала» проти «До цього була»), і нести його двічі означає
	 * нести двічі шанс збрехати.
	 */
	note?: string;
	noteEn?: string;
	/**
	 * Приховати групу-попередницю з окремого рядка хронології на користь
	 * комбінованого блоку наступниці (Варіант B у хронології).
	 */
	omitFromTimeline?: boolean;
}

export const LINEAGE: readonly GroupLineageEdge[] = lineageData satisfies readonly GroupLineageEdge[];

/** Чи прихована група з окремого блоку хронології */
export function isOmittedFromTimeline(slug: string): boolean {
	return LINEAGE.some((edge) => edge.from === slug && edge.omitFromTimeline);
}

/** Очистити назву групи від лапок для компактного показу в бейджах і деревах */
export function cleanGroupName(name: string): string {
	return name.replace(/^[«"“]|["”»]$/g, '').trim();
}

/** Роки випуску одним рядком: «2013» або «2017–2018» */
export function formatGroupYears(years: readonly number[]): string {
	if (years.length === 0) return '';
	const min = Math.min(...years);
	const max = Math.max(...years);
	return min === max ? `${min}` : `${min}–${max}`;
}

/** Один бік родоводу: сама група плюс пояснення з ребра, яким вона прийшла. */
export interface LineageLink {
	group: GraduateGroup;
	note?: string;
	noteEn?: string;
}

/**
 * Ребро → ланка родоводу. Невідомий `slug` мовчки відкидається.
 *
 * Мовчки — бо кричати про це має ГЕЙТ на збірці (`groupLineage.test.ts`), а не
 * сторінка читача карткою без назви. Той самий вибір, що в `playsByIds` і в
 * складі групи.
 */
function ланка(slug: string, edge: GroupLineageEdge): LineageLink | undefined {
	const group = GROUPS.find((g) => g.slug === slug);
	return group ? { group, note: edge.note, noteEn: edge.noteEn } : undefined;
}

function ланки(edges: GroupLineageEdge[], бік: (e: GroupLineageEdge) => string): LineageLink[] {
	return edges
		.map((edge) => ланка(бік(edge), edge))
		.filter((link): link is LineageLink => link !== undefined);
}

/** Групи, з яких ця постала: ребра, що ведуть У неї. */
export function predecessorsOf(slug: string): LineageLink[] {
	return ланки(
		LINEAGE.filter((e) => e.to === slug),
		(e) => e.from
	);
}

/** Групи, якими ця стала: ребра, що ведуть ІЗ неї. */
export function successorsOf(slug: string): LineageLink[] {
	return ланки(
		LINEAGE.filter((e) => e.from === slug),
		(e) => e.to
	);
}

/**
 * Родовід групи обома боками — і підпис до кожного.
 *
 * Підпис виводиться з КІЛЬКОСТІ, і саме тому їх по два на бік, а не по чотири.
 * «Далі стала» проти «Далі розпалася на»; «До цього була» проти «Зібралася з».
 * Тонша різниця — «перетекла» проти «влилася разом з іншими» — на цій сторінці
 * не потрібна: її видно з ІНШОГО боку зв'язку, де та сама група каже
 * «Зібралася з: A, B». Дублювати її ще й тут означало б два написи про одне.
 */
export function lineageOf(slug: string): {
	predecessors: LineageLink[];
	successors: LineageLink[];
	/** Ключі i18n — щоб компонент не збирав рядки з умов. */
	beforeKey: 'galaxy.lineageWas' | 'galaxy.lineageMergedFrom';
	afterKey: 'galaxy.lineageBecame' | 'galaxy.lineageSplitInto';
} {
	const predecessors = predecessorsOf(slug);
	const successors = successorsOf(slug);
	return {
		predecessors,
		successors,
		beforeKey: predecessors.length > 1 ? 'galaxy.lineageMergedFrom' : 'galaxy.lineageWas',
		afterKey: successors.length > 1 ? 'galaxy.lineageSplitInto' : 'galaxy.lineageBecame'
	};
}

/** Короткий бейдж родоводу для плитки: «FreeStyle + Кофейни4ки ➔» або «➔ ТУ-154 + Шевчушки» */
export function getGroupLineageBadge(slug: string, isEn: boolean): string | null {
	const preds = predecessorsOf(slug);
	if (preds.length > 0) {
		const names = preds.map((p) => cleanGroupName(isEn ? (p.group.nameEn ?? p.group.name) : p.group.name));
		return `${names.join(' + ')} ➔`;
	}
	const succs = successorsOf(slug);
	if (succs.length > 0) {
		const names = succs.map((s) => cleanGroupName(isEn ? (s.group.nameEn ?? s.group.name) : s.group.name));
		return `➔ ${names.join(' + ')}`;
	}
	return null;
}

/** Підзаголовок курсу для простого списку */
export function getGroupLineageSubtitle(slug: string, isEn: boolean): string | null {
	const preds = predecessorsOf(slug);
	const succs = successorsOf(slug);
	const current = GROUPS.find((g) => g.slug === slug);
	if (!current) return null;

	const curName = cleanGroupName(isEn ? (current.nameEn ?? current.name) : current.name);

	if (preds.length > 0) {
		const predParts = preds.map((p) => {
			const n = cleanGroupName(isEn ? (p.group.nameEn ?? p.group.name) : p.group.name);
			const y = formatGroupYears(p.group.graduationYears);
			return y ? `${n} (${y})` : n;
		});
		return `${predParts.join(' + ')} ➔ ${curName}`;
	}
	if (succs.length > 0) {
		const succParts = succs.map((s) => {
			const n = cleanGroupName(isEn ? (s.group.nameEn ?? s.group.name) : s.group.name);
			const y = formatGroupYears(s.group.graduationYears);
			return y ? `${n} (${y})` : n;
		});
		const curYears = formatGroupYears(current.graduationYears);
		const curPart = curYears ? `${curName} (${curYears})` : curName;
		return `${curPart} ➔ ${succParts.join(' + ')}`;
	}
	return null;
}

/** Вузол графічного ланцюжка родоводу */
export interface GalaxyRowLineageNode {
	slug: string;
	name: string;
	yearLabel: string;
	memberCount: number;
	memberIds?: readonly string[];
	relatedMemberIds?: readonly string[];
}

/** Дані для графічного таймлайн-ланцюжка або дерева родоводу */
export interface GalaxyRowLineageTree {
	type: 'merger' | 'split' | 'fork';
	predecessors: GalaxyRowLineageNode[];
	successors: GalaxyRowLineageNode[];
	siblings?: GalaxyRowLineageNode[];
	current: GalaxyRowLineageNode;
}

/** Отримати дерево родоводу для групи (якщо це злиття або розгалуження) */
export function getGroupLineageTree(slug: string, isEn: boolean): GalaxyRowLineageTree | null {
	const current = GROUPS.find((g) => g.slug === slug);
	if (!current) return null;

	const preds = predecessorsOf(slug);
	const succs = successorsOf(slug);

	const toNode = (g: GraduateGroup, relatedGroup?: GraduateGroup): GalaxyRowLineageNode => {
		const relatedIds = relatedGroup
			? g.memberIds.filter((id) => relatedGroup.memberIds.includes(id))
			: g.memberIds;
		return {
			slug: g.slug,
			name: cleanGroupName(isEn ? (g.nameEn ?? g.name) : g.name),
			yearLabel: formatGroupYears(g.graduationYears),
			memberCount: g.memberIds.length,
			memberIds: g.memberIds,
			relatedMemberIds: relatedIds.length > 0 ? relatedIds : g.memberIds
		};
	};

	// 1. Декілька груп зливаються в одну (наприклад, FreeStyle + Кофейни4ки ➔ ТУ-154)
	if (preds.length > 1) {
		return {
			type: 'merger',
			predecessors: preds.map((p) => toNode(p.group, current)),
			successors: [],
			current: toNode(current)
		};
	}

	// 2. Попередниця розгалужується на поточну групу ТА іншу (наприклад, Кофейни4ки ➔ Шевчушки та ТУ-154)
	if (preds.length === 1) {
		const pred = preds[0];
		const otherSuccessors = successorsOf(pred.group.slug).filter((s) => s.group.slug !== current.slug);
		if (otherSuccessors.length > 0) {
			return {
				type: 'fork',
				predecessors: [toNode(pred.group, current)],
				successors: [],
				siblings: otherSuccessors.map((s) => toNode(s.group, pred.group)),
				current: toNode(current)
			};
		}
		// Простий перетік 1-в-1 без паралельних гілок
		return {
			type: 'merger',
			predecessors: [toNode(pred.group, current)],
			successors: [],
			current: toNode(current)
		};
	}

	// 3. Група сама розгалужується на кілька наступниць
	if (succs.length > 0) {
		return {
			type: 'split',
			predecessors: [],
			successors: succs.map((s) => toNode(s.group, current)),
			current: toNode(current)
		};
	}

	return null;
}
