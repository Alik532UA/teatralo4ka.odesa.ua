import { storage } from './storage';
import { errorLogger } from './errorLogger';
import { BETA_CHECKS, BETA_TABS, type BetaCheck } from '../data/betaChecklist';

/**
 * Позначки тестувальника й звіт (BETA-CHECKLIST-v8 § 3.1, § 6).
 *
 * ЧОМУ СХОВИЩЕ БРАУЗЕРА, А НЕ БАЗА (§ 6.1). Збирати на сервер означало б
 * колекцію, правила доступу до неї й чужі імена в ній — заради даних, яких поки
 * ніхто не читає. Рішення дешево скасувати: агрегація доклеюється пізніше, не
 * переписуючи сторінку. Ключ іде через фасад `storage`, тобто отримує префікс
 * проєкту (STORAGE-NAMESPACE-v8) і не кидає за жодних обставин.
 *
 * ЧОМУ ПОЗНАЧКА НЕСЕ ВЕРСІЮ (§ 3.1). Галочка «працює» з-перед сорока комітів
 * виглядає точно так само, як сьогоднішня. Позначка з іншої версії не зникає —
 * вона все ще щось означає, — але підписана «позначено на іншій версії» й НЕ
 * рахується в поступі. Без цього список тихо перетворюється на звіт про минуле,
 * який читають як звіт про теперішнє.
 */

const MARKS_KEY = 'beta_checklist_marks';

export type Vote = 'fail' | 'weird' | 'ok';

export interface Mark {
	vote: Vote;
	/** Версія застосунку, на якій поставили. */
	version: string;
}

export type Marks = Record<string, Mark>;

const VOTES: readonly Vote[] = ['fail', 'weird', 'ok'];

/** Чи це справді позначка, а не будь-що зі сховища. */
function isMark(value: unknown): value is Mark {
	if (typeof value !== 'object' || value === null) return false;
	const m = value as Partial<Mark>;
	return VOTES.includes(m.vote as Vote) && typeof m.version === 'string';
}

/**
 * Сховище може містити будь-що: інша версія формату, чужий скрипт, ручна правка
 * в DevTools. Зіпсований запис відкидається поштучно, а не разом з усіма —
 * інакше одна битий рядок стирає людині всю роботу.
 */
export function loadMarks(): Marks {
	const raw = storage.get(MARKS_KEY);
	if (!raw) return {};
	try {
		const parsed: unknown = JSON.parse(raw);
		if (typeof parsed !== 'object' || parsed === null) return {};
		const out: Marks = {};
		for (const [id, value] of Object.entries(parsed)) {
			if (isMark(value)) out[id] = value;
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

const VOTE_LABEL: Record<Vote, string> = {
	fail: 'НЕ ПРАЦЮЄ',
	weird: 'ПРАЦЮЄ, АЛЕ ДИВНО',
	ok: 'працює'
};

/** Поламане — вгорі: звіт читають зверху, і читає його людина. */
const VOTE_WEIGHT: Record<Vote, number> = { fail: 0, weird: 1, ok: 2 };

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
		if (check.coverage === 'covered' && mark.vote !== 'ok') {
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
