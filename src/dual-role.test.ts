// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { linkedGraduateId, linkedMasterId, dualRoleCount } from '$lib/data/dualRole';
import { MASTERS, getStudentsByMaster } from '$lib/data/masters';

/**
 * Одна людина у двох реєстрах: випускник, який тепер тут працює.
 *
 * ## Що саме стережеться і чому цього не видно інакше
 *
 * Зв'язок `alsoGraduateId` — РУЧНЕ поле, і старіє воно тихо. Показ від нього
 * залежить у трьох місцях: кнопка на сторінці працівника, кнопка в анкеті
 * випускника, рівень зірки в потоці учнів. Розбіжність між ними виглядає як
 * робочий сайт: кнопка є, веде куди слід, а зірка тієї самої людини на сусідній
 * сторінці підписана «випускник».
 *
 * ## П'ять перевірок, і кожна ловить свій різновид
 *
 *  1. зв'язок вказує на НАЯВНОГО й неприхованого випускника;
 *  2. двоє працівників не вказують на одного випускника;
 *  3. зв'язок симетричний — назад веде туди, звідки прийшов;
 *  4. **кожен `id`, що є в ОБОХ реєстрах, або пов'язаний, або поіменно
 *     названий у `NOT_THE_SAME`** — див. нижче, це головна;
 *  5. у потоці учнів жодна людина не з'являється двічі.
 *
 * ## Чому четверта головна
 *
 * Сімох людей знайшли саме тим, що `id` у них в обох реєстрах однаковий. Але
 * збіг ключів — не доказ: реєстри заморожували ключі незалежно, і неспоріднений
 * збіг колись трапиться (прізвищ-двійників у даних 45 пар, і майже всі це
 * РОДИЧІ — Самуїл і Ольга Імас та випускниця Єва Імас; Тетяна Ісачкіна та
 * випускниці Єва й Дар'я). Тому перевірка вимагає не «пов'язати все, що
 * збіглося», а ВИСЛОВИТИСЯ про кожен збіг: або зв'язок, або запис у
 * `NOT_THE_SAME` з причиною. Без цього новий однойменний працівник з'явився б
 * без зв'язку й без помилки — і ніхто б не дізнався, що питання взагалі стояло.
 *
 * Дзеркальна половина тієї самої перевірки: `NOT_THE_SAME` не містить зайвого.
 * Інакше запис у ньому переживе саму причину й стане пам'ятником — рівно так, як
 * помер мертвий прапорець `unconfirmed` у `liliia-velychko`.
 *
 * ## Чому п'ята потрібна, хоч дефект уже виправлено
 *
 * Модель доти КАРАЛА за правильне заповнення даних: щойно майстрині
 * `hanna-tkach` дописали б `studiedUnder: ['svitlana-ryskina']` — тобто правду, —
 * вона з'явилася б у потоці Риськіної двічі, бо запис випускниці називає ту саму
 * майстриню. Захист `m.id === masterId` у `getStudentsByMaster` від цього не
 * рятував: він на іншій осі.
 *
 * ## Зворотний експеримент проведено на ТРЬОХ перевірках (AI-AGENT-PITFALLS-v8 § 1.1)
 *
 *  • перевірка 4 — прибрано `alsoGraduateId` у `hanna-tkach`: червоніє й називає
 *    саме її («є в обох реєстрах, але не висловлено»);
 *  • перевірка 1 — підмінено ключ на `hanna-tkach-2`: червоніє й називає ключ,
 *    якого немає серед випускників;
 *  • перевірка 5 — дописано `studiedUnder: ['svitlana-ryskina']` майстрині
 *    `hanna-tkach` із прибраним набором `asColleague`: червоніє й називає
 *    сторінку Риськіної та саму Ганну Ткач.
 */

const ROOT = '.';

interface MasterRow {
	id: string;
	displayName: string;
	visible?: boolean;
	alsoGraduateId?: string;
}

interface GraduateRow {
	id: string;
	name: string;
	hidden?: boolean;
}

const masters = JSON.parse(
	readFileSync(join(ROOT, 'src/lib/data/masters.index.json'), 'utf8')
) as MasterRow[];

const graduates = JSON.parse(
	readFileSync(join(ROOT, 'src/lib/data/graduates.index.json'), 'utf8')
) as GraduateRow[];

const GRADUATES_BY_ID = new Map(graduates.map((g) => [g.id, g]));

/**
 * Однаковий `id` в обох реєстрах, але це РІЗНІ люди.
 *
 * Порожньо, і це заміряний стан, а не заглушка: 2026-08-31 таких збігів було
 * сім, і всі сім виявилися однією людиною. Перелік існує для наступного разу —
 * прізвищ-двійників у даних досить, щоб він колись знадобився.
 *
 * Формат — `id`: причина. Причина обов'язкова: без неї запис за півроку не
 * відрізнити від забутого зв'язку.
 */
const NOT_THE_SAME: Record<string, string> = {};

const linkedMasters = masters.filter((m) => m.alsoGraduateId);

