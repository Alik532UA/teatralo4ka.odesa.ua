// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Хто читає літеру як власну дію, той забирає клавіатуру собі
 * (HOTKEYS-v8 § 2, `HK-HANDLER-GUARDS`).
 *
 * ## Що це за клас дефекту
 *
 * `services/keyboard.ts` має рівно три захисти для обробника САЙТУ: модифікатори,
 * поля вводу й лічильник `captureKeyboard`. Перші два спрацьовують самі, третій —
 * ні: він працює лише тоді, коли накладка справді покликала `captureKeyboard()`.
 * Накладка, що цього не зробила, виглядає точно так само, як накладка, що
 * зробила: жодного попередження, жодного червоного тесту, ніякої різниці в
 * розмітці.
 *
 * Ціна прогалини заміряна на піаніно в підвалі (`ui/PianoModal.svelte`), і збіг
 * там повний, а не випадковий: у нього 21 літерна клавіша, і серед них ті самі,
 * що в карти скорочень сайту. `KeyL` — біла клавіша й перемикач мови: ОДНЕ
 * натискання посеред гри вело на `/en/…`, і піаніно зникало разом зі сторінкою.
 * `KeyT` — чорна клавіша й перемикач теми. `KeyG`, `KeyH`, `KeyJ` — білі клавіші
 * й службові серії по сім натискань. `KeyR` — чорна клавіша й аварійне скидання.
 *
 * ## Чому саме інваріант, а не E2E
 *
 * E2E перевіряє те, що вже написали. Дефект тут інший за природою: він
 * з'являється тоді, коли додають НОВУ накладку з літерами й не згадують про
 * лічильник, — тобто рівно там, де тесту ще не написали. Перевірка над
 * джерелами бачить нову накладку в той самий коміт, у який її додали.
 *
 * ## Ознака «читає літеру як власну дію»
 *
 * Літерал виду `'KeyF'` у коді (не в коментарі). Це те, чим літерне скорочення
 * записується в цьому проєкті взагалі — `event.code`, а не `event.key`
 * (`HK-EVENT-CODE`: на кирилиці `key` віддає інший символ, `code` не залежить
 * від розкладки). Комбінації з `Ctrl` під ознаку теж підпадають, і це правильно:
 * захопленою клавіатурою вони теж не належать сайту.
 *
 * Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1): прибрати імпорт
 * `captureKeyboard` із `PianoModal.svelte` — перевірка мусить назвати саме його.
 * Зроблено, падає.
 */

const SRC = 'src';

/**
 * Обробник САЙТУ. Він не забирає клавіатуру — він її віддає: `acceptsShortcut`
 * усередині нього питає `isKeyboardCaptured()` і мовчить, поки накладка тримає
 * лічильник. Якби він викликав `captureKeyboard` сам, то замовк би назавжди.
 */
const SITE_HANDLER = 'src/lib/components/ui/ServiceLayer.svelte';

/** Саме виклик, а не згадка в коментарі. */
const CALLS_CAPTURE = /\bcaptureKeyboard\s*\(/;

function walk(dir: string, out: string[] = []): string[] {
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) walk(full, out);
		else if (/\.(svelte|ts)$/.test(entry) && !/\.(test|spec)\.ts$/.test(entry))
			out.push(full.split('\\').join('/'));
	}
	return out;
}

/**
 * Коментарі відрізаються перед пошуком.
 *
 * Без цього під ознаку потрапляли б `services/keySequence.ts` і сам цей файл: у
 * докблоках обох `'KeyR'` процитовано як приклад. Перевірка, що ловить власний
 * коментар, — це не суворість, а хибне спрацювання, після якого інваріант
 * вимикають.
 */
function withoutComments(source: string): string {
	return source
		.replace(/\/\*[\s\S]*?\*\//g, '')
		.replace(/^\s*\/\/.*$/gm, '')
		.replace(/<!--[\s\S]*?-->/g, '');
}

const files = walk(SRC);

/** Файли, у коді яких є літерне скорочення. */
const withLetterShortcuts = files.filter((file) =>
	/['"]Key[A-Z]['"]/.test(withoutComments(readFileSync(file, 'utf8')))
);

describe('власність над клавіатурою', () => {
	it('перевірка жива: файли з літерними скороченнями знайдено', () => {
		expect(
			withLetterShortcuts.length,
			'жодного файлу з літерним скороченням — сканер шукає не там або ознака застаріла'
		).toBeGreaterThanOrEqual(2);
	});

	it('накладка з літерами забирає клавіатуру собі', () => {
		// Шукається ВИКЛИК, а не згадка: коментар про `captureKeyboard` лишається
		// на місці й тоді, коли виклик прибрали, — і перевірка «є слово у файлі»
		// лишалася б зеленою рівно в тому випадку, заради якого написана.
		const guilty = withLetterShortcuts
			.filter((file) => file !== SITE_HANDLER)
			.filter((file) => !CALLS_CAPTURE.test(withoutComments(readFileSync(file, 'utf8'))));

		expect(
			guilty,
			'читає літеру як власну дію й не кличе captureKeyboard() — літери сайту ' +
				'працюватимуть поверх неї:\n' +
				guilty.join('\n')
		).toEqual([]);
	});

	it('обробник сайту клавіатуру НЕ забирає', () => {
		// Пункт-межа: помилка в інший бік тиха так само. Обробник, що покликав
		// `captureKeyboard`, більше ніколи не побачить жодної своєї клавіші —
		// `acceptsShortcut` віддасть `false` на власному ж лічильнику.
		expect(
			CALLS_CAPTURE.test(withoutComments(readFileSync(SITE_HANDLER, 'utf8'))),
			`${SITE_HANDLER} забирає клавіатуру собі — тоді T і L замовкнуть назавжди`
		).toBe(false);
	});
});
