import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from './storage';
import {
	buildReport,
	clearMarks,
	countFresh,
	isStale,
	loadMarks,
	saveMarks,
	toggleMark,
	type Marks
} from './betaProgress';
import { BETA_CHECKS } from '../data/betaChecklist';

/**
 * BETA-CHECKLIST-v8 § 3.1 (позначка несе версію) і § 6 (звіт).
 *
 * Найважливіше тут — третій і четвертий тести. Позначка без версії й позначка з
 * чужою версією виглядають на екрані однаково, тож ця частина не має способу
 * зламатися помітно: список просто поступово стає звітом про минуле, який
 * читають як звіт про теперішнє.
 */

const KEY = 'beta_checklist_marks';
const SOME_ID = BETA_CHECKS[0].id;

describe('позначки чеклиста', () => {
	beforeEach(() => {
		clearMarks();
	});

	it('дані чеклиста на місці — перевірка жива', () => {
		expect(BETA_CHECKS.length).toBeGreaterThan(10);
		expect(SOME_ID).toMatch(/^\w+_\d+$/);
	});

	it('позначка зберігається й читається', () => {
		const marks = toggleMark({}, SOME_ID, 'ok', '1.2.3');
		expect(saveMarks(marks)).toBe(true);
		expect(loadMarks()).toEqual({ [SOME_ID]: { vote: 'ok', version: '1.2.3' } });
	});

	it('повторне натискання того самого стану знімає позначку', () => {
		let marks: Marks = toggleMark({}, SOME_ID, 'ok', '1.2.3');
		marks = toggleMark(marks, SOME_ID, 'ok', '1.2.3');
		expect(marks).toEqual({});
	});

	it('позначка з іншої версії не рахується як зроблена (§ 3.1)', () => {
		const marks = toggleMark({}, SOME_ID, 'ok', '0.9.9');
		expect(isStale(marks[SOME_ID], '1.0.0')).toBe(true);
		expect(countFresh(marks, '1.0.0')).toBe(0);
		// Але й НЕ зникає: вона все ще щось означає.
		expect(marks[SOME_ID]).toBeDefined();
	});

	it('зіпсований запис відкидається поштучно, а не разом з усіма', () => {
		// Сховище може містити будь-що: інша версія формату, ручна правка в
		// DevTools. Якщо один битий рядок стирає все, людина втрачає всю роботу —
		// і саме тоді, коли її найбільше.
		storage.set(
			KEY,
			JSON.stringify({ good_1: { vote: 'ok', version: '1.0.0' }, bad_1: { vote: 'maybe' } })
		);
		expect(loadMarks()).toEqual({ good_1: { vote: 'ok', version: '1.0.0' } });
	});

	it('несправний JSON не кидає — сторінка мусить відкритися', () => {
		storage.set(KEY, '{ це не json');
		expect(() => loadMarks()).not.toThrow();
		expect(loadMarks()).toEqual({});
	});
});

describe('звіт', () => {
	const ctx = {
		version: '1.0.0',
		nowIso: '2026-08-19T10:00:00.000Z',
		userAgent: 'TestBrowser/1.0',
		lang: 'uk',
		theme: 'dark'
	};

	it('містить середовище й версію збірки', () => {
		const report = buildReport({}, ctx);
		expect(report).toContain('1.0.0');
		expect(report).toContain('2026-08-19T10:00:00.000Z');
		expect(report).toContain('TestBrowser/1.0');
		expect(report).toContain('dark');
	});

	it('без позначок каже про це прямо, а не віддає порожній текст', () => {
		expect(buildReport({}, ctx)).toContain('Жодного пункта не позначено');
	});

	it('містить ЛИШЕ позначені пункти (§ 6.1)', () => {
		const marks = toggleMark({}, SOME_ID, 'fail', '1.0.0');
		const report = buildReport(marks, ctx);
		// Перелік недивленого робить звіт нечитним, а звіт, який не читають,
		// дорівнює відсутньому.
		const mentioned = BETA_CHECKS.filter((c) => report.includes(c.id));
		expect(mentioned.map((c) => c.id)).toEqual([SOME_ID]);
	});

	it('поламане стоїть вище за справне', () => {
		const ok = BETA_CHECKS[0].id;
		const fail = BETA_CHECKS[1].id;
		let marks = toggleMark({}, ok, 'ok', '1.0.0');
		marks = toggleMark(marks, fail, 'fail', '1.0.0');
		const report = buildReport(marks, ctx);
		expect(report.indexOf(fail)).toBeLessThan(report.indexOf(ok));
	});

	it('помилка в покритому пункті окремо називає файл тесту (§ 3)', () => {
		// Новина гірша за звичайний баг: вона знецінює всі зелені прогони, тому у
		// звіті мусить бути видна окремим рядком, а не серед решти.
		const covered = BETA_CHECKS.find((c) => c.coverage === 'covered');
		expect(covered, 'у чеклисті немає жодного покритого пункта — тест ні про що').toBeDefined();

		const marks = toggleMark({}, covered!.id, 'fail', '1.0.0');
		const report = buildReport(marks, ctx);
		expect(report).toContain('ПУНКТ ПОКРИТО АВТОТЕСТОМ');
		expect(report).toContain(covered!.test!);
	});

	it('позначка з іншої версії підписана у звіті', () => {
		const marks = toggleMark({}, SOME_ID, 'ok', '0.9.9');
		expect(buildReport(marks, ctx)).toContain('позначено на версії 0.9.9');
	});
});
