import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default defineConfig({
	plugins: [sveltekit()],

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
					/*
					 * SDK бази — ОДНИМ чанком, і це не косметика розкладки.
					 *
					 * Відколи публічні сторінки беруть його `await import()`, а сторінки
					 * адмінки — звичайним імпортом, Rollup побачив два різні шляхи до
					 * того самого пакета й зробив дві копії: заміряно 2026-09-10, увесь
					 * клієнтський JS 723 → 753 КБ, тобто +30 КБ дублювання рівно там, де
					 * ми щойно виграли 95 КБ на критичному шляху. Явний чанк лишає одну
					 * копію; на те, що головна її не тягне, це не впливає — вона
					 * приходить динамічним імпортом і після першого кадру.
					 */
					if (id.includes('node_modules/@firebase/') || id.includes('node_modules/firebase/'))
						return 'firebase';
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
