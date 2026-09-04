import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
	INSTITUTIONS,
	getInstitutionBySlug,
	institutionPath,
	institutionSize,
	institutionsOfGraduate
} from './institutions';
import graduatesIndex from '$lib/data/graduates.index.json';
import type { GraduateIndexEntry } from '$lib/data/graduates';

/**
 * Цілісність реєстру навчальних закладів.
 *
 * ## Що тут насправді стережеться
 *
 * Реєстр закладів — це ДРУГИЙ запис того самого факту. Первинний живе рядком в
 * анкеті: «Вступ 2026: КНУТКіТ, акторський, курс Д. Богомазова». Обидва я
 * вписав руками, з однієї новини, в один день — і саме тому вони роз'їдуться.
 * Правити анкету легко (вона поруч із людиною), а про сторінку закладу
 * забувають; тоді КНУТКіТ показує шістьох, а сьомий на своїй сторінці
 * стверджує, що вступив саме туди. Помилка тиха: обидві сторінки складаються.
 *
 * Тому перевірка «рядок анкети згадує цей заклад і цей рік» іде В ОБИДВА боки:
 * і кожен студент реєстру мусить знайти себе в анкеті, і кожна анкета зі
 * словом «Вступ» мусить знайти себе в реєстрі. Одна сторона впустила б додану
 * анкету, друга — забуту.
 *
 * ## Чому імена в `unlistedStudents` перевіряються НА ВІДСУТНІСТЬ
 *
 * Це не список «сторонніх», а список НЕЗІСТАВЛЕНИХ: троє зі сімнадцяти, кого
 * школа назвала, а реєстр випускників не знає (`DATA-QUESTIONS.md` § 8.3). Коли
 * відповідь прийде, людину треба перенести в `students` із її `id` — і саме цей
 * перенос забувають. Тому щойно ім'я з'явиться в реєстрі, перевірка впаде й
 * назве, кого перенести.
 *
 * ## Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1)
 *
 * Проведено на чотирьох дефектах: `id` студента, якого немає в реєстрі
 * випускників; рік у реєстрі 2026, а в анкеті 2025; студент, викинутий із
 * реєстру закладів при наявній анкеті; ім'я в `unlistedStudents`, яке насправді
 * є в реєстрі. Кожна перевірка впала й назвала саме той заклад і ту людину.
 */
const graduates = graduatesIndex as GraduateIndexEntry[];
const byId = new Map(graduates.map((g) => [g.id, g]));
const PROFILES = join(process.cwd(), 'static/graduates/profiles');

/**
 * Файл анкети зветься за `code`, а не за адресою.
 *
 * Так його читає й сама збірка (`scripts/build-stats-history.ts`), і причина
 * історична: `code` — це старий логін людини на Google Sites, і саме під ним
 * анкети вивантажені. Зіставляти за `slug` означало б не знайти чотирьох із
 * чотирнадцяти й тихо визнати їх «без анкети».
 */
function afterGraduationOf(graduate: GraduateIndexEntry): string | null {
	const file = join(PROFILES, `${graduate.code || graduate.slug}.json`);
	if (!existsSync(file)) return null;
	const profile = JSON.parse(readFileSync(file, 'utf8')) as { afterGraduation?: string | null };
	return profile.afterGraduation ?? null;
}

