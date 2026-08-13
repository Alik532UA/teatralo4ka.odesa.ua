// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Інваріанти безпеки по джерелах (SECURITY-v8 § 16).
 *
 * Що вони ловлять, а що ні. Ловлять регресію в конструкціях, які не мають
 * з'являтися взагалі: `eval`, несанітизований `{@html}`, секрет у бандлі,
 * зовнішнє посилання без `rel`. Не ловлять поведінку в рантаймі — заблоковані
 * CSP ресурси, порядок хешів, реальний XSS. Це свідомий поділ: рантайм
 * перевіряють `e2e/csp.spec.ts` і `e2e/csp-static.spec.ts`, які відкривають
 * ЗІБРАНИЙ сайт, а перевірка по джерелах доводила б лише те, що директиву
 * написали (AI-AGENT-PITFALLS-v8 § 2.1).
 */

const SRC = 'src';

function walk(dir: string, out: string[] = []): string[] {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) walk(full, out);
		else if (/\.(ts|svelte)$/.test(entry.name)) out.push(full);
	}
	return out;
}

const sources = walk(SRC);
const appCode = sources.filter((f) => !/\.test\.ts$/.test(f));
const read = (f: string) => readFileSync(f, 'utf8');

describe('безпека — інваріанти по джерелах', () => {
	it('знаходить джерела — перевірка жива', () => {
		expect(sources.length).toBeGreaterThan(50);
		expect(appCode.length).toBeGreaterThan(50);
	});

	it('немає eval і подібного (§ 13)', () => {
		// `(?<![$\w.])` — без нього `$$eval` з Playwright і `page.$eval`
		// вважалися б викликом eval. Тут таких немає, але перевірка мусить
		// лишатися правильною й тоді, коли з'являться.
		const forbidden = /(?<![$\w.])(?:eval|Function)\s*\(|new\s+Function\s*\(|document\.write\s*\(/;
		const bad = appCode.filter((f) => forbidden.test(read(f)));
		expect(bad, `заборонені конструкції:\n${bad.join('\n')}`).toEqual([]);
	});

	/**
	 * `{@html}` — єдиний спосіб зробити XSS у Svelte «легально». Перевіряється
	 * не наявність коментаря поруч, а те, що у вираз входить санітизація або
	 * що він підпадає під названий виняток § 5.3 (структуровані дані).
	 */
	it('кожен {@html} санітизований або підпадає під виняток § 5.3', () => {
		const bad: string[] = [];
		for (const file of appCode.filter((f) => f.endsWith('.svelte'))) {
			for (const m of read(file).matchAll(/\{@html\s+([\s\S]*?)\}/g)) {
				const expr = m[1];
				const sanitized =
					/DOMPurify\.sanitize|renderContent\(/.test(expr) ||
					// JSON-LD: Svelte не обчислює вирази всередині <script> у
					// розмітці, тож іншого способу немає. DOMPurify тут непридатний —
					// він видалив би <script> цілком.
					(/JSON\.stringify/.test(expr) && /ld\+json/.test(expr));
				if (!sanitized) bad.push(`${file}: {@html ${expr.trim().slice(0, 60)}…}`);
			}
		}
		expect(bad, `неперевірений {@html}:\n${bad.join('\n')}`).toEqual([]);
	});

	/**
	 * Ключі Firebase публічні за визначенням і живуть в `import.meta.env`.
	 * Тут ловиться інше: справжній ключ, вписаний у код замість змінної
	 * оточення. Шаблони — за формою, а не за назвою: назву легко перейменувати.
	 */
	it('у джерелах немає вписаних секретів', () => {
		const patterns: [string, RegExp][] = [
			['Google API key', /\bAIza[0-9A-Za-z_-]{35}\b/],
			['приватний ключ', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
			['службовий акаунт', /"type"\s*:\s*"service_account"/],
			['токен OpenAI', /\bsk-[A-Za-z0-9]{32,}\b/],
			['JWT', /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\./]
		];
		const bad: string[] = [];
		for (const file of sources) {
			const text = read(file);
			for (const [name, re] of patterns) {
				if (re.test(text)) bad.push(`${file}: схоже на ${name}`);
			}
		}
		expect(bad, bad.join('\n')).toEqual([]);
	});

	/**
	 * `target="_blank"` без `rel` віддає відкритій сторінці доступ до
	 * `window.opener` і зливає referrer. Сучасні браузери мають на це неявний
	 * `noopener`, але не всі й не завжди — а `noreferrer` неявним не буває
	 * ніде. Правило вже діє для посилань із markdown (`markedConfig.ts` додає
	 * `rel` сам), тож розмітка мусить бути з ним послідовною.
	 */
	it('кожне target="_blank" має rel="noopener"', () => {
		const bad: string[] = [];
		for (const file of appCode.filter((f) => f.endsWith('.svelte'))) {
			const text = read(file);
			for (const m of text.matchAll(/<a\b[^>]*>/gs)) {
				const tag = m[0];
				if (!/target=["']_blank["']/.test(tag)) continue;
				// Атрибут може бути виразом (`rel={linkRel}`) — тоді значення
				// перевірити статично не можна, і достатньо самої наявності.
				if (/\brel=\{/.test(tag)) continue;
				if (/\brel=["'][^"']*noopener/.test(tag)) continue;
				const line = text.slice(0, m.index).split('\n').length;
				bad.push(`${file}:${line}  ${tag.replace(/\s+/g, ' ').slice(0, 90)}`);
			}
		}
		expect(bad, `target="_blank" без rel:\n${bad.join('\n')}`).toEqual([]);
	});
});
