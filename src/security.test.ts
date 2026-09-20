// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Інваріанти безпеки по джерелах (SECURITY-v9 § 16).
 *
 * Що вони ловлять, а що ні. Ловлять регресію в конструкціях, які не мають
 * з'являтися взагалі: `eval`, несанітизований `{@html}`, секрет у бандлі,
 * зовнішнє посилання без `rel`. Не ловлять поведінку в рантаймі — заблоковані
 * CSP ресурси, порядок хешів, реальний XSS. Це свідомий поділ: рантайм
 * перевіряють `e2e/csp.spec.ts` і `e2e/csp-static.spec.ts`, які відкривають
 * ЗІБРАНИЙ сайт, а перевірка по джерелах доводила б лише те, що директиву
 * написали (AI-AGENT-PITFALLS-v9 § 2.1).
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
	 * Тут ловиться справжній секрет, вписаний у код. Шаблони — за формою, а не
	 * за назвою: назву легко перейменувати.
	 *
	 * ОДИН файл має право містити ключ `AIza…`, і рівно один. Веб-ключ Firebase
	 * не є секретом: він приїжджає в кожну сторінку разом із бандлом, і сховати
	 * його неможливо в принципі (SECURITY-v9 § 4.1, § 4.2.1
	 * `SEC-CONFIG-IN-SOURCE`).
	 *
	 * Виняток прив'язаний до ШЛЯХУ, а не знятий загалом, бо той самий префікс
	 * мають ключі, які секретом Є: серверний ключ Google Cloud без обмеження за
	 * доменом робить платні запити від імені власника. Решта форм — приватний
	 * ключ, службовий акаунт, токен, JWT — винятків не має ніде.
	 */
	const PUBLIC_CONFIG = 'src/lib/firebase/config.ts';
	/** `walk` повертає шляхи в розділювачах ОС — на Windows це `\`. */
	const isPublicConfig = (file: string) => file.replace(/\\/g, '/').endsWith(PUBLIC_CONFIG);

	it('у джерелах немає вписаних секретів', () => {
		const patterns: [string, RegExp][] = [
			['приватний ключ', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
			['службовий акаунт', /"type"\s*:\s*"service_account"/],
			['токен OpenAI', /\bsk-[A-Za-z0-9]{32,}\b/],
			['JWT', /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\./]
		];
		const GOOGLE_KEY = /\bAIza[0-9A-Za-z_-]{35}\b/;
		const bad: string[] = [];
		for (const file of sources) {
			const text = read(file);
			for (const [name, re] of patterns) {
				if (re.test(text)) bad.push(`${file}: схоже на ${name}`);
			}
			if (!isPublicConfig(file) && GOOGLE_KEY.test(text)) {
				bad.push(`${file}: схоже на Google API key`);
			}
		}
		expect(bad, bad.join('\n')).toEqual([]);
	});

	/*
	 * Виняток вище мусить лишатися вузьким. Якщо файл переїде, `PUBLIC_CONFIG`
	 * почне вказувати в порожнечу — і перевірка мовчки перетвориться на
	 * заборону без винятку, а наступний, хто її побачить, просто зніме її.
	 */
	it('виняток для публічного конфігу вказує на наявний файл', () => {
		expect(
			sources.filter(isPublicConfig).length,
			`${PUBLIC_CONFIG} не знайдено серед джерел — виняток застарів`
		).toBe(1);
	});

	/**
	 * ЩО ЗАМІНИЛО ПЛАГІН `firebase-env-gate`.
	 *
	 * Доти збірку валила відсутність змінних: конфіг приїжджав з оточення, і
	 * порожнє значення означало мертвий Firestore для кожного відвідувача.
	 * Відколи конфіг лежить літералами в git, такого стану не існує — але
	 * зʼявився інший, тихіший: значення на місці, а веде в ЧУЖИЙ проєкт.
	 *
	 * `.firebaserc` існує окремо, бо його читає `firebase-tools`, а той не вміє
	 * в TypeScript. Тож не «одне джерело», а «два, звірені тут».
	 */
	it('конфіг Firebase повний і веде в той самий проєкт, що й .firebaserc', () => {
		const config = read(sources.find(isPublicConfig)!);

		expect(
			config,
			'значення повернулися в `import.meta.env` — тоді воно знову живе у двох місцях, ' +
				'а `git clone && npm run dev` знову не працює'
		).not.toMatch(/import\.meta\.env\.VITE_FIREBASE/);

		const block = /const firebaseConfig\s*=\s*\{([\s\S]*?)\n\}/.exec(config);
		expect(block, 'обʼєкт firebaseConfig не знайдено — його переписали').toBeTruthy();
		for (const field of ['apiKey', 'authDomain', 'projectId', 'appId']) {
			expect(block![1], `у firebaseConfig немає непорожнього ${field}`).toMatch(
				new RegExp(`${field}:\\s*["'][^"']+["']`)
			);
		}

		const inSource = /projectId:\s*["']([^"']+)["']/.exec(block![1])?.[1];
		const rc = JSON.parse(readFileSync('.firebaserc', 'utf8'));
		expect(
			rc.projects?.default,
			'`.firebaserc` і config.ts називають РІЗНІ проєкти: правила поїдуть не в ту базу, ' +
				'у яку пише застосунок, і обидві дії будуть «успішні»'
		).toBe(inSource);
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
