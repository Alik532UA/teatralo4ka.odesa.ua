import { defineConfig, devices } from '@playwright/test';

/**
 * E2E над ЗІБРАНИМ сайтом, а не над dev-сервером.
 *
 * Причина конкретна: dev-сервер не застосовує CSP, не робить prerender і не
 * мінімізує. Кожен серйозний дефект, знайдений у цьому проєкті за останній
 * час — відносний `base` у JSON-LD, 23 адреси sitemap із 404, заблоковані
 * інлайн-скрипти — був невидимий у коді й у dev, і помітний лише в `build/`.
 *
 * Порт 5195, а не типовий: сусідні проєкти екосистеми тримають dev-сервери на
 * 5173 і 5196–5199. Тести, що мовчки під'єдналися до чужого сервера, вже
 * траплялися — вони проходили, перевіряючи інший сайт. Тому ще й `strictPort`
 * (падати, а не шукати вільний) плюс перевірка тотожності в `smoke.spec.ts`.
 */
const PORT = 5195;

export default defineConfig({
	testDir: 'e2e',
	fullyParallel: true,
	// Забутий `test.only` у CI мовчки скорочує прогін до одного тесту.
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],

	use: {
		baseURL: `http://localhost:${PORT}`,
		trace: 'on-first-retry',
		screenshot: 'only-on-failure'
	},

	/**
	 * Мова задається явно, бо сайт визначає її за `Accept-Language`. Типовий
	 * для Playwright `en-US` давав англійський інтерфейс, і перша версія тестів
	 * падала на заголовку «Odesa Theatre School» — не тому, що щось зламано.
	 *
	 * Заразом це безкоштовне покриття другої мови: desktop ходить українською
	 * (основна аудиторія), mobile — англійською. Обидві розкладки проходять
	 * повний набір, окремого прогону не потрібно.
	 */
	projects: [
		{ name: 'chromium', use: { ...devices['Desktop Chrome'], locale: 'uk-UA' } },
		{ name: 'mobile', use: { ...devices['Pixel 7'], locale: 'en-US' } }
	],

	webServer: {
		// Тільки preview: збірку робить `npm run test:e2e`, щоб не збирати двічі
		// в CI, де крок build уже є. Preview над відсутнім build/ впаде одразу.
		command: `npm run preview -- --port ${PORT} --strictPort`,
		url: `http://localhost:${PORT}`,
		reuseExistingServer: false,
		timeout: 120_000
	}
});
