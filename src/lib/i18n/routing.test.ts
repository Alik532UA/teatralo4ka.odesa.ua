import { describe, it, expect } from 'vitest';
import {
	localeFromPath,
	stripLocale,
	withLocale,
	localeAlternates,
	DEFAULT_LOCALE
} from './routing';

describe('localeFromPath', () => {
	it('голий шлях — типова мова', () => {
		expect(localeFromPath('/')).toBe('uk');
		expect(localeFromPath('/about')).toBe('uk');
		expect(localeFromPath('/departments/music')).toBe('uk');
	});

	it('префікс /en дає en', () => {
		expect(localeFromPath('/en')).toBe('en');
		expect(localeFromPath('/en/')).toBe('en');
		expect(localeFromPath('/en/about')).toBe('en');
	});

	it('НЕ приймає префікс рядка замість сегмента', () => {
		// startsWith('/en') дав би 'en' для кожного з цих шляхів, і сторінка
		// мовчки поїхала б не тією мовою. Реальних адрес з такою головою в
		// проєкті зараз немає, але правило мусить бути правильним до того, як
		// вони з'являться, — інакше знайдеться воно вже в продакшні.
		expect(localeFromPath('/energy')).toBe('uk');
		expect(localeFromPath('/ensemble/strings')).toBe('uk');
	});

	it('uk у шляху НЕ вважається мовним префіксом — типова мова голого шляху', () => {
		// Інакше з'явилося б дві адреси на той самий вміст: /about і /uk/about.
		// Саме це SEO-v8 називає порушенням «одна canonical на мову».
		expect(localeFromPath('/uk/about')).toBe(DEFAULT_LOCALE);
		expect(stripLocale('/uk/about')).toBe('/uk/about');
	});
});

describe('stripLocale', () => {
	it('прибирає лише мовний сегмент', () => {
		expect(stripLocale('/en/about')).toBe('/about');
		expect(stripLocale('/en/departments/music')).toBe('/departments/music');
	});

	it('/en і /en/ обидва означають головну', () => {
		expect(stripLocale('/en')).toBe('/');
		expect(stripLocale('/en/')).toBe('/');
	});

	it('голий шлях лишається як є', () => {
		expect(stripLocale('/about')).toBe('/about');
		expect(stripLocale('/')).toBe('/');
	});
});

describe('withLocale', () => {
	it('додає префікс для en і знімає для uk', () => {
		expect(withLocale('/about', 'en')).toBe('/en/about');
		expect(withLocale('/en/about', 'uk')).toBe('/about');
	});

	it('ідемпотентний: та сама мова не подвоює префікс', () => {
		expect(withLocale('/en/about', 'en')).toBe('/en/about');
		expect(withLocale('/about', 'uk')).toBe('/about');
	});

	it('головна сторінка англійською — /en/, а не /en', () => {
		// trailingSlash: 'always'. Без цього адаптер віддавав би /en, а
		// SvelteKit перенаправляв на /en/ — тобто зайвий стрибок на кожному
		// перемиканні мови на головній.
		expect(withLocale('/', 'en')).toBe('/en/');
		expect(withLocale('/en/', 'uk')).toBe('/');
	});
});

describe('localeAlternates', () => {
	it('віддає обидві мови у фіксованому порядку, типова перша', () => {
		expect(localeAlternates('/about')).toEqual([
			{ locale: 'uk', path: '/about' },
			{ locale: 'en', path: '/en/about' }
		]);
	});

	it('результат не залежить від того, якою мовою прийшла адреса', () => {
		// Це властивість, від якої залежить hreflang: обидві мовні версії
		// сторінки мусять оголосити ОДНАКОВИЙ набір альтернатив, інакше Google
		// вважає розмітку суперечливою і не бере до уваги жодну.
		expect(localeAlternates('/en/about')).toEqual(localeAlternates('/about'));
		expect(localeAlternates('/en/')).toEqual(localeAlternates('/'));
	});
});
