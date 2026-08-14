/**
 * Доповнення jsdom до того рівня, який очікує код застосунку.
 *
 * jsdom не реалізує `window.matchMedia` — жодного. Це не дрібниця середовища:
 * конструктор `ui` підписується на зміну системної теми, `scrollbar` тримає два
 * `MediaQuery` зі `svelte/reactivity` на рівні модуля, а `ContentWidget` питає
 * ширину екрана. Тобто без цієї заглушки жоден контролер не можна навіть
 * ІМПОРТУВАТИ в тесті — саме на цьому впав перший прогін.
 *
 * Заглушка навмисно тупа: `matches: false` для будь-якого запиту. Це означає
 * «вузький екран, світла системна тема, без тонкого вказівника» і дає той самий
 * стан, який побачив би відвідувач на телефоні. Тест, якому потрібен інший
 * результат, підміняє `window.matchMedia` сам — так видно, що поведінка
 * залежить від медіа-запиту, а не сховано в глобальному налаштуванні.
 *
 * Чому НЕ `vi.fn()`: заглушка мусить бути живою і в тих файлах, які не
 * імпортують vitest — вона ставиться до збору тестів.
 */
/**
 * Робочий `localStorage`.
 *
 * Node 25 має власний експериментальний глобальний `localStorage`, і він
 * ЗАТІНЯЄ той, що дає jsdom. Наслідок побачив перший же тест контролера:
 * `store.getItem is not a function` зі `services/storage.ts`.
 *
 * Небезпека тут не в самому виключенні — фасад його ловить, на те він і
 * писався. Небезпека в тому, що після першої відмови фасад назавжди ставить
 * `available = false`, і КОЖЕН наступний тест у тому самому файлі бачить
 * сховище недоступним. Тест, який перевіряє поведінку зі збереженим значенням,
 * лишався б зеленим, нічого не перевіривши: значення просто ніколи не
 * зберігається.
 */
if (typeof globalThis.localStorage?.getItem !== 'function') {
	const makeStorage = (): Storage => {
		const data = new Map<string, string>();
		return {
			get length() {
				return data.size;
			},
			key: (i: number) => [...data.keys()][i] ?? null,
			getItem: (k: string) => data.get(k) ?? null,
			setItem: (k: string, v: string) => void data.set(k, String(v)),
			removeItem: (k: string) => void data.delete(k),
			clear: () => data.clear()
		} as Storage;
	};

	Object.defineProperty(globalThis, 'localStorage', {
		value: makeStorage(),
		configurable: true,
		writable: true
	});
	Object.defineProperty(globalThis, 'sessionStorage', {
		value: makeStorage(),
		configurable: true,
		writable: true
	});
}

if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
	window.matchMedia = (query: string): MediaQueryList => {
		const list: MediaQueryList = {
			matches: false,
			media: query,
			onchange: null,
			addEventListener: () => {},
			removeEventListener: () => {},
			// Застарілі, але `svelte/reactivity` і частина бібліотек їх ще кличуть.
			addListener: () => {},
			removeListener: () => {},
			dispatchEvent: () => false
		};
		return list;
	};
}
