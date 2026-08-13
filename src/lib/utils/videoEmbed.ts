/**
 * Розпізнавання посилань на відео: платформа, адреса плеєра, кадр для картки.
 *
 * Чиста логіка без залежностей — щоб перевірялася тестами. Показ живе в
 * компонентах (`ContentCard`, `DetailPage`), рішення — тут.
 *
 * ## Що вбудовується, а що ні — і чому
 *
 * Вбудовуються лише YouTube і Vimeo. Причина не в лінощах, а в CSP: для них
 * директиви `frame-src` у проєкті вже є, і жодного стороннього скрипта не
 * потрібно.
 *
 * Instagram і Facebook розпізнаються, але позначаються `embeddable: false`.
 * Instagram вимагає oEmbed із токеном застосунку Facebook або SDK на кожній
 * сторінці; у Facebook є iframe-плагін без SDK, але це новий домен у CSP і
 * залежність від того, чи піст публічний. Обидва ламаються МОВЧКИ — порожньою
 * рамкою, — а це той клас дефектів, який у цьому проєкті вже двічі коштував
 * часу (`media-src` для звуку, `frame-src` для відео в статтях). Тому для них
 * кнопка відкриває посилання в новій вкладці: відвідувач бачить те саме, а
 * сайт не залежить від чужого SDK.
 */

export type VideoPlatform = 'youtube' | 'vimeo' | 'instagram' | 'facebook';

export interface VideoInfo {
	platform: VideoPlatform;
	/** Ідентифікатор ролика. Для Instagram/Facebook не потрібен і не витягується. */
	id?: string;
	/** Адреса для `<iframe>`. Є лише коли `embeddable`. */
	embedUrl?: string;
	/**
	 * Кадр для картки, коли автор не завантажив обкладинки.
	 *
	 * Є лише в YouTube: він віддає його статичною адресою без API. Vimeo без
	 * запиту до свого API кадру не дає, тож там `undefined` — і картка просто
	 * лишається без зображення.
	 */
	posterUrl?: string;
	/** Чи можна показати плеєр на сторінці, чи лишається посилання. */
	embeddable: boolean;
	/** Початкове посилання — його відкриває кнопка для невбудовуваних платформ. */
	url: string;
}

/** `youtube-nocookie`, а не `youtube`: без реклами й без cookie до відтворення. */
const YOUTUBE_EMBED = 'https://www.youtube-nocookie.com/embed/';
const YOUTUBE_POSTER = (id: string) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
const VIMEO_EMBED = 'https://player.vimeo.com/video/';

/** Ідентифікатор YouTube — 11 символів із безпечного алфавіту. */
const YT_ID = /^[\w-]{11}$/;

function youtubeId(u: URL): string | null {
	const host = u.hostname.replace(/^www\./, '');

	// youtu.be/<id>
	if (host === 'youtu.be') {
		const id = u.pathname.slice(1).split('/')[0];
		return YT_ID.test(id) ? id : null;
	}

	if (host !== 'youtube.com' && host !== 'm.youtube.com' && host !== 'youtube-nocookie.com') {
		return null;
	}

	// /watch?v=<id>
	const v = u.searchParams.get('v');
	if (v && YT_ID.test(v)) return v;

	// /embed/<id>, /shorts/<id>, /live/<id> — усі три трапляються в посиланнях,
	// які копіюють із адресного рядка.
	const m = /^\/(?:embed|shorts|live|v)\/([\w-]{11})/.exec(u.pathname);
	return m ? m[1] : null;
}

function vimeoId(u: URL): string | null {
	if (u.hostname.replace(/^www\./, '') !== 'vimeo.com') return null;
	// vimeo.com/123456789 і vimeo.com/channels/staffpicks/123456789
	const m = /(?:^|\/)(\d{6,12})(?:$|[/?#])/.exec(u.pathname);
	return m ? m[1] : null;
}

/**
 * Розбирає посилання на відео. `null` — це не відео (або взагалі не адреса).
 *
 * Розбір через `new URL`, а не регуляркою по рядку: так host перевіряється
 * саме як host. Наївне `url.includes('youtube.com')` пропустило б
 * `https://evil.example/?x=youtube.com`.
 */
export function parseVideoUrl(raw: string | null | undefined): VideoInfo | null {
	if (!raw) return null;
	const trimmed = raw.trim();
	if (!trimmed) return null;

	let u: URL;
	try {
		u = new URL(trimmed);
	} catch {
		return null;
	}
	if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;

	const host = u.hostname.replace(/^www\./, '');

	const yt = youtubeId(u);
	if (yt) {
		return {
			platform: 'youtube',
			id: yt,
			embedUrl: `${YOUTUBE_EMBED}${yt}`,
			posterUrl: YOUTUBE_POSTER(yt),
			embeddable: true,
			url: trimmed
		};
	}

	const vm = vimeoId(u);
	if (vm) {
		return {
			platform: 'vimeo',
			id: vm,
			embedUrl: `${VIMEO_EMBED}${vm}`,
			embeddable: true,
			url: trimmed
		};
	}

	if (host === 'instagram.com' || host === 'instagr.am') {
		return { platform: 'instagram', embeddable: false, url: trimmed };
	}

	if (host === 'facebook.com' || host === 'fb.watch' || host === 'm.facebook.com') {
		return { platform: 'facebook', embeddable: false, url: trimmed };
	}

	return null;
}

/**
 * Обкладинка для картки: те, що завантажив автор, інакше кадр із відео.
 *
 * Порядок саме такий, бо це і є ваше правило: якщо є і зображення, і відео —
 * на картці зображення. Кадр підставляється лише коли зображення немає.
 */
export function cardImageUrl(coverUrl: string | undefined, videoUrl: string | undefined): string {
	const cover = coverUrl?.trim();
	if (cover) return cover;
	return parseVideoUrl(videoUrl)?.posterUrl ?? '';
}
