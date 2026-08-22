/**
 * Перевірка правил доступу Firestore над емулятором (CLOUD-DATABASE-v8, CDB-RULES-GATE).
 *
 * Запускати: `npm run check:rules` — скрипт сам піднімає емулятор.
 *
 * ## Навіщо це поверх наявного `src/firestore-rules.test.ts`
 *
 * Той інваріант СТАТИЧНИЙ: він звіряє allowlist полів у правилі зі Zod-схемою й
 * ловить рівно один (дуже тихий) клас — поле, додане в код і не додане в
 * правило. Він не виконує правил і тому не може сказати, чи адміністратор
 * справді може зберегти статтю і чи справді не може підвищити себе до
 * суперадміна.
 *
 * До цього скрипта правила в цьому проєкті були єдиною частиною, стан якої не
 * видно НІДЕ: ні в `src/`, ні у `build/`, ні в жодному гейті. Докблок
 * статичного інваріанта це й визнавав: «CI їх навіть не деплоїть — це ручний
 * крок». Аудит канону v8 (прохід 4) назвав це CRITICAL: три інші проєкти з
 * клієнтським доступом до бази гейт мають, цей — ні.
 *
 * ## Чому окремий скрипт, а не файл під vitest
 *
 * Файл під vitest, який вимагає живого емулятора, у звичайному прогоні або
 * падає, або тихо пропускається — тобто стає перевіркою, якої не запускає ніхто
 * (AI-AGENT-PITFALLS-v8 § 1.3). Тут навпаки: команда сама піднімає емулятор і
 * повертає код виходу.
 *
 * ## Чому `fetch`, а не firebase-admin
 *
 * `firebase-admin` ходить в ОБХІД правил — він перевіряв би не те. Тут
 * звичайний REST із токеном звичайного користувача: він проходить крізь правила
 * так само, як клієнтський SDK.
 *
 * ## Чому `:commit` із `setToServerValue`, а не простий `createDocument`
 *
 * Правило вимагає `request.resource.data.createdAt == request.time`. Літеральний
 * час, надісланий клієнтом, цю умову не задовольняє НІКОЛИ — і саме тому вона
 * там і стоїть. Клієнтський SDK ставить сюди сентинел `serverTimestamp()`, а в
 * REST це `FieldTransform.setToServerValue: REQUEST_TIME`, доступний лише в
 * `:commit`. Через `createDocument` перевірити цей клас неможливо в принципі:
 * позитивні випадки виглядали б забороненими, і гейт «ловив» би те, чого немає.
 *
 * ## Засівання даних
 *
 * Правила цього проєкту майже все виводять із документа `users/{uid}`
 * (`get()`-виклики в `belongsToProject`, `hasArticlePerm`, `canManageTarget`).
 * Створити перший такий документ клієнтським шляхом не можна за задумом — у
 * продакшні це робиться поза застосунком. Тому засів іде через документований
 * адмін-обхід емулятора (`Authorization: Bearer owner`), а САМІ ВИПАДКИ — уже
 * звичайними токенами. Засів не є предметом перевірки; предмет — те, що правила
 * роблять із запитами реальних користувачів.
 *
 * ## Зворотний експеримент усередині
 *
 * Половина очікувань — «застосунок мусить це вміти», половина — «сторонній не
 * мусить цього могти». Скрипт валить прогін, якщо один із наборів порожній:
 * перевірка лише з позитивних випадків зеленіє на правилі `allow read, write: if true`.
 *
 * ## Порти й найчастіша пастка прогону
 *
 * Порти в `firebase.json` навмисно не типові (8084 / 9096 / UI 4030): типові
 * 8080 і 9099 займе перший запущений проєкт, а другий або впаде, або
 * підключиться до бази сусіда й перевірить ЧУЖІ правила — зелений гейт на
 * правилах, яких він не читав. Реєстр портів усіх проєктів — у
 * `PROJECT-CONTEXT.md`.
 *
 * Після аварійного падіння емулятор лишає порт зайнятим, і наступний прогін
 * каже «Could not start Firestore Emulator, port taken». Знімати:
 * `netstat -ano | grep 8084` → `taskkill //PID <pid> //F`.
 */

