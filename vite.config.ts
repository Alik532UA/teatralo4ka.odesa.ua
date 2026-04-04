import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { execSync } from 'child_process';
import matter from 'gray-matter';
import { marked } from 'marked';

export default defineConfig({
	plugins: [
		sveltekit(),
		{
			name: 'markdown-loader',
			transform(code, id) {
				if (id.endsWith('.md')) {
					const { data, content } = matter(code);
					const html = marked.parse(content);
					
					// Генерація TOC
					const headingRegex = /^(#{2,3})\s+(.+)$/gm;
					const toc = [];
					let match;
					while ((match = headingRegex.exec(content)) !== null) {
						const level = match[1].length;
						const title = match[2];
						const anchor = title.toLowerCase().replace(/[^\wа-яієїґ\s]/gi, '').replace(/\s+/g, '-');
						toc.push({ level, title, anchor });
					}

					const result = {
						metadata: data,
						html,
						markdown: content,
						toc
					};

					return {
						code: `export default ${JSON.stringify(result)};`,
						map: null
					};
				}
			}
		},
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
