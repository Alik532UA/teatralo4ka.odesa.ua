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

			// CODE-QUALITY-v8 § 1: any заборонений, але вимикати збірку на 31 наявному
			// випадку не можна — тому warn, і список має скорочуватися.
			'@typescript-eslint/no-explicit-any': 'warn',
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

			// 8 місць. Звичайний Map/Set у $state не сповіщає про set/delete —
			// потрібні SvelteMap/SvelteSet (SVELTE-CORE-v8 § 1.5).
			'svelte/prefer-svelte-reactivity': 'warn',

			// 4 місця. Кожен {@html} має бути або санітизованим, або підпадати
			// під виняток SECURITY-v8 § 5.3 із записаною причиною.
			'svelte/no-at-html-tags': 'warn',

			// 72 місця. Правило плагіна, якого немає в стандарті: воно вимагає
			// resolve() для внутрішніх посилань замість ручного base. Питання
			// відкрите — спершу треба вирішити, чи це канон проєкту.
			'svelte/no-navigation-without-resolve': 'warn'
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
