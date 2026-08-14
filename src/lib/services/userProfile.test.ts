import { describe, it, expect } from 'vitest';
import { normalizeProfile, projectIdsFor } from './userProfile';

/**
 * Тести на приведення профілю з Firestore.
 *
 * Доти ця логіка жила в конструкторі контролера разом із чотирма зверненнями
 * до мережі, зокрема `deleteDoc`. Перевірити її було нічим: конструктор
 * запускається самим імпортом і одразу тягне Firebase. Тобто вхід плюс
 * міграція даних із видаленням документа — найризикованіше місце проєкту —
 * лишалися поза перевірками.
 */

describe('normalizeProfile', () => {
	it('немає даних — немає профілю', () => {
		expect(normalizeProfile(null)).toBeNull();
		expect(normalizeProfile(undefined)).toBeNull();
		expect(normalizeProfile('щось')).toBeNull();
	});

	it('профіль нової схеми лишається як є', () => {
		const raw = {
			email: 'a@b.c',
			projects: { site: { role: 'admin', permissions: { canEditArticles: true } } }
		};
		const profile = normalizeProfile(raw);
		expect(profile?.email).toBe('a@b.c');
		expect(profile?.projects.site.role).toBe('admin');
	});

	it('профіль без projects отримує порожню мапу, а не undefined', () => {
		// Далі код усюди робить `profile.projects[...]`; undefined там —
		// виключення при першій же перевірці прав.
		expect(normalizeProfile({ email: 'a@b.c' })?.projects).toEqual({});
	});

	it('стара схема: schoolId стає записом у projects', () => {
		const profile = normalizeProfile({
			schoolId: 'teatralo4ka',
			role: 'moderator',
			permissions: { canCreate: true, canEdit: true, canDelete: false }
		});
		expect(Object.keys(profile!.projects)).toEqual(['teatralo4ka']);
		expect(profile!.projects.teatralo4ka.role).toBe('moderator');
	});

	it('старі плоскі права розкриваються в РЕАЛЬНІ ключі інтерфейсу', () => {
		// Ось той дефект, який знайшовся при винесенні. Попередній код підставляв
		// `{ canCreate, canEdit, canDelete }` — імена, яких у
		// ProjectAccess['permissions'] немає взагалі. Жодна перевірка прав їх не
		// читає, тож користувач після міграції отримував об'єкт, який виглядає як
		// дозволи і не є ними: усі справжні прапорці лишалися undefined.
		// TypeScript цього не бачив, бо профіль ішов через `any`.
		const p = normalizeProfile({
			schoolId: 'site',
			role: 'moderator',
			permissions: { canCreate: true, canEdit: true, canDelete: false }
		})!.projects.site.permissions;

		expect(p.canCreateArticles).toBe(true);
		expect(p.canCreatePages).toBe(true);
		expect(p.canEditArticles).toBe(true);
		expect(p.canDeleteArticles).toBe(false);
		expect(p).not.toHaveProperty('canCreate');
	});

	it('нові права стара схема НЕ видає нікому', () => {
		// canManageUsers і canManageSettings стара схема не знала. Вгадувати їх
		// означало б тихо розширити доступ до керування користувачами.
		const p = normalizeProfile({
			schoolId: 'site',
			role: 'admin',
			permissions: { canCreate: true, canEdit: true, canDelete: true }
		})!.projects.site.permissions;

		expect(p.canManageUsers).toBe(false);
		expect(p.canManageSettings).toBe(false);
	});

	it('schoolId "all" не створює запису, але дає isSuperAdmin', () => {
		const profile = normalizeProfile({ schoolId: 'all', role: 'superadmin' });
		expect(profile!.projects).toEqual({});
		expect(profile!.isSuperAdmin).toBe(true);
	});

	it('старі поля не протікають у результат', () => {
		// Вони пишуться назад у Firestore при міграції — і схема, у якій лишився
		// schoolId, наступного разу знову пішла б у гілку міграції.
		const profile = normalizeProfile({ schoolId: 'site', role: 'admin', permissions: {} });
		expect(profile).not.toHaveProperty('schoolId');
		expect(profile).not.toHaveProperty('permissions');
	});

	it('НЕ мутує вхідні дані', () => {
		// Попередня версія робила `delete raw.schoolId` прямо на об'єкті, який
		// потім писався у Firestore через setDoc. Мутація вхідних даних поруч із
		// записом — це коли помилка в приведенні стає незворотною зміною в базі.
		const raw = { schoolId: 'site', role: 'admin', permissions: { canCreate: true } };
		normalizeProfile(raw);
		expect(raw.schoolId).toBe('site');
		expect(raw.permissions).toEqual({ canCreate: true });
	});

	it('наявна мапа projects головніша за старий schoolId', () => {
		// Профіль, який уже мігрували, але schoolId у ньому лишився з якоїсь
		// причини: перезаписувати справжні права старим одним записом не можна.
		const profile = normalizeProfile({
			schoolId: 'old',
			role: 'admin',
			projects: { site: { role: 'moderator', permissions: {} } }
		});
		expect(Object.keys(profile!.projects)).toEqual(['site']);
	});
});

describe('projectIdsFor', () => {
	it('віддає ключі мапи проєктів', () => {
		expect(projectIdsFor({ projects: { a: {}, b: {} } } as never)).toEqual(['a', 'b']);
	});

	it('порожня мапа — порожній масив, не undefined', () => {
		// Правила Firestore звіряються з projectIds; undefined там дає відмову
		// ПРАВИЛА, тобто повідомлення, з якого причини не видно.
		expect(projectIdsFor({ projects: {} } as never)).toEqual([]);
		expect(projectIdsFor({} as never)).toEqual([]);
	});
});
