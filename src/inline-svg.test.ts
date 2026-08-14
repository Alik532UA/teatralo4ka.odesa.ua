import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Сирий `<svg>` у розмітці сторінок (UI-UX-v8 § 3, MEDIUM).
 *
 * Правило не про охайність. Вписана руками іконка не має ані назви, ані єдиної
 * товщини лінії, ані спільного розміру — і не помітно, що вона вже є в
 * бібліотеці. У цьому проєкті таких було 23 у п'яти сторінках адмінки, і всі
 * 23 виявилися іконками Lucide, вписаними вручну: шість різних, кожна від двох
 * до восьми разів. Тобто одна й та сама іконка існувала у восьми копіях, і
 * зміна розміру чи товщини мала б робитися у восьми місцях.
 *
 * ## Де сирий `<svg>` лишається дозволеним
 *
 * У компонентах-іконках (`components/icons/`) — це їхня робота. У `app.html` —
 * там завіса заставки, і вона мусить бути в розмітці, бо малюється до
 * завантаження будь-якого JS. І в декоративних полотнах (`backgrounds/`), де
 * фігури генеруються, а не малюються.
 */

const ROOTS = ['src/routes', 'src/lib/components'];

/** Місця, де власна векторна розмітка доречна. */
const ALLOWED = [
	/^src\/lib\/components\/icons\//,
	/^src\/lib\/components\/backgrounds\//,
	// Логотип: складна фірмова графіка, не іконка з набору.
	/^src\/lib\/components\/LogoIcon\.svelte$/,
	// Два шеврони випадайок лишаються вписаними, і причина технічна, а не «не
	// дійшли руки». Обидва стилізуються ЧЕРЕЗ КЛАС із власного `<style>`
	// (`.sel-chevron.open` повертає його на 180°), а скоуп Svelte до дочірнього
	// компонента не дістає — SVELTE-UI-v8 § 3.5. Замінивши `<svg>` на
	// `<ChevronDown class="sel-chevron">`, ми отримали б іконку без стилів і без
	// жодного попередження: клас поїхав би в компонент, правило лишилося б у
	// батька, і поворот просто перестав би працювати.
	//
	// Вихід є — обгорнути іконку в свій `<span>` і стилізувати його, — але це
	// зміна розкладки, яку треба дивитися оком у чотирьох темах. Тому окремим
	// кроком, а не разом із механічною заміною 23 іконок.
	/^src\/lib\/components\/ui\/Select\.svelte$/,
	/^src\/lib\/components\/admin\/ArticleCategoryPicker\.svelte$/
];

function walk(dir: string, out: string[] = []): string[] {
	for (const entry of readdirSync(dir)) {
		const p = join(dir, entry);
		if (statSync(p).isDirectory()) walk(p, out);
		else if (p.endsWith('.svelte')) out.push(p.split('\\').join('/'));
	}
	return out;
}

describe('сирий <svg> у розмітці', () => {
	const files = ROOTS.flatMap((root) => walk(root)).filter(
		(f) => !ALLOWED.some((re) => re.test(f))
	);

	it('сторінки й компоненти беруть іконки з бібліотеки, а не вписують', () => {
		const offenders = files
			.map((f) => ({ file: f, count: [...readFileSync(f, 'utf8').matchAll(/<svg\b/g)].length }))
			.filter((x) => x.count > 0)
			.map((x) => `${x.file} — ${x.count}`);

		expect(
			offenders,
			`сирий <svg> у розмітці (UI-UX-v8 § 3): візьміть іконку з lucide-svelte або винесіть у components/icons/\n${offenders.join('\n')}`
		).toEqual([]);
	});

	it('перевірка справді читає файли, а не порожній список', () => {
		expect(files.length).toBeGreaterThan(20);
	});
});
