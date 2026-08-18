import fs from 'fs';
import path from 'path';

/**
 * Бюджет розміру клієнтського бандла (PERFORMANCE-v8).
 *
 * До цього перевірки не було жодної, і розмір міг рости непомітно: жоден гейт
 * його не бачив, а оком приріст у 30 КБ на коміт не помічається взагалі. Саме
 * так важка бібліотека потрапляє в головний бандл — не рішенням, а поступово.
 *
 * ## Що саме міряється
 *
 * Не «сума всього в build/». Значення має те, що браузер тягне, ЩОБ ПОКАЗАТИ
 * ГОЛОВНУ: модулі з `modulepreload` у `build/index.html`. Решта — маршрути
 * адмінки, редактор TipTap — вантажиться за потребою, і рахувати її разом
 * означало б лякатися числа, якого відвідувач не платить.
 *
 * Розмір береться з `.br`, які кладе `precompress: true`: GitHub Pages віддає
 * саме їх. Міряти нестиснуті файли — це міряти те, чого ніхто не завантажує.
 *
 * ## Про числа
 *
 * Пороги стоять трохи вище поточних значень: бюджет має ловити СТРИБОК, а не
 * дрижання від зміни хешів. Коли поточне число наблизиться до порога впритул,
 * це саме по собі привід дивитися, що виросло, — а не піднімати поріг.
 */

const BUILD_DIR = 'build';

/**
 * Критичний шлях головної сторінки, brotli.
 *
 * 320 при поточних 264 — це приблизно 20 % запасу. Перший варіант мав 420, і
 * це була помилка: бюджет із запасом у 60 % не ловить нічого, крім катастрофи,
 * а тоді він і не потрібен. Поріг має бути достатньо близько, щоб помітний
 * приріст став червоним ще до релізу.
 */
const HOME_BUDGET_KB = 320;
/** Увесь клієнтський JS, brotli — щоб бачити й те, що вантажиться пізніше. */
const TOTAL_BUDGET_KB = 620;

/**
 * Частка Firebase SDK у критичному шляху головної, brotli. Храповик, не бюджет.
 *
 * CLOUD-DATABASE-v8 § 10.2 (`CDB-LAZY-SDK`, HIGH) вимагає, щоб пакет бази
 * імпортувався через `await import()` у тому шляху, де база справді потрібна, і
 * прямо каже, ЯК це перевіряти: не за кодом, а за `build/` — чанк із SDK не має
 * бути в початковому завантаженні сторінки.
 *
 * Заміряно 2026-08-19: SDK — це ОДИН чанк на 95 КБ brotli, тобто **36 %** усього,
 * що браузер тягне, щоб показати головну (264 КБ). Тягне його кожен, хто зайшов
 * почитати сторінку тексту, бо шапка бере меню з Firestore, а `firebase/config`
 * піднімає SDK самим фактом імпорту.
 *
 * ЧОМУ ХРАПОВИК, А НЕ НУЛЬ. Правильне виправлення — лінива ініціалізація, і воно
 * зачіпає вхід в адмінку, який E2E не проходить (немає облікових даних). Гейт із
 * нулем тут довелося б вимкнути того самого дня, а вимкнений гейт гірший за
 * відсутній: він створює враження, що перевірка є. Тому число фіксується як борг
 * і не має права рости — рівно як храповик розмірів файлів у
 * `src/structure.test.ts`. Зменшилося? Опустіть число тим самим комітом.
 *
 * 100 при поточних 95 — запас лише на дрижання від оновлення самого SDK.
 */
const FIREBASE_IN_HOME_CEILING_KB = 100;

/**
 * Ознака чанка з Firebase SDK.
 *
 * `@firebase/` — рядок із власних версійних міток SDK, він лишається в бандлі
 * після мінімізації. Пробували `firebase` як слово: воно зустрічається і в
 * нашому коді (шляхи, коментарі, назви змінних), тобто ловило б чанки без SDK.
 */
const FIREBASE_MARKER = '@firebase/';

function sizeKb(file: string): number {
	// `.br` — те, що реально йде по мережі. Якщо його немає (precompress
	// вимкнули), беремо сирий файл: краще завищена оцінка, ніж мовчазний нуль.
	const brotli = `${file}.br`;
	const target = fs.existsSync(brotli) ? brotli : file;
	if (!fs.existsSync(target)) return 0;
	return fs.statSync(target).size / 1024;
}

