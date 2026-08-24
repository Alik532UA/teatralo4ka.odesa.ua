/**
 * Пороги Lighthouse.
 *
 * ## Чому SEO перевіряється НЕ на всіх адресах
 *
 * `staticDistDir` знаходить сторінки сам, і серед них є `/admin/` та
 * `/admin/login/`. Ці сторінки навмисно закриті від індексації — у
 * `static/robots.txt` стоїть `Disallow: /admin/`, і так має бути: панель
 * керування в пошуку не потрібна нікому.
 *
 * Аудит `is-crawlable` бачить саме це й ставить нуль, тягнучи категорію SEO до
 * 0.69 проти порога 0.9. Тобто гейт вимагав зробити адмінку індексованою: він
 * позеленів би ЛИШЕ від справжньої регресії — знятого `Disallow`. Заміряно на
 * прогоні `d98e8ff`: обидві адреси 0.69, і єдина причина — `is-crawlable`.
 *
 * Такий гейт гірший за відсутній: він тисне в бік помилки. Тому SEO
 * стверджується лише там, де індексація потрібна.
 *
 * Доступність і найкращі практики на адмінці лишаються під порогом: це живий
 * інтерфейс, яким користуються, і до пошуку він відношення не має.
 */

/** Те, що вимагається від КОЖНОЇ сторінки. */
const EVERY_PAGE = {
	'categories:performance': ['warn', { minScore: 0.8 }],
	'categories:accessibility': ['error', { minScore: 0.95 }],
	'categories:best-practices': ['error', { minScore: 0.9 }]
};

/**
 * Адмінка — будь-яка адреса з сегментом `admin`.
 *
 * Дужка `(/|$)` обов'язкова: без неї шаблон збігся б і з умовною
 * `/administration-news/`, тобто мовчки зняв би перевірку SEO зі звичайної
 * сторінки. Патерни взаємно виключні — LHCI застосовує КОЖЕН, чий шаблон
 * підійшов, тож перекриття дало б дві різні вимоги до тієї самої адреси.
 */
const ADMIN = '/admin(/|$)';

module.exports = {
	ci: {
		collect: {
			staticDistDir: './build',
			maxAutodiscoverIsolate: 1
		},
		assert: {
			assertMatrix: [
				{
					matchingUrlPattern: ADMIN,
					assertions: { ...EVERY_PAGE }
				},
				{
					matchingUrlPattern: `^(?!.*${ADMIN}).*$`,
					assertions: {
						...EVERY_PAGE,
						'categories:seo': ['error', { minScore: 0.9 }]
					}
				}
			]
		},
		upload: {
			target: 'temporary-public-storage'
		}
	}
};
