// @vitest-environment node
import { describe, it, expect } from 'vitest';
import graduatesIndex from './graduates.index.json';
import mastersIndex from './masters.index.json';
import groupsData from './groups.data.json';
import playsData from './plays.data.json';
import festivalsData from './festivals.data.json';
import { DEPARTMENTS, GRADUATE_KINDS } from './graduates';
import { MASTER_CATEGORIES, MASTER_STATUSES } from './masters';
import { VISIBILITY_LEVELS } from '$lib/config/visibility';

/**
 * Поля, які компілятор звірити не може.
 *
 * ## Звідки взялася діра
 *
 * Реєстри лежать у JSON і доти приходили в код через `as MasterIndexEntry[]` —
 * приведення, яке мовчки погоджується з БУДЬ-ЯКИМ вмістом файлу. Тепер форму
 * звіряє `satisfies`, тобто сам компілятор, і коштує це в бандлі нуль.
 *
 * Але одного TypeScript зробити не вміє: в імпортованому JSON він бачить
 * `departments: string[]`, а не союз із семи значень, і `unconfirmed: boolean`
 * замість літерала `true`. Тому в типах, які дивляться на JSON, ці п'ять полів
 * навмисне розширені — а звужує їх ця перевірка.
 *
 * Перелік розширених полів і перелік перевірок тут мусять збігатися. Розійшовшись,
 * вони дадуть рівно те, що було до цієї роботи: поле, за яким не стежить ніхто.
 *
 * ## Чому не zod
 *
 * У проєкті zod уже є — у `lib/schemas`, на межі з Firestore. Там він доречний:
 * дані приходять ззовні й міняються в рантаймі. Реєстри натомість — сталі, що
 * їдуть у бандл; перевіряти їх у браузері читача означало б везти туди ще й
 * схему заради того, що вже відомо на збірці.
 *
 * ## Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1)
 *
 * Проведено на трьох дефектах: `departments: ['театр']` у випускника,
 * `category: 'зірки'` у майстра, `hasPhoto: false`. Кожна перевірка впала й
 * назвала саме той запис і те поле.
 */
const graduates = graduatesIndex as {
	id: string;
	departments?: string[];
	hasPhoto?: boolean;
	kind?: string;
	visibility?: string;
}[];
const masters = mastersIndex as {
	id: string;
	departments?: string[];
	category?: string;
	status?: string;
	unconfirmed?: boolean;
	visibility?: string;
}[];