describe('реєстр навчальних закладів', () => {
	it('перевірка жива: реєстр і реєстр випускників прочитано', () => {
		expect(INSTITUTIONS.length).toBeGreaterThan(0);
		expect(graduates.length).toBeGreaterThan(100);
	});

	it('адреса придатна для URL і не повторюється', () => {
		const seen = new Map<string, number>();
		for (const i of INSTITUTIONS) {
			expect(i.slug, `${i.name}: адреса не з латиниці`).toMatch(/^[a-z0-9-]+$/);
			seen.set(i.slug, (seen.get(i.slug) ?? 0) + 1);
		}
		const dupes = [...seen].filter(([, n]) => n > 1).map(([slug]) => slug);
		expect(dupes, `два заклади на одній адресі:\n  ${dupes.join('\n  ')}`).toEqual([]);
	});

	it('назва є, і вона не повторюється', () => {
		const seen = new Map<string, number>();
		for (const i of INSTITUTIONS) {
			expect(i.name.trim(), `${i.slug}: без назви`).not.toBe('');
			seen.set(i.name, (seen.get(i.name) ?? 0) + 1);
		}
		const dupes = [...seen].filter(([, n]) => n > 1).map(([name, n]) => `${name} × ${n}`);
		expect(dupes, `той самий заклад двома записами:\n  ${dupes.join('\n  ')}`).toEqual([]);
	});

	/*
	 * Код країни — формою, як у фестивалів: «UKR» замість «UA» і «ua» замість
	 * «UA» — саме те, на чому `CountryFlag` мовчки перейде на запасні літери.
	 */
	it('код країни — дві великі латинські літери', () => {
		const bad: string[] = [];
		for (const i of INSTITUTIONS) {
			if (!i.countries.length) bad.push(`${i.slug}: без країни`);
			for (const code of i.countries)
				if (!/^[A-Z]{2}$/.test(code)) bad.push(`${i.slug} → «${code}»`);
		}
		expect(bad, `негодящий код країни:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	it('CountryFlag знає кожен код країни з реєстру', () => {
		const source = readFileSync('src/lib/components/icons/CountryFlag.svelte', 'utf8');
		const known = new Set([...source.matchAll(/upperCode === '([A-Z]{2})'/g)].map((m) => m[1]));
		expect(known.size, 'перевірка жива: коди з компонента прочитано').toBeGreaterThan(5);

		const bad: string[] = [];
		for (const i of INSTITUTIONS)
			for (const code of i.countries) if (!known.has(code)) bad.push(`${i.slug} → «${code}»`);
		expect(bad, `прапор буде показано літерами:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	it('рік вступу в межах', () => {
		const bad: string[] = [];
		for (const i of INSTITUTIONS)
			for (const s of [...i.students, ...(i.unlistedStudents ?? [])])
				if (s.year < 1990 || s.year > 2035) bad.push(`${i.slug} → ${s.year}`);
		expect(bad, `рік поза межами:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	it('кожен студент існує в реєстрі випускників', () => {
		const bad: string[] = [];
		for (const i of INSTITUTIONS)
			for (const s of i.students) if (!byId.has(s.id)) bad.push(`${i.slug} → ${s.id}`);
		expect(bad, `студент веде в нікуди:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	/*
	 * Двічі в одному закладі — це не «вступив і перевівся», а копія. Вступ у два
	 * РІЗНІ заклади тут законний і не ловиться.
	 */
	it('одна людина не стоїть у закладі двічі', () => {
		const bad: string[] = [];
		for (const i of INSTITUTIONS) {
			const seen = new Set<string>();
			for (const s of i.students) {
				if (seen.has(s.id)) bad.push(`${i.slug} → ${s.id}`);
				seen.add(s.id);
			}
		}
		expect(bad, `студент повторюється:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	it('незіставлені імена справді відсутні в реєстрі випускників', () => {
		const known = new Map(graduates.map((g) => [g.name.trim(), g.id]));
		const bad: string[] = [];
		for (const i of INSTITUTIONS)
			for (const person of i.unlistedStudents ?? []) {
				const id = known.get(person.name.trim());
				if (id) bad.push(`${i.slug} → «${person.name}» уже є в реєстрі як ${id}`);
			}
		expect(bad, `час перенести людину в students із її id:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	it('анкета студента згадує цей заклад і цей рік', () => {
		const bad: string[] = [];
		for (const i of INSTITUTIONS)
			for (const s of i.students) {
				const graduate = byId.get(s.id);
				if (!graduate) continue; // назве попередня перевірка
				const line = afterGraduationOf(graduate);
				if (!line) {
					bad.push(`${graduate.name}: анкета не каже про вступ, а ${i.slug} каже`);
					continue;
				}
				if (!line.includes(i.name))
					bad.push(`${graduate.name}: в анкеті немає «${i.name}» — ${line}`);
				if (!line.includes(String(s.year)))
					bad.push(`${graduate.name}: в анкеті немає ${s.year} — ${line}`);
			}
		expect(bad, `реєстр закладів і анкета розійшлися:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	/*
	 * Зворотний бік тієї самої пари. Слово «Вступ» — це той формат, яким рядок
	 * записаний в усіх чотирнадцяти; якби з'явився інший, перевірка нового рядка
	 * просто не побачила б — тому нижче стоїть замір ЧИСЛА знайдених анкет.
	 */
	it('кожна анкета зі вступом знайшла свій заклад', () => {
		const відомі = new Set(INSTITUTIONS.flatMap((i) => i.students.map((s) => s.id)));
		const зіВступом = graduates.filter((g) => (afterGraduationOf(g) ?? '').includes('Вступ'));
		expect(зіВступом.length, 'перевірка жива: анкети зі вступом знайдено').toBeGreaterThan(0);

		const bad = зіВступом
			.filter((g) => !відомі.has(g.id))
			.map((g) => `${g.name} — ${afterGraduationOf(g)}`);
		expect(bad, `анкета каже про вступ, а закладу в реєстрі немає:\n  ${bad.join('\n  ')}`).toEqual(
			[]
		);
	});

	it('стан верифікації — з відомого набору', () => {
		const known = new Set(['verified', 'possible_errors', 'definite_errors']);
		const bad = INSTITUTIONS.filter(
			(i) => i.verificationStatus && !known.has(i.verificationStatus)
		).map((i) => `${i.slug} → «${i.verificationStatus}»`);
		expect(bad, `невідомий стан верифікації:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	it('хелпери знаходять заклад за адресою та за людиною', () => {
		const first = INSTITUTIONS[0];
		expect(getInstitutionBySlug(first.slug)?.name).toBe(first.name);
		expect(getInstitutionBySlug('такого-немає')).toBeUndefined();

		expect(institutionSize(first)).toBe(
			first.students.length + (first.unlistedStudents?.length ?? 0)
		);
		expect(institutionPath(first.slug)).toBe(
			`/projects/galaxy-graduates/institutions/${first.slug}`
		);

		const student = first.students[0];
		expect(institutionsOfGraduate(student.id).map((x) => x.institution.slug)).toContain(first.slug);
		expect(institutionsOfGraduate('нікого-такого')).toEqual([]);
	});
});
