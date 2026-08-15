import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * PROJECT-STRUCTURE-v8 § 8.
 *
 * Три перевірки, і третя — про борг, який до 2026-08-16 ніхто не міряв.
 * PROJECT-CONTEXT називав три завеликі файли з числами 2078 / 1296 / 1113.
 * Заміряно: файлів **тридцять**, а ті три мають 2511 / 1419 / 1369 — тобто
 * записані числа не просто застаріли, вони занижені на чотири сотні рядків
 * кожне. Саме проти цього написаний AI-AGENT-PITFALLS-v8 § 5.5: число,
 * назване з пам'яті, живе в документації довго й читається як вимір.
 *
 * Стеля тут — не «мета», а храповик. Канон (§ 8) прямо каже: межу вмикають
 * після того, як чинні порушення розібрані, а доти перелік тримають у тесті
 * як явний allowlist, що тільки скорочується. Тому:
 *   • файл понад свою стелю — падіння (розростання зупинено);
 *   • файл, що впав нижче канонічної межі, мусить піти з переліку — інакше
 *     список перетворюється на пам'ятник;
 *   • новий файл понад канонічну межу — падіння без жодного запису.
 *
 * Стеля НЕ звужується на кожен знятий рядок навмисно: гейт, який червоніє від
 * будь-якої правки в бік покращення, вимикають першим.
 */

/** Канонічні межі § 7. Перший збіг виграє, тож порядок значущий. */
const LIMITS: Array<[RegExp, number]> = [
	[/\/routes\/.*\+page\.svelte$/, 400],
	[/\.svelte$/, 300],
	[/\.svelte\.ts$/, 300],
	[/\.ts$/, 250]
];

/**
 * Заміряно `wc -l` 2026-08-16. Кожен рядок — записаний борг § 7, а не дозвіл.
 * Число можна лише зменшувати; коли воно дійде до канонічної межі, рядок
 * прибирається, і перевірка нижче про це нагадає.
 */
const CEILINGS: Record<string, number> = {
	'src/routes/admin/settings/+page.svelte': 2511,
	'src/lib/components/HeaderSection.svelte': 1419,
	'src/lib/components/admin/ArticleForm.svelte': 1369,
	'src/lib/services/settings.ts': 1272,
	'src/routes/admin/content/+page.svelte': 1013,
	'src/routes/admin/users/+page.svelte': 994,
	'src/lib/components/ui/MenuEditor.svelte': 984,
	'src/lib/components/ui/RichTextEditor.svelte': 886,
	'src/lib/components/ContentWidget.svelte': 813,
	'src/routes/admin/articles/+page.svelte': 806,
	'src/lib/components/ContentCard.svelte': 731,
	'src/lib/components/ui/Toast.svelte': 689,
	'src/lib/components/ui/PianoModal.svelte': 682,
	'src/lib/components/Minimap.svelte': 662,
	'src/lib/components/FooterSection.svelte': 562,
	'src/routes/+page.svelte': 522,
	'src/routes/+layout.svelte': 504,
	'src/lib/components/ui/Select.svelte': 475,
	'src/lib/components/DetailPage.svelte': 421,
	'src/lib/components/admin/ArticleCategoryPicker.svelte': 405,
	'src/lib/components/PageScrollbar.svelte': 399,
	'src/lib/components/DepartmentsSection.svelte': 393,
	'src/lib/components/HeroSection.svelte': 386,
	'src/lib/components/GalleryCarousel.svelte': 382,
	'src/lib/components/SearchOverlay.svelte': 378,
	'src/lib/components/PhotoLightbox.svelte': 307,
	'src/lib/components/ui/PasswordInput.svelte': 301,
	'src/lib/schemas/settings.ts': 277,
	'src/lib/services/admin-articles.ts': 267,
	'src/lib/services/articles.ts': 267
};

const walk = (dir: string, out: string[] = []): string[] => {
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry).replace(/\\/g, '/');
		if (statSync(full).isDirectory()) walk(full, out);
		else out.push(full);
	}
	return out;
};

const all = walk('src');
const sources = all.filter((f) => /\.(ts|svelte)$/.test(f) && !/\.(test|spec)\.ts$/.test(f));
const lines = (f: string) => readFileSync(f, 'utf8').split('\n').length;
const limitFor = (f: string) => LIMITS.find(([re]) => re.test(f))?.[1] ?? Infinity;

describe('структура', () => {
	it('знаходить джерела — перевірка жива', () => {
		expect(sources.length).toBeGreaterThan(0);
		expect(Object.keys(CEILINGS).length).toBeGreaterThan(0);
	});

	it('руни лише у .svelte та .svelte.ts (CRITICAL)', () => {
		// Компілятор не обробляє руни поза цими розширеннями: `$state` у
		// звичайному `.ts` не помилка синтаксису, а звичайне звертання до
		// неоголошеної змінної — тобто падіння в рантаймі, а не на збірці.
		const bad = all
			.filter((f) => f.endsWith('.ts') && !f.endsWith('.svelte.ts'))
			.filter((f) => !/\.(test|spec)\.ts$/.test(f))
			.filter((f) => /\$state[({<]|\$derived[({<]|\$effect[({.]/.test(readFileSync(f, 'utf8')));
		expect(bad, `руни у звичайному .ts — не скомпілюються:\n${bad.join('\n')}`).toEqual([]);
	});

	it('псевдонім імпорту збігається з іменем файлу (§ 5.2)', () => {
		// Розбіжність тиха: код працює, а пошук за назвою компонента більше не
		// знаходить місць його використання — і зв'язок «testid ↔ компонент ↔
		// файл» рветься саме там, де на нього спираються перевірки.
		const re = /import\s+([A-Z][A-Za-z0-9]*)\s+from\s+["'][^"']*\/([A-Z][A-Za-z0-9]*)\.svelte["']/g;
		const bad: string[] = [];
		for (const f of sources) {
			for (const m of readFileSync(f, 'utf8').matchAll(re)) {
				if (m[1] !== m[2]) bad.push(`${f}: ${m[1]} -> ${m[2]}.svelte`);
			}
		}
		expect(bad, `розбіжність псевдоніма й файлу:\n${bad.join('\n')}`).toEqual([]);
	});

	it('жоден файл не переріс своєї стелі (§ 7)', () => {
		const grown = sources
			.map((f) => {
				const ceiling = CEILINGS[f] ?? limitFor(f);
				const n = lines(f);
				return n > ceiling ? `${f}: ${n} рядків (стеля ${ceiling})` : null;
			})
			.filter(Boolean);
		expect(
			grown,
			`файли виросли — розділити за відповідальністю або оновити стелю разом із причиною:\n${grown.join('\n')}`
		).toEqual([]);
	});

	it('перелік стель не містить зайвого (§ 8)', () => {
		const stale = Object.keys(CEILINGS).filter((f) => !sources.includes(f));
		expect(stale, `файлів більше немає — прибрати з переліку:\n${stale.join('\n')}`).toEqual([]);

		const fixed = Object.keys(CEILINGS)
			.filter((f) => sources.includes(f))
			.filter((f) => lines(f) <= limitFor(f))
			.map((f) => `${f}: ${lines(f)} — уже в межах ${limitFor(f)}`);
		expect(
			fixed,
			`борг закрито — прибрати рядок із CEILINGS, щоб перелік не став пам'ятником:\n${fixed.join('\n')}`
		).toEqual([]);
	});
});
