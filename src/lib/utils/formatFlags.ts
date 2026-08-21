export interface TextToken {
	type: 'text';
	value: string;
}

export interface FlagToken {
	type: 'flag';
	code: string;
	emoji: string;
}

export type ContentToken = TextToken | FlagToken;

export function emojiToCountryCode(emoji: string): string {
	const codePoints = [...emoji].map((char) => char.codePointAt(0) ?? 0);
	if (codePoints.length === 2) {
		const c1 = String.fromCharCode(codePoints[0] - 0x1f1e6 + 65);
		const c2 = String.fromCharCode(codePoints[1] - 0x1f1e6 + 65);
		return `${c1}${c2}`.toUpperCase();
	}
	return '';
}

export function parseContentWithFlags(text: string): ContentToken[] {
	if (!text) return [];
	const tokens: ContentToken[] = [];
	const regex = /(\p{Regional_Indicator}{2})/gu;
	let lastIndex = 0;
	let match: RegExpExecArray | null;

	while ((match = regex.exec(text)) !== null) {
		if (match.index > lastIndex) {
			tokens.push({ type: 'text', value: text.slice(lastIndex, match.index) });
		}
		const emoji = match[0];
		const code = emojiToCountryCode(emoji);
		tokens.push({ type: 'flag', code, emoji });
		lastIndex = regex.lastIndex;
	}

	if (lastIndex < text.length) {
		tokens.push({ type: 'text', value: text.slice(lastIndex) });
	}

	return tokens;
}
