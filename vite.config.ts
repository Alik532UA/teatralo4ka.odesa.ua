import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { execSync } from 'child_process';

export default defineConfig({
	plugins: [
		sveltekit(),
		{
			name: 'smart-static-build-tools',
			apply: 'build',
			buildStart() {
				console.log('🔍 Running content validation...');
				try {
					execSync('npm run validate-content', { stdio: 'inherit' });
				} catch {
					console.error('❌ Build stopped due to invalid content');
					process.exit(1);
				}
			},
			closeBundle() {
				console.log('🗺️ Generating SEO artifacts...');
				try {
					execSync('npm run generate-sitemap', { stdio: 'inherit' });
					execSync('npm run generate-changelog', { stdio: 'inherit' });
				} catch {
					console.warn('⚠️ SEO generation failed, check scripts');
				}
			}
		}
	],

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
