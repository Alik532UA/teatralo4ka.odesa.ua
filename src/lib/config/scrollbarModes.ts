/**
 * Режими смуги прокрутки: тип, перелік дійсних значень і ключі перекладу.
 *
 * Живе в конфігу, а не в контролері, бо на це посилаються з трьох боків:
 * контролер `ui`, налаштування з Firestore (`services/settings`) і два місця
 * вибору в UI. Коли тип лежав у контролері, сервіс мусив би імпортувати
 * контролер — залежність не в той бік, та ще й із рунами всередині.
 */

export type ScrollbarMode = 'standard' | 'custom' | 'minimap' | 'minimap-full';

/**
 * Дійсні значення одним кортежем.
 *
 * `as const` обов'язковий: із нього zod робить `z.enum`, а перевірка при читанні
 * зі сховища — `includes`. Інакше довелося б тримати той самий перелік ще й
 * рядками в схемі, і вони розійшлися б при додаванні режиму.
 */
export const SCROLLBAR_MODE_IDS = ['standard', 'custom', 'minimap', 'minimap-full'] as const;

/**
 * Режими з ключами перекладу — для випадайки налаштувань і контекстного меню
 * смуги. Дві копії розійшлися б при додаванні режиму, і в одному з місць його
 * просто забули б.
 *
 * Порядок — від звичного до найважчого: спершу нативна, далі власна накладка,
 * потім мінімапи.
 */
export const SCROLLBAR_MODES: { id: ScrollbarMode; key: string }[] = [
	{ id: 'standard', key: 'settings.scrollbarStandard' },
	{ id: 'custom', key: 'settings.scrollbarCustom' },
	{ id: 'minimap', key: 'settings.scrollbarMinimap' },
	{ id: 'minimap-full', key: 'settings.scrollbarMinimapFull' }
];
