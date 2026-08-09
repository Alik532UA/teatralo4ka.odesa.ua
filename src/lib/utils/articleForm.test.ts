// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
	CATEGORY_CUSTOM,
	CATEGORY_NONE,
	datePresetValue,
	formatCategory,
	formatDateInput,
	isImageUrlValid,
	parseCategory,
	sanitizeSlug,
	validateForm,
	type FormLimits,
	type FormValues
} from './articleForm';

const KNOWN = ['news', 'events', 'announcements'] as const;

describe('sanitizeSlug', () => {
	it('пробіли стають підкресленнями, великі літери — малими', () => {
		expect(sanitizeSlug({ raw: 'New Year Concert', cursor: 16 }).slug).toBe('new_year_concert');
	});

	it('заборонені символи викидаються', () => {
		const out = sanitizeSlug({ raw: 'кон!церт@2026', cursor: 13 });
		expect(out.slug).toBe('2026');
		expect(out.hasForbidden).toBe(true);
	});

	it('без заборонених символів прапорець не піднімається', () => {
		expect(sanitizeSlug({ raw: 'valid_slug_1', cursor: 12 }).hasForbidden).toBe(false);
	});

	it('курсор зсувається рівно на кількість викинутого ЛІВОРУЧ від нього', () => {
		// «ab!cd», курсор після «!» (позиція 3). Викинуто один символ ліворуч,
		// тож курсор має стати 2 — між «b» і «c».
		expect(sanitizeSlug({ raw: 'ab!cd', cursor: 3 }).cursor).toBe(2);
	});

	it('викинуте ПРАВОРУЧ від курсора його не зсуває', () => {
		// Без цієї умови курсор стрибав би в кінець рядка, і редагувати slug
		// посеред тексту стало б неможливо.
		expect(sanitizeSlug({ raw: 'ab!cd', cursor: 2 }).cursor).toBe(2);
	});

	it('порожній рядок лишається порожнім', () => {
		expect(sanitizeSlug({ raw: '', cursor: 0 })).toEqual({ slug: '', cursor: 0, hasForbidden: false });
	});

	it('цифри та підкреслення проходять як є', () => {
		expect(sanitizeSlug({ raw: 'fest_2026_01', cursor: 0 }).slug).toBe('fest_2026_01');
	});
});

describe('parseCategory', () => {
	it('порожнє значення означає «без категорії»', () => {
		expect(parseCategory('', KNOWN)).toEqual({ selection: CATEGORY_NONE, customUk: '', customEn: '' });
	});

	it('відомий ключ обирається у випадайці', () => {
		expect(parseCategory('news', KNOWN).selection).toBe('news');
	});

	it('дві мови в одному рядку розкладаються на два поля', () => {
		expect(parseCategory('Концерти||Concerts', KNOWN)).toEqual({
			selection: CATEGORY_CUSTOM,
			customUk: 'Концерти',
			customEn: 'Concerts'
		});
	});

	it('власна категорія без англійської лишає англійське поле порожнім', () => {
		expect(parseCategory('Майстер-класи', KNOWN)).toEqual({
			selection: CATEGORY_CUSTOM,
			customUk: 'Майстер-класи',
			customEn: ''
		});
	});

	it('рядок із порожньою англійською частиною не ламається', () => {
		expect(parseCategory('Концерти||', KNOWN).customEn).toBe('');
	});
});

describe('formatCategory', () => {
	it('«без категорії» дає порожній рядок', () => {
		expect(formatCategory({ selection: CATEGORY_NONE, customUk: 'x', customEn: 'y' })).toBe('');
	});

	it('відомий ключ повертається як є', () => {
		expect(formatCategory({ selection: 'news', customUk: '', customEn: '' })).toBe('news');
	});

	it('дві мови зʼєднуються роздільником', () => {
		expect(formatCategory({ selection: CATEGORY_CUSTOM, customUk: 'Концерти', customEn: 'Concerts' }))
			.toBe('Концерти||Concerts');
	});

	it('без англійської роздільник не пишеться', () => {
		// Інакше в базі осідали б рядки «Концерти||», які потім розбиралися б
		// у порожню англійську назву.
		expect(formatCategory({ selection: CATEGORY_CUSTOM, customUk: 'Концерти', customEn: '' })).toBe('Концерти');
	});

	it('пробіли обрізаються', () => {
		expect(formatCategory({ selection: CATEGORY_CUSTOM, customUk: '  Концерти  ', customEn: '  Concerts ' }))
			.toBe('Концерти||Concerts');
	});

	it('розбір і збирання дають вихідне значення', () => {
		for (const stored of ['', 'news', 'Концерти||Concerts', 'Майстер-класи']) {
			expect(formatCategory(parseCategory(stored, KNOWN))).toBe(stored);
		}
	});
});

