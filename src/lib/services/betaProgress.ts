import { storage } from './storage';
import { errorLogger } from './errorLogger';
import { BETA_CHECKS, BETA_TABS, type BetaCheck } from '../data/betaChecklist';

/**
 * Позначки тестувальника й звіт (BETA-CHECKLIST-v9 § 3.1, § 6).
 *
 * ЧОМУ СХОВИЩЕ БРАУЗЕРА, А НЕ БАЗА (§ 6.1). Збирати на сервер означало б
 * колекцію, правила доступу до неї й чужі імена в ній — заради даних, яких поки
 * ніхто не читає. Рішення дешево скасувати: агрегація доклеюється пізніше, не
 * переписуючи сторінку. Ключ іде через фасад `storage`, тобто отримує префікс
 * проєкту (STORAGE-NAMESPACE-v9) і не кидає за жодних обставин.
 *
 * ЧОМУ ПОЗНАЧКА НЕСЕ ВЕРСІЮ (§ 3.1). Галочка «працює» з-перед сорока комітів
 * виглядає точно так само, як сьогоднішня. Позначка з іншої версії не зникає —
 * вона все ще щось означає, — але підписана «позначено на іншій версії» й НЕ
 * рахується в поступі. Без цього список тихо перетворюється на звіт про минуле,
 * який читають як звіт про теперішнє.
 */

const MARKS_KEY = 'beta_checklist_marks';

export type Vote = 'fail' | 'unclear' | 'ok' | 'skip';

export interface Mark {
	vote: Vote;
	/** Версія застосунку, на якій поставили. */
	version: string;
}

export type Marks = Record<string, Mark>;

const VOTES: readonly Vote[] = ['fail', 'unclear', 'ok', 'skip'];

/** Перевіряє та нормалізує позначку зі сховища (зокрема переводить weird у unclear). */
function normalizeMark(value: unknown): Mark | null {
	if (typeof value !== 'object' || value === null) return null;
	const m = value as { vote?: unknown; version?: unknown };
	let v = m.vote;
	if (v === 'weird') v = 'unclear';
	if (VOTES.includes(v as Vote) && typeof m.version === 'string') {
		return { vote: v as Vote, version: m.version };
	}
	return null;
}

/**
 * Сховище може містити будь-що: інша версія формату, чужий скрипт, ручна правка
 * в DevTools. Зіпсований запис відкидається поштучно, а не разом з усіма —
 * інакше одна битий рядок стирає людині всю роботу.
 *
 * Відкидається й позначка пункта, ЯКОГО В ЧЕКЛИСТІ ВЖЕ НЕМАЄ (§ 8.6,
 * `BETA-MARKS-UNTRUSTED`). Форму такий запис має правильну, тож попередня
 * редакція його пропускала — і він рахувався в поступі: пункт прибрали зі
 * списку, а число лишилося, тобто сторінка показувала «36 / 34». Виправити це
 * зсередини не було як: у списку такого пункта вже немає, отже й зняти позначку
 * нема на чому.
 */
export function loadMarks(): Marks {
	const raw = storage.get(MARKS_KEY);
	if (!raw) return {};
	try {
		const parsed: unknown = JSON.parse(raw);
		if (typeof parsed !== 'object' || parsed === null) return {};
		const known = new Set(BETA_CHECKS.map((check) => check.id));
		const out: Marks = {};
		for (const [id, value] of Object.entries(parsed)) {
			if (!known.has(id)) continue;
			const mark = normalizeMark(value);
			if (mark) out[id] = mark;
		}
		return out;
	} catch (e) {
		errorLogger.logWarning('позначки чеклиста не прочитано', { component: 'beta-checklist' }, e);
		return {};
	}
}

/** Повертає новий об'єкт позначок; повторне натискання того самого стану знімає його. */
export function toggleMark(marks: Marks, id: string, vote: Vote, version: string): Marks {
	const next = { ...marks };
	if (next[id]?.vote === vote && next[id]?.version === version) delete next[id];
	else next[id] = { vote, version };
	return next;
}

