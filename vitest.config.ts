import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
	test: {
		globals: true,
		environment: 'jsdom',
		// `vitest/support` теж: там живе розв'язувач токенів, на який
		// спирається перевірка контрасту, і він має власні тести.
		include: ['src/**/*.{test,spec}.ts', 'vitest/support/**/*.test.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: ['node_modules/', 'build/', '.svelte-kit/', 'static/', 'vitest/']
		}
	},
	resolve: {
		// Масив, а не об'єкт: порядок записів значущий. Запис для firebase/config
		// мусить стояти ПЕРЕД `$lib`, інакше `$lib/firebase/config` збіжиться з
		// префіксом `$lib` раніше й заглушка ніколи не спрацює.
		alias: [
			{
				// Regex, а не рядок: модуль імпортують двома написаннями —
				// `$lib/firebase/config` у маршрутах і ВІДНОСНИМ `../firebase/config`
				// у сервісах. Рядковий alias зіставляється з написаним у імпорті, тож
				// відносну форму він не впіймав би ніколи; ловимо обидві за хвостом.
				//
				// Навіщо взагалі: справжній config.ts ініціалізує Firebase самим
				// імпортом, і юніт-тести без секретів (CI) падали з
				// auth/invalid-api-key. Подробиці й чому НЕ фолбеки в самому
				// config.ts — у заглушці.
				// `^.*` не декоративний: alias підставляє заміну замість ЗБІГЛОЇ частини
			// специфікатора, тож без нього від `../firebase/config` лишався хвіст
			// `..` перед абсолютним шляхом — і резолв падав уже на заглушці.
			find: /^.*\/firebase\/config$/,
				replacement: path.resolve(__dirname, './vitest/stubs/firebase-config.ts')
			},
			// Модулі `$app/*` створює плагін SvelteKit під час збірки — у vitest їх
			// немає, і імпорт падає ще на резолві. Заглушки відтворюють поведінку
			// саме цього проєкту (зокрема `base: ''`); подробиці — у самих файлах.
			{ find: '$app/paths', replacement: path.resolve(__dirname, './vitest/stubs/app-paths.ts') },
			{
				find: '$app/environment',
				replacement: path.resolve(__dirname, './vitest/stubs/app-environment.ts')
			},
			{ find: '$lib', replacement: path.resolve(__dirname, './src/lib') }
		]
	}
});