const FS_HOST = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8084';
const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? '127.0.0.1:9096';
const PROJECT = process.env.GCLOUD_PROJECT ?? 'demo-teatralo4ka';

const BASE = `http://${FS_HOST}/v1/projects/${PROJECT}/databases/(default)/documents`;
const COMMIT = `http://${FS_HOST}/v1/projects/${PROJECT}/databases/(default)/documents:commit`;

/** Школа, у межах якої живуть усі випадки. Реальний `projectId` сайту. */
const SCHOOL = 'teatralo4ka';
/** Чужа школа — для перевірки межі «сторонній зі своїм доступом». */
const OTHER_SCHOOL = 'inshaskola';

// ---------------------------------------------------------------- автентифікація

async function signIn(label) {
	const res = await fetch(
		`http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=emulator`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: `${label}@example.test`,
				password: 'emulator-only',
				returnSecureToken: true
			})
		}
	);
	if (!res.ok) throw new Error(`емулятор Auth не дав токен для ${label}: ${res.status}`);
	const body = await res.json();
	return { uid: body.localId, token: body.idToken, email: `${label}@example.test` };
}

const auth = (token) => (token ? { Authorization: `Bearer ${token}` } : {});
/** Документований адмін-обхід емулятора — лише для засіву. */
const OWNER = { Authorization: 'Bearer owner' };

// ------------------------------------------------------------ кодування значень

const value = (raw) => {
	if (raw === null || raw === undefined) return { nullValue: null };
	if (typeof raw === 'string') return { stringValue: raw };
	if (typeof raw === 'boolean') return { booleanValue: raw };
	if (typeof raw === 'number')
		return Number.isInteger(raw) ? { integerValue: String(raw) } : { doubleValue: raw };
	if (raw instanceof Date) return { timestampValue: raw.toISOString() };
	if (Array.isArray(raw)) return { arrayValue: { values: raw.map(value) } };
	return {
		mapValue: { fields: Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, value(v)])) }
	};
};
const fields = (data) => Object.fromEntries(Object.entries(data).map(([k, v]) => [k, value(v)]));

// ------------------------------------------------------------------- операції

async function read(path, token) {
	return (await fetch(`${BASE}/${path}`, { headers: auth(token) })).status;
}