export function saveMarks(marks: Marks): boolean {
	return storage.set(MARKS_KEY, JSON.stringify(marks));
}

export function clearMarks(): void {
	storage.remove(MARKS_KEY);
}

/** Позначка з іншої версії лишається видимою, але не рахується як зроблена. */
export function isStale(mark: Mark | undefined, version: string): boolean {
	return mark !== undefined && mark.version !== version;
}

export function countFresh(marks: Marks, version: string): number {
	return Object.values(marks).filter((m) => m.version === version).length;
}

/**
 * Поступ ОКРЕМОЇ вкладки (§ 8.1, `BETA-TAB-PROGRESS`).
 *
 * Загальне «12 / 35» не відповідає на питання, яке тестувальник собі ставить:
 * чи закінчена ця вкладка. Вкладок п'ять, і проходять їх по одній — тобто без
 * лічильника позицію доводиться тримати в голові.
 */
export function countFreshInTab(
	marks: Marks,
	version: string,
	checks: readonly { id: string }[]
): { done: number; total: number } {
	const done = checks.filter((check) => marks[check.id]?.version === version).length;
	return { done, total: checks.length };
}

const VOTE_LABEL: Record<Vote, string> = {
	fail: 'НЕ ПРАЦЮЄ',
	unclear: 'НЕ ЗРОЗУМІЛО',
	skip: 'ПРОПУЩЕНО',
	ok: 'працює'
};

/** Поламане — вгорі: звіт читають зверху, і читає його людина. */
const VOTE_WEIGHT: Record<Vote, number> = { fail: 0, unclear: 1, skip: 2, ok: 3 };

export interface ReportContext {
	version: string;
	/** ISO-час передається, а не береться тут: так звіт можна перевірити тестом. */
	nowIso: string;
	userAgent: string;
	lang: string;
	theme: string;
}

/**
 * Текст звіту (§ 6.1): версія, час, середовище і ЛИШЕ позначені пункти.
 *
 * Перелік недивленого робить звіт нечитним — а звіт, який не читають, дорівнює
 * відсутньому. Пункт рівня `covered` із позначкою «не працює» отримує окремий
 * рядок: це новина гірша за звичайний баг, бо знецінює всі зелені прогони.
 */
export function buildReport(marks: Marks, ctx: ReportContext): string {
	const tabOf = new Map<string, string>();
	for (const tab of BETA_TABS) for (const c of tab.checks) tabOf.set(c.id, tab.title.uk);

	const marked = BETA_CHECKS.filter((c) => marks[c.id]).sort(
		(a, b) => VOTE_WEIGHT[marks[a.id].vote] - VOTE_WEIGHT[marks[b.id].vote]
	);

	const head = [
		`Чеклист бета-тестування — teatralo4ka.odesa.ua`,
		`версія збірки: ${ctx.version}`,
		`час: ${ctx.nowIso}`,
		`мова: ${ctx.lang}   тема: ${ctx.theme}`,
		`браузер: ${ctx.userAgent}`,
		`позначено: ${marked.length} із ${BETA_CHECKS.length}`,
		''
	];

	if (marked.length === 0) {
		return [...head, 'Жодного пункта не позначено.'].join('\n');
	}

	const body = marked.flatMap((check: BetaCheck) => {
		const mark = marks[check.id];
		const lines = [
			`[${VOTE_LABEL[mark.vote]}] ${check.id} (${tabOf.get(check.id) ?? '—'})`,
			`    ${check.text.uk}`
		];
		if (isStale(mark, ctx.version)) {
			lines.push(`    (позначено на версії ${mark.version}, зараз ${ctx.version})`);
		}
		if (check.coverage === 'covered' && (mark.vote === 'fail' || mark.vote === 'unclear')) {
			lines.push(
				`    !!! ПУНКТ ПОКРИТО АВТОТЕСТОМ ${check.test} —`,
				`        тест не побачив цієї помилки`
			);
		}
		lines.push('');
		return lines;
	});

	return [...head, ...body].join('\n');
}
