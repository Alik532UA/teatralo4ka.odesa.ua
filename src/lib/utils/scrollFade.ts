import type { Attachment } from 'svelte/attachments';

/** Поріг, з якого край вважається таким, що має куди гортати (px). */
const EDGE = 8;

/**
 * Які краї зони прокрутки мають згасати: `''`, `'top'`, `'bottom'` або
 * `'top bottom'`.
 *
 * Поріг у вісім пікселів, а не нуль: субпіксельні висоти дають залишок
 * прокрутки в частку пікселя там, де гортати насправді нікуди, і нижній край
 * згасав би на списку, що вміщається цілком.
 */
export function fadeEdges(scrollTop: number, scrollHeight: number, clientHeight: number): string {
	return [
		scrollTop > EDGE ? 'top' : '',
		scrollHeight - scrollTop - clientHeight > EDGE ? 'bottom' : ''
	]
		.filter(Boolean)
		.join(' ');
}

/**
 * Згасання вмісту біля верхнього й нижнього країв зони прокрутки.
 *
 * Дописує елементу `data-fade`; саму́ маску малює `global.css`. Логіка і вигляд
 * розділені навмисно: місць прокрутки в інтерфейсі багато й усі різні
 * заввишки, але правило одне — згасає той край, куди справді є куди догорнути.
 *
 * Відкладений перемір потрібен так само, як у переліку випускників: вміст
 * приїжджає пізніше за розмітку (шрифти, ілюстрації, розкриті пункти), і без
 * нього нижній край лишався б згаслим у списку, що давно вміщається цілком.
 */
export function scrollFade(): Attachment {
	return (nodeElement: Element) => {
		const node = nodeElement as HTMLElement;

		const update = () => {
			const edges = fadeEdges(node.scrollTop, node.scrollHeight, node.clientHeight);
			if (edges) node.dataset.fade = edges;
			else delete node.dataset.fade;
		};

		node.addEventListener('scroll', update, { passive: true });

		const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
		observer?.observe(node);

		const settle = setTimeout(update, 60);
		update();

		return () => {
			node.removeEventListener('scroll', update);
			observer?.disconnect();
			clearTimeout(settle);
		};
	};
}
