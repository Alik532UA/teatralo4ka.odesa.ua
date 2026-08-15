import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SITE_ORIGIN, siteUrl } from '$lib/config/site';

/**
 * CUSTOM-DOMAIN-v8 § 1 і § 5 — адреса сайту живе в одному місці.
 *
 * Переїзд на інший домен атомарний: половина змін дає стан гірший за їх повну
 * відсутність — canonical веде на стару адресу, sitemap на нову, і в індексі
 * два повні дублі сайту. До 2026-08-16 копій було чотири (`+layout.ts`,
 * `+layout.svelte`, `generate-sitemap.ts`, `robots.txt`), тобто атомарність
 * трималася на уважності.
 *
 * Ця перевірка тримає дві різні речі, і другу видно лише звідси: у коді копій
 * більше немає, а `robots.txt` — файл поза межами будь-якого гейта проєкту —
 * називає ту саму адресу.
 */
const ORIGIN_LITERAL = new RegExp(`['"\`]${SITE_ORIGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]`);

/** Джерело правди; тут літерал і має бути. */
const SOURCE_OF_TRUTH = 'src/lib/config/site.ts';

const walk = (dir: string, out: string[] = []): string[] => {
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry).replace(/\\/g, '/');
		if (statSync(full).isDirectory()) walk(full, out);
		else if (/\.(ts|svelte)$/.test(entry)) out.push(full);
	}
	return out;
};

describe('адреса сайту', () => {
	const sources = [...walk('src'), ...walk('scripts')].filter(
		(f) => !/\.(test|spec)\.ts$/.test(f)
	);

	it('знаходить джерела — перевірка жива', () => {
		expect(sources.length).toBeGreaterThan(0);
		expect(sources).toContain(SOURCE_OF_TRUTH);
	});

	it('origin без хвостової косої риски', () => {
		// Усі споживачі додають шлях, що починається зі слеша. Зайва риска дала б
		// `https://site//about/` — валідну адресу, яка в індексі конкурує зі
		// справжньою.
		expect(SITE_ORIGIN).toMatch(/^https:\/\/[^/]+$/);
		expect(siteUrl('/about/')).toBe(`${SITE_ORIGIN}/about/`);
	});

	it('жодне джерело не тримає власної копії origin', () => {
		const copies = sources
			.filter((f) => f !== SOURCE_OF_TRUTH)
			.filter((f) => ORIGIN_LITERAL.test(readFileSync(f, 'utf8')));

		expect(
			copies,
			`адреса продубльована — при переїзді розійдеться:\n${copies.join('\n')}`
		).toEqual([]);
	});

	it('robots.txt називає ту саму адресу', () => {
		// Єдиний файл проєкту, куди origin доводиться писати рядком: його читає
		// пошуковик, а не збірка. Тому звіряється тут — більше ніде його не видно.
		const robots = readFileSync('static/robots.txt', 'utf8');

		const host = /^Host:\s*(\S+)\s*$/m.exec(robots);
		const sitemap = /^Sitemap:\s*(\S+)\s*$/m.exec(robots);

		expect(host, 'у robots.txt немає рядка Host').not.toBeNull();
		expect(sitemap, 'у robots.txt немає рядка Sitemap').not.toBeNull();

		expect(host?.[1]).toBe(SITE_ORIGIN);
		expect(sitemap?.[1]).toBe(siteUrl('/sitemap.xml'));
	});
});
