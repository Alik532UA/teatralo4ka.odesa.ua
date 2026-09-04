// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Одне поняття — одна іконка.
 *
 * ## Що саме поламалося
 *
 * Нагороди в картці вистави підписував `Award`, а вкладка-фільтр «З нагородами»
 * поруч — `Trophy`. Той самий `Award` водночас очолював розділ майстрів курсу,
 * тобто означав і нагороду, і людину. `Users` означав людей у трьох місцях і
 * групу в четвертому. `Sparkles` — то лічильник вистав, то абревіатуру групи.
 *
 * Жодна перевірка цього не бачила: кожна іконка окремо цілком доречна, а
 * розходяться вони лише між сторінками, які ніхто не відкриває поруч.
 *
 * ## Як перевіряється
 *
 * Не «іконка живе тільки в цьому файлі» — це заборонило б будь-яке нове
 * доречне вживання. Перевіряється зворотне й головне: біля МІТКИ поняття
 * (`data-testid`, ключ i18n, клас) стоїть саме та іконка, яку словник за цим
 * поняттям закріпив, і жодна чужа з того ж словника.
 *
 * Мітка — це те, що вже є в розмітці й не додане заради тесту.
 *
 * ## Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1)
 *
 * `Trophy` біля `award-item` замінено назад на `Award` — перевірка впала й
 * назвала і файл, і поняття, і те, що знайшла замість очікуваного.
 */
const VOCABULARY = [
	{
		concept: 'нагорода',
		icon: 'Trophy',
		sites: [
			{ file: 'src/lib/components/adults/MasterProductionCard.svelte', marker: 'award-item' },
			{
				file: 'src/lib/components/adults/MasterProductionsFilters.svelte',
				marker: 'galaxy.filterAwards'
			},
			{
				file: 'src/lib/components/adults/MasterProductionsList.svelte',
				marker: 'master-productions-row-awards-mark'
			}
		]
	},
	{
		/*
		 * Родовід — саме `GitBranch`, і причина не в моді на git-іконки: зв'язок
		 * груп буває багато-до-багатьох (кілька злилися, одна розпалася), і це
		 * галуження, а не стрілка вперед. `History` чи `ArrowRight` обіцяли б
		 * рівно те, чого механізм НЕ означає, — один лінійний ланцюг.
		 */
		concept: 'родовід груп: з чого постала й чим стала',
		icon: 'GitBranch',
		sites: [{ file: 'src/lib/components/GroupLineageSection.svelte', marker: 'group-lineage-title' }]
	},
	{
		concept: 'курс: майстри курсу й навчальні групи',
		icon: 'GraduationCap',
		sites: [
			{ file: 'src/lib/components/adults/MasterGroups.svelte', marker: 'master-groups-title' },
			{
				file: 'src/routes/projects/galaxy-graduates/groups/[slug]/+page.svelte',
				marker: 'section-faculty-title'
			}
		]
	},
	{
		concept: 'люди: склад і учасники',
		icon: 'Users',
		sites: [
			{ file: 'src/lib/components/adults/MasterProductionCard.svelte', marker: 'galaxy.participants' },
			{
				file: 'src/routes/projects/galaxy-graduates/groups/[slug]/+page.svelte',
				marker: 'section-members-title'
			},
			{
				file: 'src/routes/projects/galaxy-graduates/groups/+page.svelte',
				marker: 'group.memberIds.length'
			}
		]
	},
	{
		concept: 'вистави',
		icon: 'Theater',
		sites: [
			{
				file: 'src/lib/components/adults/MasterProductions.svelte',
				marker: 'master-productions-total-badge'
			},
			{ file: 'src/lib/components/GroupRepertoire.svelte', marker: 'section-plays-title' },
			{
				// Керування сценою переїхало зі сторінки в окремий компонент:
				// на телефоні ці кнопки ховаються за одним значком.
				file: 'src/lib/components/GalaxyStageControls.svelte',
				marker: 'galaxy-plays-link'
			},
			{
				// Мітка змінилася разом із джерелом: репертуар групи читається
				// через `playIdsOfGroup`, а не з `group.playIds` — інакше сторінка
				// курсу показувала б менше, ніж знає сама вистава.
				file: 'src/routes/projects/galaxy-graduates/groups/+page.svelte',
				marker: 'playIdsOfGroup(group.slug).length'
			}
		]
	},
	{
		concept: 'позивний групи',
		icon: 'Sparkles',
		sites: [
			{ file: 'src/routes/projects/galaxy-graduates/groups/+page.svelte', marker: 'group.abbr' },
			{
				file: 'src/routes/projects/galaxy-graduates/groups/[slug]/+page.svelte',
				marker: 'data.group.abbr'
			}
		]
	}
] as const;

const ALL_ICONS = VOCABULARY.map((v) => v.icon);

