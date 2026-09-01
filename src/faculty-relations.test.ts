// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Зв'язки «випускник — викладач» і «майстер — його власний майстер».
 *
 * ## Що саме тут стережеться і чому це не видно інакше
 *
 * Дані про викладачів лежать у ДВОХ місцях, і кожне відповідає на своє питання:
 *
 *   `masters.index.json` → `subjects`: що ця людина викладає ВЗАГАЛІ;
 *   запис зв'язку в випускника → `subjects`: що вона викладала САМЕ ЙОМУ.
 *
 * Різниця не теоретична. У профілі випускника поруч із Самуїлом Імасом стояло
 * «(Риторика та поетика, акторська майстерність)», хоча цей випускник мав у нього
 * лише риторику. Причина — рукописна копія повного переліку майстра, зліплена
 * комою в полі `subject`. Помітити це можна було лише оком на сторінці: жоден
 * гейт не зіставляв дві сторони зв'язку, бо одна з них була вільним рядком.
 *
 * ## Три перевірки, і кожна ловить свій різновид
 *
 *  1. предмет зв'язку існує в переліку майстра. Ловить описки, вигадані назви й
 *     розбіжність регістру («акторська майстерність» проти «Акторська»);
 *  2. `subject` (стара форма, вільний рядок) не з'являється в нових записах;
 *  3. `studiedUnder` вказує на наявного майстра й не на самого себе;
 *  4. зв'язок видно з ОБОХ боків — і зі сторінки випускника, і зі сторінки
 *     викладача.
 *
 * ## Чому знадобилася четверта
 *
 * Сторінки читають ті самі зв'язки з РІЗНИХ файлів, і це не симетрично:
 *
 *   сторінка випускника: `profile?.teachers ?? graduate.teachers` —
 *     анкета ПЕРЕКРИВАЄ реєстр, і порожнє поле в ній ховає реєстр цілком;
 *   сторінка викладача: `getStudentsByMaster` обходить `GRADUATES`, тобто
 *     самий лише РЕЄСТР — анкет вона не читає взагалі.
 *
 * Наслідок заміряно на живому дефекті 2026-08-31: Миколу Балдіна вписали
 * Марині Сухановій в АНКЕТУ, її сторінка його показала, а на його сторінці її
 * не було — бо в реєстрі зв'язку не існувало. Односторонній зв'язок виглядає
 * як робочий рівно доти, доки не відкриєш другу сторінку.
 *
 * ## Зворотний експеримент проведено на ДВОХ дефектах (AI-AGENT-PITFALLS-v8 § 1.1)
 *
 * Повернення саме того рядка, з якого все почалося
 * (`"subject": "Риторика та поетика, акторська майстерність"`), червонить лише
 * перевірку 2 — і це правильно: обидва названі предмети в Імаса СПРАВДІ є, тож
 * перевірка 1 і не мусить нічого казати. Регістр вона порівнює без урахування
 * великих літер навмисно: «акторська» проти «Акторська» — це не два різних
 * предмети, а слід рукописного введення, і ловити його має інша перевірка.
 *
 * Перевірку 1 випробувано окремо — вигаданим предметом («Фехтування»): вона
 * називає і його, і повний перелік майстра для порівняння.
 */

const ROOT = '.';

interface TeacherLink {
	id?: string;
	name?: string;
	subject?: string;
	subjects?: string[];
}

interface GraduateRecord {
	slug?: string;
	code?: string;
	teachers?: (string | TeacherLink)[];
	masters?: (string | TeacherLink)[];
}

interface MasterRecord {
	id: string;
	subjects?: string[];
	studiedUnder?: (string | { id: string })[];
}

const graduates = JSON.parse(
	readFileSync(join(ROOT, 'src/lib/data/graduates.index.json'), 'utf8')
) as GraduateRecord[];

const masters = JSON.parse(
	readFileSync(join(ROOT, 'src/lib/data/masters.index.json'), 'utf8')
) as MasterRecord[];

/**
 * Профілі випускників теж скануються, і це не надмірність: індекс і профіль —
 * ДВА файли з тими самими зв'язками, і розійтися вони можуть тихо. Профіль
 * читається сторінкою профілю, індекс — потоком на сторінці майстра, тобто
 * розбіжність побачив би той, хто дивиться обидві сторінки поряд.
 */