describe('поля, які компілятор не звужує', () => {
	it('перевірка жива: обидва реєстри прочитано', () => {
		expect(graduates.length).toBeGreaterThan(100);
		expect(masters.length).toBeGreaterThan(50);
	});

	it('реєстри знають лише відомі відділення', () => {
		const known = new Set<string>(DEPARTMENTS);
		const bad: string[] = [];
		for (const [label, rows] of [
			['випускник', graduates],
			['працівник', masters]
		] as const)
			for (const row of rows)
				for (const department of row.departments ?? [])
					if (!known.has(department)) bad.push(`${label} ${row.id} → «${department}»`);
		expect(bad, `невідоме відділення:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	/*
	 * `hasPhoto?: true` — не примха типу, а домовленість: запис БЕЗ поля летить у
	 * галактиці зіркою, запис із полем — портретом. `false` тут означав би третій
	 * стан, якого код не знає, і людина мовчки зникла б із портретного шару.
	 */
	it('hasPhoto існує лише зі значенням true', () => {
		const bad = graduates.filter((g) => 'hasPhoto' in g && g.hasPhoto !== true).map((g) => g.id);
		expect(bad, `hasPhoto не true:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	it('unconfirmed існує лише зі значенням true', () => {
		const bad = masters.filter((m) => 'unconfirmed' in m && m.unconfirmed !== true).map((m) => m.id);
		expect(bad, `unconfirmed не true:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	it('реєстр працівників знає лише відомі ролі та стани', () => {
		const categories = new Set<string>(MASTER_CATEGORIES);
		const statuses = new Set<string>(MASTER_STATUSES);
		const bad: string[] = [];
		for (const m of masters) {
			if (m.category !== undefined && !categories.has(m.category))
				bad.push(`${m.id}.category → «${m.category}»`);
			if (m.status !== undefined && !statuses.has(m.status))
				bad.push(`${m.id}.status → «${m.status}»`);
		}
		expect(bad, `невідоме значення:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	it('реєстри груп, вистав, фестивалів та працівників мають валідний verificationStatus', () => {
		const allowed = new Set(['verified', 'possible_errors', 'definite_errors']);
		const bad: string[] = [];

		for (const g of groupsData as { slug: string; verificationStatus?: string }[]) {
			if (g.verificationStatus !== undefined && !allowed.has(g.verificationStatus)) {
				bad.push(`група ${g.slug} → «${g.verificationStatus}»`);
			}
		}

		for (const p of playsData as { id: string; verificationStatus?: string }[]) {
			if (p.verificationStatus !== undefined && !allowed.has(p.verificationStatus)) {
				bad.push(`вистава ${p.id} → «${p.verificationStatus}»`);
			}
		}

		for (const f of festivalsData as { slug: string; verificationStatus?: string }[]) {
			if (f.verificationStatus !== undefined && !allowed.has(f.verificationStatus)) {
				bad.push(`фестиваль ${f.slug} → «${f.verificationStatus}»`);
			}
		}

		for (const m of mastersIndex as { id: string; verificationStatus?: string }[]) {
			if (m.verificationStatus !== undefined && !allowed.has(m.verificationStatus)) {
				bad.push(`працівник ${m.id} → «${m.verificationStatus}»`);
			}
		}

		expect(bad, `невідомий verificationStatus:\n  ${bad.join('\n  ')}`).toEqual([]);

		const ztk = (groupsData as { slug: string; verificationStatus?: string }[]).find(
			(g) => g.slug === 'zakhysnyky-teatralnykh-kulis'
		);
		expect(ztk?.verificationStatus).toBe('verified');
	});

	/*
	 * Видимість — одне поле з трьома значеннями в ОБОХ реєстрах
	 * (`config/visibility.ts`). Невідоме значення читається як `listed`, тобто
	 * описка не сховала б людину мовчки — вона показала б її; саме тому описку
	 * має ловити збірка, а не читач.
	 */
	it('видимість — лише три відомі рівні, в обох реєстрах', () => {
		const levels = new Set<string>(VISIBILITY_LEVELS);
		const bad: string[] = [];
		for (const g of graduates)
			if (g.visibility !== undefined && !levels.has(g.visibility))
				bad.push(`graduates ${g.id}.visibility → «${g.visibility}»`);
		for (const m of masters)
			if (m.visibility !== undefined && !levels.has(m.visibility))
				bad.push(`masters ${m.id}.visibility → «${m.visibility}»`);
		expect(bad, `невідомий рівень видимости:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	it('kind випускника — лише відомі значення', () => {
		const kinds = new Set<string>(GRADUATE_KINDS);
		const bad = graduates
			.filter((g) => g.kind !== undefined && !kinds.has(g.kind))
			.map((g) => `${g.id}.kind → «${g.kind}»`);
		expect(bad, `невідомий статус:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	/*
	 * Учень у галактиці не буває — так вирішив автор 2026-09-02: його сторінку
	 * й зв'язки збираємо заздалегідь, а в переліку випускників він з'явиться,
	 * коли стане випускником. Рік у нього очікуваний, і перелік за роками
	 * поставив би його поруч зі справжнім випуском.
	 */
	it('учень не буває в переліку', () => {
		const bad = graduates
			.filter((g) => g.kind === 'student' && (g.visibility ?? 'listed') === 'listed')
			.map((g) => g.id);
		expect(bad, `учень у галактиці — потрібен рівень linked або direct:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	/*
	 * Старі поля не повертаються. `hidden` і `visible` означали різне під схожими
	 * іменами, `graduationLabelKey` тримав статус у ключі перекладу; повернення
	 * будь-якого з них знову зробило б відповідь «чи показуємо» такою, що її
	 * треба виводити з коду.
	 */
	it('старі поля видимости й підпису не повернулися', () => {
		const bad: string[] = [];
		for (const g of graduates as unknown as Record<string, unknown>[]) {
			if ('hidden' in g) bad.push(`graduates ${g.id}: hidden → visibility`);
			if ('graduationLabelKey' in g) bad.push(`graduates ${g.id}: graduationLabelKey → kind`);
		}
		for (const m of masters as unknown as Record<string, unknown>[])
			if ('visible' in m) bad.push(`masters ${m.id}: visible → visibility`);
		expect(bad, `старе поле повернулося:\n  ${bad.join('\n  ')}`).toEqual([]);
	});
});
