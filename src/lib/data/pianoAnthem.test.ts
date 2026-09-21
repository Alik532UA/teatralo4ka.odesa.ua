import { describe, it, expect } from 'vitest';
import {
	SCHOOL_ANTHEM_SEQUENCE,
	ANTHEM_PAUSES,
	TOTAL_ANTHEM_STEPS,
	getAnthemStep,
	getAnthemStepY,
	getAnthemPauseY
} from './pianoAnthem';

describe('pianoAnthem', () => {
	it('містить повний запис мелодії з 232 кроків', () => {
		expect(TOTAL_ANTHEM_STEPS).toBe(232);
		expect(SCHOOL_ANTHEM_SEQUENCE.length).toBe(232);
	});

	it('містить 41 фразу та 41 паузу', () => {
		expect(ANTHEM_PAUSES.length).toBe(41);
		const lastStep = SCHOOL_ANTHEM_SEQUENCE[SCHOOL_ANTHEM_SEQUENCE.length - 1];
		expect(lastStep.phrase).toBe(40);
		expect(lastStep.hasPauseAfter).toBe(true);
	});

	it('починається з перших двох фраз: до до до (пауза) до ре ре (пауза)', () => {
		const firstNotes = SCHOOL_ANTHEM_SEQUENCE.slice(0, 6).map((s) => s.solfeggio).join(' ');
		expect(firstNotes).toBe('до до до до ре ре');
		expect(SCHOOL_ANTHEM_SEQUENCE[2].hasPauseAfter).toBe(true);
		expect(SCHOOL_ANTHEM_SEQUENCE[5].hasPauseAfter).toBe(true);
	});

	it('містить ноти малої октави ля(мо) та си-бемоль(мо)', () => {
		const lowLa = SCHOOL_ANTHEM_SEQUENCE.find((s) => s.solfeggio === 'ля(мо)');
		expect(lowLa?.note).toBe('A3');
		expect(lowLa?.whiteIndex).toBe(0);

		const lowSiFlat = SCHOOL_ANTHEM_SEQUENCE.find((s) => s.solfeggio === 'си-бемоль(мо)');
		expect(lowSiFlat?.note).toBe('A#3');
		expect(lowSiFlat?.sharp).toBe(true);
	});

	it('містить ноти другої октави до(2о) та ре(2о)', () => {
		const do2 = SCHOOL_ANTHEM_SEQUENCE.find((s) => s.solfeggio === 'до(2о)');
		expect(do2?.note).toBe('C5');
		expect(do2?.whiteIndex).toBe(9);

		const re2 = SCHOOL_ANTHEM_SEQUENCE.find((s) => s.solfeggio === 'ре(2о)');
		expect(re2?.note).toBe('D5');
		expect(re2?.whiteIndex).toBe(10);
	});

	it('getAnthemStep повертає крок або null за межами', () => {
		expect(getAnthemStep(0)?.note).toBe('C4');
		expect(getAnthemStep(231)?.solfeggio).toBe('си-бемоль');
		expect(getAnthemStep(-1)).toBeNull();
		expect(getAnthemStep(232)).toBeNull();
	});

	it('getAnthemStepY повертає 0 для активного кроку та плавний підйом', () => {
		expect(getAnthemStepY(5, 5)).toBe(0);
		expect(getAnthemStepY(6, 5)).toBeGreaterThan(0);
		expect(getAnthemStepY(4, 5)).toBeLessThan(0);
	});

	it('getAnthemPauseY повертає позицію паузи', () => {
		expect(getAnthemPauseY(0, 0)).toBeGreaterThan(0);
		expect(getAnthemPauseY(0, 5)).toBeLessThan(0);
	});
});