const PROFILES_DIR = join(ROOT, 'static/graduates/profiles');
const profiles = readdirSync(PROFILES_DIR)
	.filter((f) => f.endsWith('.json'))
	.map((f) => ({
		file: `static/graduates/profiles/${f}`,
		data: JSON.parse(readFileSync(join(PROFILES_DIR, f), 'utf8')) as GraduateRecord
	}));

const MASTER_SUBJECTS = new Map<string, Set<string>>(
	masters.map((m) => [m.id, new Set((m.subjects ?? []).map((s) => s.toLocaleLowerCase('uk')))])
);
const MASTER_IDS = new Set(masters.map((m) => m.id));

/** Усі зв'язки «випускник → викладач» із обох джерел, з адресою файлу. */
function allTeacherLinks(): { where: string; who: string; link: TeacherLink }[] {
	const out: { where: string; who: string; link: TeacherLink }[] = [];
	const collect = (where: string, record: GraduateRecord) => {
		for (const t of record.teachers ?? []) {
			if (typeof t === 'string') continue; // лише id, предметів у ньому немає
			out.push({ where, who: record.slug ?? record.code ?? '?', link: t });
		}
	};
	for (const g of graduates) collect('src/lib/data/graduates.index.json', g);
	for (const p of profiles) collect(p.file, p.data);
	return out;
}

describe('перевірка жива', () => {
	it('дані прочитано і звʼязки в них є', () => {
		expect(graduates.length).toBeGreaterThan(100);
		expect(masters.length).toBeGreaterThan(50);
		expect(profiles.length).toBeGreaterThan(50);
		// Без цього «порушень немає» означало б «нічого не перевірено»: зв'язки
		// `teachers` є поки що в одного випускника, тобто зникнути можуть непомітно.
		expect(allTeacherLinks().length, 'звʼязків «випускник → викладач» не знайдено').toBeGreaterThan(0);
	});
});

describe('звʼязки викладачів', () => {
	it('предмет звʼязку існує у переліку самого майстра', () => {
		const problems: string[] = [];

		for (const { where, who, link } of allTeacherLinks()) {
			if (!link.id) continue;
			const known = MASTER_SUBJECTS.get(link.id);
			if (known === undefined) {
				problems.push(`${where} → ${who}: майстра «${link.id}» немає в masters.index.json`);
				continue;
			}
			const claimed = [
				...(link.subjects ?? []),
				// Стара форма: кілька предметів у ній писали через кому.
				...(link.subject ? link.subject.split(',').map((s) => s.trim()) : [])
			].filter(Boolean);

			for (const subject of claimed) {
				if (!known.has(subject.toLocaleLowerCase('uk'))) {
					problems.push(
						`${where} → ${who} / ${link.id}: «${subject}» немає в subjects майстра ` +
							`(${[...known].join(', ') || 'перелік порожній'})`
					);
				}
			}
		}

		expect(
			problems,
			`предмет звʼязку розійшовся з переліком майстра:\n${problems.join('\n')}`
		).toEqual([]);
	});

	/**
	 * Вільний рядок `subject` читається (сумісність), але писати в нього більше
	 * не можна: саме він і дав дефект. Перелік зіставляється з переліком майстра,
	 * рядок — ні.
	 */
	it('нових записів у старому полі `subject` немає', () => {
		const legacy = allTeacherLinks()
			.filter(({ link }) => link.subject !== undefined)
			.map(({ where, who, link }) => `${where} → ${who} / ${link.id}: "${link.subject}"`);

		expect(
			legacy,
			`замініть на масив \`subjects\` — вільний рядок не зіставляється з переліком майстра:\n${legacy.join('\n')}`
		).toEqual([]);
	});
});

