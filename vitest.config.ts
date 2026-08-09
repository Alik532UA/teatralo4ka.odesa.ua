import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
	test: {
		globals: true,
		environment: 'jsdom',
		include: ['src/**/*.{test,spec}.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: ['node_modules/', 'build/', '.svelte-kit/', 'static/', 'vitest/']
		}
	},
	resolve: {
		alias: {
			$lib: path.resolve(__dirname, './src/lib'),
			// Модулі `$app/*` створює плагін SvelteKit під час збірки — у vitest їх
			// немає, і імпорт падає ще на резолві. Заглушки відтворюють поведінку
			// саме цього проєкту (зокрема `base: ''`); подробиці — у самих файлах.
			'$app/paths': path.resolve(__dirname, './vitest/stubs/app-paths.ts'),
			'$app/environment': path.resolve(__dirname, './vitest/stubs/app-environment.ts')
		}
	}
});
