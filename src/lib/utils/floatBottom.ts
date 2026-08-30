import type { Attachment } from 'svelte/attachments';

/** Найвужча колонка тексту, в яку ще варто писати (px). */
const MIN_TEXT_COLUMN = 160;

/**
 * Найменша частка ширини блоку, яку має лишати собі текст.
 *
 * Абсолютного порога замало: у широкому вікні 160px — це вже не колонка, а
 * поле. Частка тримає пропорцію на будь-якій ширині, а `MIN_TEXT_COLUMN`
 * страхує знизу, коли сам блок вузький.
 */
const MIN_TEXT_SHARE = 0.55;

/** Скільки разів добирати відступ, доки текст не перестане звисати нижче. */
const MAX_PASSES = 6;

/**
 * Чи лишається поруч із ілюстрацією колонка, придатна для тексту.
 *
 * Обтікання тримається саме на цьому. Коли колонка вужча, в рядок стає два-три
 * слова — виходить не абзац, а драбинка, а при зовсім вузькій щілині —
 * самотня літера біля картинки.
 */
export function fitsBeside(columnWidth: number, figureWidth: number): boolean {
	const needed = Math.max(MIN_TEXT_COLUMN, columnWidth * MIN_TEXT_SHARE);
	return columnWidth - figureWidth >= needed;
}

/**
 * Ставить плаваючу ілюстрацію праворуч УНИЗУ свого блоку.
 *
 * Вішається на обгортку ілюстрації; перед нею в блоці має стояти розпірка
 * (сусід зліва), а текст — за нею. Сам блок має бути власним контекстом
 * форматування (`display: flow-root`), інакше плаваючий елемент вилізе за його
 * межі.
 *
 * Плаваючий елемент починається там, де його зустріли в потоці: перед текстом
 * він липне до верху, після тексту — падає під нього, і обтікати вже нічого.
 *
 * ОПУСКАЄ ЙОГО РОЗПІРКА, А НЕ ВЛАСНИЙ ВІДСТУП. Рядки обходять МАРГІН-БОКС
 * плаваючого елемента, а не його видиму рамку, тож `margin-top` розтягував той
 * бокс від самого верху блоку: картинка малювалася внизу, а текст звужувався на
 * всю висоту (заміряно — рядки по 226px замість 290 при 305 доступних). Тому
 * перед ілюстрацією стоїть порожній плаваючий елемент НУЛЬОВОЇ ШИРИНИ: він
 * нічого не звужує, а `clear: right` на самій ілюстрації ставить її одразу під
 * ним. Звузяться тільки ті рядки, що справді порівнялися з картинкою.
 *
 * ВИСОТА РОЗПІРКИ ДОБИРАЄТЬСЯ, А НЕ РАХУЄТЬСЯ ОДРАЗУ. Опустивши ілюстрацію, ми
 * міняємо ширину сусідніх рядків, і текст стає вищим — порахована на око висота
 * лишала б її посеред блоку. Тому крок повторюється, доки текст звисає нижче за
 * неї; кожен крок посуває її тільки вниз, тож це сходиться.
 *
 * Замір, а не медіазапит: питання не в ширині екрана, а в тому, чи лишається
 * поруч колонка. Та сама ілюстрація в широкому вікні обтікається, а у вузькому
 * ні — жодне число в CSS цього не знає.
 */
export function floatBottom(): Attachment {
	return (nodeElement: Element) => {
		const node = nodeElement as HTMLElement;
		const body = node.parentElement;
		const pusher = node.previousElementSibling as HTMLElement | null;
		if (!body || !pusher) return;

		/*
		 * Стежимо за ШИРИНОЮ, а не за будь-якою зміною розміру: `place` міняє
		 * висоту блоку, а спостерігач дивиться на той самий блок — без цієї
		 * перевірки вони ганяли б одне одного по колу.
		 */
		let lastWidth = -1;

		const place = () => {
			lastWidth = body.clientWidth;

			/* Міряємо чисте: усе, що ми могли проставити раніше, знімається. */
			node.style.cssText = '';
			body.style.display = '';
			pusher.style.display = '';
			pusher.style.height = '0px';

			const gapLeft = parseFloat(getComputedStyle(node).marginLeft) || 0;
			const figureWidth = node.offsetWidth + gapLeft;

			/*
			 * Порожня обгортка — не помилка: ілюстрацію має не кожен пункт. Без
			 * цієї перевірки їй дістався б відступ на всю висоту тексту, і пункт
			 * виріс би вдвічі ні на чому.
			 */
			if (!node.offsetHeight) return;

			if (!fitsBeside(lastWidth, figureWidth)) {
				/*
				 * Обтікати нема чим — ілюстрація стає під текстом, праворуч.
				 *
				 * Знімаємо саме обтікання, а не просто опускаємо: плаваючий
				 * елемент лишається плаваючим, і текст однаково лізе йому збоку
				 * вузькою драбинкою. Заміряно на «викладачах»: відступ у 159px
				 * робив блок не 209 заввишки, а 364 — текст переверстувався в
				 * сімдесятипіксельну колонку й ріс на 155px.
				 *
				 * Колонка флексом, а не переміщенням у розмітці: розміткою
				 * порядкує Svelte, і посунутий вузол він поверне на місце при
				 * найближчому оновленні.
				 */
				pusher.style.display = 'none';
				body.style.display = 'flex';
				body.style.flexDirection = 'column';
				node.style.float = 'none';
				node.style.order = '1';
				node.style.alignSelf = 'flex-end';
				node.style.margin = '0.5rem 0 0';
				return;
			}

			for (let pass = 0; pass < MAX_PASSES; pass++) {
				const hanging =
					body.getBoundingClientRect().bottom - node.getBoundingClientRect().bottom;
				if (hanging <= 1) break;
				pusher.style.height = `${(parseFloat(pusher.style.height) || 0) + hanging}px`;
			}
		};

		const onResize = () => {
			if (body.clientWidth !== lastWidth) place();
		};

		place();

		const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(onResize);
		observer?.observe(body);
		/* Вміст приїжджає пізніше за розмітку — шрифти й картинки міняють висоту. */
		const settle = setTimeout(place, 60);

		return () => {
			observer?.disconnect();
			clearTimeout(settle);
		};
	};
}
