import type { StoredArticle } from '$lib/services/articles';
import { getDisplayDate, timestampToISO } from './articleDate';

/**
 * ОДИН файл із відібраними новинами — щоб віддати його AI-агенту на переклад у код.
 *
 * ## Звідки взялася вимога
 *
 * Дослівно: «коли у мене накопилися новини, то я виділяю новини які є в
 * firebase і зберігаю на комп'ютер, і віддаю AI агенту щоб він зробив ці новини
 * в коді». І окремо: «варто все підготувати щоб на prod я міг зберегти новини і
 * відправити в цей чат ОДНИМ ФАЙЛОМ, а не кожний окремо зберігати».
 *
 * Тобто файл тут не «експорт про всяк випадок», а вхідні дані конвертера. Через
 * це в ньому лежить те, чого немає в чернетці редактора: `id` статті (за ним
 * новина в коді потім заявляє `replacesArticleId`), дата у придатному для
 * машини вигляді і повні адреси зображень.
 *
 * ## Чому дата ще й окремим полем `dateISO`
 *
 * Знімки конвертер кладе в `static/news/<дата>/`, а дата статті буває у трьох
 * режимах (`createdAt`, `customDate`, прихована). Розбирати ці режими вдруге на
 * тому боці означало б завести другу копію правила — того самого
 * `getDisplayDate`. Тому дата рахується ТУТ, один раз, і їде готовою.
 *
 * ## Чого файл НЕ робить
 *
 * Не чіпає базу. Відбір і збереження на диск — дія читача; приховувати чи
 * видаляти вихідну статтю автор вирішує сам і потім («а потім я видаляю чи
 * приховую новину яка була на firebase»). Автоматичного переїзду немає й у
 * dev — про це сказано прямо: «в dev версії ми не робимо автоматичний переїзд,
 * бо мені тут треба тестувати з різних джерел».
 */

/** Позначка формату: конвертер має відрізнити цей файл від чернетки редактора. */
export const NEWS_EXPORT_KIND = 'teatralo4ka-news-batch';
export const NEWS_EXPORT_VERSION = 1;

export interface NewsExportItem {
	id: string;
	slug?: string;
	type?: string;
	category: string;
	/** Хто підписаний під статтею — у markdown це поле `author`. */
	author: string;
	dateMode: string;
	/** Дата показу в ISO — те, з чого конвертер робить теку `static/news/<дата>/`. */
	dateISO: string | null;
	sortOrder?: number;
	mediaShape?: string;
	mediaLayout?: string;
	translations: StoredArticle['translations'];
}

export interface NewsExportFile {
	kind: typeof NEWS_EXPORT_KIND;
	version: typeof NEWS_EXPORT_VERSION;
	exportedAt: string;
	count: number;
	items: NewsExportItem[];
}

/**
 * Дата показу в ISO — те, з чого конвертер робить теку `static/news/<дата>/`.
 *
 * Правило вибору поля тут НЕ переписується: воно одне на проєкт і живе в
 * `utils/articleDate`. Копію було почато писати саме на цьому місці — щоб не
 * тягнути в чистий модуль службу з Firestore, — і саме тому правило звідти
 * виїхало в утиліту.
 */
function датаПоказу(стаття: StoredArticle): string | null {
	return timestampToISO(getDisplayDate(стаття));
}

export function buildNewsExport(articles: readonly StoredArticle[], now: Date): NewsExportFile {
	const items = [...articles]
		/* Найстаріші перші: конвертер дописує новини в реєстр по черзі, і так
		   порядок у файлі збігається з порядком, у якому вони там опиняться. */
		.sort((a, b) => (датаПоказу(a) ?? '').localeCompare(датаПоказу(b) ?? ''))
		.map((стаття) => ({
			id: стаття.id,
			...(стаття.slug ? { slug: стаття.slug } : {}),
			...(стаття.type ? { type: стаття.type } : {}),
			category: стаття.category,
			author: стаття.author ?? '',
			dateMode: стаття.dateMode,
			dateISO: датаПоказу(стаття),
			...(стаття.sortOrder !== undefined ? { sortOrder: стаття.sortOrder } : {}),
			...(стаття.mediaShape ? { mediaShape: стаття.mediaShape } : {}),
			...(стаття.mediaLayout ? { mediaLayout: стаття.mediaLayout } : {}),
			translations: стаття.translations
		}));

	return {
		kind: NEWS_EXPORT_KIND,
		version: NEWS_EXPORT_VERSION,
		exportedAt: now.toISOString(),
		count: items.length,
		items
	};
}

/** Ім'я файла з датою: у теці завантажень їх назбирується кілька. */
export function newsExportFileName(now: Date, count: number): string {
	const день = now.toISOString().slice(0, 10);
	return `news-batch-${день}-${count}.json`;
}