describe('майстри, які самі тут вчилися', () => {
	it('`studiedUnder` вказує на наявного майстра і не на себе', () => {
		const problems: string[] = [];

		for (const m of masters) {
			for (const entry of m.studiedUnder ?? []) {
				const id = typeof entry === 'string' ? entry : entry.id;
				if (!id) {
					problems.push(`${m.id}: запис у studiedUnder без id`);
					continue;
				}
				if (id === m.id) {
					problems.push(`${m.id}: вказаний сам у себе`);
				}
				if (!MASTER_IDS.has(id)) {
					problems.push(`${m.id}: майстра «${id}» немає в masters.index.json`);
				}
			}
		}

		expect(problems, `звʼязок «навчався у» веде в нікуди:\n${problems.join('\n')}`).toEqual([]);
	});

	/**
	 * Індекс і профіль майстра — два файли з тими самими даними. Профіль
	 * накладається на індекс на сторінці майстра (`+page.ts` робить
	 * `{ ...master, ...profile }`), тож розбіжність тут означала б, що потік
	 * випускників і сама сторінка кажуть різне.
	 */
	it('профіль майстра не розходиться з індексом щодо `studiedUnder`', () => {
		const problems: string[] = [];
		const dir = join(ROOT, 'static/masters/profiles');

		for (const m of masters) {
			const declared = (m.studiedUnder ?? []).map((e) => (typeof e === 'string' ? e : e.id)).sort();
			let profile: MasterRecord;
			try {
				profile = JSON.parse(readFileSync(join(dir, `${m.id}.json`), 'utf8')) as MasterRecord;
			} catch {
				continue; // профілю може не бути — тоді сторінка бере лише індекс
			}
			const inProfile = (profile.studiedUnder ?? [])
				.map((e) => (typeof e === 'string' ? e : e.id))
				.sort();

			if (JSON.stringify(declared) !== JSON.stringify(inProfile)) {
				problems.push(
					`${m.id}: індекс [${declared.join(', ')}] проти профілю [${inProfile.join(', ')}]`
				);
			}
		}

		expect(problems, `індекс і профіль майстра розійшлися:\n${problems.join('\n')}`).toEqual([]);
	});
});

/** Ідентифікатори зв'язків, у якій би формі їх не записали. */
function linkIds(list: (string | TeacherLink)[] | undefined): Set<string> {
	const out = new Set<string>();
	for (const item of list ?? []) {
		const id = typeof item === 'string' ? item : item.id;
		if (id) out.add(id);
	}
	return out;
}

describe('звʼязок видно з обох боків', () => {
	const withRecord = profiles
		.map((p) => ({
			...p,
			record: graduates.find((g) => g.slug === p.data.slug || g.code === p.data.code)
		}))
		.filter((p) => p.record);

	it('перевірка жива: анкети зіставлено з реєстром', () => {
		expect(
			withRecord.length,
			'жодну анкету не вдалося зіставити з реєстром — перевірка нічого не стверджує'
		).toBeGreaterThan(50);
	});

	/**
	 * Зв'язок з анкети мусить бути й у реєстрі.
	 *
	 * Інакше він односторонній: сторінка випускника покаже викладача, а
	 * сторінка викладача цього випускника — ні, бо `getStudentsByMaster`
	 * обходить самий лише реєстр.
	 */
	it('усе, що є в анкеті, є і в реєстрі', () => {
		const missing: string[] = [];
		for (const { file, data, record } of withRecord) {
			for (const field of ['masters', 'teachers'] as const) {
				const inProfile = linkIds(data[field]);
				const inRegistry = linkIds(record![field]);
				for (const id of inProfile) {
					if (!inRegistry.has(id)) {
						missing.push(`${data.slug ?? file} · ${field}: ${id}`);
					}
				}
			}
		}
		expect(
			missing,
			'звʼязок є в анкеті, але не в реєстрі — тоді сторінка викладача цього ' +
				'випускника НЕ покаже, бо вона читає реєстр. Дописати той самий ' +
				'ідентифікатор у `graduates.index.json`:\n' +
				missing.join('\n')
		).toEqual([]);
	});

	/**
	 * І навпаки: непорожня анкета ПЕРЕКРИВАЄ реєстр цілком, тож зв'язок, який
	 * лишився тільки в реєстрі, зникне зі сторінки випускника — але
	 * лишиться на сторінці викладача.
	 */
	it('непорожня анкета не ховає звʼязків реєстру', () => {
		const hidden: string[] = [];
		for (const { file, data, record } of withRecord) {
			for (const field of ['masters', 'teachers'] as const) {
				// Порожнє поле анкети реєстр не перекриває — там працює `??`.
				if (!data[field]?.length) continue;
				const inProfile = linkIds(data[field]);
				for (const id of linkIds(record![field])) {
					if (!inProfile.has(id)) {
						hidden.push(`${data.slug ?? file} · ${field}: ${id}`);
					}
				}
			}
		}
		expect(
			hidden,
			'звʼязок є в реєстрі, але анкета його перекриває — сторінка випускника ' +
				'його не покаже, а сторінка викладача покаже. Дописати той самий ' +
				'ідентифікатор в анкету:\n' +
				hidden.join('\n')
		).toEqual([]);
	});
});
