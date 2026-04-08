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
				} catch (e) {
					console.error('❌ Build stopped due to invalid content');
					process.exit(1);
				}
			},
			closeBundle() {
				console.log('🗺️ Generating SEO artifacts...');
				try {
					execSync('npm run generate-sitemap', { stdio: 'inherit' });
					execSync('npm run generate-changelog', { stdio: 'inherit' });
				} catch (e) {
					console.warn('⚠️ SEO generation failed, check scripts');
				}
			}
		}
	],

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
