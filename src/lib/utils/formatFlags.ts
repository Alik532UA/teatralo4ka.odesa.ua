export interface TextToken {
	type: 'text';
	value: string;
}

export interface FlagToken {
	type: 'flag';
	code: string;
	emoji: string;
}

export interface LinkToken {
	type: 'link';
	label: string;
	href: string;
}

export interface SocialToken {
	type: 'social';
	network: string;
	href: string;
}

export type ContentToken = TextToken | FlagToken | LinkToken | SocialToken;

export function emojiToCountryCode(emoji: string): string {
	const codePoints = [...emoji].map((char) => char.codePointAt(0) ?? 0);
	if (codePoints.length === 2) {
		const c1 = String.fromCharCode(codePoints[0] - 0x1f1e6 + 65);
		const c2 = String.fromCharCode(codePoints[1] - 0x1f1e6 + 65);
		return `${c1}${c2}`.toUpperCase();
	}
	return '';
}

/**
 * Розпізнавання відомих соцмереж за адресою посилання.
 */
export function detectSocialNetwork(url: string): string | null {
	try {
		const fullUrl = /^[a-zA-Z]+:\/\//.test(url) ? url : `https://${url}`;
		const parsed = new URL(fullUrl);
		const host = parsed.hostname.toLowerCase();
		if (host === 'instagram.com' || host.endsWith('.instagram.com') || host === 'instagr.am')
			return 'instagram';
		if (host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtu.be')
			return 'youtube';
		if (
			host === 'facebook.com' ||
			host.endsWith('.facebook.com') ||
			host === 'fb.me' ||
			host.endsWith('.fb.me') ||
			host === 'fb.com'
		)
			return 'facebook';
		if (
			host === 't.me' ||
			host.endsWith('.t.me') ||
			host === 'telegram.me' ||
			host.endsWith('.telegram.me')
		)
			return 'telegram';
		if (host === 'tiktok.com' || host.endsWith('.tiktok.com')) return 'tiktok';
	} catch {
		return null;
	}
	return null;
}

/**
 * Посилання в тексті анкети: `[підпис](адреса)`.
 *
 * Навіщо взагалі розмітка в даних, які досі були простим текстом: в анкетах
 * раз у раз згадуються речі, у яких на сайті вже є власна сторінка (навчальна
 * група, з якою грали виставу) або власний сайт (театр, у якому людина
 * працює). Без посилання читач мусить шукати їх сам, а назва «ЗТК» узагалі
 * нікому нічого не каже.
 *
 * Синтаксис узятий із markdown навмисно: його впізнає будь-хто, хто редагує
 * ці файли руками, а іншої розмітки тут немає й не планується — жирного,
 * курсиву й заголовків анкетам не треба.
 *
 * Адреса проходить `safeUrl` на боці компонента: файли анкет редагує
 * адміністратор, але `javascript:` в атрибуті `href` Svelte не екранує, і
 * покладатися на добрі наміри автора файлу тут нема причин.
 */
const LINK = /\[([^\]\n]+)\]\(([^)\s]+)\)/g;

const SOCIAL_LABELS = new Set([
	'instagram',
	'youtube',
	'facebook',
	'telegram',
	'tiktok',
	'інстаграм',
	'ютуб',
	'фейсбук',
	'телеграм',
	'тікток'
]);

export function parseContentWithFlags(text: string): ContentToken[] {
	if (!text) return [];
	const tokens: ContentToken[] = [];
	const regex = /(\p{Regional_Indicator}{2}|\[[^\]\n]+\]\([^)\s]+\)|https?:\/\/[^\s<>"{}|\\^`]+)/gu;
	let lastIndex = 0;
	let match: RegExpExecArray | null;

	while ((match = regex.exec(text)) !== null) {
		if (match.index > lastIndex) {
			tokens.push({ type: 'text', value: text.slice(lastIndex, match.index) });
		}
		const piece = match[0];
		if (piece.startsWith('[')) {
			LINK.lastIndex = 0;
			const link = LINK.exec(piece);
			if (link) {
				const social = detectSocialNetwork(link[2]);
				if (
					social &&
					(link[1].trim() === '' ||
						link[1] === link[2] ||
						SOCIAL_LABELS.has(link[1].toLowerCase().trim()))
				) {
					tokens.push({ type: 'social', network: social, href: link[2] });
				} else {
					tokens.push({ type: 'link', label: link[1], href: link[2] });
				}
			}
		} else if (/^https?:\/\//i.test(piece)) {
			let url = piece;
			let trailing = '';
			const puncMatch = /[.,;:!?]+$/.exec(url);
			if (puncMatch) {
				trailing = puncMatch[0];
				url = url.slice(0, -trailing.length);
			}
			const social = detectSocialNetwork(url);
			if (social) {
				tokens.push({ type: 'social', network: social, href: url });
			} else {
				tokens.push({ type: 'link', label: url, href: url });
			}
			if (trailing) {
				tokens.push({ type: 'text', value: trailing });
			}
		} else {
			tokens.push({ type: 'flag', code: emojiToCountryCode(piece), emoji: piece });
		}
		lastIndex = regex.lastIndex;
	}

	if (lastIndex < text.length) {
		tokens.push({ type: 'text', value: text.slice(lastIndex) });
	}

	return tokens;
}

/**
 * Чи є в тексті власне посилання `[підпис](адреса)` або URL.
 *
 * Питання не пусте: рядок із власним посиланням НЕ МОЖНА загортати в ще одне.
 * `<a>` всередині `<a>` — невалідна розмітка; браузер її мовчки лагодить, а
 * Svelte у dev валить сторінку цілком (`node_invalid_placement_ssr`), і
 * заміряно це саме так: анкета Марини Суханової, де в рядку вистави стоїть
 * посилання на групу, не рендерилася взагалі.
 */
export function hasLink(text: string): boolean {
	LINK.lastIndex = 0;
	return LINK.test(text) || /https?:\/\/[^\s<>"{}|\\^`]+/i.test(text);
}
