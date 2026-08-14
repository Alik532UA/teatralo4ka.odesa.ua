import type { ProjectAccess, UserProfile } from '../controllers/auth.svelte';

/**
 * Приведення профілю з Firestore до поточної схеми — чистою функцією.
 *
 * ## Чому це окремий модуль
 *
 * Уся ця логіка жила в тілі `onAuthStateChanged` у конструкторі контролера.
 * Разом із нею там жили чотири звернення до мережі, зокрема `deleteDoc` —
 * тобто найризикованіший код проєкту (аутентифікація плюс міграція даних із
 * видаленням документа) не мав жодного тесту й не міг мати: конструктор
 * запускається самим імпортом і одразу тягне Firebase.
 *
 * Тепер у контролері лишився ввід-вивід, а РІШЕННЯ живуть тут і перевіряються.
 *
 * ## Що саме приводиться
 *
 * Стара схема тримала один `schoolId` і плаский `permissions`. Нова — мапу
 * `projects` з окремими правами на кожен проєкт. Профілі старої форми ще
 * лежать у базі, тож читання мусить розуміти обидві.
 */

/** Дозволи «нічого не можна» — база, до якої додаються знайдені права. */
function noPermissions(): ProjectAccess['permissions'] {
	return {
		canCreateArticles: false,
		canEditArticles: false,
		canDeleteArticles: false,
		canCreatePages: false,
		canEditPages: false,
		canDeletePages: false,
		canManageUsers: false,
		canManageSettings: false
	};
}

/**
 * Плаский `permissions` старої схеми → роздільні права нової.
 *
 * **Тут був справжній дефект.** Попередній код при міграції підставляв
 * `{ canCreate: true, canEdit: false, canDelete: false }` — ключі, яких у
 * `ProjectAccess['permissions']` немає взагалі. Жодна перевірка прав таких імен
 * не читає, тож користувач після міграції отримував об'єкт, який виглядає як
 * дозволи і не є ними: усі справжні прапорці лишалися `undefined`.
 *
 * Помітити це оком майже неможливо — TypeScript не бачив розходження, бо
 * профіль ішов через `any`. Виправлення навмисно консервативне: старе
 * `canCreate` розкривається у створення статей І сторінок, бо саме це воно й
 * означало, коли розділу на два типи вмісту ще не було. Нові права
 * (`canManageUsers`, `canManageSettings`) не видаються НІКОМУ — стара схема про
 * них не знала, і вгадувати тут означало б тихо розширити доступ.
 */
function expandLegacyPermissions(legacy: Record<string, unknown> | undefined): ProjectAccess['permissions'] {
	const permissions = noPermissions();
	if (!legacy) {
		// Профіль старої схеми без блоку прав: раніше тут стояло
		// `canCreate: true`. Зберігаємо цей намір — не більше.
		permissions.canCreateArticles = true;
		permissions.canCreatePages = true;
		return permissions;
	}

	if (legacy.canCreate === true) {
		permissions.canCreateArticles = true;
		permissions.canCreatePages = true;
	}
	if (legacy.canEdit === true) {
		permissions.canEditArticles = true;
		permissions.canEditPages = true;
	}
	if (legacy.canDelete === true) {
		permissions.canDeleteArticles = true;
		permissions.canDeletePages = true;
	}
	return permissions;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

/**
 * Приводить сирі дані профілю до `UserProfile`.
 *
 * Повертає `null`, якщо даних немає — виклик тоді знає, що профілю не існує, і
 * не мусить розрізняти «немає» від «порожній».
 *
 * Не мутує вхід: попередня версія робила `delete raw.schoolId` прямо на
 * об'єкті, який потім писався назад у Firestore. Мутація вхідних даних у коді,
 * що поруч викликає `setDoc`, — це той випадок, коли помилка в приведенні стає
 * незворотною зміною в базі.
 */
export function normalizeProfile(raw: unknown): UserProfile | null {
	if (!isRecord(raw)) return null;

	const { schoolId, permissions: legacyPermissions, projects, role, ...rest } = raw;

	const normalizedProjects: Record<string, ProjectAccess> = isRecord(projects)
		? ({ ...projects } as Record<string, ProjectAccess>)
		: {};

	const profile: UserProfile = {
		...(rest as Omit<UserProfile, 'projects' | 'role'>),
		projects: normalizedProjects
	};

	if (typeof role === 'string') {
		profile.role = role as UserProfile['role'];
	}

	// Стара схема: один `schoolId` замість мапи проєктів.
	if (typeof schoolId === 'string' && !isRecord(projects)) {
		// `all` означало «доступ до всього» — окремого запису в мапі для цього
		// немає, роль супер-адміністратора нижче покриває його цілком.
		if (schoolId !== 'all' && typeof role === 'string') {
			profile.projects[schoolId] = {
				role: role as ProjectAccess['role'],
				permissions: expandLegacyPermissions(
					isRecord(legacyPermissions) ? legacyPermissions : undefined
				)
			};
		}
		if (role === 'superadmin') {
			profile.isSuperAdmin = true;
		}
	}

	return profile;
}

/**
 * Перелік проєктів для правил Firestore.
 *
 * Правила звіряються саме з `projectIds`, і профіль, створений до появи мапи
 * `projects`, цього поля не має — без нього запис при міграції відхиляється
 * правилом, а не помилкою коду. Тому поле обчислюється перед записом.
 */
export function projectIdsFor(profile: UserProfile): string[] {
	return Object.keys(profile.projects ?? {});
}
