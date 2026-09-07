/**
 * Стандартна адреса випускника, яка веде на його особисту.
 *
 * ## Задача
 *
 * Адреса сторінки — це `code ?? slug` (`graduateAddress`). У 22 людей `code`
 * особистий: `Alik`, `Dana`, `ri2be`, `leraburian`, `kamywek_`,
 * `odessitkavmonreale`. Ще кілька мають особистий `slug` — `reverenciel`,
 * `al_bryn`, `margotcine`. У всіх них ОЧІКУВАНА адреса (ім'я-прізвище) не веде
 * нікуди: `findByAddress` шукає рівно за `graduateAddress`, тож
 * `/projects/galaxy-graduates/alik-zapolnov/` — це 404.
 *
 * Автор попросив закрити це для всіх одразу, а не по одному.
 *
 * ## Чому ГЕНЕРУЄТЬСЯ, а не пишеться руками
 *
 * Прохання було дослівне: «наступний випускник з особистою адресою отримає
 * редирект без жодної правки». Для 22 із коду це виконується точно: пара
 * «`slug` → `code`» уже лежить у самому записі, вигадувати нема чого.
 *
 * Для особистого `slug` вивести нема з чого — стандартної адреси в даних просто
 * немає, а транслітерувати ім'я навмання означало б вгадувати (у реєстрі є
 * `anton-babich` проти `anton-babych`, `dar-ia-hurevych`, `maryna-perehud` —
 * тобто «стандарт» у самих даних не один). Тому такі адреси пишуться полем
 * `aliases` там-таки, де змінюють `slug`, а не в окремому файлі: одна правка, а
 * не дві. Кого забули — назве гейт `src/address-aliases.test.ts`.
 *
 * ## Що робить із зіткненнями
 *
 * Стандартна адреса буває ЧУЖОЮ: у реєстрі є тезки з `-2` (`mariia-poliakova`
 * і `mariia-poliakova-2`). Такий аліас відкидається — інакше редирект забрав би
 * живу сторінку. Скрипт про це кричить, а не мовчить.
 *
 * Вихід: `src/lib/data/address-aliases.data.json`, який читають
 * `config/renamedAddresses.ts` (звідти — реєстр заглушок і чеклист) і
 * `svelte.config.js` (звідти — англійські дзеркала).
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

interface Запис {
	id: string;
	slug: string;
	name: string;
	code?: string;
	aliases?: string[];
}

const РЕЄСТР = path.join('src', 'lib', 'data', 'graduates.index.json');
const ВИХІД = path.join('src', 'lib', 'data', 'address-aliases.data.json');

export function записи(): Запис[] {
	return JSON.parse(fs.readFileSync(РЕЄСТР, 'utf8')) as Запис[];
}

export const адреса = (g: Запис): string => g.code ?? g.slug;

export interface Зібране {
	/** Стандартна адреса → чинна. */
	aliases: Record<string, string>;
	/** Те, що відкинуто й потребує рішення людини. */
	конфлікти: string[];
	/**
	 * Відкинуте з ВІДОМОЇ причини: адреса відрізняється лише регістром.
	 *
	 * Окремо від `конфлікти` тому, що це не задача «розберися», а стан, який уже
	 * розібрано: троє таких є, вони названі в гейті поіменно, і поява четвертого
	 * має зупинити збірку, а не тихо додатися до трьох.
	 */
	регістр: string[];
}

export function зібрати(усі: Запис[] = записи()): Зібране {
	const чинні = new Set(усі.map(адреса));
	const aliases: Record<string, string> = {};
	const конфлікти: string[] = [];
	const регістр: string[] = [];

	for (const g of усі) {
		const свої = [
			// Виведене: у кого адреса — код, стандартна адреса це його ж slug.
			...(g.code && g.code !== g.slug ? [g.slug] : []),
			// Назване руками: особистий slug стандартної адреси в даних не має.
			...(g.aliases ?? [])
		];
		for (const alias of свої) {
			if (alias === адреса(g)) continue;
			/*
			 * Адреса, що відрізняється ЛИШЕ регістром, — не аліас, а пастка.
			 *
			 * У трьох людей адреса з великих літер (`Kateryna-Muntian`,
			 * `Nadiia-Hasynets`, `Sofia-Chernova`), і `kateryna-muntian`
			 * виглядає як очевидний аліас до неї. Заміряно 7 вересня 2026: на
			 * Windows обидві сторінки претендують на ОДНУ теку в `build/`, і
			 * заглушка затирає справжню сторінку — збірка впала на битих
			 * посиланнях `/en/projects/galaxy-graduates/Kateryna-Muntian`.
			 *
			 * На Linux (CI, прод) вони б ужилися, тобто вада була б лише в
			 * локальній збірці — і це найгірший різновид: у автора червоне, у
			 * CI зелене. Тому такий аліас не робиться взагалі, а правильне
			 * рішення — привести саму адресу до нижнього регістру, і це вже
			 * перейменування, тобто рішення автора, а не скрипта.
			 */
			if (alias.toLowerCase() === адреса(g).toLowerCase()) {
				регістр.push(`${alias} → ${адреса(g)}`);
				continue;
			}
			if (чинні.has(alias)) {
				конфлікти.push(`${alias} → ${адреса(g)} (${g.name}): це чинна адреса іншої людини`);
				continue;
			}
			if (aliases[alias] && aliases[alias] !== адреса(g)) {
				конфлікти.push(`${alias}: на неї претендують ${aliases[alias]} і ${адреса(g)}`);
				continue;
			}
			aliases[alias] = адреса(g);
		}
	}

	return {
		aliases: Object.fromEntries(Object.entries(aliases).sort(([a], [b]) => a.localeCompare(b))),
		конфлікти,
		регістр: регістр.sort()
	};
}

function головна(): void {
	const { aliases, конфлікти, регістр } = зібрати();
	fs.writeFileSync(ВИХІД, `${JSON.stringify(aliases, null, '\t')}\n`, 'utf8');
	console.log(`🔗 адреси-аліаси: ${Object.keys(aliases).length} у ${ВИХІД}`);
	for (const рядок of конфлікти) console.log(`   ⚠ пропущено: ${рядок}`);
	for (const рядок of регістр) console.log(`   ⏭ лише регістр, аліас не робиться: ${рядок}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) головна();
