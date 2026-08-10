import type { ScrollbarMode } from '$lib/controllers/ui.svelte';

/**
 * Режими смуги прокрутки з ключами перекладу.
 *
 * Один перелік на два місця — випадайку налаштувань і контекстне меню самої
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