describe('одна людина у двох реєстрах', () => {
	it('перевірка жива: зв\'язки знайдено з обох боків', () => {
		expect(linkedMasters.length).toBeGreaterThan(0);
		expect(masters.length).toBeGreaterThan(0);
		expect(graduates.length).toBeGreaterThan(0);
		// Похідні мапи бачать НЕ всі зв'язки: прихованих вони обрізають.
		expect(dualRoleCount()).toBeGreaterThan(0);
		expect(dualRoleCount()).toBeLessThanOrEqual(linkedMasters.length);
	});

	it('зв\'язок вказує на наявного й неприхованого випускника', () => {
		const bad: string[] = [];
		for (const m of linkedMasters) {
			const graduate = GRADUATES_BY_ID.get(m.alsoGraduateId as string);
			if (!graduate) {
				bad.push(`${m.id} → ${m.alsoGraduateId}: такого випускника немає`);
			} else if (graduate.hidden) {
				bad.push(`${m.id} → ${m.alsoGraduateId}: випускник прихований, посилання веде в нікуди`);
			}
		}
		expect(bad, `зв'язок веде не туди:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	it('двоє працівників не вказують на одного випускника', () => {
		const byGraduate = new Map<string, string[]>();
		for (const m of linkedMasters) {
			const key = m.alsoGraduateId as string;
			byGraduate.set(key, [...(byGraduate.get(key) ?? []), m.id]);
		}
		const bad = [...byGraduate]
			.filter(([, ids]) => ids.length > 1)
			.map(([graduateId, ids]) => `${graduateId} ← ${ids.join(', ')}`);
		expect(bad, `один випускник — двоє працівників:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	it('зв\'язок симетричний, і прихований його не отримує', () => {
		const bad: string[] = [];
		for (const m of linkedMasters) {
			const forward = linkedGraduateId(m.id);
			const hidden = m.visible === false;

			// Прихований працівник обрізається в ОБИДВА боки — правило одне на всі
			// поверхні, див. докблок `dualRole.ts`.
			if (hidden) {
				if (forward !== null) bad.push(`${m.id}: прихований, а зв'язок віддається`);
				if (linkedMasterId(m.alsoGraduateId as string) !== null)
					bad.push(`${m.id}: прихований, а зворотний зв'язок віддається`);
				continue;
			}

			if (forward !== m.alsoGraduateId) {
				bad.push(`${m.id}: уперед віддає ${forward}, а в даних ${m.alsoGraduateId}`);
				continue;
			}
			const back = linkedMasterId(forward);
			if (back !== m.id) bad.push(`${m.id}: назад веде на ${back}`);
		}
		expect(bad, `зв'язок несиметричний:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	it('про кожен збіг ключів у двох реєстрах висловлено (головна)', () => {
		const collisions = masters.filter((m) => GRADUATES_BY_ID.has(m.id));

		const silent = collisions
			.filter((m) => !m.alsoGraduateId && !(m.id in NOT_THE_SAME))
			.map(
				(m) =>
					`${m.id} («${m.displayName}» / «${GRADUATES_BY_ID.get(m.id)?.name}») — ` +
					`та сама людина? Тоді alsoGraduateId. Різні? Тоді NOT_THE_SAME з причиною`
			);
		expect(
			silent,
			`ключ є в обох реєстрах, а відповіді немає:\n  ${silent.join('\n  ')}`
		).toEqual([]);

		// Дзеркальна половина: запис у переліку мусить лишатися потрібним.
		const stale = Object.keys(NOT_THE_SAME).filter(
			(id) => !collisions.some((m) => m.id === id)
		);
		expect(
			stale,
			`збігу ключів більше немає — прибрати з NOT_THE_SAME:\n  ${stale.join('\n  ')}`
		).toEqual([]);

		const both = Object.keys(NOT_THE_SAME).filter((id) =>
			masters.some((m) => m.id === id && m.alsoGraduateId)
		);
		expect(both, `і зв'язок, і «різні люди» водночас:\n  ${both.join('\n  ')}`).toEqual([]);
	});

	it('у потоці учнів жодна людина не з\'являється двічі', () => {
		const bad: string[] = [];
		for (const master of MASTERS) {
			const seen = new Map<string, number>();
			for (const entry of getStudentsByMaster(master.id)) {
				/* Ключ — людина, а не запис: у сімох людей `id` збігається в обох
				 * реєстрах, тож рахувати окремо «випускника» й «працівника»
				 * означало б не помітити саме той дубль, який шукаємо. */
				const person = entry.kind === 'master' ? entry.master.id : entry.graduate.id;
				const key = linkedMasterId(person) ?? person;
				seen.set(key, (seen.get(key) ?? 0) + 1);
			}
			for (const [person, times] of seen)
				if (times > 1) bad.push(`${master.id}: ${person} — ${times} рази`);
		}
		expect(bad, `подвійна зірка в потоці:\n  ${bad.join('\n  ')}`).toEqual([]);
	});
});
