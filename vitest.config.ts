import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
	// Без цього плагіна руни в `.svelte.ts` не компілювалися, і жоден із
	// контролерів не міг мати ані тесту. Це був не «ще не написали тести», а
	// «написати їх було нічим»: `$state` у класі — синтаксис, який без компіляції
	// падає на етапі розбору. Наслідком п'ять контролерів, тобто ВЕСЬ стан
	// застосунку, лежали поза перевірками, а в PROJECT-CONTEXT це роками стояло
	// як «середовище компонентних тестів ще не обрано».
	//
	// `svelte()`, а НЕ `sveltekit()`. Другий сам додає власні аліаси для `$app/*`
	// і `$lib`, і вони перекрили б заглушки нижче — зокрема підміну
	// `firebase/config`, без якої тести падають з `auth/invalid-api-key` у CI,
	// де секретів немає. Той плагін ще й вимагає повного середовища SvelteKit,
	// якого юніт-тестам не потрібно.
	plugins: [svelte({ hot: false })],
	test: {
		globals: true,
		environment: 'jsdom',
		// `vitest/support` теж: там живе розв'язувач токенів, на який
		// спирається перевірка контрасту, і він має власні тести.
		include: ['src/**/*.{test,spec}.ts', 'vitest/support/**/*.test.ts'],
		// Доповнює jsdom тим, чого в ньому немає (`matchMedia`). Без цього
		// контролери не можна навіть імпортувати — подробиці у самому файлі.
		setupFiles: ['./vitest/support/setup.ts'],
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
