import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { buildCast } from '../../../scripts/build-play-cast';
import { PLAY_CAST as cast } from './playCast';
import { PLAYS } from './plays';

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

	it('файл зрізу лежить там, де його шукає скрипт', () => {
		expect(fs.existsSync(path.join('src', 'lib', 'data', 'play-cast.json'))).toBe(true);
	});
});
