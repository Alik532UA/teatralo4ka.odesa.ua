/**
 * Збирає склад кожної вистави з анкет випускників.
 *
 * ## Навіщо окремий файл, а не читання анкет на сторінці
 *
 * Анкети лежать у `static/graduates/profiles/` і НЕ потрапляють у бандл — це
 * свідоме рішення, записане в `graduates.ts`: разом усі вони важать 96 КБ, і
 * тягнути їх заради однієї відкритої картки безглуздо. Сторінці вистави
 * потрібен зворотний зріз тих самих даних: не «вистави цієї людини», а «люди
 * цієї вистави». Обійти всі дев'яносто файлів на кожній із 363 сторінок під
 * час пререндеру — це десятки тисяч читань замість одного.
 *
 * Тому зріз рахується один раз тут і лягає в `play-cast.json`, який імпортує
 * ЛИШЕ маршрут вистави, тобто в критичний шлях головної він не потрапляє.
 *
 * ## Звідки береться склад
 *
 * Виключно з `playId` в анкетах — це і є заява «я в цьому грав». Виводити
 * склад із групи заборонено; чому саме, з двома замірами, написано в докблоці
 * `src/lib/data/plays.ts`.
 *
 * ## Що робити, коли гейт упав
 *
 * `npm run build:play-cast` — і закомітити оновлений `play-cast.json`. Гейт
 * `src/lib/data/play-cast.test.ts` перераховує зріз наново й порівнює: без
 * нього анкету можна було б виправити, а склад на сторінці лишився б старим.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

interface AnketaPlay {
	playId?: string;
	role?: string;
	text?: string;
	items?: string[];
	fromRegistry?: boolean;
}

interface Anketa {
	id?: string;
	slug?: string;
	code?: string;
	plays?: AnketaPlay[];
}

/** Один рядок складу: хто, у якій ролі і в якому номері програми. */
export interface CastEntry {
	graduateId: string;
	role?: string;
	/**
	 * Номери програми — уривки вечора. Порожньо: людина назвала вечір, а не
	 * уривок. Перелік, бо в одному вечорі буває кілька уривків однієї людини.
	 */
	items?: string[];
	/** Рядок зі списку школи, а не зі слів людини. Див. `GraduatePlay.fromRegistry`. */
	fromRegistry?: boolean;
}

const PROFILES = path.join('static', 'graduates', 'profiles');
const OUT = path.join('src', 'lib', 'data', 'play-cast.json');

export function buildCast(): Record<string, CastEntry[]> {
	const cast: Record<string, CastEntry[]> = {};

	const files = fs.readdirSync(PROFILES).filter((f) => f.endsWith('.json')).sort();
	for (const file of files) {
		let anketa: Anketa;
		try {
			anketa = JSON.parse(fs.readFileSync(path.join(PROFILES, file), 'utf8'));
		} catch {
			// Побитий файл — не привід зупиняти збірку решти; про нього кричить
			// власний гейт анкет, а не цей.
			continue;
		}

		const id = anketa.id ?? anketa.slug ?? anketa.code;
		if (!id) continue;

		for (const play of anketa.plays ?? []) {
			if (!play.playId) continue;
			/*
			 * Людина в складі вистави трапляється РАЗ, скільки б рядків про неї не
			 * було в анкеті.
			 *
			 * Рядків буває кілька: в «Уривках з класики» 2015 Алік Запольнов грав
			 * і в «Асі» Тургенєва (роль «М. М.»), і в «Принижених та зневажених» —
			 * два різні номери, у кожного своя роль, а роль живе в рядку. На
			 * сторінці ж це одна людина: без злиття `{#each}` діставав два записи
			 * з тим самим ключем і падав з `each_key_duplicate`, тобто сторінка
			 * показу не відкривалася зовсім.
			 *
			 * Номери об'єднуються, роль береться перша названа, а `fromRegistry`
			 * лишається тільки тоді, коли ЖОДЕН із рядків не є словами самої
			 * людини: досить одного власного рядка, щоб заява перестала бути
			 * «зі списку школи».
			 */
			const list = (cast[play.playId] ??= []);
			const existing = list.find((entry) => entry.graduateId === id);
			const entry = existing ?? { graduateId: id };
			if (play.role && !entry.role) entry.role = play.role;
			if (play.items?.length) {
				entry.items = [...new Set([...(entry.items ?? []), ...play.items])];
			}
			if (play.fromRegistry) {
				if (!existing) entry.fromRegistry = true;
			} else {
				delete entry.fromRegistry;
			}
			if (!existing) list.push(entry);
		}
	}

	/*
	 * Порядок сталий — за `graduateId`, а не за порядком файлів у теці: інакше
	 * той самий склад давав би різний JSON на різних машинах, і гейт падав би
	 * на порожньому місці.
	 */
	for (const list of Object.values(cast)) {
		list.sort((a, b) => a.graduateId.localeCompare(b.graduateId));
	}

	return Object.fromEntries(Object.entries(cast).sort(([a], [b]) => a.localeCompare(b)));
}

function main() {
	const cast = buildCast();
	const plays = Object.keys(cast).length;
	const people = Object.values(cast).reduce((sum, list) => sum + list.length, 0);
	const roles = Object.values(cast).reduce(
		(sum, list) => sum + list.filter((entry) => entry.role).length,
		0
	);

	fs.writeFileSync(OUT, JSON.stringify(cast, null, '\t') + '\n', 'utf8');
	console.log(
		`🎭 склад вистав: ${plays} вистав, ${people} записів, з них із роллю ${roles} → ${OUT}`
	);
}

/*
 * Запис лише при ПРЯМОМУ запуску: цей модуль імпортує ще й гейт
 * `play-cast.test.ts`, щоб перерахувати зріз наново. Без цієї умови сам прогін
 * перевірок переписував би файл, який перевіряє, — і будь-яке відставання
 * зникало б непоміченим саме тоді, коли його шукають.
 */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	main();
}