async function seed(path, data) {
	const res = await fetch(`${BASE}/${path.split('/').slice(0, -1).join('/')}?documentId=${path.split('/').pop()}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...OWNER },
		body: JSON.stringify({ fields: fields(data) })
	});
	if (res.status < 200 || res.status >= 300) {
		throw new Error(`засів ${path} не вдався: ${res.status} ${await res.text()}`);
	}
}

/**
 * Запис через `:commit`. `serverFields` отримують `REQUEST_TIME` — єдиний спосіб
 * задовольнити `== request.time` (див. докблок вище).
 *
 * @param {string} path документ без префікса `documents/`
 * @param {Record<string, unknown>} data поля-літерали
 * @param {string[]} serverFields поля, які має виставити сервер
 * @param {string | null} token токен користувача
 * @param {boolean | undefined} mustNotExist `currentDocument.exists = false` для create
 */
async function write(path, data, serverFields, token, mustNotExist) {
	const update = { name: `projects/${PROJECT}/databases/(default)/documents/${path}`, fields: fields(data) };
	const entry = {
		update,
		updateTransforms: serverFields.map((f) => ({ fieldPath: f, setToServerValue: 'REQUEST_TIME' }))
	};
	if (mustNotExist === true) entry.currentDocument = { exists: false };
	// `updateMask` не задаємо: без нього `update` замінює документ цілком, і
	// `request.resource.data` у правилі дорівнює саме тому, що ми надіслали.
	const res = await fetch(COMMIT, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...auth(token) },
		body: JSON.stringify({ writes: [entry] })
	});
	return res.status;
}

async function remove(path, token) {
	return (await fetch(`${BASE}/${path}`, { method: 'DELETE', headers: auth(token) })).status;
}

// --------------------------------------------------------------------- засів

const admin = await signIn('admin');
const outsider = await signIn('outsider');
const superadmin = await signIn('superadmin');

const FULL_PERMS = {
	canCreateArticles: true,
	canEditArticles: true,
	canDeleteArticles: true,
	canCreatePages: true,
	canEditPages: true,
	canDeletePages: true,
	canManageUsers: true,
	canManageSettings: true
};

await seed(`users/${admin.uid}`, {
	email: admin.email,
	isSuperAdmin: false,
	projects: { [SCHOOL]: { role: 'admin', permissions: FULL_PERMS } },
	projectIds: [SCHOOL],
	lastModifiedProject: SCHOOL,
	createdAt: new Date('2026-01-01T00:00:00Z')
});

await seed(`users/${outsider.uid}`, {
	email: outsider.email,
	isSuperAdmin: false,
	projects: { [OTHER_SCHOOL]: { role: 'admin', permissions: FULL_PERMS } },
	projectIds: [OTHER_SCHOOL],
	lastModifiedProject: OTHER_SCHOOL,
	createdAt: new Date('2026-01-01T00:00:00Z')
});

await seed(`users/${superadmin.uid}`, {
	email: superadmin.email,
	isSuperAdmin: true,
	projects: {},
	projectIds: [],
	lastModifiedProject: SCHOOL,
	createdAt: new Date('2026-01-01T00:00:00Z')
});

/** Мінімальна валідна стаття у формі, яку пише сама адмінка. */
const article = (over = {}) => ({
	title: 'Проба',
	content: 'Текст',
	category: 'news',
	lang: 'uk',
	author: 'Гейт',
	isPublished: true,
	...over
});

await seed(`projects/${SCHOOL}/articles/published`, {
	...article(),
	createdAt: new Date('2026-01-01T00:00:00Z'),
	updatedAt: new Date('2026-01-01T00:00:00Z')
});
await seed(`projects/${SCHOOL}/articles/draft`, {
	...article({ isPublished: false, title: 'Чернетка' }),
	createdAt: new Date('2026-01-01T00:00:00Z'),
	updatedAt: new Date('2026-01-01T00:00:00Z')
});
await seed(`projects/${SCHOOL}/settings/home`, { updatedAt: new Date('2026-01-01T00:00:00Z') });
await seed(`projects/${SCHOOL}/settings/secretpanel`, { updatedAt: new Date('2026-01-01T00:00:00Z') });

// ------------------------------------------------------------------- випадки

const TIMES = ['createdAt', 'updatedAt'];

const CASES = [
	// --- застосунок мусить це вміти ---
	{
		name: 'гість читає опубліковану статтю',
		allowed: true,
		run: () => read(`projects/${SCHOOL}/articles/published`, null)
	},
	{
		name: 'гість читає публічні налаштування (home)',
		allowed: true,
		run: () => read(`projects/${SCHOOL}/settings/home`, null)
	},
	{
		name: 'адмін школи читає чернетку',
		allowed: true,
		run: () => read(`projects/${SCHOOL}/articles/draft`, admin.token)
	},
	{
		name: 'адмін школи створює статтю (час — від сервера)',
		allowed: true,
		run: () => write(`projects/${SCHOOL}/articles/new-1`, article(), TIMES, admin.token, true)
	},
	{
		name: 'адмін школи редагує статтю (createdAt збережено)',
		allowed: true,
		run: () =>
			write(
				`projects/${SCHOOL}/articles/published`,
				{ ...article({ title: 'Оновлено' }), createdAt: new Date('2026-01-01T00:00:00Z') },
				['updatedAt'],
				admin.token
			)
	},
	{
		name: 'адмін школи створює сторінку (type=page)',
		allowed: true,
		run: () =>
			write(
				`projects/${SCHOOL}/articles/page-1`,
				article({ type: 'page', slug: 'pro_shkolu' }),
				TIMES,
				admin.token,
				true
			)
	},
	{
		name: 'адмін школи зберігає налаштування зі whitelist',
		allowed: true,
		run: () => write(`projects/${SCHOOL}/settings/header`, {}, ['updatedAt'], admin.token)
	},
	{
		name: 'адмін читає свій документ користувача',
		allowed: true,
		run: () => read(`users/${admin.uid}`, admin.token)
	},
	{
		name: 'суперадмін читає документ чужого користувача',
		allowed: true,
		run: () => read(`users/${admin.uid}`, superadmin.token)
	},
	{
		name: 'адмін школи видаляє свою статтю',
		allowed: true,
		run: () => remove(`projects/${SCHOOL}/articles/new-1`, admin.token)
	},

	// --- сторонній не мусить цього могти ---
	{
		name: 'гість читає ЧЕРНЕТКУ',
		allowed: false,
		run: () => read(`projects/${SCHOOL}/articles/draft`, null)
	},
	{
		name: 'гість читає налаштування ПОЗА whitelist',
		allowed: false,
		run: () => read(`projects/${SCHOOL}/settings/secretpanel`, null)
	},
	{
		name: 'гість створює статтю',
		allowed: false,
		run: () => write(`projects/${SCHOOL}/articles/guest`, article(), TIMES, null, true)
	},
	{
		name: 'адмін ЧУЖОЇ школи читає чернетку',
		allowed: false,
		run: () => read(`projects/${SCHOOL}/articles/draft`, outsider.token)
	},
	{
		name: 'адмін ЧУЖОЇ школи створює статтю тут',
		allowed: false,
		run: () => write(`projects/${SCHOOL}/articles/foreign`, article(), TIMES, outsider.token, true)
	},
	{
		// Головний клас, який знімає `setToServerValue`: літеральний час не
		// дорівнює `request.time`, і саме тому правило його не пускає.
		name: 'адмін підробляє createdAt літеральним часом',
		allowed: false,
		run: () =>
			write(
				`projects/${SCHOOL}/articles/faketime`,
				{ ...article(), createdAt: new Date('2000-01-01T00:00:00Z') },
				['updatedAt'],
				admin.token,
				true
			)
	},
	{
		name: 'адмін створює статтю з НЕВІДОМИМ полем',
		allowed: false,
		run: () =>
			write(
				`projects/${SCHOOL}/articles/extra`,
				article({ pwned: 'так' }),
				TIMES,
				admin.token,
				true
			)
	},
	{
		// Рівно той клас, який ловить статичний `src/firestore-rules.test.ts`, —
		// тут він перевірений виконанням, а не звіркою текстів.
		name: 'адмін створює статтю з невідомим ключем ПЕРЕКЛАДУ',
		allowed: false,
		run: () =>
			write(
				`projects/${SCHOOL}/articles/badtranslation`,
				article({ translations: { uk: { title: 'Так', pwned: 'ні' } } }),
				TIMES,
				admin.token,
				true
			)
	},
	{
		name: 'адмін створює статтю з заголовком понад 150 символів',
		allowed: false,
		run: () =>
			write(
				`projects/${SCHOOL}/articles/longtitle`,
				article({ title: 'я'.repeat(151) }),
				TIMES,
				admin.token,
				true
			)
	},
	{
		name: 'адмін створює статтю з мовою поза переліком',
		allowed: false,
		run: () =>
			write(
				`projects/${SCHOOL}/articles/badlang`,
				article({ lang: 'de' }),
				TIMES,
				admin.token,
				true
			)
	},
	{
		name: 'адмін перекласифіковує статтю в сторінку',
		allowed: false,
		run: () =>
			write(
				`projects/${SCHOOL}/articles/published`,
				{
					...article({ type: 'page', slug: 'pidmina' }),
					createdAt: new Date('2026-01-01T00:00:00Z')
				},
				['updatedAt'],
				admin.token
			)
	},
	{
		name: 'адмін пише налаштування з id ПОЗА whitelist',
		allowed: false,
		run: () => write(`projects/${SCHOOL}/settings/secretpanel`, {}, ['updatedAt'], admin.token)
	},
	{
		// Названий канонічний негативний випадок (CDB-FIELD-SCOPED-UPDATE):
		// «учасник підвищує себе до господаря».
		name: 'адмін ПІДВИЩУЄ СЕБЕ до суперадміна',
		allowed: false,
		run: () =>
			write(
				`users/${admin.uid}`,
				{
					email: admin.email,
					isSuperAdmin: true,
					projects: { [SCHOOL]: { role: 'admin', permissions: FULL_PERMS } },
					projectIds: [SCHOOL],
					lastModifiedProject: SCHOOL,
					createdAt: new Date('2026-01-01T00:00:00Z')
				},
				[],
				admin.token
			)
	},
	{
		name: 'адмін дописує собі ЧУЖУ школу',
		allowed: false,
		run: () =>
			write(
				`users/${admin.uid}`,
				{
					email: admin.email,
					isSuperAdmin: false,
					projects: {
						[SCHOOL]: { role: 'admin', permissions: FULL_PERMS },
						[OTHER_SCHOOL]: { role: 'admin', permissions: FULL_PERMS }
					},
					projectIds: [SCHOOL, OTHER_SCHOOL],
					lastModifiedProject: OTHER_SCHOOL,
					createdAt: new Date('2026-01-01T00:00:00Z')
				},
				[],
				admin.token
			)
	},
	{
		name: 'сторонній читає документ адміна',
		allowed: false,
		run: () => read(`users/${admin.uid}`, outsider.token)
	},
	{
		name: 'неавторизований читає документ користувача',
		allowed: false,
		run: () => read(`users/${admin.uid}`, null)
	},
	{
		name: 'адмін читає документ школи як колекцію (list)',
		allowed: false,
		run: () => read('projects?pageSize=5', null)
	},
	{
		// Catch-all `allow read, write: if false` — і саме тому нова колекція
		// вимагає правила, а не просто коду.
		name: 'довільна нова колекція (catch-all)',
		allowed: false,
		run: () => write('hackers/pwn', { any: 1 }, [], admin.token, true)
	},
	{
		name: 'довільна нова підколекція школи',
		allowed: false,
		run: () => write(`projects/${SCHOOL}/backdoor/x`, { any: 1 }, [], admin.token, true)
	}
];

// -------------------------------------------------------------------- прогін

const problems = [];
let positives = 0;

for (const { name, allowed, run } of CASES) {
	if (allowed) positives++;
	const status = await run();
	const ok = status >= 200 && status < 300;
	const verdict = ok ? 'ДОЗВОЛЕНО' : `ЗАБОРОНЕНО(${status})`;
	console.log(`  ${ok === allowed ? '✓' : '✗'} ${verdict.padEnd(18)} ${name}`);
	if (ok !== allowed) {
		problems.push(
			`${name}: очікувалося ${allowed ? 'дозволено' : 'заборонено'}, отримано ${verdict}`
		);
	}
}

const negatives = CASES.length - positives;
if (positives === 0 || negatives === 0) {
	console.error(
		'\nПеревірка вироджена: потрібні і позитивні, і негативні випадки. ' +
			'Лише позитивні зеленіли б і на правилі `allow read, write: if true`.'
	);
	process.exit(1);
}

if (problems.length) {
	console.error(`\nПравила доступу не відповідають очікуванням (${problems.length}):`);
	for (const problem of problems) console.error(`  - ${problem}`);
	process.exit(1);
}

console.log(
	`\nПравила доступу: ${CASES.length} перевірок (${positives} дозволено, ${negatives} заборонено), розбіжностей немає.`
);
