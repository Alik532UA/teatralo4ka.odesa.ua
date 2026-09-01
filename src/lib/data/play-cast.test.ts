import { describe, it, expect } from 'vitest';
import fs, { readFileSync, readdirSync } from 'node:fs';
import path, { join } from 'node:path';
import { buildCast } from '../../../scripts/build-play-cast';
import { PLAY_CAST as cast } from './playCast';
import { PLAYS } from './plays';
import { GRADUATES } from './graduates';
import { createNameMatcher } from '$lib/utils/participantMatch';

/**
 * Склад вистав не має права відстати від анкет.
 *
 * `play-cast.json` — це ЗРІЗ, а не джерело: він рахується з анкет у
 * `static/graduates/profiles/`. Джерело редагується руками (так тут заведено:
 * генератор анкет затирає ручні правки), і без цієї перевірки послідовність
 * подій виглядала б так: хтось виправляє анкету, сторінка випускника показує
 * нове, сторінка вистави — старе, і жоден гейт не бачить різниці.
 *
 * Тому тут не «файл існує», а ПЕРЕРАХУНОК: зріз будується наново з тих самих
 * файлів і звіряється дослівно.
 *
 * Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1): дописати виставу в
 * будь-яку анкету й не перезібрати — перевірка назве цю виставу поіменно.
 */
