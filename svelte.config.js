import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

// Хеш інлайн-скрипта теми обчислюється з app.html під час збірки, а не
// вписується руками: вписаний хеш розходиться з файлом при першому ж
// редагуванні, і скрипт після цього блокується мовчки.
//
// Раніше тут стояло, що dev-сервер CSP не застосовує. Це неправда — політика
// діє і в `vite dev`, порушення видно в консолі браузера. Помилку помітно не
// тому, що її нема де побачити, а тому, що заблокований ресурс нічого не
// ламає візуально: сторінка малюється, просто щось тихо не працює.
function inlineThemeScript() {
	const html = readFileSync('src/app.html', 'utf8');
	const open = '<script>';
	const close = '</' + 'script>';
	const start = html.indexOf(open);
	const end = html.indexOf(close, start);
	if (start < 0 || end < 0) {
		throw new Error('app.html: інлайн-скрипт теми не знайдено — CSP заблокує його мовчки');
	}
	return html.slice(start + open.length, end);
}

const themeScriptHash = `sha256-${createHash('sha256').update(inlineThemeScript()).digest('base64')}`;
import adapter from '@sveltejs/adapter-static';
import { relative, sep } from 'node:path';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// defaults to rune mode for the project, except for `node_modules`. Can be removed in svelte 6.
		runes: ({ filename }) => {
			const relativePath = relative(import.meta.dirname, filename);
			const pathSegments = relativePath.toLowerCase().split(sep);
			const isExternalLibrary = pathSegments.includes('node_modules');

			return isExternalLibrary ? undefined : true;
		}
	},
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: '404.html',
			precompress: true,
			strict: true
		}),
		// Домени взято зі зібраного бандла, а не зі здогадок: Firebase Auth,
		// Firestore, Google Analytics. Забути connect-src означає, що запити
		// блокуються мовчки, а код виглядає робочим.
		csp: {
			mode: 'auto',
			directives: {
				'default-src': ['self'],
				'script-src': [
					'self',
					themeScriptHash,
					'https://www.googletagmanager.com',
					'https://apis.google.com',
					// reCAPTCHA, яку підтягує Firebase Auth. Знайдено не в бандлі,
					// а в консолі браузера: сам виклик робить SDK у рантаймі.
					'https://www.google.com',
					'https://www.gstatic.com'
				],
				'connect-src': [
					'self',
					'https://*.googleapis.com',
					'https://*.google-analytics.com',
					'https://*.analytics.google.com',
					'https://securetoken.google.com',
					// reCAPTCHA не лише завантажується, а й шле власні запити.
					// Знайдено в консолі браузера вже після того, як script-src
					// був виправлений: кожен шар CSP відкриває наступний.
					'https://www.google.com'
				],
				'img-src': ['self', 'data:', 'blob:', 'https:'],
				// Без цієї директиви `default-src 'self'` мовчки блокував звуки
				// піаніно: сторінка й далі малювалася, клавіші підсвічувалися,
				// не було лише звуку. Локальний метроном тікера покривається
				// `self`, зовнішні семпли — ні.
				'media-src': ['self', 'https://carolinegabriel.com'],
				'style-src': ['self', 'unsafe-inline'],
				'font-src': ['self', 'data:'],
				'frame-src': [
					'self',
					'https://*.firebaseapp.com',
					'https://accounts.google.com',
					'https://www.google.com',
					// Санітайзер статей навмисно дозволяє <iframe> заради вбудованого
					// відео (`DOMPURIFY_HTML_CONFIG.ADD_TAGS`). Без цих джерел вийшло б
					// те саме, що зі звуком піаніно: розмітка проходить санітизацію, а
					// показати її політика не дає — і виглядає це як порожня рамка.
					'https://www.youtube.com',
					'https://www.youtube-nocookie.com',
					'https://player.vimeo.com'
				],
				'object-src': ['none'],
				'base-uri': ['self'],
				'form-action': ['self']
			}
		},
		paths: {
			base: ''
		},
		prerender: {
			crawl: true,
			// Перелік перевіряється після збірки (scripts/generate-sitemap.ts):
			// `handleUnseenRoutes: 'ignore'` мовчки пропускає адресу, якої немає,
			// тож без перевірки помилка тут не видно ніде. Так у списку роками
			// жила неіснуюча '/test' і '/projects/spring-Odesa-theatre' з великою
			// «O» — остання збиралася лише тому, що Windows не розрізняє регістр.
			entries: [
				'/',
				'/about',
				'/history',
				'/contacts',
				'/admission',
				'/news',
				'/projects',
				'/departments/theatre',
				'/departments/aesthetic',
				'/departments/music',
				'/departments/art',
				'/residents/adults',
				'/residents/kids',
				'/residents/graduates',
				'/projects/teatr-pro',
				'/projects/festival',
				'/projects/galaxy-graduates',
				'/projects/photo-archive',
				'/projects/spring-odesa-theatre',
				'/projects/support-production',
				'/fest-odesa-teatr-pro',
				'/fest-odessa-teatr-pro',
				'/admin',
				'/admin/login'
			],
			handleHttpError: 'warn',
			handleUnseenRoutes: 'ignore'
		}
	}
};

export default config;
