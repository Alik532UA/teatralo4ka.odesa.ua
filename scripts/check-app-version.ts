import fs from 'fs';

/**
 * Файл версії в ЗІБРАНОМУ сайті (VERSIONING-v8 § 6).
 *
 * Інваріант `src/version.test.ts` звіряє `static/app-version.json` із
 * `package.json` — тобто перевіряє РЕПОЗИТОРІЙ. Але `services/version.ts` тягне
 * не репозиторій, а `/app-version.json` із хостингу, і між цими двома файлами
 * стоїть збірка: копіювання `static/`, `paths.base`, перезапис однойменним
 * артефактом. У PROJECT-CONTEXT це роками стояло рядком боргу з планом «перевірка
 * над `build/app-version.json` у postbuild» — ось вона.
 *
 * Що саме тут ловиться і чого не ловить жоден інший гейт:
 *
 * 1. Файла у збірці немає взагалі. Це не гіпотетично: досить виключити `static/`
 *    з копіювання або перейменувати файл — і механізм оновлення мовчки
 *    вимикається на всіх. Симптом нульовий: сайт працює, нова версія просто
 *    ніколи не долітає до відкритої вкладки.
 * 2. Версія у збірці розійшлася з `package.json`. Несиметрично дорого: файл
 *    позаду — оновлення не спрацює; файл попереду — кожен відвідувач отримає
 *    примусове перезавантаження на версію, якої в збірці немає.
 * 3. У файлі з'явилися дані моменту збірки. Тоді кожен локальний білд бруднить
 *    дерево, і ця зміна раз по раз їде в чужі коміти — рівно те, що ловить
 *    `git diff --exit-code` у CI, але вже після того, як зламало чийсь коміт.
 * 4. Файл є, а JSON у ньому зламаний. Для `services/version.ts` це справжня
 *    помилка (§ 4.3), тобто впаде вона в браузері відвідувача, а не тут — якщо
 *    тут не подивитися.
 */

const BUILD_FILE = 'build/app-version.json';

function fail(message: string): never {
	console.error(`❌ ${message}`);
	process.exit(1);
}

function main() {
	if (!fs.existsSync('build')) {
		fail('build/ не існує — файл версії перевіряється після збірки');
	}

	if (!fs.existsSync(BUILD_FILE)) {
		fail(
			`${BUILD_FILE} немає у збірці — механізм оновлення мовчки не працює: ` +
				'services/version.ts тягне саме цю адресу, і 404 для нього виглядає як «оновлень немає»'
		);
	}

	const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')) as { version: string };

	let built: Record<string, unknown>;
	try {
		built = JSON.parse(fs.readFileSync(BUILD_FILE, 'utf8')) as Record<string, unknown>;
	} catch (e) {
		fail(`${BUILD_FILE}: зламаний JSON — у браузері відвідувача це справжня помилка (${e})`);
	}

	if (built.version !== pkg.version) {
		fail(
			`${BUILD_FILE}: версія ${JSON.stringify(built.version)} проти ${JSON.stringify(pkg.version)} ` +
				'у package.json. Позаду — оновлення не спрацює; попереду — примусове ' +
				'перезавантаження на версію, якої у збірці немає. Виправляє `npm run bump-version`'
		);
	}

	const keys = Object.keys(built);
	if (keys.length !== 1 || keys[0] !== 'version') {
		fail(
			`${BUILD_FILE}: очікується єдиний ключ "version", а є [${keys.join(', ')}]. ` +
				'Дані моменту збірки роблять дерево брудним після кожного локального білда'
		);
	}

	console.log(`🏷️  версія у збірці: ${pkg.version} (${BUILD_FILE})`);
}

main();
