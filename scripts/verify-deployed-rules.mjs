/**
 * ЧИ СПРАВДІ В БАЗІ ТЕ, ЩО В GIT — перевірка ПІСЛЯ викладення.
 *
 * ## Навіщо, якщо крок деплою щойно відзвітував успіхом
 *
 * Бо «команда не впала» і «в базі тепер ця редакція» — різні твердження.
 * `--only` міг не покрити файл, проєкт міг бути не той, крок міг бути
 * пропущений умовою `if`. Жоден із цих випадків не робить прогін червоним, а
 * результат у всіх один: у базі лишаються старі правила
 * (CLOUD-DATABASE-v9 § 2.3, `CDB-RULES-READBACK`).
 *
 * Що це коштує, показав сусідній `Slovko`: там у Firestore лежала редакція,
 * коротша за файл на 4021 байт, і серпнева ревізія з виправленням трьох
 * проломів не доїхала жодного разу. Тут ціна була б вищою: `check:rules`
 * ганяє 29 випадків на ЕМУЛЯТОРІ, тобто зелений гейт означає «файл
 * правильний», а не «база захищена».
 *
 * ## Звідки береться, ДО ЯКОЇ бази йти
 *
 * З того самого файлу, який читає застосунок, — `src/lib/firebase/config.ts`.
 * Не з оточення й не з окремої копії: питання «а куди це поїхало» має мати
 * одну відповідь, інакше перевірка може сумлінно звіряти правила чужого
 * проєкту й бути при цьому зеленою (SECURITY-v9 § 4.2.1,
 * `SEC-CONFIG-IN-SOURCE`).
 *
 * ## Чому порівнюється зміст, а не байти
 *
 * Відступи й переноси віддає Firebase у своєму форматуванні, а не в нашому.
 * Розбіжність у них означала б «розійшлося» там, де нічого не розійшлося, — і
 * такий звіт перестали б читати вже на другий раз.
 *
 * ## Запуск
 *
 *   GOOGLE_APPLICATION_CREDENTIALS=… node scripts/verify-deployed-rules.mjs
 *
 * Лише читання. Нічого не міняє й нічого не викладає.
 */
import { createSign } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';

const CONFIG_SOURCE = 'src/lib/firebase/config.ts';
const RULES_FILE = 'firebase/firestore.rules';
const KEY_FILE = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!KEY_FILE) {
	console.error('Потрібен GOOGLE_APPLICATION_CREDENTIALS.');
	process.exit(2);
}

/** @param {string} field */
function fromConfig(field) {
	const source = readFileSync(CONFIG_SOURCE, 'utf8');
	const value = new RegExp(`${field}:\\s*["']([^"']+)["']`).exec(source)?.[1];
	if (!value) {
		console.error(`У ${CONFIG_SOURCE} немає поля ${field} — перевірка не знає, куди йти.`);
		process.exit(2);
	}
	return value;
}

const PROJECT = fromConfig('projectId');
const key = JSON.parse(readFileSync(KEY_FILE, 'utf8'));

const base64url = (s) =>
	Buffer.from(s).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function token() {
	const now = Math.floor(Date.now() / 1000);
	const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
	const claims = base64url(
		JSON.stringify({
			iss: key.client_email,
			scope: 'https://www.googleapis.com/auth/cloud-platform',
			aud: 'https://oauth2.googleapis.com/token',
			iat: now,
			exp: now + 3600
		})
	);
	const sign = createSign('RSA-SHA256');
	sign.update(`${header}.${claims}`);
	const res = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
			assertion: `${header}.${claims}.${sign.sign(key.private_key, 'base64url')}`
		})
	});
	const body = await res.json();
	if (!res.ok) throw new Error(`токен: ${res.status} ${JSON.stringify(body)}`);
	return body.access_token;
}

const squeeze = (text) => text.replace(/\s+/g, ' ').trim();

console.log(`Проєкт: ${PROJECT}`);

/*
 * Ключ сервісного акаунта тут доречний, бо читається ТЕКСТ правил, а не
 * робиться запит до даних. Проба запитом під цим токеном не довела б нічого:
 * він обходить правила цілком і відповідав би «дозволено» навіть на порожній
 * базі (CLOUD-DATABASE-v9 § 2.3, `CDB-PROBE-NOT-AS-ADMIN`).
 */
if (!existsSync(RULES_FILE)) {
	console.error(`Немає ${RULES_FILE} — перевірка дивиться не туди.`);
	process.exit(2);
}

const t = await token();
const rel = await fetch(`https://firebaserules.googleapis.com/v1/projects/${PROJECT}/releases`, {
	headers: { Authorization: `Bearer ${t}` }
});
if (!rel.ok) {
	console.error(`  Firestore: перелік релізів дав ${rel.status}`);
	process.exit(1);
}

const release = ((await rel.json()).releases ?? []).find((r) => r.name.endsWith('cloud.firestore'));
if (!release) {
	console.error('  Firestore: жодного релізу правил — у базі типові');
	process.exit(1);
}

const rs = await fetch(`https://firebaserules.googleapis.com/v1/${release.rulesetName}`, {
	headers: { Authorization: `Bearer ${t}` }
});
const ruleset = await rs.json();
const live = (ruleset.source?.files ?? []).map((f) => f.content).join('\n');
const local = readFileSync(RULES_FILE, 'utf8');

/*
 * Дата з RULESET, а не з release: `release.createTime` — це коли вперше
 * створили сам ВКАЗІВНИК на правила, і він не міняється ніколи. У щойно
 * виконаному деплої звіт писав би дату кількарічної давності, тобто зелений
 * прогін повідомляв би неправду. Виміряно на `MindStep`.
 */
const коли = ruleset.createTime ?? release.updateTime ?? '(дата невідома)';

if (squeeze(live) !== squeeze(local)) {
	console.error(
		`  Firestore: РОЗІЙШЛОСЯ — у базі ${live.length}, у ${RULES_FILE} ${local.length}, ` +
			`цей текст викладено ${коли}`
	);
	console.error('\nУ базі не те, що в репозиторії.');
	process.exit(1);
}

console.log(`  Firestore: збігається (${live.length} символів), цей текст викладено ${коли}`);
console.log('\nПеревірено 1: у базі те саме, що в git.');
