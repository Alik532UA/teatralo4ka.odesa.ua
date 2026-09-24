import { describe, expect, it } from 'vitest';
import { emojiToCountryCode, parseContentWithFlags, detectSocialNetwork } from './formatFlags';

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

	it('detects social networks from URLs', () => {
		expect(detectSocialNetwork('https://www.instagram.com/mstrn.ya.sm')).toBe('instagram');
		expect(detectSocialNetwork('https://youtube.com/channel/UCVYjH9fZA7EvcD3gQb-Q_pA')).toBe('youtube');
		expect(detectSocialNetwork('https://youtu.be/abc')).toBe('youtube');
		expect(detectSocialNetwork('https://facebook.com/profile')).toBe('facebook');
		expect(detectSocialNetwork('https://t.me/channel')).toBe('telegram');
		expect(detectSocialNetwork('https://tiktok.com/@user')).toBe('tiktok');
		expect(detectSocialNetwork('https://example.com')).toBeNull();
	});

	it('parses raw social URLs in text into social tokens', () => {
		const text = 'Ютуб та інстаграм нашої майстерні:\nhttps://www.instagram.com/mstrn.ya.sm\nhttps://youtube.com/channel/UCVYjH9fZA7EvcD3gQb-Q_pA';
		const tokens = parseContentWithFlags(text);

		expect(tokens).toEqual([
			{ type: 'text', value: 'Ютуб та інстаграм нашої майстерні:\n' },
			{ type: 'social', network: 'instagram', href: 'https://www.instagram.com/mstrn.ya.sm' },
			{ type: 'text', value: '\n' },
			{ type: 'social', network: 'youtube', href: 'https://youtube.com/channel/UCVYjH9fZA7EvcD3gQb-Q_pA' }
		]);
	});

	it('parses markdown links with social labels into social tokens, preserving custom labels as regular links', () => {
		const text = '[instagram](https://www.instagram.com/user) та [наш канал](https://youtube.com/c/user)';
		const tokens = parseContentWithFlags(text);

		expect(tokens).toEqual([
			{ type: 'social', network: 'instagram', href: 'https://www.instagram.com/user' },
			{ type: 'text', value: ' та ' },
			{ type: 'link', label: 'наш канал', href: 'https://youtube.com/c/user' }
		]);
	});
});
