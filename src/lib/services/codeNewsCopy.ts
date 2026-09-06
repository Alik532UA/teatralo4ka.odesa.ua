import { Timestamp } from 'firebase/firestore';
import { asset } from '$app/paths';
import { addArticle } from './admin-articles';
import { saveNewsOverrides } from './newsOverrides';
import { codeNewsById } from '$lib/config/codeNews';
import { loadPageMarkdown } from '$lib/i18n/loader';
import { withReplacement, type NewsOverrides } from '$lib/utils/newsOverrides';
import type { ArticleMediaItem } from '$lib/utils/articleMedia';
import type { ArticleTranslation } from './articles';

/**
 * Копія новини з КОДУ в базу — щоб її можна було виправити з адмінки.
 *
 * ## Навіщо
 *
 * Автор описав це так: «якщо текст новини що була кодом змінюється в адмінці,
 * тоді ховаємо оригінал що був в коді, показуємо нову версію яку зробили і її
 * тримаємо в firebase». Текст новини лежить у репозиторії, і правити його з
 * адмінки не можна — можна зробити копію, правити її, а оригінал приховати.
 *
 * ## Що саме копіюється
 *
 * Обидві мови, сирий markdown (а не готовий HTML: у редактор має лягти те, що
 * автор писав), увесь перелік медіа з реєстру і пропорція з розкладкою.
 * Дата — з frontmatter, у режимі `custom`: це заявлена дата ПОДІЇ, і `createdAt`
 * замінив би її на «коли натиснули кнопку».
 *
 * ## Чому одразу й перевизначення
 *
 * Копія без запису `replacedBy` дала б у переліку ДВІ однакові новини — стару з
 * коду й свіжу з бази. Тому копіювання і заміна — одна дія: спершу стаття,
 * потім запис. Зворотний порядок був би гіршим: заміна на ще неіснуючий `id`
 * прибрала б новину з переліків, а показати замість неї не було б чого.
 *
 * ## Межа, про яку адмінка каже словами
 *
 * Сторінка новини з коду зібрана заздалегідь, тож за прямим посиланням
 * («поділилися в месенджері») ще деякий час віддаватиметься СТАРИЙ текст —
 * доти, доки не буде наступної збірки. Розбір — у `utils/newsOverrides`.
 */

/** Знімки лежать у `static/`, тож їм потрібен базовий шлях; посилання на запис — ні. */
function зАдресами(media: readonly ArticleMediaItem[]): ArticleMediaItem[] {
	return media.map((елемент) =>
		елемент.kind === 'photo'
			? { ...елемент, url: asset(елемент.url as `/${string}`) }
			: { ...елемент }
	);
}

function переклад(lang: 'uk' | 'en', slug: string, media: ArticleMediaItem[]): ArticleTranslation {
	const джерело = loadPageMarkdown(lang, slug);
	if (!джерело) return { title: '', content: '', isPublished: false };

	const знімок = media.find((m) => m.kind === 'photo');
	const запис = media.find((m) => m.kind === 'video');

	return {
		title: джерело.metadata.title,
		content: джерело.markdown,
		contentFormat: 'markdown',
		excerpt: джерело.metadata.excerpt ?? джерело.metadata.seo.description,
		isPublished: джерело.metadata.status === 'published',
		media,
		/* Старі поля — теж: перелік новин і прев'ю в месенджері читають саме їх,
		   коли `media` порожній, і копія має виглядати так само, як оригінал. */
		...(знімок ? { coverUrl: знімок.url } : {}),
		...(запис ? { videoUrl: запис.url } : {})
	};
}

export interface CodeNewsCopyResult {
	/** `id` створеної статті — за ним адмінка одразу відкриває редактор. */
	articleId: string;
	/** Перевизначення ПІСЛЯ запису: сторінка підміняє свій стан лише цим. */
	overrides: NewsOverrides;
}

export async function copyCodeNewsToDatabase(
	codeNewsId: string,
	overrides: NewsOverrides | null
): Promise<CodeNewsCopyResult> {
	const новина = codeNewsById(codeNewsId);
	if (!новина) throw new Error(`Новини «${codeNewsId}» немає в реєстрі коду`);

	const media = зАдресами(новина.media);
	const uk = переклад('uk', новина.slug, media);
	const en = переклад('en', новина.slug, media);

	const дата = loadPageMarkdown('uk', новина.slug)?.metadata.date;
	const мітка = дата ? new Date(дата) : null;

	const посилання = await addArticle({
		category: 'news',
		slug: '',
		type: 'article',
		author: '',
		dateMode: мітка && !Number.isNaN(мітка.getTime()) ? 'custom' : 'createdAt',
		customDate: мітка && !Number.isNaN(мітка.getTime()) ? Timestamp.fromDate(мітка) : null,
		...(новина.mediaShape ? { mediaShape: новина.mediaShape } : {}),
		...(новина.mediaLayout ? { mediaLayout: новина.mediaLayout } : {}),
		translations: { uk, en }
	});

	const нові = withReplacement(overrides, codeNewsId, посилання.id);
	await saveNewsOverrides(нові);

	return { articleId: посилання.id, overrides: нові };
}
