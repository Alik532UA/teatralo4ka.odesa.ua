import type { GraduatePlay } from './graduates';

/**
 * Рядки вистав анкети, згорнуті по вечорах.
 *
 * ## Навіщо
 *
 * Коли людина грала в кількох уривках одного вечора, в анкеті це кілька
 * рядків — по одному на уривок, бо роль живе в рядку (докблок
 * `GraduatePlay.items`). У переліку «Вистави та ролі» вони повторювали рік,
 * назву вечора й плашку «разом з» стільки разів, скільки уривків. Заміряно на
 * анкеті Аліка Запольнова 2026-09-02: три рядки «Уривків з класики» 2013 — три
 * однакові плашки «разом з Freedom», і різнилися рядки лише хвостом після
 * двокрапки.
 *
 * ## Правило
 *
 * Рядки з тим самим `playId` стають одним «вечором» на місці першого з них, у
 * порядку анкети. Рядок без `playId` вечором бути не може — його нікуди
 * прив'язати — і лишається одиночним. Один рядок на виставу теж лишається
 * одиночним: згортати є що лише від двох.
 *
 * Чиста функція без даних — щоб правило перевірялося тестом, а не оком.
 */
export type PlayRowGroup =
	| { kind: 'single'; row: GraduatePlay }
	| { kind: 'evening'; playId: string; year: number | null; rows: GraduatePlay[] };

export function groupPlayRows(rows: readonly GraduatePlay[]): PlayRowGroup[] {
	const byPlay = new Map<string, GraduatePlay[]>();
	for (const row of rows) {
		if (!row.playId) continue;
		byPlay.set(row.playId, [...(byPlay.get(row.playId) ?? []), row]);
	}

	const out: PlayRowGroup[] = [];
	const done = new Set<string>();
	for (const row of rows) {
		const siblings = row.playId ? byPlay.get(row.playId) : undefined;
		if (!row.playId || !siblings || siblings.length < 2) {
			out.push({ kind: 'single', row });
			continue;
		}
		if (done.has(row.playId)) continue;
		done.add(row.playId);
		out.push({ kind: 'evening', playId: row.playId, year: row.year, rows: siblings });
	}
	return out;
}
