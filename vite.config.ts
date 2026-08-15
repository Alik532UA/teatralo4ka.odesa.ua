import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

/**
 * Тут був плагін `smart-static-build-tools`, який робив те саме, що вже роблять
 * `prebuild` і `postbuild` — і робив це гірше.
 *
 * `closeBundle` кликав `generate-sitemap` у `try`, а `catch` знижував падіння до
 * `console.warn`. Але `generate-sitemap.ts` — це не генератор, а ГЕЙТ: він валить
 * збірку на адресі з `prerender.entries`, якої немає в `build/`, і на сторінці
 * без вмісту (SEO-v8 CRITICAL). Загорнутий у цей `catch`, він друкував
 * попередження й лишав `vite build` із кодом 0 — рівно те, від чого застерігає
 * коментар у `svelte.config.js` про `handleHttpError: 'fail'`: «попередження в
 * лозі збірки не бачить ніхто».
 *
 * Гейт працював лише тому, що `postbuild` запускав той самий скрипт удруге, вже
 * поза `catch`. Тобто перевірка трималася на дублюванні, а не на задумі:
 * `validate-content` виконувався двічі (`prebuild` + `buildStart`), sitemap —
 * двічі (`closeBundle` + `postbuild`).
 *
 * Тепер кожен крок має рівно одне місце, і кожен із них падає:
 *   prebuild  → validate-content
 *   postbuild → generate-sitemap, check-bundle-budget, check-links, changelog
 */
export default defineConfig({
	plugins: [sveltekit()],

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
