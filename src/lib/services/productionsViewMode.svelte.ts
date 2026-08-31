import { browser } from '$app/environment';
import { storage } from './storage';

/**
 * Режим показу вистав у профілі майстра: плитка / список / хронологія.
 *
 * ## Чому три, і чому саме ці
 *
 * У Федора Ткача вісімдесят вистав, і одна розкладка на всіх не працює: плитка
 * добре показує окрему виставу з нагородами й складом, але змушує гортати
 * екранами; список дає перебігти очима роки й назви; хронологія відповідає на
 * інше питання — скільки чого було в котрий рік. Це три різні питання до тих
 * самих даних, а не три оформлення одного.
 *
 * Типовою лишається плитка: доти вона була єдиною, і зміна режиму не повинна
 * бути умовою побачити те, що бачили раніше.
 *
 * ## Чому контролер, а не `$state` у компоненті
 *
 * Форма й причини — ті самі, що в сусіднього
 * [`adultsViewMode`](./adultsViewMode.svelte.ts): ключ із префіксом проєкту
 * (сайт живе на спільному origin, і `no-restricted-globals` в `eslint.config.js`
 * ловить прямий `localStorage`), читання в конструкторі під `browser` замість
 * `onMount` (інакше перший кадр із типовим значенням і перемальовування),
 * наскрізний запис у мутаторі без `$effect` (SVELTE-CORE-v8 § 1.9).
 */
const STORAGE_KEY = 'master_productions_view';

export const PRODUCTION_VIEWS = ['timeline', 'list', 'tiles'] as const;

export type ProductionView = (typeof PRODUCTION_VIEWS)[number];

/**
 * Охоронець типу для збереженого значення.
 *
 * Потрібен не лише проти сміття: перемикач віддає рядок, бо служить двом
 * розділам із різними наборами режимів. Звуження робиться тут, у того, хто
 * знає свій набір, — а не узагальненням у самому перемикачі.
 */
export function isProductionView(value: string | null): value is ProductionView {
	return value !== null && (PRODUCTION_VIEWS as readonly string[]).includes(value);
}

class ProductionsViewState {
	current = $state<ProductionView>('timeline');

	constructor() {
		if (browser) {
			const saved = storage.get(STORAGE_KEY);
			if (isProductionView(saved)) this.current = saved;
		}
	}

	set(mode: ProductionView): void {
		this.current = mode;
		if (browser) storage.set(STORAGE_KEY, mode);
	}
}

export const productionsViewMode = new ProductionsViewState();
