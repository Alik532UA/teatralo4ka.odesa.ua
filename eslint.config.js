import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

/**
 * Правила зібрані за CODE-QUALITY-v8 § 6.4 та SVELTE-CORE-v8 § 6.
 *
 * Ідея не в тому, щоб увімкнути якнайбільше, а в тому, щоб анти-патерни
 * зі стандарту перестали бути текстом і стали помилкою збірки.
 */
export default ts.config(
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node }
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser,
				svelteConfig
			}
		}
	},
	{
		rules: {
			// Анти-патерни SVELTE-CORE-v8: застарілі ідіоми Svelte 4 та SvelteKit < 2.12.
			// Без цього правила заборона лишається текстом у документі.
			'no-restricted-imports': [
				'error',
				{
					paths: [
						{
							name: 'svelte/store',
							importNames: ['writable', 'readable', 'derived'],
							message: 'Svelte 5: використовуйте $state/$derived (SVELTE-CORE-v8, анти-патерни).'
						},
						{
							name: '$app/stores',
							message: 'Deprecated із SvelteKit 2.12: імпортуйте page з $app/state.'
						}
					]
				}
			],

			// SECURITY-v8 § 13
			'no-eval': 'error',
			'no-implied-eval': 'error',
			'no-new-func': 'error',
			'no-script-url': 'error',

			// DEBUGGING-v8: логування йде через errorLogger, а не console.
			// warn, а не error: у проєкті є місця, які ще не мігровані.
			'no-console': ['warn', { allow: ['warn', 'error'] }],

			// CODE-QUALITY-v8 § 1: any заборонений, але вимикати збірку на наявних
			// випадках не можна — тому warn, і список має скорочуватися.
			//
			// 31 на момент увімкнення правила, 39 на 2026-08-14. Число зросло, і
			// це рівно те, заради чого `warn` стоїть замість `off`: борг видно.
			'@typescript-eslint/no-explicit-any': 'warn',

			// CODE-QUALITY-v8 § 1: `@ts-ignore` без записаної причини. Останнє
			// правило базового набору § 6.4.1, якого тут бракувало; знахідок нуль,
			// тож одразу error.
			'@typescript-eslint/ban-ts-comment': 'error',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					// const { updatedAt, ...rest } = obj — стандартна ідіома «прибрати ключ».
					// Без цього ESLint вимагав би видалити змінну і мовчки змінив би поведінку.
					ignoreRestSiblings: true
				}
			],

			// Компіляторні a11y-попередження Svelte (ACCESSIBILITY-v8 § 10.5).
			'svelte/valid-compile': 'error',

			// I18N-v8 § 4.3, HIGH: форматування без явної локалі.
			//
			// Без аргументу метод бере локаль СИСТЕМИ, а не мову сайту. Помилка
			// невидима саме там, де її шукають: у розробника система українська,
			// сайт українською, вивід збігається. Ламається вона в англійській
			// версії на українській системі й навпаки — тобто рівно в того
			// відвідувача, який до розробника не дійде.
			//
			// Ловилося це в проєкті рівно нічим: у README пакета такий гейт
			// обіцяний, а правила не було, і `MAX_CONTENT_LEN.toLocaleString()`
			// в ArticleForm прожив до 2026-08-14.
			//
			// Селектор дивиться саме на ВІДСУТНІСТЬ аргументів: із локаллю це
			// правильний виклик, і чіпати його не треба.
			'no-restricted-syntax': [
				'error',
				{
					selector:
						"CallExpression[arguments.length=0][callee.property.name=/^toLocale(String|DateString|TimeString)$/]",
					message:
						'I18N-v8 § 4.3: передайте локаль явно — без неї береться локаль системи, а не мова сайту.'
				}
			],

			// SVELTE-CORE-v8 § 1.5. Було 8 місць у режимі warn. Два з них були
			// справжнім станом і переїхали на SvelteSet; решта шість — локальні
			// тимчасові колекції, які взагалі не мали бути реактивними, і кожна
			// має поруч записану причину. Тепер error.
			'svelte/prefer-svelte-reactivity': 'error',

			// SECURITY-v8 § 5.3. Кожен {@html} у проєкті — виняток із записаною
			// причиною і `eslint-disable-next-line` поруч. Тепер error: новий
			// {@html} без такого коментаря не пройде lint, а отже і CI.
			'svelte/no-at-html-tags': 'error',

			// SVELTE-UI-v8, HIGH. Було 60 місць у режимі warn — усі мігровані,
			// тож правило підняте до error і назад воно вже не опуститься.
			// Ціна ключа не нульова: дублікат кидає помилку в рантаймі, а не на
			// збірці. Тому ключі взято з полів, які код і так вважає унікальними
			// (id, slug, path), а не з першого-ліпшого рядка.
			'svelte/require-each-key': 'error',

			// --- Борг, що мігрується окремими комітами ---
			// Кожне з правил нижче має бути 'error'. Поки воно 'warn', бо разова
			// зміна на сотні місць непереглядна, а вимкнути її зовсім означало б
			// вдати, що проблеми немає. Кількість у коментарі — стан на момент
			// увімкнення ESLint; вона має лише зменшуватися.

			// Правила немає в стандарті v8, і спершу воно виглядало зайвим: із
			// `base: ''` шаблон `${base}/foo` дає рівно те саме, що resolve('/foo').
			// Різниця в тому, що resolve() ТИПІЗОВАНИЙ проти списку реальних
			// маршрутів проєкту, тож помилка в адресі стає помилкою компіляції.
			// Саме такий баг — '/projects/spring-Odesa-theatre' з великою «O» —
			// тримав сторінку зламаною в продакшні. Було 72 місця, лишилося 0.
			'svelte/no-navigation-without-resolve': 'error'
		}
	},
	{
		// Файли, у яких ЖОДНЕ посилання не може бути статичним, тому точкові
		// винятки на кожен рядок були б просто шумом.
		files: [
			// П'ять посилань на соцмережі, адреси беруться зі словників перекладу.
			'src/lib/components/FooterSection.svelte',
			'src/lib/components/HeroSection.svelte',
			// href приходить пропом; той, хто його передає, уже викликав resolve().
			'src/lib/components/ContentCard.svelte',
			'src/lib/components/ContentWidget.svelte',
			// Усі посилання шапки — це пункти меню з Firestore, які редагує
			// адміністратор: маршрут не відомий на збірці за визначенням.
			// Єдине статичне посилання компонента — логотип — уже на resolve().
			// Точкові коментарі тут не працюють: `eslint-disable-next-line`
			// довелося б ставити між атрибутами тега, а HTML-коментар там
			// недопустимий — перша спроба зламала компіляцію.
			'src/lib/components/HeaderSection.svelte',
			// Результати пошуку: адресу кожного вже склав `services/searchIndex`,
			// і склав саме через resolve() із літералом маршруту. Тут вона приходить
			// полем об'єкта (`hit.href`), а такого правило не відстежує в принципі —
			// воно приймає лише прямий виклик resolve() або змінну, у чиєму
			// оголошенні цей виклик стоїть.
			'src/lib/components/SearchOverlay.svelte'
		],
		rules: {
			'svelte/no-navigation-without-resolve': 'off'
		}
	},
	{
		// Згенероване, зібране й службове — не наш код.
		ignores: [
			'build/',
			'.svelte-kit/',
			'node_modules/',
			'static/',
			'dist/',
			'firebase/',
			'design-source/',
			'.private/',
			'.temp/',
			'security-audit/',
			// Одноразовий міграційний скрипт, залишений як історія правки.
			'scripts/update_settings_ui.cjs'
		]
	}
);
