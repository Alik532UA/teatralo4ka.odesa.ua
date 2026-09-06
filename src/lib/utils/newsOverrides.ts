/**
 * Що адмінка може сказати про новину, яка живе В КОДІ.
 *
 * ## Навіщо це взагалі
 *
 * Новина з коду незмінна з адмінки — файл лежить у репозиторії. Але авторові
 * потрібні дві дії, які коміту не вартують: ПРИХОВАТИ новину («тимчасова,
 * прибери») і ЗАМІНИТИ її свіжою версією, написаною в адмінці. Обидві мусять
 * діяти негайно, а не після збірки.
 *
 * Тому рішення живе не в коді, а в одному документі налаштувань
 * (`settings/newsOverrides`), який сайт і так читає разом із рештою
 * налаштувань — тобто нового класу витрат не з'являється.
 *
 * ## Дві дії, і різниця між ними
 *
 * - `hidden` — ключ новини з коду, якої немає в переліках. Сторінка лишається
 *   доступною прямим посиланням: так само поводиться `status: "draft"` у
 *   markdown, і ламати цю симетрію без причини не варто.
 * - `replacedBy` — ключ новини з коду → `id` статті в базі, яка стала її новою
 *   версією. У переліках новина з коду зникає (замість неї стоїть стаття з
 *   бази), а на власній сторінці показується нова версія.
 *
 * ## Чого цей механізм НЕ вміє
 *
 * Змінити те, що вже зібрано в HTML. Сторінка новини з коду пререндерена, тож
 * перший кадр і прев'ю в месенджері покажуть СТАРИЙ текст, аж поки не буде
 * наступної збірки. Автор про це знає й погодився («показувати нову версію
 * після гідратації, а в адмінці написати прямо»), і саме тому адмінка мусить
 * казати це словами, а не мовчати.
 */

export interface NewsOverrides {
	/** Ключі новин із коду, прихованих із переліків. */
	hidden: string[];
	/** Ключ новини з коду → `id` статті в базі, яка її заміняє. */
	replacedBy: Record<string, string>;
}

export const NO_NEWS_OVERRIDES: NewsOverrides = { hidden: [], replacedBy: {} };

/**
 * Ключі новин із коду, яких НЕ показуємо в переліках.
 *
 * Замінені сюди теж входять: у переліку замість них стоїть стаття з бази, і
 * показувати обидві означало б одну новину двічі.
 */
export function hiddenCodeNews(overrides: NewsOverrides | null): Set<string> {
	if (!overrides) return new Set();
	return new Set([...overrides.hidden, ...Object.keys(overrides.replacedBy)]);
}

/** `id` статті в базі, яка заміняє цю новину з коду, або `undefined`. */
export function replacementFor(
	overrides: NewsOverrides | null,
	codeNewsId: string
): string | undefined {
	return overrides?.replacedBy[codeNewsId];
}

/**
 * Три перетворення нижче — ЄДИНИЙ спосіб змінити перевизначення.
 *
 * Кожне повертає новий об'єкт, а не править наявний. Причина не в моді на
 * незмінність: той самий об'єкт лежить у стані сторінки й у кеші браузера, і
 * правка на місці означала б, що перелік уже перемалювався, а запис у базу ще
 * не відбувся — а він може й не відбутися. Новий об'єкт дає просте правило:
 * підмінити стан лише після того, як база відповіла.
 */

/** Приховати новину з коду або повернути її в переліки. */
export function withHidden(
	overrides: NewsOverrides | null,
	codeNewsId: string,
	hidden: boolean
): NewsOverrides {
	const було = overrides ?? NO_NEWS_OVERRIDES;
	const без = було.hidden.filter((id) => id !== codeNewsId);
	return { hidden: hidden ? [...без, codeNewsId] : без, replacedBy: { ...було.replacedBy } };
}

/**
 * Записати, що новину з коду замінила стаття з бази.
 *
 * З `hidden` ключ при цьому ЗНИМАЄТЬСЯ: заміна вже ховає новину з переліків
 * (див. `hiddenCodeNews`), і залишений слід у `hidden` зробив би так, що
 * скасування заміни нічого не повернуло б.
 */
export function withReplacement(
	overrides: NewsOverrides | null,
	codeNewsId: string,
	articleId: string
): NewsOverrides {
	const було = overrides ?? NO_NEWS_OVERRIDES;
	return {
		hidden: було.hidden.filter((id) => id !== codeNewsId),
		replacedBy: { ...було.replacedBy, [codeNewsId]: articleId }
	};
}

/** Зняти будь-яке перевизначення — новина з коду знову така, як у репозиторії. */
export function withoutOverride(
	overrides: NewsOverrides | null,
	codeNewsId: string
): NewsOverrides {
	const було = overrides ?? NO_NEWS_OVERRIDES;
	const replacedBy = { ...було.replacedBy };
	delete replacedBy[codeNewsId];
	return { hidden: було.hidden.filter((id) => id !== codeNewsId), replacedBy };
}