describe('склад вистав', () => {
	it('зріз збігається з анкетами', () => {
		const свіжий = buildCast();

		const уФайлі = new Set(Object.keys(cast));
		const свіжі = new Set(Object.keys(свіжий));
		const зникли = [...уФайлі].filter((id) => !свіжі.has(id));
		const зʼявилися = [...свіжі].filter((id) => !уФайлі.has(id));

		expect(
			{ зникли, зʼявилися },
			'`play-cast.json` відстав від анкет. Перезібрати: npm run build:play-cast'
		).toEqual({ зникли: [], зʼявилися: [] });

		const різні = [...свіжі].filter(
			(id) => JSON.stringify(cast[id]) !== JSON.stringify(свіжий[id])
		);
		expect(
			різні,
			'склад цих вистав у зрізі не такий, як в анкетах. Перезібрати: npm run build:play-cast'
		).toEqual([]);
	});

	it('кожен ключ зрізу — справжня вистава з реєстру', () => {
		const відомі = new Set(PLAYS.map((play) => play.id));
		const чужі = Object.keys(cast).filter((id) => !відомі.has(id));
		expect(чужі, 'у зрізі є вистави, яких немає в реєстрі').toEqual([]);
	});

	it('перевірка жива: склад не порожній і ролі трапляються', () => {
		const вистав = Object.keys(cast).length;
		const записів = Object.values(cast).reduce((sum, list) => sum + list.length, 0);
		const ролей = Object.values(cast).reduce(
			(sum, list) => sum + list.filter((entry) => entry.role).length,
			0
		);
		// Числа — нижні межі, а не точні: вони ростуть із кожною новою анкетою.
		expect(вистав, 'зріз порожній — перевірка нічого не стверджує').toBeGreaterThan(200);
		expect(записів).toBeGreaterThan(300);
		expect(ролей, 'жодної ролі — поле `role` перестало заповнюватися').toBeGreaterThan(0);
	});

	/*
	 * Номер програми, на який ніхто не відповідає.
	 *
	 * `item` у рядку анкети — це заява «я грав у ЦЬОМУ уривку», і вона має сенс
	 * лише поки такий номер у програмі вечора існує. Розійтися вони можуть тихо:
	 * номер перейменували в реєстрі, а рядок анкети лишився зі старим ключем.
	 * Людина при цьому зі сторінки не зникає — `groupCastByProgramme` зносить її
	 * до тих, хто уривка не назвав, — але заява про уривок губиться безслідно,
	 * і саме тому це перевіряється тут, а не покладається на показ.
	 */
	it('кожен номер програми у складі існує в програмі своєї вистави', () => {
		const bad: string[] = [];
		for (const [playId, list] of Object.entries(cast)) {
			const play = PLAYS.find((p) => p.id === playId);
			if (!play) continue; // про невідому виставу кричить інша перевірка
			const known = new Set((play.programme ?? []).map((item) => item.id));
			for (const entry of list) {
				for (const item of entry.items ?? []) {
					if (known.has(item)) continue;
					bad.push(
						`${playId}: ${entry.graduateId} посилається на номер «${item}», ` +
							`а в програмі вистави є ${known.size > 0 ? [...known].join(', ') : 'взагалі нічого'}`
					);
				}
			}
		}
		expect(
			bad,
			'номер програми в анкеті не існує у виставі — або виправити `item` в анкеті, ' +
				'або додати номер у `programme`:' + bad.map((b) => `
  ${b}`).join('')
		).toEqual([]);
	});

	it('перевірка номерів жива: у реєстрі є вечори з програмою і склад із номерами', () => {
		const зПрограмою = PLAYS.filter((p) => (p.programme?.length ?? 0) > 0);
		expect(зПрограмою.length, 'жодного вечора з програмою — перевірка вище нічого не стверджує').toBeGreaterThan(0);
		const зНомером = Object.values(cast)
			.flat()
			.filter((e) => e.items?.length);
		expect(зНомером.length, 'жодного складу з номером — те саме').toBeGreaterThan(0);
	});

	/*
	 * Прапорець `fromRegistry` не можна поставити з нічого.
	 *
	 * Він означає «цей рядок узято зі списку школи», і єдине, що це підтверджує,
	 * — саме ім'я в `participants` або `extraParticipants` тієї вистави. Без
	 * перевірки прапорець став би зручним способом додати людину у виставу, ні
	 * на що не спираючись: напис під складом обіцяв би список школи, якого
	 * немає.
	 *
	 * Заміряно: після хвилі 1 таких рядків 52 у 25 анкетах.
	 */
	it('кожен рядок «зі списку школи» справді є в списку школи', () => {
		const match = createNameMatcher(GRADUATES);
		const bad: string[] = [];
		let перевірено = 0;
		for (const [playId, list] of Object.entries(cast)) {
			const play = PLAYS.find((p) => p.id === playId);
			if (!play) continue;
			const наПапері = new Set(
				[...(play.participants ?? []), ...(play.extraParticipants ?? [])]
					.map((raw) => match(raw)?.id)
					.filter((id): id is string => Boolean(id))
			);
			for (const entry of list) {
				if (!entry.fromRegistry) continue;
				перевірено += 1;
				if (наПапері.has(entry.graduateId)) continue;
				bad.push(`${playId}: ${entry.graduateId} позначений як «зі списку школи», а в списку його немає`);
			}
		}
		expect(перевірено, 'жодного рядка зі списку школи — перевірка нічого не стверджує').toBeGreaterThan(0);
		expect(
			bad,
			'прапорець `fromRegistry` без підстави в складі показу:' + bad.map((b) => `\n  ${b}`).join('')
		).toEqual([]);
	});

	/*
	 * Дві згадки однієї вистави в анкеті — лише про РІЗНІ уривки.
	 *
	 * Спершу тут стояло просте «одна вистава — один рядок», і воно було надто
	 * суворим: у «Уривках з класики» 2015 Алік Запольнов грав і в «Асі»
	 * Тургенєва (роль «М. М.»), і в «Принижених та зневажених». Це два різні
	 * номери, у кожного своя роль — а роль живе В РЯДКУ. Злити їх в один рядок
	 * означало б утратити одну з ролей.
	 *
	 * Заборонене інше, і воно справді помилка:
	 *
	 *   1. рядок зі СПИСКУ ШКОЛИ для вистави, яку людина назвала сама — це
	 *      повтор, і сторінка показує ту саму подію двічі різними словами. Так
	 *      сталося, коли уривок «Гріх» згорнули у вечір, до якого людину вже
	 *      дописали списком;
	 *   2. два рядки про той самий набір уривків — або обидва без уривків
	 *      узагалі: тоді це просто дубль без жодної різниці.
	 */
	it('вистава повторюється в анкеті лише заради різних уривків', () => {
		const dir = join('static', 'graduates', 'profiles');
		const bad: string[] = [];
		for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
			const profile = JSON.parse(readFileSync(join(dir, file), 'utf8'));
			const rows = new Map<string, { items: string; fromRegistry: boolean }[]>();
			for (const play of profile.plays ?? []) {
				if (!play.playId) continue;
				const list = rows.get(play.playId) ?? [];
				list.push({
					items: [...(play.items ?? [])].sort().join('+'),
					fromRegistry: play.fromRegistry === true
				});
				rows.set(play.playId, list);
			}
			for (const [playId, list] of rows) {
				if (list.length < 2) continue;
				const own = list.filter((r) => !r.fromRegistry);
				if (own.length > 0 && list.some((r) => r.fromRegistry)) {
					bad.push(`${file}: ${playId} — рядок зі списку школи поверх власних слів`);
					continue;
				}
				const keys = list.map((r) => r.items);
				if (new Set(keys).size !== keys.length) {
					bad.push(`${file}: ${playId} — два рядки про ті самі уривки (${keys.join(' | ') || 'без уривків'})`);
				}
			}
		}
		expect(
			bad,
			'повтор вистави в анкеті. Кілька рядків можна лише про РІЗНІ уривки; рядок' +
				' зі списку школи прибрати, якщо людина назвала виставу сама:' +
				bad.map((b) => `\n  ${b}`).join('')
		).toEqual([]);
	});

	/*
	 * У складі вистави людина трапляється РАЗ.
	 *
	 * Це не косметика: `{#each}` на сторінці показу ключований `graduate.id`, і
	 * другий запис із тим самим ключем валить рендер із `each_key_duplicate` —
	 * сторінка не відкривається зовсім. Заміряно: саме так сталося, щойно в
	 * анкеті з'явилися два рядки про один вечір (різні уривки, різні ролі).
	 *
	 * Злиття робить `build-play-cast`; ця перевірка сторожить результат.
	 */
	it('у складі вистави людина трапляється рівно раз', () => {
		const bad: string[] = [];
		for (const [playId, list] of Object.entries(cast)) {
			const seen = new Map<string, number>();
			for (const entry of list) {
				seen.set(entry.graduateId, (seen.get(entry.graduateId) ?? 0) + 1);
			}
			for (const [graduateId, count] of seen) {
				if (count > 1) bad.push(`${playId}: ${graduateId} — ${count} записи`);
			}
		}
		expect(
			bad,
			'та сама людина двічі в складі вистави — сторінка показу впаде на' +
				' `each_key_duplicate`:' + bad.map((b) => `\n  ${b}`).join('')
		).toEqual([]);
	});

	it('файл зрізу лежить там, де його шукає скрипт', () => {
		expect(fs.existsSync(path.join('src', 'lib', 'data', 'play-cast.json'))).toBe(true);
	});
});
