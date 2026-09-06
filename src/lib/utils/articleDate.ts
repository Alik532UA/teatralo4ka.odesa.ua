import type { Timestamp } from 'firebase/firestore';

/**
 * Дата, яку стаття ПОКАЗУЄ, — одне правило на весь проєкт.
 *
 * ## Чому це переїхало зі служби в утиліту
 *
 * Правило чисте: воно лише вибирає одне з трьох полів за режимом. Але жило воно
 * в `services/articles.ts`, а той модуль на першому ж рядку піднімає Firestore
 * (`firebase/config` викликає `initializeApp` просто при імпорті). Через це
 * будь-що, кому потрібна була сама лише дата, тягло за собою всю базу — і в
 * перевірках без браузера це або падало, або вимагало підробленого оточення.
 *
 * Саме тут і починаються другі копії правила: простіше переписати чотири рядки
 * `switch`, ніж тягнути Firestore. Копію вже було почато писати в експорті
 * новин — і зупинено на цьому місці.
 *
 * `services/articles.ts` віддає цю ж функцію далі, тож жоден із наявних
 * викликачів не змінився.
 *
 * ## Чому тип параметра описаний тут, а не взятий з `Article`
 *
 * Щоб залежність лишилася в один бік. `Article` описує ще й переклади, медіа й
 * автора — нічого з цього для дати не потрібно, а посилання на нього повернуло
 * б сюди службу, від якої тут і відв'язуються.
 */

export interface ArticleDates {
	dateMode: 'createdAt' | 'updatedAt' | 'custom' | 'hidden';
	createdAt?: unknown;
	updatedAt?: unknown;
	customDate?: unknown;
}

export function getDisplayDate(article: ArticleDates): Timestamp | null {
	switch (article.dateMode) {
		case 'createdAt':
			return (article.createdAt as Timestamp) ?? null;
		case 'updatedAt':
			return (article.updatedAt as Timestamp) ?? null;
		case 'custom':
			return (article.customDate as Timestamp) ?? null;
		case 'hidden':
			return null;
		default:
			return (article.createdAt as Timestamp) ?? null;
	}
}

/**
 * Мітка часу Firestore → ISO, або `null`.
 *
 * `serverTimestamp()` до запису — це `FieldValue`, а не `Timestamp`: у нього
 * немає `toDate`, і саме на ньому падало б наївне приведення типу. Тому
 * перевіряється наявність методу, а не тип.
 */
export function timestampToISO(значення: unknown): string | null {
	const мітка = значення as { toDate?: () => Date } | null | undefined;
	if (!мітка || typeof мітка.toDate !== 'function') return null;
	const дата = мітка.toDate();
	return Number.isNaN(дата.getTime()) ? null : дата.toISOString();
}
