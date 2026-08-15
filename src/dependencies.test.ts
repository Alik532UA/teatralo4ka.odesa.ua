import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * DEPENDENCIES-v8 § 6 — GATE-DEPS.
 *
 * Єдиний гейт пакета, якого в проєкті не було зовсім. Він дешевий і ловить те,
 * що не видно ніде більше: `package.json` не читає ані `svelte-check`, ані
 * ESLint, а `npm ci` мовчить про все, крім розбіжності з lockfile.
 *
 * Кожен пункт нижче — про клас помилки, а не про смак:
 *   • два lockfile у корені — це дві різні збірки, і яка з них поїде, залежить
 *     від того, чим запустили;
 *   • інструмент у `dependencies` розширює поверхню, яку рахує `npm audit`
 *     з `--omit=dev`, тобто робить звіт про вразливості неправильним;
 *   • `latest`/`*` роблять збірку невідтворюваною мовчки — учора зелена, сьогодні ні;
 *   • розбіжність версії Node між CI, `.nvmrc` та `engines` дає падіння, яке
 *     локально не відтворюється взагалі.
 */
const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as {
	engines?: Record<string, string>;
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
};

/** Найбільший мажор із діапазону виду `>=22.12.0`; null, якщо форма інша. */
function majorOfRange(range: string): number | null {
	const m = /^>=\s*(\d+)\./.exec(range.trim());
	return m ? Number(m[1]) : null;
}

describe('залежності', () => {
	it('знаходить package.json — перевірка жива', () => {
		expect(Object.keys(pkg.dependencies ?? {}).length).toBeGreaterThan(0);
		expect(Object.keys(pkg.devDependencies ?? {}).length).toBeGreaterThan(0);
	});

	it('один менеджер пакетів (§ 2.1)', () => {
		const locks = ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lockb'].filter(
			(f) => existsSync(f)
		);
		expect(locks, `знайдено кілька lockfile: ${locks.join(', ')}`).toHaveLength(1);
	});

	it('інструменти збірки не в dependencies (§ 2.2)', () => {
		const runtime = Object.keys(pkg.dependencies ?? {});
		const buildOnly = runtime.filter((d) =>
			/^(vite|vitest|typescript|svelte-check|@sveltejs\/(kit|adapter|vite-plugin)|eslint|prettier|@playwright|@types\/)/.test(
				d
			)
		);
		expect(
			buildOnly,
			`мають бути у devDependencies — інакше npm audit --omit=dev рахує не ту поверхню: ${buildOnly.join(', ')}`
		).toEqual([]);
	});

	it('немає плаваючих версій (§ 2.3)', () => {
		const all = { ...pkg.dependencies, ...pkg.devDependencies };
		const floating = Object.entries(all)
			.filter(([, v]) => v === '*' || v === 'latest' || v === '')
			.map(([k]) => k);
		expect(floating, `невідтворювані версії: ${floating.join(', ')}`).toEqual([]);
	});

	it('версія Node однакова в engines, .nvmrc і CI (§ 2.3)', () => {
		const engines = pkg.engines?.node;
		expect(engines, 'у package.json немає engines.node').toBeDefined();

		const enginesMajor = majorOfRange(engines as string);
		expect(enginesMajor, `engines.node="${engines}" не у формі ">=X.Y.Z"`).not.toBeNull();

		expect(existsSync('.nvmrc'), 'немає .nvmrc — локальна версія ні з чим не звіряється').toBe(
			true
		);
		const nvmrcMajor = Number(readFileSync('.nvmrc', 'utf8').trim().replace(/^v/, '').split('.')[0]);
		expect(nvmrcMajor, `.nvmrc не містить номера версії`).not.toBeNaN();

		const workflows = readdirSync('.github/workflows').filter((f) => /\.ya?ml$/.test(f));
		const ciMajors = workflows
			.flatMap((f) => [
				...readFileSync(`.github/workflows/${f}`, 'utf8').matchAll(
					/node-version:\s*["']?v?(\d+)/g
				)
			])
			.map((m) => Number(m[1]));
		expect(ciMajors.length, 'у workflow не знайдено node-version — перевірка мертва').toBeGreaterThan(
			0
		);

		const mismatch = ciMajors.filter((v) => v !== nvmrcMajor);
		expect(
			mismatch,
			`node-version у CI (${mismatch.join(', ')}) розходиться з .nvmrc (${nvmrcMajor})`
		).toEqual([]);
		expect(nvmrcMajor, `.nvmrc ${nvmrcMajor} не задовольняє engines.node "${engines}"`).toBe(
			enginesMajor
		);
	});
});
