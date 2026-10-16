import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
	SOFIIA_PODIAKOVA_AWARD,
	GALAXY_AWARD_THEMES
} from './galaxyAward';

describe('SOFIIA_PODIAKOVA_AWARD', () => {
	it('містить валідні обовʼязкові поля відзнаки', () => {
		expect(SOFIIA_PODIAKOVA_AWARD.id).toBe('galaxy-award-podiakova');
		expect(SOFIIA_PODIAKOVA_AWARD.personNameUk).toContain('Софія');
		expect(SOFIIA_PODIAKOVA_AWARD.certificateNumber).toBe('№ 001');
		expect(SOFIIA_PODIAKOVA_AWARD.plays.length).toBeGreaterThan(0);
	});

	it('зображення фото та QR-коду існують у каталозі static', () => {
		const photoPath = join('static', SOFIIA_PODIAKOVA_AWARD.photo.replace(/^\//, ''));
		const qrPath = join('static', SOFIIA_PODIAKOVA_AWARD.qrCode.replace(/^\//, ''));

		expect(existsSync(photoPath), `Файл фото не знайдено: ${photoPath}`).toBe(true);
		expect(existsSync(qrPath), `Файл QR-коду не знайдено: ${qrPath}`).toBe(true);
	});

	it('містить теми оформлення для відзнаки', () => {
		expect(GALAXY_AWARD_THEMES.length).toBeGreaterThanOrEqual(2);
		expect(GALAXY_AWARD_THEMES.some((t) => t.id === 'galaxy-space')).toBe(true);
		expect(GALAXY_AWARD_THEMES.some((t) => t.id === 'galaxy-print-light')).toBe(true);
	});
});
