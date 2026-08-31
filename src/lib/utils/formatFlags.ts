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

export type ContentToken = TextToken | FlagToken | LinkToken;

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

export function parseContentWithFlags(text: string): ContentToken[] {
	if (!text) return [];
	const tokens: ContentToken[] = [];
	const regex = /(\p{Regional_Indicator}{2}|\[[^\]\n]+\]\([^)\s]+\))/gu;
	let lastIndex = 0;
	let match: RegExpExecArray | null;

	while ((match = regex.exec(text)) !== null) {
		if (match.index > lastIndex) {
			tokens.push({ type: 'text', value: text.slice(lastIndex, match.index) });
		}
		const piece = match[0];
		LINK.lastIndex = 0;
		const link = LINK.exec(piece);
		if (link) {
			tokens.push({ type: 'link', label: link[1], href: link[2] });
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
 * Чи є в тексті власне посилання `[підпис](адреса)`.
 *
 * Питання не пусте: рядок із власним посиланням НЕ МОЖНА загортати в ще одне.
 * `<a>` всередині `<a>` — невалідна розмітка; браузер її мовчки лагодить, а
 * Svelte у dev валить сторінку цілком (`node_invalid_placement_ssr`), і
 * заміряно це саме так: анкета Марини Вішталюк, де в рядку вистави стоїть
 * посилання на групу, не рендерилася взагалі.
 */
export function hasLink(text: string): boolean {
	LINK.lastIndex = 0;
	return LINK.test(text);
}
