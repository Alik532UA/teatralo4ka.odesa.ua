import { describe, expect, it } from 'vitest';
import { emojiToCountryCode, parseContentWithFlags } from './formatFlags';

describe('formatFlags', () => {
	it('converts flag emojis to uppercase ISO country codes', () => {
		expect(emojiToCountryCode('🇺🇦')).toBe('UA');
		expect(emojiToCountryCode('🇧🇬')).toBe('BG');
		expect(emojiToCountryCode('🇨🇿')).toBe('CZ');
		expect(emojiToCountryCode('🇦🇹')).toBe('AT');
		expect(emojiToCountryCode('🇩🇪')).toBe('DE');
		expect(emojiToCountryCode('🇵🇱')).toBe('PL');
	});

	it('parses mixed text with flags into tokens', () => {
		const text = '🇨🇿 🇦🇹 🇩🇪 Квітуча Чехія, 2011 (Австрія, Чехія, Німеччина)';
		const tokens = parseContentWithFlags(text);

		expect(tokens).toEqual([
			{ type: 'flag', code: 'CZ', emoji: '🇨🇿' },
			{ type: 'text', value: ' ' },
			{ type: 'flag', code: 'AT', emoji: '🇦🇹' },
			{ type: 'text', value: ' ' },
			{ type: 'flag', code: 'DE', emoji: '🇩🇪' },
			{ type: 'text', value: ' Квітуча Чехія, 2011 (Австрія, Чехія, Німеччина)' }
		]);
	});

	it('returns a single text token when no flags present', () => {
		const text = 'Під час навчання брав активну участь у житі МТШ';
		const tokens = parseContentWithFlags(text);
		expect(tokens).toEqual([{ type: 'text', value: text }]);
	});
});
