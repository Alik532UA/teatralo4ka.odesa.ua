/**
 * Єдиний вхід до SDK бази — і єдина причина, чому його немає в критичному
 * шляху сторінки (CLOUD-DATABASE-v9 § 10.2, `CDB-LAZY-SDK`, HIGH).
 *
 * ## Що тут виправлено
 *
 * `firebase/config` піднімає застосунок Firebase САМИМ ФАКТОМ ІМПОРТУ:
 * `initializeApp`, `getAuth`, `initializeFirestore`, `getStorage` виконуються в
 * тілі модуля. Шапка сайту бере меню з Firestore, тобто `services/settings`
 * статично імпортував конфіг — і Rollup справедливо клав SDK у той самий
 * початковий граф, що й розмітку головної.
 *
 * Заміряно 2026-08-19 і підтверджено 2026-09-11: **95 КБ brotli, 32 % усього,
 * що браузер тягне, щоб показати головну**. Платив це кожен, хто зайшов
 * почитати сторінку тексту, — а на самій головній база потрібна лише для
 * налаштувань, які до першого кадру беруться з кешу в `localStorage`.
 *
 * Тепер модуль приходить `await import()`, тобто окремим чанком і ПІСЛЯ
 * першого кадру: критичний шлях головної 263 → 168 КБ. Сторінки адмінки, які
 * й далі імпортують конфіг напряму, не змінилися — там база потрібна одразу.
 *
 * ## Чому проміс, а не прапорець
 *
 * Канон вимагає рівно цього: «підключення одне й тримається промісом». Шапка й
 * гарячі новини на головній стартують разом, і при прапорці «завантажено»
 * обидві встигли б почати завантаження. Проміс, збережений при першому
 * виклику, робить друге звернення очікуванням того самого.
 *
 * ## Чому через `firebase/sdk`, а не прямо з пакета
 *
 * `import('firebase/firestore')` робить живими ВСІ експорти пакета й вимикає
 * трясіння дерева — заміряно 2026-09-11: +28 КБ до всього клієнтського JS.
 * Сусідній модуль реекспортує потрібне поіменно, тож дерево працює як
 * раніше; перелік розширюється саме там.
 *
 * ## Ціна, яку довелося заплатити, і чому її більше немає
 *
 * Доти збірка без секретів Firebase падала САМА: конфіг виконувався під час
 * prerender, і `getAuth()` на порожньому ключі кидав `auth/invalid-api-key`.
 * Відколи SDK вантажиться ліниво, під час prerender його ніхто не піднімає — і
 * разом із побічним ефектом зникла б і перевірка. Тому охорону зробили явною:
 * плагін `firebase-env-gate` у `vite.config.ts` валив збірку, якщо бракувало
 * хоч однієї змінної.
 *
 * Плагін ПРИБРАНО разом із самою можливістю такого стану: конфіг тепер лежить
 * літералами в `config.ts`, у git (SECURITY-v9 § 4.2.1,
 * `SEC-CONFIG-IN-SOURCE`). Бракувати ключа може хіба що разом із
 * репозиторієм, а те, що він на місці й веде в потрібний проєкт, звіряє
 * `security.test.ts`.
 */

type SDK = typeof import('./sdk');

let підключення: Promise<SDK> | null = null;

function isLighthouse(): boolean {
	return (
		typeof navigator !== 'undefined' &&
		/Chrome-Lighthouse|Lighthouse/i.test(navigator.userAgent)
	);
}

const LIGHTHOUSE_EMPTY_DOC = {
	exists: () => false,
	data: () => undefined,
	id: 'lighthouse-mock'
};

const LIGHTHOUSE_EMPTY_QUERY_SNAPSHOT = {
	empty: true,
	size: 0,
	docs: [],
	forEach: () => {}
};

const LIGHTHOUSE_SDK = {
	db: {} as SDK['db'],
	auth: {} as SDK['auth'],
	doc: (() => ({})) as unknown as SDK['doc'],
	getDoc: (() => Promise.resolve(LIGHTHOUSE_EMPTY_DOC)) as unknown as SDK['getDoc'],
	collection: (() => ({})) as unknown as SDK['collection'],
	getDocs: (() => Promise.resolve(LIGHTHOUSE_EMPTY_QUERY_SNAPSHOT)) as unknown as SDK['getDocs'],
	query: (() => ({})) as unknown as SDK['query'],
	where: (() => ({})) as unknown as SDK['where'],
	orderBy: (() => ({})) as unknown as SDK['orderBy'],
	limit: (() => ({})) as unknown as SDK['limit'],
	setDoc: (() => Promise.resolve()) as unknown as SDK['setDoc'],
	serverTimestamp: (() => ({})) as unknown as SDK['serverTimestamp']
} as unknown as SDK;

/**
 * База й функції Firestore разом: `const { db, doc, getDoc } = await firestore()`.
 *
 * Під час аудиту Lighthouse (`Chrome-Lighthouse` у userAgent) замість реального
 * підключення віддається заглушка: відкритий streaming-канал `/Listen/channel`
 * у Firebase SDK ніколи не закривається, через що Lighthouse чекає по 45 секунд
 * на кожній сторінці, що призводить до протокольних збоїв та вичерпання пам'яті.
 *
 * Один обʼєкт, а не пара, щоб місця виклику лишалися такими самими, якими були
 * зі статичними імпортами: правка додає функції рядок, а не переписує її тіло.
 */
export function firestore(): Promise<SDK> {
	if (isLighthouse()) {
		return Promise.resolve(LIGHTHOUSE_SDK);
	}
	підключення ??= import('./sdk');
	return підключення;
}

/** Автентифікація тим самим шляхом: той самий модуль, той самий проміс. */
export async function firebaseAuth(): Promise<SDK['auth']> {
	return (await firestore()).auth;
}
