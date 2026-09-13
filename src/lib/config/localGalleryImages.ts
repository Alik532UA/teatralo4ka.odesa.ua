/**
 * Розміри знімків у ГАЛЕРЕЯХ випускників — окремо від решти медіа.
 *
 * Причина не косметична. Решта записів у `localImages.ts` — це оформлення
 * сайту: шапка, банери груп і фестивалів, значки. Їх стільки ж, скільки
 * сторінок, і додаються вони поодинці. Галерея ж — ВМІСТ: одна тека
 * випускника дає стільки рядків, скільки в ній кадрів, і тека Аліка дала
 * одразу 47. Тримати їх разом означає, що будь-яка наступна галерея
 * перекидає спільний файл через стелю § 7, і борг ростиме на рівному місці.
 *
 * Мапа лишається ОДНА: `localImages.ts` домішує цей запис до себе, тож
 * `imageSize()` і його інваріант нічого не знають про поділ.
 */
export const GRADUATE_GALLERY_SIZES = {
	'/graduates/gallery/alik-zapolnov/01.webp': { width: 720, height: 576 },
	'/graduates/gallery/alik-zapolnov/02.webp': { width: 720, height: 576 },
	'/graduates/gallery/alik-zapolnov/03.webp': { width: 1280, height: 891 },
	'/graduates/gallery/alik-zapolnov/04.webp': { width: 1280, height: 960 },
	'/graduates/gallery/alik-zapolnov/05.webp': { width: 1280, height: 960 },
	'/graduates/gallery/alik-zapolnov/06.webp': { width: 720, height: 444 },
	'/graduates/gallery/alik-zapolnov/07.webp': { width: 720, height: 444 },
	'/graduates/gallery/alik-zapolnov/08.webp': { width: 720, height: 444 },
	'/graduates/gallery/alik-zapolnov/09.webp': { width: 720, height: 444 },
	'/graduates/gallery/alik-zapolnov/10.webp': { width: 720, height: 445 },
	'/graduates/gallery/alik-zapolnov/11.webp': { width: 720, height: 444 },
	'/graduates/gallery/alik-zapolnov/12.webp': { width: 720, height: 444 },
	'/graduates/gallery/alik-zapolnov/13.webp': { width: 720, height: 445 },
	'/graduates/gallery/alik-zapolnov/14.webp': { width: 1280, height: 960 },
	'/graduates/gallery/alik-zapolnov/15.webp': { width: 1280, height: 720 },
	'/graduates/gallery/alik-zapolnov/16.webp': { width: 1280, height: 720 },
	'/graduates/gallery/alik-zapolnov/17.webp': { width: 704, height: 576 },
	'/graduates/gallery/alik-zapolnov/18.webp': { width: 704, height: 576 },
	'/graduates/gallery/alik-zapolnov/19.webp': { width: 702, height: 575 },
	'/graduates/gallery/alik-zapolnov/20.webp': { width: 1280, height: 960 },
	'/graduates/gallery/alik-zapolnov/21.webp': { width: 1280, height: 960 },
	'/graduates/gallery/alik-zapolnov/22.webp': { width: 1280, height: 960 },
	'/graduates/gallery/alik-zapolnov/23.webp': { width: 1280, height: 960 },
	'/graduates/gallery/alik-zapolnov/24.webp': { width: 1280, height: 960 },
	'/graduates/gallery/alik-zapolnov/25.webp': { width: 1280, height: 960 },
	'/graduates/gallery/alik-zapolnov/26.webp': { width: 703, height: 576 },
	'/graduates/gallery/alik-zapolnov/27.webp': { width: 702, height: 576 },
	'/graduates/gallery/alik-zapolnov/28.webp': { width: 704, height: 576 },
	'/graduates/gallery/alik-zapolnov/29.webp': { width: 471, height: 535 },
	'/graduates/gallery/alik-zapolnov/30.webp': { width: 704, height: 576 },
	'/graduates/gallery/alik-zapolnov/31.webp': { width: 704, height: 576 },
	'/graduates/gallery/alik-zapolnov/32.webp': { width: 1280, height: 721 },
	'/graduates/gallery/alik-zapolnov/33.webp': { width: 807, height: 538 },
	'/graduates/gallery/alik-zapolnov/34.webp': { width: 807, height: 538 },
	'/graduates/gallery/alik-zapolnov/35.webp': { width: 453, height: 604 },
	'/graduates/gallery/alik-zapolnov/36.webp': { width: 478, height: 478 },
	'/graduates/gallery/alik-zapolnov/37.webp': { width: 784, height: 576 },
	'/graduates/gallery/alik-zapolnov/38.webp': { width: 780, height: 576 },
	'/graduates/gallery/alik-zapolnov/39.webp': { width: 781, height: 576 },
	'/graduates/gallery/alik-zapolnov/40.webp': { width: 781, height: 576 },
	'/graduates/gallery/alik-zapolnov/41.webp': { width: 781, height: 576 },
	'/graduates/gallery/alik-zapolnov/42.webp': { width: 780, height: 576 },
	'/graduates/gallery/alik-zapolnov/43.webp': { width: 769, height: 576 },
	'/graduates/gallery/alik-zapolnov/44.webp': { width: 769, height: 576 },
	'/graduates/gallery/alik-zapolnov/45.webp': { width: 779, height: 576 },
	'/graduates/gallery/alik-zapolnov/46.webp': { width: 773, height: 576 },
	'/graduates/gallery/alik-zapolnov/47.webp': { width: 1280, height: 720 },
	'/graduates/gallery/anastasiia-moldovanu/01.webp': { width: 869, height: 1280 },
	'/graduates/gallery/anastasiia-moldovanu/02.webp': { width: 961, height: 1280 },
	'/graduates/gallery/anastasiia-moldovanu/03.webp': { width: 1280, height: 960 },
	'/graduates/gallery/anastasiia-moldovanu/04.webp': { width: 960, height: 1280 },
	'/graduates/gallery/anastasiia-moldovanu/05.webp': { width: 959, height: 1280 },
	'/graduates/gallery/nikol-onyshchenko/01.webp': { width: 720, height: 1280 },
	'/graduates/gallery/nikol-onyshchenko/02.webp': { width: 720, height: 1280 },
	'/graduates/gallery/nikol-onyshchenko/03.webp': { width: 1270, height: 792 },
	'/graduates/gallery/nikol-onyshchenko/04.webp': { width: 1248, height: 853 },
	'/graduates/gallery/margotcine/01.webp': { width: 1280, height: 960 },
	'/graduates/gallery/margotcine/02.webp': { width: 960, height: 1280 },
	'/graduates/gallery/margotcine/03.webp': { width: 1280, height: 960 },
	'/graduates/gallery/margotcine/04.webp': { width: 1280, height: 904 },
	'/graduates/gallery/margotcine/05.webp': { width: 1280, height: 960 },
	'/graduates/gallery/margotcine/06.webp': { width: 604, height: 453 },
} as const;
