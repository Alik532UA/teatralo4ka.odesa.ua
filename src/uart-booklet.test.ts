import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { POSTERS_LIST, POSTER_GROUPS, POSTER_THEMES } from '$lib/data/posters';
import { UART_SECRETS_BOOKLET, UART_BOOKLET_THEMES } from '$lib/data/uartSecretsBooklet';

describe('UArt «Дуже багато SEкретів» буклет A4', () => {
	it('зареєстрований у загальному реєстрі афіш школи POSTERS_LIST', () => {
		const meta = POSTERS_LIST.find((p) => p.id === 'uart-secrets-booklet');
		expect(meta).toBeDefined();
		expect(meta?.titleUk).toContain('Дуже багато SEкретів');
		expect(meta?.dateBadgeUk).toContain('7 листопада');
	});

	it('входить до групи 2026–2027 років у POSTER_GROUPS', () => {
		const group = POSTER_GROUPS.find((g) => g.id === '2026-2027');
		expect(group?.ids).toContain('uart-secrets-booklet');
	});

	it('має фірмові теми оформлення (темну та білу ощадну)', () => {
		const dark = POSTER_THEMES.find((t) => t.id === 'uart-dark');
		const light = POSTER_THEMES.find((t) => t.id === 'uart-light');
		expect(dark).toBeDefined();
		expect(light).toBeDefined();
		expect(dark?.forPosters).toContain('uart-secrets-booklet');
		expect(light?.forPosters).toContain('uart-secrets-booklet');
		expect(UART_BOOKLET_THEMES.length).toBeGreaterThanOrEqual(2);
	});

	it('містить 4 офіційні організації-презентери у шапці', () => {
		const presenters = UART_SECRETS_BOOKLET.presentersUk;
		expect(presenters).toHaveLength(4);
		expect(presenters[0]).toContain('Департамент культури');
		expect(presenters[1]).toContain('PRO.ТЕАТР');
		expect(presenters[2]).toContain('Одеська театральна школа');
		expect(presenters[3]).toContain('UArt');
	});

	it('містить повний склад дійових осіб та виконавців (9 записів)', () => {
		const cast = UART_SECRETS_BOOKLET.cast;
		expect(cast).toHaveLength(9);

		const expectedNames = [
			'Катерина Тютюнник',
			'Анастасія Загородна',
			'Кіра Любинська',
			'Поліна Койчева',
			'Софія Подьякова',
			'Маргарита Ковтун',
			'Крістіна Садоєва',
			'Тетяна Чупровська',
			'Павло Примак'
		];

		for (const name of expectedNames) {
			const found = cast.some((c) => c.actorUk === name);
			expect(found, `Актор/ка ${name} має бути у складі`).toBe(true);
		}

		// Перевірка мульти-ролі Павла Примака
		const prymak = cast.find((c) => c.actorUk === 'Павло Примак');
		expect(prymak?.characterUk).toContain('Вчителька');
		expect(prymak?.characterUk).toContain('Макс');
		expect(prymak?.characterUk).toContain('лікар');
	});

	it('містить повну постановочну команду, педагогів та адміністрацію', () => {
		const data = UART_SECRETS_BOOKLET;
		expect(data.directorUk).toContain('ФЕДІР ТКАЧ');
		expect(data.artisticDirectorUk).toContain('Федір Ткач');
		expect(data.durationUk).toContain('80');
		expect(data.premiereUk).toContain('7 листопада 2026');
		expect(data.ageBadge).toBe('14+');

		// Хореограф Стогул
		expect(data.crew.some((c) => c.namesUk.includes('Тетяна Стогул'))).toBe(true);
		// AI та IT підтримка
		expect(data.crew.some((c) => c.namesUk.includes('Алік Запольнов'))).toBe(true);
		// Директор Ткач
		expect(data.administration.some((a) => a.namesUk.includes('Олена Ткач'))).toBe(true);
	});

	it('усі файли зображень та логотипів існують у static/', () => {
		const files = [
			UART_SECRETS_BOOKLET.coverLeftImage,
			UART_SECRETS_BOOKLET.coverRightImage,
			...UART_SECRETS_BOOKLET.logos.map((l) => l.src)
		];

		for (const file of files) {
			const diskPath = join(process.cwd(), 'static', file.replace(/^\//, ''));
			expect(existsSync(diskPath), `Файл ${file} має існувати на диску`).toBe(true);
		}
	});
});

