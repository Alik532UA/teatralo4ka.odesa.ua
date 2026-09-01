// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PLAYS, getPlayById, playsByIds } from './plays';
import { GROUPS } from './groups';
import mastersIndex from './masters.index.json';
import type { MasterIndexEntry } from './masters';

/**
 * Цілісність реєстру вистав.
 *
 * ## Що саме тут стережеться
 *
 * Реєстр з'явився, щоб вистава перестала бути трьома незалежними записами. Але
 * сам собою він цього не гарантує: щойно два записи опишуть ту саму виставу
 * того самого року, дублювання повернеться — тільки тепер усередині реєстру,
 * де його ще важче помітити.
 *
 * Тому головна перевірка тут — не «поле заповнене», а «та сама подія не
 * трапляється двічі». Подія при цьому впізнається трійкою «назва + рік +
 * група», і це не педантизм: див. коментар біля самої перевірки.
 *
 * ## Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1)
 *
 * Проведено на двох дефектах: доданий другий запис із тією самою назвою, роком
 * і групою — впала перевірка на повтори; ключ у групі змінено на неіснуючий —
 * впала перевірка посилань. Обидві назвали саме той запис.
 *
 * Третій дефект знайшовся сам, і саме він і виправив правило: ключ без групи
 * склеїв два різні покази, і помітити це вдалося лише тому, що у Ткача стало
 * 78 вистав замість 80.
 */
