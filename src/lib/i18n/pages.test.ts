// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Кожен slug, який запитує маршрут, мусить відповідати файлу — з тим самим
 * регістром (I18N-v8 § 4).
 *
 * Реальний випадок із цього проєкту: `/projects/spring-odesa-theatre` просив
 * `spring-Odesa-theatre.md`, тоді як файл називається `spring-odesa-theatre.md`.
 * Vite будує ключі `import.meta.glob` із реальних імен файлів і порівнює їх
 * рядок у рядок, тож сторінка мовчки віддавала «Завантаження…» назавжди — і в
 * продакшні, і локально. Ані типи, ані збірка, ані lint цього не бачать: для
 * них це просто рядок.
 */
const PAGES_DIR = 'src/lib/i18n/pages';
const ROUTES_DIR = 'src/routes';

function slugsOf(lang: string): Set<string> {
	return new Set(
		readdirSync(join(PAGES_DIR, lang))
			.filter((f) => f.endsWith('.md'))
			.map((f) => f.replace(/\.md$/, ''))
	);
}

function sourceFiles(dir: string): string[] {
	const out: string[] = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) out.push(...sourceFiles(full));
		else if (entry.name.endsWith('.ts') || entry.name.endsWith('.svelte')) out.push(full);
	}
	return out;
}

describe('slug сторінок збігається з іменем файлу', () => {
	const available = { uk: slugsOf('uk'), en: slugsOf('en') };

	const requested: { file: string; lang: 'uk' | 'en'; slug: string }[] = [];
	for (const file of sourceFiles(ROUTES_DIR)) {
		const text = readFileSync(file, 'utf8');
		for (const m of text.matchAll(/loadPageWithMetadata\(\s*'(uk|en)'\s*,\s*'([^']+)'/g)) {
			requested.push({ file, lang: m[1] as 'uk' | 'en', slug: m[2] });
		}
	}

	it('запити знайдено — перевірка жива', () => {
		expect(requested.length).toBeGreaterThan(0);
		expect(available.uk.size).toBeGreaterThan(0);
	});

	it('кожен запитаний slug має файл із таким самим регістром', () => {
		const missing = requested
			.filter(({ lang, slug }) => !available[lang].has(slug))
			.map(({ file, lang, slug }) => `${file} → ${lang}/${slug}.md`);

		expect(missing, `немає таких файлів:\n${missing.join('\n')}`).toEqual([]);
	});
});
