/**
 * Повний запис мелодії «Гімну школи» для інтерактивного тренажера фортепіано.
 *
 * Фрази та паузи:
 * 1.  до до до (пауза) до ре ре (пауза) ре ми ми (пауза) ми фа ре до (пауза)
 * 2.  до до до (пауза) до ре ре (пауза) ре ми ми (пауза) ми фа ре до (пауза)
 * 3.  ля соль фа ре ля(мо) (пауза)
 * 4.  ля ля ля ля ля фа си-бемоль (пауза)
 * 5.  до до до (пауза) до ре ре (пауза) ре ми ми (пауза) ми фа ре до (пауза)
 * 6.  до до до (пауза) до ре ре (пауза) ре ми ми (пауза) ми фа ре до (пауза)
 * 7.  ля соль фа ре ля(мо) (пауза)
 * 8.  ля ля ля ля ля фа си-бемоль (пауза)
 * 9.  си-бемоль си-бемоль си-бемоль си-бемоль си-бемоль ля фа (пауза)
 * 10. ля ля ля ля ля фа фа (пауза)
 * 11. ля ля ля ля ля фа фа (пауза)
 * 12. ре ре ре ре ре до до (пауза)
 * 13. си-бемоль си-бемоль си-бемоль си-бемоль си-бемоль ля фа (пауза)
 * 14. ля ля ля ля ля фа фа (пауза)
 * 15. ля соль фа ре ля(мо) (пауза)
 * 16. ре ре ре ре ре до до (пауза)
 * 17. си-бемоль си-бемоль си-бемоль си-бемоль си-бемоль си-бемоль ля соль си-бемоль (пауза)
 * 18. ля ля соль фа ля соль фа ля соль фа ля (пауза)
 * 19. си-бемоль си-бемоль си-бемоль си-бемоль си-бемоль си-бемоль си-бемоль си-бемоль ля соль си-бемоль (пауза)
 * 20. до(2о) до(2о) до(2о) до(2о) до(2о) до(2о) до(2о) ре(2о) до(2о) до(2о) ре(2о) до(2о) (пауза)
 * 21. до(2о) до(2о) до(2о) до(2о) до(2о) си-бемоль (пауза)
 * 22. си-бемоль си-бемоль си-бемоль си-бемоль си-бемоль соль соль (пауза)
 * 23. си-бемоль си-бемоль си-бемоль си-бемоль си-бемоль соль соль (пауза)
 * 24. ми ми ми ми ми ре ре (пауза)
 * 25. до(2о) до(2о) до(2о) до(2о) до(2о) си-бемоль соль (пауза)
 * 26. си-бемоль си-бемоль си-бемоль си-бемоль си-бемоль соль соль (пауза)
 * 27. си-бемоль ля соль ми си-бемоль(мо) (пауза)
 * 28. ми ми ми ми ми ре ре (пауза)
 * 29. до(2о) до(2о) до(2о) до(2о) до(2о) си-бемоль (пауза)
 */

export interface AnthemStep {
	id: number;
	note: string;
	solfeggio: string;
	whiteIndex: number;
	sharp: boolean;
	phrase: number;
	hasPauseAfter?: boolean;
}

export interface AnthemPause {
	id: string;
	afterStepId: number;
	phrase: number;
}

const NOTE_MAP: Record<string, { note: string; whiteIndex: number; sharp: boolean }> = {
	'до': { note: 'C4', whiteIndex: 2, sharp: false },
	'ре': { note: 'D4', whiteIndex: 3, sharp: false },
	'ми': { note: 'E4', whiteIndex: 4, sharp: false },
	'фа': { note: 'F4', whiteIndex: 5, sharp: false },
	'соль': { note: 'G4', whiteIndex: 6, sharp: false },
	'ля': { note: 'A4', whiteIndex: 7, sharp: false },
	'си-бемоль': { note: 'A#4', whiteIndex: 7, sharp: true },
	'ля(мо)': { note: 'A3', whiteIndex: 0, sharp: false },
	'си-бемоль(мо)': { note: 'A#3', whiteIndex: 0, sharp: true },
	'до(2о)': { note: 'C5', whiteIndex: 9, sharp: false },
	'ре(2о)': { note: 'D5', whiteIndex: 10, sharp: false }
};

