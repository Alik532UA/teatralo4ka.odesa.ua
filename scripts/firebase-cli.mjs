/**
 * Запустити Firebase CLI, не ставлячи його в залежності проєкту.
 *
 * Використання: `node scripts/firebase-cli.mjs emulators:exec --only firestore "…"`.
 *
 * ЧОМУ НЕ devDependency. `firebase-tools` тягне `superstatic`, який оголошує
 * `node: "20 || 22 || 24"`. У проєкті стоїть `engine-strict=true` (`.npmrc`) —
 * свідоме рішення, бо саме воно ловить розходження версії Node між машиною й
 * CI. Разом це означає, що на Node 25 (машина автора) падає не встановлення
 * `firebase-tools`, а `npm install` ЦІЛКОМ: жодну залежність поставити не
 * вдається. Тобто інструмент для перевірки правил зламав би щоденну роботу над
 * рештою проєкту. Розгорнуто — DEPENDENCIES-v8 § 2.4.
 *
 * ЧОМУ НЕ ПРОСТО npx. `npx` читає `.npmrc` із поточної теки, тож упирається в
 * той самий `engine-strict` і навіть не завантажує пакет.
 *
 * ЧОМУ НЕ `npm ci --legacy-peer-deps`. Це знімає перевірку peer-залежностей для
 * УСЬОГО дерева заради одного пакета — тобто гасить сигнал там, де він потрібен.
 *
 * ЩО РОБИТЬ ЦЕ. Знімає перевірку рушія РІВНО для цього одного виклику, через
 * змінну оточення дочірнього процесу. Тут це безпечно: CLI ніколи не потрапляє
 * ні в бандл, ні в браузер відвідувача.
 *
 * ЧОМУ ЦЕ НЕ РЯДОК У package.json. Префікс `VAR=value команда` — синтаксис
 * POSIX-оболонки. На Windows npm-скрипти йдуть через `cmd.exe`, де такий рядок
 * не запускається взагалі, а `check:rules` мусить працювати на машині автора так
 * само, як у CI.
 *
 * Форма взята з `Slovko` і `VetCrewGames`, де той самий гейт уже стоїть: три
 * різні реалізації однієї обгортки — це три різні набори пасток.
 */
import { spawn } from 'node:child_process';

const args = process.argv.slice(2);
if (args.length === 0) {
	console.error('firebase-cli.mjs: потрібні аргументи для firebase CLI');
	process.exit(2);
}

/** Мажор фіксуємо: `latest` міняв би поведінку гейта без жодного коміту. */
const CLI = 'firebase-tools@15';

/*
 * Аргументи склеюються в РЯДОК, і пробільні беруться в лапки вручну.
 *
 * Оболонка тут обов'язкова: на Windows `npx` — це `npx.cmd`, а Node з версії 18
 * навмисно відмовляється запускати `.cmd` без `shell: true`. Але з оболонкою
 * масив аргументів просто конкатенується, тож `emulators:exec "node scripts/…"`
 * розпався б на два аргументи, і CLI сказав би «Too many arguments».
 */
const command = [
	'npx',
	'--yes',
	CLI,
	...args.map((arg) => (/\s/.test(arg) ? `"${arg}"` : arg))
].join(' ');

const child = spawn(command, {
	stdio: 'inherit',
	shell: true,
	env: { ...process.env, npm_config_engine_strict: 'false' }
});

child.on('error', (error) => {
	console.error('firebase-cli.mjs: не вдалося запустити npx —', error.message);
	process.exit(1);
});

// Код виходу передається НАСКРІЗЬ: гейт, який завжди повертає 0, — це не гейт.
child.on('exit', (code, signal) => {
	if (signal) {
		console.error(`firebase-cli.mjs: процес зупинено сигналом ${signal}`);
		process.exit(1);
	}
	process.exit(code ?? 1);
});
