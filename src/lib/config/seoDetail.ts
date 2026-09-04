// Відносний імпорт, як у `seoPages.ts` і `hiddenRoutes.ts`.
import { localeFromPath } from '../i18n/routing';

/**
 * Кілька слів для описів сторінок-деталей — і чому вони тут, а не в i18n.
 *
 * ## Чому опис збирає ЗАВАНТАЖУВАЧ
 *
 * Тільки звідти він доходить до `og:description`, тобто до прев'ю в месенджері.
 * Опис, написаний у `<svelte:head>` сторінки, у прев'ю не потрапляє ЗОВСІМ:
 * `og:` малює layout, і бере він `page.data.seoDescription` або SEO-карту.
 * Заміряно у збірці — шість сторінок розділу мали ДВІ мітки `description`
 * (свою й загальну з layout), а прев'ю всі показували опис головної сторінки.
 *
 * ## Чому слова тут, а не через `$t`
 *
 * `load` виконується ДО появи компонента, тож стор `svelte-i18n` там
 * недосяжний. Тягнути обидва словники в бандл сторінки заради п'яти слів
 * дорожче за саме дублювання — той самий висновок уже записаний у докблоці
 * `[address]/+page.ts`, який робить це першим.
 *
 * Модуль спільний, а не по копії в кожному завантажувачі: копій було б чотири
 * (група, вистава, фестиваль, працівник), і розійшлися б вони тихо — опис
 * сторінки ніхто не перечитує.
 *
 * ## Чого тут НЕМА навмисно
 *
 * Ані назв країн, ані числівників. Назви країн живуть у словниках
 * (`galaxy.country.*`), і копія тут застаріла б окремо від них. Числівники —
 * бо українська вимагає узгодження («1 вистава», «2 вистави», «5 вистав»), і
 * саме на цьому опис анкети випускника колись і зламався: 29 сторінок казали
 * «1 вистав і ролей». Опис збирається з того, що не має форми: назв, років, імен.
 */
const WORDS = {
	uk: {
		/** «випуск 2018» у групі. */
		graduation: 'випуск',
		masterOne: 'Майстер курсу',
		masterMany: 'Майстри курсу',
		/** Хвіст опису групи — те, що на сторінці є завжди. */
		groupTail: 'Склад групи, викладачі та репертуар вистав',
		/** Хвіст опису вистави. */
		playTail: 'Хто грав, у чиєму репертуарі та запис показу',
		/** Хвіст опису поїздки на фестиваль. */
		festivalTail: 'Учасники, вистави та спільні фото поїздки',
		/** Хвіст опису навчального закладу, куди вступили наші випускники. */
		institutionTail: 'Наші випускники, які тут навчаються, і роки вступу',
		/** Хвіст опису театру, у якому працюють наші випускники. */
		theatreTail: 'Наші випускники, які тут працюють, посади й роки'
	},
	en: {
		graduation: 'graduated',
		masterOne: 'Course master',
		masterMany: 'Course masters',
		groupTail: 'Roster, teachers and the repertoire of plays',
		playTail: 'Who performed, whose repertoire it belongs to and the recording',
		festivalTail: 'Participants, productions and shared photos of the trip',
		institutionTail: 'Our graduates studying here and the years they enrolled',
		theatreTail: 'Our graduates working here, their roles and years'
	}
} as const;

/**
 * Тип — із ЛІТЕРАЛІВ однієї мови, зведених до `string`.
 *
 * Без `Record<..., string>` `as const` робить кожне слово власним типом
 * («випуск» проти «graduated»), і англійський набір перестає бути сумісним з
 * українським — компілятор називає це «graduated не присвоюється до випуск».
 */
export type SeoDetailWords = Record<keyof (typeof WORDS)['uk'], string>;

/** Слова тією мовою, якою відкрито сторінку. Мова береться зі ШЛЯХУ. */
export function detailWords(pathname: string): SeoDetailWords {
	return localeFromPath(pathname) === 'en' ? WORDS.en : WORDS.uk;
}

/**
 * Збирає опис із частин, мовчки минаючи порожні.
 *
 * Частини приходять уже готовими рядками, а не значеннями: вирішувати, що
 * робити з відсутнім роком чи майстром, має той, хто про сторінку знає, — а не
 * ця склейка.
 */
export function joinDescription(parts: readonly (string | undefined | null)[]): string {
	return parts
		.map((p) => p?.trim())
		.filter((p): p is string => Boolean(p))
		.join('. ');
}