describe('дати', () => {
	const today = new Date('2026-08-10T12:00:00Z');
	const created = new Date('2026-01-15T00:00:00Z');
	const updated = new Date('2026-03-20T00:00:00Z');

	it('formatDateInput дає ISO-дату без часу', () => {
		expect(formatDateInput(created)).toBe('2026-01-15');
	});

	it('відсутня дата показується прочерком', () => {
		expect(formatDateInput(null)).toBe('---');
	});

	it('пресети беруть свою дату', () => {
		const dates = { createdAt: created, updatedAt: updated, today };
		expect(datePresetValue('createdAt', dates)).toBe('2026-01-15');
		expect(datePresetValue('updatedAt', dates)).toBe('2026-03-20');
		expect(datePresetValue('today', dates)).toBe('2026-08-10');
	});

	it('«прихована» дата це null, а не сьогодні', () => {
		expect(datePresetValue('hidden', { createdAt: created, updatedAt: updated, today })).toBeNull();
	});

	it('відсутня дата створення падає на сьогодні', () => {
		expect(datePresetValue('createdAt', { createdAt: null, updatedAt: null, today })).toBe('2026-08-10');
	});
});

describe('validateForm', () => {
	const limits: FormLimits = {
		dateMin: '1990-01-01',
		dateMax: '2027-08-10',
		maxCategoryLength: 50,
		maxTitleLength: 150,
		maxContentLength: 50000
	};

	const ok: FormValues = {
		dateMode: 'createdAt',
		customDateStr: '',
		category: 'news',
		translations: { uk: { title: 'Заголовок', content: 'Текст' }, en: { title: 'Title', content: 'Text' } }
	};

	it('коректна форма проблем не має', () => {
		expect(validateForm(ok, limits)).toBeNull();
	});

	it('дата поза межами firestore.rules відхиляється', () => {
		expect(validateForm({ ...ok, dateMode: 'custom', customDateStr: '1889-01-01' }, limits))
			.toEqual({ kind: 'dateRange' });
		expect(validateForm({ ...ok, dateMode: 'custom', customDateStr: '2099-01-01' }, limits))
			.toEqual({ kind: 'dateRange' });
	});

	it('нерозбірлива дата відхиляється', () => {
		expect(validateForm({ ...ok, dateMode: 'custom', customDateStr: 'не дата' }, limits))
			.toEqual({ kind: 'dateRange' });
	});

	it('дата перевіряється ЛИШЕ в режимі custom', () => {
		// В інших режимах поле може містити що завгодно — воно не зберігається.
		expect(validateForm({ ...ok, dateMode: 'hidden', customDateStr: 'сміття' }, limits)).toBeNull();
	});

	it('задовга категорія називає поточну довжину', () => {
		const out = validateForm({ ...ok, category: 'к'.repeat(60) }, limits);
		expect(out).toEqual({ kind: 'categoryLength', current: 60 });
	});

	it('задовгий заголовок називає мову', () => {
		const long = { ...ok, translations: { ...ok.translations, en: { title: 'x'.repeat(200), content: '' } } };
		expect(validateForm(long, limits)).toEqual({ kind: 'titleLength', lang: 'en' });
	});

	it('задовгий текст називає мову', () => {
		const long = { ...ok, translations: { ...ok.translations, uk: { title: 'ок', content: 'x'.repeat(50001) } } };
		expect(validateForm(long, limits)).toEqual({ kind: 'contentLength', lang: 'uk' });
	});

	it('межа включна — рівно ліміт проходить', () => {
		const exact = { ...ok, category: 'к'.repeat(50) };
		expect(validateForm(exact, limits)).toBeNull();
	});
});

describe('isImageUrlValid', () => {
	it('порожнє значення придатне — обкладинка необовʼязкова', () => {
		expect(isImageUrlValid('')).toBe(true);
	});

	it('відомі розширення проходять, регістр не важливий', () => {
		for (const url of ['/a.jpg', '/a.JPEG', '/a.png', '/a.webp', '/a.gif', '/a.svg']) {
			expect(isImageUrlValid(url)).toBe(true);
		}
	});

	it('чуже розширення не проходить', () => {
		expect(isImageUrlValid('/document.pdf')).toBe(false);
		expect(isImageUrlValid('https://example.com/page')).toBe(false);
	});
});
