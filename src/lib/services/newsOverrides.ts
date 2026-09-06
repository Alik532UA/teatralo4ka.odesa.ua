import { doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { storage } from './storage';
import { rethrowFriendly } from './firebaseErrors';
import { NewsOverridesSchema, parseOrUndefined } from '../schemas/settings';
import { NO_NEWS_OVERRIDES, type NewsOverrides } from '../utils/newsOverrides';
import { setDoc } from 'firebase/firestore';

/**
 * Рішення адмінки про новини, які живуть у коді: приховати або замінити.
 *
 * ## Чому окремий документ, а не поле в `settings/news`
 *
 * Та сама причина, що записана біля `hotNews`: цей документ читає КОЖНА
 * сторінка з переліком новин, а налаштування віджета новин їй не потрібні.
 * Тримати одне в одному означало б тягнути зайве.
 *
 * ## Чому окремий файл, а не `services/settings.ts`
 *
 * Той файл стоїть на своїй стелі розміру (976 із 980 рядків), і дописати сюди
 * ще один розділ означало б підняти її заради коду, який має власну
 * відповідальність. Читається він тим самим способом і тими самими правилами.
 *
 * ## Кеш
 *
 * Як і решта налаштувань: спершу віддається збережене в браузері, потім
 * оновлюється з бази. Перелік новин через це не блимає — приховане лишається
 * прихованим із першого кадру.
 */

const SITE_PROJECT_ID = import.meta.env.VITE_PROJECT_ID || 'teatralo4ka';
const КЕШ = 'newsOverrides';

/** Збережене в браузері — щоб перший кадр уже знав про приховані новини. */
export function getCachedNewsOverrides(): NewsOverrides | null {
	try {
		return storage.getJSON<NewsOverrides>(КЕШ) ?? null;
	} catch {
		/* пошкоджений кеш — читаємо з бази */
		return null;
	}
}

/**
 * Читання ПУБЛІЧНЕ: правила дозволяють `settingId == 'newsOverrides'`.
 *
 * Помилка не кидається далі: перелік новин мусить працювати й тоді, коли
 * документа немає (його ще не створювали) або база недосяжна. Порожні
 * перевизначення означають «показуємо все», а не «сайт зламався».
 */
export async function getNewsOverrides(): Promise<NewsOverrides> {
	try {
		const посилання = doc(db, 'projects', SITE_PROJECT_ID, 'settings', 'newsOverrides');
		const знімок = await getDoc(посилання);
		if (!знімок.exists()) return NO_NEWS_OVERRIDES;

		const перевірене = parseOrUndefined(NewsOverridesSchema, знімок.data());
		const дані: NewsOverrides = {
			hidden: перевірене?.hidden ?? [],
			replacedBy: перевірене?.replacedBy ?? {}
		};

		try {
			storage.setJSON(КЕШ, дані);
		} catch {
			/* квота або SSR — не критично */
		}

		return дані;
	} catch (error) {
		console.warn('Новини: перевизначення недоступні, показуємо все', error);
		return NO_NEWS_OVERRIDES;
	}
}

/** Запис — лише для адміністратора (правила: `canManageSettings`). */
export async function saveNewsOverrides(overrides: NewsOverrides): Promise<void> {
	const посилання = doc(db, 'projects', SITE_PROJECT_ID, 'settings', 'newsOverrides');
	try {
		await setDoc(посилання, { ...overrides, updatedAt: serverTimestamp() });
		try {
			storage.setJSON(КЕШ, overrides);
		} catch {
			/* квота — не критично */
		}
	} catch (error) {
		console.error('Новини: не вдалося зберегти перевизначення', error);
		rethrowFriendly(error);
	}
}