const norm = (s: string) =>
	s
		.toLowerCase()
		.replace(/[«»"'’ʼ]/g, '')
		.replace(/ё/g, 'е')
		.replace(/[^\p{L}\p{N}]+/gu, ' ')
		.trim();

describe('реєстр вистав', () => {
	it('перевірка жива: реєстр не порожній', () => {
		expect(PLAYS.length).toBeGreaterThan(100);
	});

	it('ключі унікальні', () => {
		const seen = new Map<string, number>();
		for (const p of PLAYS) seen.set(p.id, (seen.get(p.id) ?? 0) + 1);
		const dupes = [...seen].filter(([, n]) => n > 1).map(([id, n]) => `${id} × ${n}`);
		expect(dupes, `повтори ключів:\n  ${dupes.join('\n  ')}`).toEqual([]);
	});

	it('ключ придатний для адреси', () => {
		const bad = PLAYS.filter((p) => !/^[a-z0-9-]+$/.test(p.id)).map((p) => p.id);
		expect(bad, `не годиться в адресу:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	/*
	 * Подія — це «назва + рік + ГРУПА», а не «назва + рік».
	 *
	 * Ключем без групи два різні покази склеюються в один, і половина даних
	 * зникає мовчки. Заміряно на живому прикладі: «Уривки з класики» 2015 йшли
	 * групою ГруФФиш у школі й групою 4-РТЗ в ОТХУ; «Показ етюдів» 2024 —
	 * двома «Інтенсивами» під номерами 57 і 58. Перший варіант цього гейта
	 * дозволив їх склеїти, і виявилося це лише тим, що у Ткача стало 78 вистав
	 * замість 80.
	 */
	it('назва разом із роком і групою не трапляється двічі', () => {
		const seen = new Map<string, string[]>();
		for (const p of PLAYS) {
			const key = `${norm(p.title)} · ${p.year} · ${p.theatreGroup ?? '—'}`;
			seen.set(key, [...(seen.get(key) ?? []), p.id]);
		}
		const dupes = [...seen].filter(([, ids]) => ids.length > 1).map(([k, ids]) => `${k} → ${ids.join(', ')}`);
		expect(dupes, `та сама подія двома записами:\n  ${dupes.join('\n  ')}`).toEqual([]);
	});

	it('рік правдоподібний, назва не порожня', () => {
		const bad = PLAYS.filter((p) => !p.title.trim() || p.year < 1990 || p.year > 2035).map(
			(p) => `${p.id}: «${p.title}» ${p.year}`
		);
		expect(bad, `непридатні записи:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	it('кожен майстер у виставі існує в реєстрі майстрів', () => {
		const known = new Set((mastersIndex as MasterIndexEntry[]).map((m) => m.id));
		const bad: string[] = [];
		for (const p of PLAYS)
			for (const id of p.masters ?? []) if (!known.has(id)) bad.push(`${p.id} → ${id}`);
		expect(bad, `майстра немає:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	it('кожен ключ вистави в групі веде на наявний запис', () => {
		const bad: string[] = [];
		for (const group of GROUPS)
			for (const id of group.playIds) if (!getPlayById(id)) bad.push(`${group.slug} → ${id}`);
		expect(bad, `репертуар посилається в нікуди:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	/*
	 * Анкети лежать у `static/`, тож читаються з диска — як і в
	 * `graduates.test.ts`. Це єдине місце, де розрив «анкета → вистава» видно
	 * до того, як його побачить читач: у самій анкеті поруч із ключем лишається
	 * текст, і сторінка не впаде, а просто мовчатиме про зв'язок.
	 */
	it('кожен ключ вистави в анкеті веде на наявний запис', () => {
		const dir = join(process.cwd(), 'static/graduates/profiles');
		const bad: string[] = [];
		for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
			const profile = JSON.parse(readFileSync(join(dir, file), 'utf8')) as {
				plays?: { playId?: string }[];
			};
			for (const play of profile.plays ?? [])
				if (play.playId && !getPlayById(play.playId)) bad.push(`${file} → ${play.playId}`);
		}
		expect(bad, `анкета посилається в нікуди:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	/**
	 * ОСНОВА СЛАГА разом із роком не трапляється двічі, якщо групи однакові.
	 *
	 * ## Що це ловить, чого не ловить перевірка вище
	 *
	 * Перевірка «назва + рік + група» порівнює НАЗВУ, а її пишуть люди — і два
	 * записи однієї вистави легко мають різні назви. Заміряно 2026-08-31 на
	 * імпорті розкладів: сім вистав приїхали двічі, і другий примірник щоразу
	 * відрізнявся лише мовою назви й вставкою `-hr-<група>` у ключі:
	 *
	 *   dumaite-o-nas-2014            «Думайте про нас»   склад 2, гр. ROST-OK
	 *   dumaite-o-nas-hr-16-t-2014    «Думайте о нас»     склад 0
	 *
	 * Для тієї перевірки це дві різні події — назви ж різні. Для цієї — та сама,
	 * бо ОСНОВА ключа однакова. Слаг роблять із назви машинально, тож він
	 * переживає переклад і різнобій у написанні: саме тому він тут надійніший за
	 * назву.
	 *
	 * Ціна заміряна: 6 вистав у Тетяни Ісачкіної показували склад 0, а справжній
	 * склад висів на записі, якого в її репертуарі не було зовсім.
	 *
	 * ## Чому переліку винятків НЕМАЄ і не мусить бути
	 *
	 * Однакова основа при однаковому році буває законно: та сама назва, два
	 * покази двох груп. Але тоді в кожного запису СВОЯ `theatreGroup` — і це не
	 * послаблення, а те саме визначення події, що в перевірці вище. Заміряно на
	 * поточних даних: колізій дві, і обидві саме такі —
	 * `pokaz-etiudiv-2024` («Інтенсив-мол» проти «Інтенсив-ст») і
	 * `uryvky-z-klasyky-2015` («ГруФФиш» проти «4-РТЗ у Театрі на Чайній»).
	 * Тобто правило вкладається в дані без жодного поіменного дозволу, а отже й
	 * не стане пам'ятником.
	 *
	 * Запис із анкети групи в розкладі не має взагалі — тому дефект, з якого все
	 * почалося, під виняток не підпадає й червонітиме.
	 *
	 * ## Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1)
	 *
	 * Повернено приречений примірник `bylly-hr-8t-21-2015` («Билли +», без
	 * групи): перевірка червоніє й називає обидва ключі. Друга спроба — той самий
	 * запис, але з дописаною `theatreGroup`: зелено, бо це вже інша подія за
	 * визначенням проєкту.
	 */
	it('основа слага з роком не повторюється при однаковій групі', () => {
		/* Знімаємо рік, числовий дискримінатор і вставку `-hr-<група>`, яку
		 * додавав імпорт розкладів. Лишається основа, зроблена з назви. */
		const baseOf = (id: string): string => {
			const noDisc = id.replace(/-\d$/, '');
			const sched = /^(.*?)-hr-.*?-((?:19|20)\d\d)$/.exec(noDisc);
			if (sched) return `${sched[1]} · ${sched[2]}`;
			const plain = /^(.*)-((?:19|20)\d\d)$/.exec(noDisc);
			return plain ? `${plain[1]} · ${plain[2]}` : `${noDisc} · ?`;
		};

		const seen = new Map<string, typeof PLAYS>();
		for (const p of PLAYS) seen.set(baseOf(p.id), [...(seen.get(baseOf(p.id)) ?? []), p]);

		const bad: string[] = [];
		for (const [base, list] of seen) {
			if (list.length < 2) continue;
			const groups = list.map((p) => p.theatreGroup ?? null);
			if (groups.every((g) => g !== null) && new Set(groups).size === groups.length) continue;
			bad.push(
				`${base}\n    ${list
					.map((p) => `${p.id} «${p.title}» група: ${p.theatreGroup ?? '—'}`)
					.join('\n    ')}`
			);
		}
		expect(
			bad,
			'та сама вистава двома записами (основа ключа й рік збігаються, а групи — ні):\n  ' +
				bad.join('\n  ')
		).toEqual([]);
	});

	/*
	 * Двійники за НАЗВОЮ, а не за ключем.
	 *
	 * ## Чому попередньої перевірки не досить
	 *
	 * Перевірка вище дивиться на основу КЛЮЧА. Але той самий показ приходив у
	 * реєстр двічі — з репертуару майстра й із розкладу, — і назва в них
	 * написана по-різному: «Отрывки из «классики»» проти «Уривки з класики»,
	 * «Blondie» проти «Blondi», «Фейсбучик» проти «Фейс-бу-чік». Різні назви
	 * дають різні ключі, тож для тієї перевірки це два різних записи.
	 *
	 * Заміряно 2026-09-01, перед злиттям: 30 кластерів схожих назв в одному
	 * році, 31 надлишковий запис, і лише в одному кластері це справді два
	 * покази. Тобто перевірка, якої не було, пропустила тридцять випадків.
	 *
	 * ## Як міряється схожість
	 *
	 * Спершу назва зводиться до кістяка: геть лапки й знаки, геть сполучники,
	 * и/ы→і, е→є, ь/ъ геть, ґ→г, у→в, подвоєння в одну літеру, «із»→«з»,
	 * російські «отрывки/классики» до українських. Уже після цього — відстань
	 * Левенштейна.
	 *
	 * Порогів два, і другий не зайвий: відношення 0.9 не ловить КОРОТКИХ назв —
	 * «blondі» проти «blondіє» це 0.83, тобто двійник пройшов би. Тому ще й
	 * «відстань до двох літер».
	 *
	 * ## Чому перелік винятків, а не число
	 *
	 * Однакова назва в одному році буває й у двох РІЗНИХ показів: «Показ
	 * етюдів» 2024 грали два курси під номерами 57 і 58, а «Уривки з класики»
	 * 2015 — двома групами в різних закладах (ДТШ і училище). Число дозволених
	 * двійників нічого б не сказало про те, ЧОМУ вони дозволені, і наступний
	 * справжній двійник просто зайняв би вільне місце.
	 */
	const KNOWN_DISTINCT: readonly (readonly [string, string, string])[] = [
		[
			'uryvky-z-klasyky-2015',
			'uryvky-z-klasyky-2015-2',
			'два покази: ДТШ курсом «ГруФФиш» (номер 30) і училище курсом 4-РТЗ у Театрі на Чайній'
		],
		[
			'pokaz-etiudiv-2024',
			'pokaz-etiudiv-2024-2',
			'два курси, номери показу 57 і 58 — саме той випадок, від якого застерігає докблок plays.ts'
		],
		[
			'alisa-v-zadzerkali-2024',
			'alisa-v-zadzerkalli-2024',
			'відкрите питання DATA-QUESTIONS 3.10: один показ трьома написаннями чи різні'
		],
		[
			'zahubleni-2024',
			'zahubleni-u-2024',
			'відкрите питання DATA-QUESTIONS 3.6: як повністю звучить назва'
		],
		[
			'etiudy-2013',
			'e-t-iu-d-y-2013',
			'відкрите питання DATA-QUESTIONS 3.15: «Етюди» й «Е. Т. Ю. Д. И.» — один показ чи два'
		]
	];

	function titleSkeleton(title: string): string {
		let s = title.toLowerCase();
		for (const q of ['«', '»', '"', '’', '‘', "'"]) s = s.split(q).join('');
		s = ` ${s.replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim()} `;
		for (const w of [' та ', ' і ', ' и ', ' the ', ' a ']) s = s.split(w).join(' ');
		const folds: readonly [string, string][] = [
			['ы', 'і'], ['и', 'і'], ['е', 'є'], ['ъ', ''], ['ь', ''], ['ґ', 'г'], ['у', 'в'],
			['отрывкі', 'урівкі'], ['классікі', 'класікі'], ['із', 'з'], ['вз', 'з']
		];
		for (const [from, to] of folds) s = s.split(from).join(to);
		return s.replace(/(.)\1+/gu, '$1').replace(/\s+/g, '');
	}

	function distance(a: string, b: string): number {
		if (a === b) return 0;
		if (!a || !b) return Math.max(a.length, b.length);
		let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
		for (let i = 1; i <= a.length; i++) {
			const row = [i];
			for (let j = 1; j <= b.length; j++) {
				row.push(
					Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
				);
			}
			prev = row;
		}
		return prev[b.length];
	}

	function sameEvent(a: string, b: string): boolean {
		const d = distance(a, b);
		const longest = Math.max(a.length, b.length);
		return d === 0 || d <= 2 || (longest > 0 && 1 - d / longest >= 0.9);
	}

	it('немає двох записів про той самий показ (§ схожа назва в одному році)', () => {
		const allowed = new Set(KNOWN_DISTINCT.map(([a, b]) => [a, b].sort().join('|')));
		const byYear = new Map<number, typeof PLAYS[number][]>();
		for (const play of PLAYS) {
			const list = byYear.get(play.year) ?? [];
			list.push(play);
			byYear.set(play.year, list);
		}

		const bad: string[] = [];
		for (const [year, list] of byYear) {
			for (let i = 0; i < list.length; i++) {
				for (let j = i + 1; j < list.length; j++) {
					const a = list[i];
					const b = list[j];
					if (!sameEvent(titleSkeleton(a.title), titleSkeleton(b.title))) continue;
					if (allowed.has([a.id, b.id].sort().join('|'))) continue;
					bad.push(
						`${year}: ${a.id} «${a.title}» і ${b.id} «${b.title}»` +
							`\n    номери показу: ${a.number ?? '—'} / ${b.number ?? '—'}` +
							`\n    курси: ${a.theatreGroup ?? '—'} / ${b.theatreGroup ?? '—'}`
					);
				}
			}
		}
		expect(
			bad,
			'схожі назви в одному році — або той самий показ двома записами (тоді злити й додати' +
				' редирект у RENAMED_PLAY_IDS), або два різних (тоді додати в KNOWN_DISTINCT із' +
				` причиною):\n  ${bad.join('\n  ')}`
		).toEqual([]);
	});

	it('перевірка схожості жива: ловить саме те, через що наросли двійники', () => {
		/*
		 * Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1): пари, що справді
		 * лежали в реєстрі двома записами до 2026-09-01.
		 */
		const були: readonly [string, string][] = [
			['«Отрывки из «классики»»', '«Уривки з класики»'],
			['«Blondie»', '«Blondi»'],
			['«Фейсбучик»', '«Фейс-бу-чік»'],
			['«Все літо в один день»', '«Усе літо в один день»'],
			['«Нікому не потрібні»', '«Нікому непотрібні»'],
			['«Балаганчик братів Ґрімм»', '«Балаганчик Братів Грим»'],
			['«Тень»', '«Тінь»']
		];
		for (const [a, b] of були) {
			expect(
				sameEvent(titleSkeleton(a), titleSkeleton(b)),
				`${a} і ${b} мусять зійтися як одна назва`
			).toBe(true);
		}

		/* А різні назви — не мусять. */
		const різні: readonly [string, string][] = [
			['«Уривки з класики»', '«Показ етюдів»'],
			['«Аліса в Задзеркалі»', '«Аліса в країні див»'],
			['«Мина Мазайло»', '«Мина Мазайло-NEW»']
		];
		for (const [a, b] of різні) {
			expect(
				sameEvent(titleSkeleton(a), titleSkeleton(b)),
				`${a} і ${b} — різні назви, вони не мусять зійтися`
			).toBe(false);
		}
	});

	it('`playsByIds` віддає найновіші згори й мовчки минає невідомі ключі', () => {
		const known = PLAYS.slice(0, 3).map((p) => p.id);
		const out = playsByIds([...known, 'takoi-vystavy-nemaie-1999']);
		expect(out).toHaveLength(known.length);
		for (let i = 1; i < out.length; i++) expect(out[i - 1].year).toBeGreaterThanOrEqual(out[i].year);
	});
});