const ANTHEM_SCORE_TEXT = `
до до до (пауза) до ре ре (пауза) ре ми ми (пауза) ми фа ре до (пауза)
до до до (пауза) до ре ре (пауза) ре ми ми (пауза) ми фа ре до (пауза)
ля соль фа ре ля(мо) (пауза)
ля ля ля ля ля фа си-бемоль (пауза)
до до до (пауза) до ре ре (пауза) ре ми ми (пауза) ми фа ре до (пауза)
до до до (пауза) до ре ре (пауза) ре ми ми (пауза) ми фа ре до (пауза)
ля соль фа ре ля(мо) (пауза)
ля ля ля ля ля фа си-бемоль (пауза)
си-бемоль си-бемоль си-бемоль си-бемоль си-бемоль ля фа (пауза)
ля ля ля ля ля фа фа (пауза)
ля ля ля ля ля фа фа (пауза)
ре ре ре ре ре до до (пауза)
си-бемоль си-бемоль си-бемоль си-бемоль си-бемоль ля фа (пауза)
ля ля ля ля ля фа фа (пауза)
ля соль фа ре ля(мо) (пауза)
ре ре ре ре ре до до (пауза)
си-бемоль си-бемоль си-бемоль си-бемоль си-бемоль си-бемоль ля соль си-бемоль (пауза)
ля ля соль фа ля соль фа ля соль фа ля (пауза)
си-бемоль си-бемоль си-бемоль си-бемоль си-бемоль си-бемоль си-бемоль си-бемоль ля соль си-бемоль (пауза)
до(2о) до(2о) до(2о) до(2о) до(2о) до(2о) до(2о) ре(2о) до(2о) до(2о) ре(2о) до(2о) (пауза)
до(2о) до(2о) до(2о) до(2о) до(2о) си-бемоль (пауза)
си-бемоль си-бемоль си-бемоль си-бемоль си-бемоль соль соль (пауза)
си-бемоль си-бемоль си-бемоль си-бемоль си-бемоль соль соль (пауза)
ми ми ми ми ми ре ре (пауза)
до(2о) до(2о) до(2о) до(2о) до(2о) си-бемоль соль (пауза)
си-бемоль си-бемоль си-бемоль си-бемоль си-бемоль соль соль (пауза)
си-бемоль ля соль ми си-бемоль(мо) (пауза)
ми ми ми ми ми ре ре (пауза)
до(2о) до(2о) до(2о) до(2о) до(2о) си-бемоль (пауза)
`;

function parseScore(): { steps: AnthemStep[]; pauses: AnthemPause[] } {
	const lines = ANTHEM_SCORE_TEXT.trim().split('\n');
	const parsedSteps: AnthemStep[] = [];
	const parsedPauses: AnthemPause[] = [];
	let stepId = 0;
	let phraseId = 0;

	for (const line of lines) {
		const segments = line.split(/\s*\(пауза\)\s*/).filter((s) => s.trim().length > 0);
		for (const seg of segments) {
			const tokens = seg.trim().split(/\s+/);
			for (let i = 0; i < tokens.length; i++) {
				const tok = tokens[i];
				const isLastInSeg = i === tokens.length - 1;
				const mapped = NOTE_MAP[tok];
				if (!mapped) continue;

				parsedSteps.push({
					id: stepId,
					note: mapped.note,
					solfeggio: tok,
					whiteIndex: mapped.whiteIndex,
					sharp: mapped.sharp,
					phrase: phraseId,
					hasPauseAfter: isLastInSeg
				});

				if (isLastInSeg) {
					parsedPauses.push({
						id: `pause-${parsedPauses.length}`,
						afterStepId: stepId,
						phrase: phraseId
					});
				}
				stepId++;
			}
			phraseId++;
		}
	}
	return { steps: parsedSteps, pauses: parsedPauses };
}

const PARSED = parseScore();

export const SCHOOL_ANTHEM_SEQUENCE: readonly AnthemStep[] = PARSED.steps;
export const ANTHEM_PAUSES: readonly AnthemPause[] = PARSED.pauses;
export const TOTAL_ANTHEM_STEPS = SCHOOL_ANTHEM_SEQUENCE.length;

export function getAnthemStep(index: number): AnthemStep | null {
	if (index < 0 || index >= SCHOOL_ANTHEM_SEQUENCE.length) return null;
	return SCHOOL_ANTHEM_SEQUENCE[index];
}

const NOTE_SPACING = 18;
const PAUSE_EXTRA_SPACING = 24;
const PAUSE_MARKER_OFFSET = 12;

const STEP_BASE_Y: number[] = (() => {
	const positions: number[] = [0];
	for (let i = 1; i < SCHOOL_ANTHEM_SEQUENCE.length; i++) {
		const prev = SCHOOL_ANTHEM_SEQUENCE[i - 1];
		const gap = prev.hasPauseAfter ? NOTE_SPACING + PAUSE_EXTRA_SPACING : NOTE_SPACING;
		positions.push(positions[i - 1] + gap);
	}
	return positions;
})();

const PAUSE_BASE_Y: number[] = ANTHEM_PAUSES.map((p) => {
	const stepY = STEP_BASE_Y[p.afterStepId];
	return stepY + PAUSE_MARKER_OFFSET;
});

/**
 * Розраховує вертикальну позицію Y для кроку мелодії відносно поточного активного індексу.
 * Активний крок має Y = 0 (рівень ліхтарика).
 */
export function getAnthemStepY(stepId: number, currentStepIndex: number): number {
	if (stepId < currentStepIndex) {
		return -24 - (currentStepIndex - stepId) * 16;
	}
	return STEP_BASE_Y[stepId] - STEP_BASE_Y[currentStepIndex];
}

/**
 * Розраховує вертикальну позицію Y для візуального маркера паузи відносно поточного активного індексу.
 */
export function getAnthemPauseY(pauseIdx: number, currentStepIndex: number): number {
	const pause = ANTHEM_PAUSES[pauseIdx];
	if (pause.afterStepId < currentStepIndex) {
		return -24 - (currentStepIndex - pause.afterStepId) * 16;
	}
	return PAUSE_BASE_Y[pauseIdx] - STEP_BASE_Y[currentStepIndex];
}
