import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { readFileSync } from 'node:fs';
import { відсутніСекрети } from './scripts/firebase-env';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

/**
 * Збірка без секретів Firebase падає ГОЛОСНО і до деплою.
 *
 * ## Навіщо явна перевірка, коли раніше обходилися без неї
 *
 * Раніше цю роль виконував ПОБІЧНИЙ ЕФЕКТ: `firebase/config` статично
 * імпортувався шапкою, тобто виконувався під час prerender, і `getAuth()` на
 * порожньому ключі кидав `auth/invalid-api-key`. Збірка червоніла — але не
 * тому, що хтось так задумав, а тому, що модуль випадково опинявся в
 * серверному графі. Це записано в `vitest/stubs/firebase-config.ts` як
 * властивість, на яку покладаються.
 *
 * Відколи SDK вантажиться `await import()` (CLOUD-DATABASE-v9 § 10.2,
 * `CDB-LAZY-SDK`), під час prerender його ніхто не піднімає — і разом із
 * побічним ефектом зникла б і перевірка. Тоді збірка проходила б зеленою, а на
 * хостинг їхав сайт із порожнім ключем: Firestore і Auth мертві для всіх, і
 * жоден гейт цього не бачить. Тому охорона стала явною й лишилася на тому
 * самому місці життєвого циклу — на початку збірки.
 *
 * Значення НЕ друкуються: у лозі CI лишаються самі назви відсутніх ключів.
 * Сам перелік і чиста функція «чого бракує» живуть у `scripts/firebase-env.ts`,
 * щоб їх можна було перевірити без збірки.
 */
function firebaseEnvGate(): Plugin {
	return {
		name: 'firebase-env-gate',
		apply: 'build',
		config(_config, { mode }) {
			const env = { ...process.env, ...loadEnv(mode, process.cwd(), 'VITE_') };
			const порожні = відсутніСекрети(env);
			if (порожні.length > 0) {
				throw new Error(
					'збірка зупинена: немає секретів Firebase — ' +
						порожні.join(', ') +
						'. Локально вони лежать у `.env.local` (зразок — `.env.example`), ' +
						'у CI приходять із `secrets`. Без них сайт збереться, ' +
						'але Firestore і Auth будуть мертві для кожного відвідувача.'
				);
			}
		}
	};
}

export default defineConfig({
	plugins: [firebaseEnvGate(), sveltekit()],

	/**
	 * Номер збірки — константою на етапі збірки, а не читанням файла в рантаймі.
	 *
	 * `static/app-version.json` уже є, але його призначення інше: `version.ts`
	 * ТЯГНЕ його по мережі, щоб порівняти з тим, що лежить у сховищі, і виявити нову
	 * збірку. Табло версії має показати номер одразу, ще до будь-якої мережі — і
	 * показати саме той, з якого зібрана сторінка, а не той, що на сервері.
	 *
	 * Обидва числа походять із `package.json`, тож розійтися вони не можуть:
	 * `app-version.json` пише `prebuild` із того самого поля.
	 */
	define: {
		__APP_VERSION__: JSON.stringify(pkg.version),
	},

	/**
	 * Sourcemap для попередньо зібраних залежностей у dev — вимкнено.
	 *
	 * `tiptap-markdown` публікує бандл, у sourcemap якого сім джерел записані
	 * абсолютними адресами `https://raw.githubusercontent.com/fb55/entities/…`
	 * з `sourcesContent: null`. DevTools іде за ними, CSP їх блокує — і на
	 * кожному відкритті редактора в консолі сім червоних рядків. Постійний шум
	 * такого штибу навчає не читати консоль, а тоді там губиться і справжня
	 * помилка.
	 *
	 * Що втрачається: покрокове налагодження ВСЕРЕДИНІ node_modules у dev.
	 * Sourcemap власного коду це не зачіпає — їх робить сам Vite при
	 * трансформації, а не оптимізатор залежностей. Повертається одним рядком.
	 *
	 * На збірку не впливає: у продакшні мап немає взагалі.
	 */
	optimizeDeps: {
		esbuildOptions: {
			sourcemap: false
		}
	},

	build: {
		rollupOptions: {
			output: {
				manualChunks: (id) => {
					if (id.includes('node_modules/svelte/')) return 'svelte';
					if (id.includes('node_modules/svelte-i18n/')) return 'i18n';
					if (id.includes('node_modules/zod/')) return 'validation';
				},
			},
		},
		minify: 'esbuild',
		cssCodeSplit: true,
		chunkSizeWarningLimit: 500,
	},
});
