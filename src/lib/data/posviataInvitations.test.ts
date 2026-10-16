import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	chunkStudents,
	formatGreeting,
	getStudentsForSlot,
	LEFT_MINI_ICONS,
	POSVIATA_EVENT_META,
	POSVIATA_STUDENTS_10_00,
	POSVIATA_STUDENTS_12_00,
	RIGHT_MINI_ICONS
} from './posviataInvitations';

describe('posviata invitations data', () => {
	it('метадані події коректні', () => {
		expect(POSVIATA_EVENT_META.dateUk).toBe('24 жовтня 2026 р.');
		expect(POSVIATA_EVENT_META.addressUk).toBe('вул. Софіївська, 24');
		expect(POSVIATA_EVENT_META.hallUk).toBe('Велика зала');
	});

	it('список 10:00 містить рівно 36 учнів для 6 повних аркушів по 6 карток', () => {
		expect(POSVIATA_STUDENTS_10_00).toHaveLength(36);
		const chunks = chunkStudents(POSVIATA_STUDENTS_10_00, 6);
		expect(chunks).toHaveLength(6);
		for (const chunk of chunks) {
			expect(chunk).toHaveLength(6);
		}
	});

	it('список 12:00 містить рівно 42 учні для 7 повних аркушів по 6 карток', () => {
		expect(POSVIATA_STUDENTS_12_00).toHaveLength(42);
		const chunks = chunkStudents(POSVIATA_STUDENTS_12_00, 6);
		expect(chunks).toHaveLength(7);
		for (const chunk of chunks) {
			expect(chunk).toHaveLength(6);
		}
	});

	it('getStudentsForSlot повертає правильні списки', () => {
		expect(getStudentsForSlot('10:00')).toBe(POSVIATA_STUDENTS_10_00);
		expect(getStudentsForSlot('12:00')).toBe(POSVIATA_STUDENTS_12_00);
	});

	it('форматування звернення узгоджує рід', () => {
		const female = { firstName: 'Аделіна', lastName: 'Бочкова', gender: 'f' as const };
		const male = { firstName: 'Євген', lastName: 'Бежевець', gender: 'm' as const };

		expect(formatGreeting(female, false)).toBe('Дорога Аделіна Бочкова!');
		expect(formatGreeting(male, false)).toBe('Дорогий Євген Бежевець!');
		expect(formatGreeting(female, true)).toBe('Dear Аделіна Бочкова!');
	});

	it('усі міні-іконки існують у static/miniIcon/svg/', () => {
		expect(LEFT_MINI_ICONS).toHaveLength(9);
		expect(RIGHT_MINI_ICONS).toHaveLength(9);

		const allIcons = new Set([...LEFT_MINI_ICONS, ...RIGHT_MINI_ICONS]);
		for (const iconId of allIcons) {
			const p = resolve(
				process.cwd(),
				`static/miniIcon/svg/t4_logo_IndividualParticles_MiniIcon${iconId}_2026.svg`
			);
			expect(existsSync(p), `Icon ${iconId} not found at ${p}`).toBe(true);
		}
	});
});