/**
 * Іконки словника поблизу мітки — у межах двох рядків.
 *
 * Саме поблизу, а не «перед»: мітка розділу трапляється двічі — спершу в
 * `aria-labelledby` самої секції, потім у заголовку, — і іконка стоїть між
 * ними. Заміряно на всіх дванадцяти місцях: далі двох рядків не відходить
 * жодна, а сусіднє поняття ближче ніж на три не підступає.
 */
const NEAR = 2;

/**
 * Іконка трапляється у ДВОХ формах, і читаються вони РІЗНО.
 *
 * `<Theater ` — звичайний тег у розмітці, і тоді від мітки його відділяють
 * рядки: іконка стоїть між `aria-labelledby` секції та її заголовком. Звідси
 * вікно ±2.
 *
 * `icon: Theater` — та сама іконка, але в ОПИСУВАЧІ: у панелі сцени галактики
 * п'ять переліків згорнуті в `{#each}`, значок приходить полем масиву, а тег
 * там записаний як `<Значок`. У цій формі іконка й мітка стоять на ОДНОМУ
 * рядку, тож вікно тут не потрібне — і шкідливе.
 *
 * Це перевірено на собі, двома падіннями підряд. Спершу перевірка знала лише
 * тег і побачила біля мітки нуль іконок. Потім я додав форму описувача, лишивши
 * вікно ±2, — і вона назвала «GraduationCap, Theater»: у вікно влізли СУСІДНІ
 * записи масиву, бо кожен займає один рядок. Тому правило таке: якщо мітка й
 * `icon:` стоять на одному рядку, вважається лише той рядок.
 */
const описувач = (icon: string) => [`icon: ${icon},`, `icon: ${icon} `];

function iconsNear(lines: string[], marker: string): Set<string> {
	const found = new Set<string>();
	lines.forEach((line, n) => {
		if (!line.includes(marker)) return;
		const свій = ALL_ICONS.filter((icon) => описувач(icon).some((ф) => line.includes(ф)));
		if (свій.length) {
			for (const icon of свій) found.add(icon);
			return;
		}
		for (let i = Math.max(0, n - NEAR); i <= Math.min(lines.length - 1, n + NEAR); i++)
			for (const icon of ALL_ICONS) if (lines[i].includes(`<${icon} `)) found.add(icon);
	});
	return found;
}

describe('словник іконок: одне поняття — одна іконка', () => {
	it('перевірка жива: усі згадані файли існують і містять свої мітки', () => {
		for (const { concept, sites } of VOCABULARY)
			for (const { file, marker } of sites) {
				const src = readFileSync(file, 'utf8');
				expect(src.includes(marker), `${concept}: у ${file} немає мітки «${marker}»`).toBe(true);
			}
	});

	it('біля мітки поняття стоїть саме його іконка', () => {
		const bad: string[] = [];
		for (const { concept, icon, sites } of VOCABULARY)
			for (const { file, marker } of sites) {
				const found = [...iconsNear(readFileSync(file, 'utf8').split('\n'), marker)];
				if (found.length === 1 && found[0] === icon) continue;
				bad.push(
					`${concept} → чекали ${icon}, а біля «${marker}» у ${file}: ${found.join(', ') || '—'}`
				);
			}
		expect(bad, `іконка розійшлася з поняттям:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	/*
	 * `Award` прибрано навмисно: він означав і нагороду, і майстра курсу, тобто
	 * саме те, чого цей словник не допускає. Нагорода тепер `Trophy`, майстер —
	 * `GraduationCap`. Повернути `Award` можна лише разом із поняттям, якого ще
	 * немає в словнику вище.
	 */
	it('двозначний Award не повернувся в публічну частину', () => {
		const bad: string[] = [];
		const walk = (dir: string) => {
			for (const e of readdirSync(dir, { withFileTypes: true })) {
				const p = join(dir, e.name).split('\\').join('/');
				if (e.isDirectory()) {
					if (!p.includes('/admin')) walk(p);
				} else if (/\.svelte$/.test(e.name)) {
					const src = readFileSync(p, 'utf8');
					if (/\{[^}]*\bAward\b[^}]*\}\s*from\s*'lucide-svelte'/.test(src)) bad.push(p);
				}
			}
		};
		walk('src');
		expect(bad, `Award знову в публічній частині:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	it('жодна іконка словника не закріплена за двома поняттями', () => {
		const seen = new Map<string, string[]>();
		for (const { concept, icon } of VOCABULARY)
			seen.set(icon, [...(seen.get(icon) ?? []), concept]);
		const bad = [...seen]
			.filter(([, concepts]) => concepts.length > 1)
			.map(([icon, concepts]) => `${icon}: ${concepts.join(' / ')}`);
		expect(bad, `іконка означає двоє:\n  ${bad.join('\n  ')}`).toEqual([]);
		expect(new Set(ALL_ICONS).size).toBe(ALL_ICONS.length);
	});
});
