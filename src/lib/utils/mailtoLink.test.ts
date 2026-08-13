import { describe, expect, it, afterEach } from 'vitest';
import { emailFromHref, resolveMailtoClick } from './mailtoLink';

/**
 * Перевіряється те, від чого залежить обіцянка «однаково скрізь»: що адреса
 * дістається з будь-якої форми `mailto:` і що клік по посиланню з markdown —
 * тобто по тому, чого жоден компонент не писав — розпізнається так само, як
 * по кнопці в підвалі.
 */

describe('emailFromHref', () => {
	it('бере адресу з простого mailto', () => {
		expect(emailFromHref('mailto:teatr_school@i.ua')).toBe('teatr_school@i.ua');
	});

	it('відкидає параметри запиту', () => {
		expect(emailFromHref('mailto:a@b.ua?subject=Hi&body=Text')).toBe('a@b.ua');
	});

	it('розкодовує escape-послідовності', () => {
		expect(emailFromHref('mailto:teatr%2Eschool@i.ua')).toBe('teatr.school@i.ua');
	});

	it('MAILTO великими літерами теж рахується', () => {
		expect(emailFromHref('MAILTO:a@b.ua')).toBe('a@b.ua');
	});

	it('не плутає схему з іншими посиланнями', () => {
		for (const href of ['/contacts', 'https://example.com', 'tel:+380631509551', '#anchor', '']) {
			expect(emailFromHref(href), href).toBeNull();
		}
	});

	it('порожня адреса не вважається адресою', () => {
		expect(emailFromHref('mailto:')).toBeNull();
		expect(emailFromHref('mailto:?subject=x')).toBeNull();
		expect(emailFromHref(null)).toBeNull();
		expect(emailFromHref(undefined)).toBeNull();
	});
});

describe('resolveMailtoClick', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	const click = (el: Element, init: MouseEventInit = {}) => {
		const e = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init });
		el.dispatchEvent(e);
		return e;
	};

	it('ловить клік по вмісту ВСЕРЕДИНІ посилання', () => {
		// Саме така розмітка виходить із markdown сторінки `teatr-pro`: адреса
		// загорнута в іконку й текст, тож ціллю кліку є вони, а не сам <a>.
		document.body.innerHTML =
			'<p><a href="mailto:teatr.pro.fest@gmail.com"><svg></svg><span>написати</span></a></p>';
		const inner = document.querySelector('span')!;

		const hit = resolveMailtoClick(click(inner));

		expect(hit?.email).toBe('teatr.pro.fest@gmail.com');
		expect(hit?.anchor, 'анкором має бути саме посилання').toBe(document.querySelector('a'));
	});

	it('не чіпає посилань, які не є поштовими', () => {
		document.body.innerHTML = '<a href="/contacts">контакти</a>';
		expect(resolveMailtoClick(click(document.querySelector('a')!))).toBeNull();
	});

	it('модифікатори й середня кнопка лишаються браузеру', () => {
		document.body.innerHTML = '<a href="mailto:a@b.ua">пошта</a>';
		const link = document.querySelector('a')!;
		for (const init of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
			expect(resolveMailtoClick(click(link, init)), JSON.stringify(init)).toBeNull();
		}
	});

	it('клік, який хтось уже обробив, не перехоплюється вдруге', () => {
		document.body.innerHTML = '<a href="mailto:a@b.ua">пошта</a>';
		const e = click(document.querySelector('a')!);
		e.preventDefault();
		expect(resolveMailtoClick(e)).toBeNull();
	});

	it('клік поза посиланням нічого не дає', () => {
		document.body.innerHTML = '<p>просто текст</p>';
		expect(resolveMailtoClick(click(document.querySelector('p')!))).toBeNull();
	});
});