/** Скрипти й модулі, які згадані в HTML головної сторінки. */
function homeCriticalFiles(): string[] {
	const html = fs.readFileSync(path.join(BUILD_DIR, 'index.html'), 'utf8');
	const refs = new Set<string>();
	for (const m of html.matchAll(/["']([^"']*_app\/immutable\/[^"']+\.js)["']/g)) {
		refs.add(m[1].replace(/^\//, ''));
	}
	return [...refs].map((r) => path.join(BUILD_DIR, r));
}

function allClientJs(dir: string, out: string[] = []): string[] {
	for (const entry of fs.readdirSync(dir)) {
		const full = path.join(dir, entry);
		if (fs.statSync(full).isDirectory()) allClientJs(full, out);
		else if (entry.endsWith('.js')) out.push(full);
	}
	return out;
}

function main() {
	const appDir = path.join(BUILD_DIR, '_app');
	if (!fs.existsSync(appDir)) {
		console.error(`❌ ${appDir}/ не існує — бюджет міряється після збірки`);
		process.exit(1);
	}

	const home = homeCriticalFiles();
	if (home.length === 0) {
		console.error('❌ у build/index.html не знайдено жодного модуля — перевірка мертва');
		process.exit(1);
	}

	const homeKb = home.reduce((sum, f) => sum + sizeKb(f), 0);
	const allJs = allClientJs(appDir);
	const totalKb = allJs.reduce((sum, f) => sum + sizeKb(f), 0);

	// Чанки з SDK бази — і в усьому бандлі, і окремо в критичному шляху головної.
	// Читаємо НЕстиснутий `.js` (маркер у `.br` не видно), а розмір беремо з `.br`.
	const carriesFirebase = (f: string) => fs.readFileSync(f, 'utf8').includes(FIREBASE_MARKER);
	const firebaseAnywhere = allJs.filter(carriesFirebase);
	const firebaseInHome = home.filter((f) => fs.existsSync(f) && carriesFirebase(f));
	const firebaseHomeKb = firebaseInHome.reduce((sum, f) => sum + sizeKb(f), 0);

	const fmt = (n: number) => `${Math.round(n)} КБ`;
	console.log(
		`📦 бандл (brotli): головна ${fmt(homeKb)} / ${HOME_BUDGET_KB} КБ у ${home.length} модулях, ` +
			`увесь клієнтський JS ${fmt(totalKb)} / ${TOTAL_BUDGET_KB} КБ`
	);
	console.log(
		`🔥 Firebase SDK: ${fmt(firebaseHomeKb)} / ${FIREBASE_IN_HOME_CEILING_KB} КБ у критичному шляху ` +
			`головної (${Math.round((firebaseHomeKb / homeKb) * 100)} % від нього), ` +
			`${firebaseInHome.length} чанк(ів) із ${firebaseAnywhere.length} у бандлі`
	);

	const over: string[] = [];

	// Перевірка не має права зеленіти від того, що маркер перестав знаходитися:
	// проєкт ходить у Firestore, тож SDK у бандлі є завжди. Нуль тут означає
	// зламану ознаку, а не досягнуту мету — і без цього рядка храповик нижче
	// став би зеленим назавжди.
	if (firebaseAnywhere.length === 0) {
		console.error(
			`❌ ознаки "${FIREBASE_MARKER}" немає в жодному чанку — перевірка мертва, ` +
				'а не мета досягнута: проєкт звертається до Firestore із клієнта'
		);
		process.exit(1);
	}

	if (firebaseHomeKb > FIREBASE_IN_HOME_CEILING_KB) {
		over.push(
			`Firebase SDK у критичному шляху головної: ${fmt(firebaseHomeKb)} > ` +
				`${FIREBASE_IN_HOME_CEILING_KB} КБ (CLOUD-DATABASE-v8 § 10.2)`
		);
	}
	if (firebaseHomeKb === 0) {
		// Борг закрито — але тоді храповик мусить піти разом із ним, інакше
		// перелік перетворюється на пам'ятник (та сама логіка, що в CEILINGS).
		console.error(
			'❌ SDK бази більше немає в критичному шляху головної — це добра новина ' +
				'і причина прибрати FIREBASE_IN_HOME_CEILING_KB із цього скрипта тим самим комітом'
		);
		process.exit(1);
	}
	if (homeKb > HOME_BUDGET_KB) {
		over.push(`критичний шлях головної: ${fmt(homeKb)} > ${HOME_BUDGET_KB} КБ`);
	}
	if (totalKb > TOTAL_BUDGET_KB) {
		over.push(`увесь клієнтський JS: ${fmt(totalKb)} > ${TOTAL_BUDGET_KB} КБ`);
	}

	if (over.length > 0) {
		console.error('❌ бюджет розміру перевищено (PERFORMANCE-v8):');
		for (const line of over) console.error(`   ${line}`);
		console.error('   Підняття порога — не виправлення. Спершу подивіться, ЩО саме виросло:');
		console.error('   найбільші модулі критичного шляху видно командою');
		console.error('   ls -S build/_app/immutable/chunks/*.js.br | head');
		process.exit(1);
	}
}

main();
