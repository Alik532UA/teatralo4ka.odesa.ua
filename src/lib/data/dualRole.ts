// JSON читається НАПРЯМУ, а не через `masters.ts`/`graduates.ts`, і причина не
// в економії: `masters.ts` імпортує цей модуль (`getStudentsByMaster` вирішує,
// якою зіркою летить подвійна людина), тож зворотний імпорт дав би цикл. Тут
// потрібні лише ключі й два прапорці — типи нижче описують рівно їх.
import mastersIndexData from './masters.index.json';
import graduatesIndexData from './graduates.index.json';
import { isMasterRecordPublic } from '../config/mastersVisibility';

/**
 * Одна людина у ДВОХ реєстрах: випускник, який тепер тут працює.
 *
 * ## Що це за випадок і скільки їх
 *
 * Заміряно 2026-08-31 на повних реєстрах (141 запис працівників, 530 —
 * випускників): таких людей **одинадцять**. Сім із них мають в обох реєстрах
 * ОДНАКОВИЙ `id`, і це чиста випадковість — ключі заморожували незалежно, а
 * читати цей збіг не пробував ніхто. У чотирьох він розійшовся: зміна прізвища
 * (Осадча ← Бур'ян), інший ключ на ту саму людину (`d-rybalchenko`), різна
 * транслітерація (Валдіс/Валдес, Дарія/Дар'я).
 *
 * Саме тому зв'язок ЯВНИЙ, а не «за однаковим ключем»: такий пошук знайшов би
 * 7 з 11. Гірше зворотне — прізвищ-двійників у даних 45 пар, і майже всі це
 * РОДИЧІ (Самуїл і Ольга Імас та випускниця Єва Імас; Тетяна Ісачкіна та
 * випускниці Єва й Дар'я). Автоматичне склеювання за прізвищем оголосило б їх
 * однією людиною без жодної помилки.
 *
 * Саме поле — `MasterIndexEntry.alsoGraduateId`; там же й причина, чому воно
 * живе в реєстрі працівників, а не випускників.
 *
 * ## Сторінки лишаються ДВІ
 *
 * Спільної сторінки немає навмисно. `code` випускника (`Alik`,
 * `nadiia-rybakova`) — це САМА адреса зі старого сайту, яку люди роздавали
 * роками; третя адреса на ту саму людину зламала б або її, або сторінку
 * працівника. Дві сторінки відповідають на різні питання — «ким я був тут» і
 * «чим я тут займаюся», — і зв'язок лише робить кожну з них видимою з іншої.
 *
 * ## Прихований працівник зв'язку НЕ отримує — у ЖОДНОМУ напрямку
 *
 * `visible: false` означає «не показуємо в переліку команди», і
 * [`mastersVisibility.ts`](../config/mastersVisibility.ts) перелічує чотири
 * поверхні цієї обіцянки. Кнопка стала б п'ятою, про яку там не сказано, тож
 * зв'язок обривається тут — в одному місці, а не трьома перевірками на трьох
 * сторінках. Таких серед одинадцяти двоє: Діана Руденко і Владислав Цобенко.
 *
 * Обривається саме в ОБИДВА боки, і це не надмірність: односторонній зв'язок
 * дав би зірку, що на сторінці майстра підписана «колега», а веде на сторінку,
 * якої в переліку немає. Правило одне — «прихованого не видно нізвідки», —
 * і симетричність його стереже `src/dual-role.test.ts`.
 */
interface LinkableMaster {
	id: string;
	visible?: boolean;
	alsoGraduateId?: string;
}

interface LinkableGraduate {
	id: string;
	hidden?: boolean;
}

const MASTER_ROWS = mastersIndexData satisfies readonly LinkableMaster[];
const GRADUATE_ROWS = graduatesIndexData satisfies readonly LinkableGraduate[];

/* Прихованих випускників теж пропускаємо: `GRADUATES` їх відфільтровує, тож
 * посилання вело б у нікуди. Заміряно: серед одинадцяти таких немає жодного —
 * перевірка на майбутнє, а не на теперішній стан. */
const VISIBLE_GRADUATE_IDS: ReadonlySet<string> = new Set(
	(GRADUATE_ROWS as LinkableGraduate[]).filter((g) => !g.hidden).map((g) => g.id)
);

/** `masterId → graduateId` і навпаки. Обидві мапи вже без прихованих. */
const GRADUATE_BY_MASTER = new Map<string, string>();
const MASTER_BY_GRADUATE = new Map<string, string>();

for (const master of MASTER_ROWS as LinkableMaster[]) {
	const graduateId = master.alsoGraduateId;
	if (!graduateId) continue;
	if (!isMasterRecordPublic(master)) continue;
	if (!VISIBLE_GRADUATE_IDS.has(graduateId)) continue;
	GRADUATE_BY_MASTER.set(master.id, graduateId);
	MASTER_BY_GRADUATE.set(graduateId, master.id);
}

/** Запис випускника цього працівника, або `null`. */
export function linkedGraduateId(masterId: string): string | null {
	return GRADUATE_BY_MASTER.get(masterId) ?? null;
}

/** Запис працівника цього випускника, або `null`. */
export function linkedMasterId(graduateId: string): string | null {
	return MASTER_BY_GRADUATE.get(graduateId) ?? null;
}

/** Скільки зв'язків показуємо. Для звітів збірки — щоб «нуль» був видимим. */
export function dualRoleCount(): number {
	return GRADUATE_BY_MASTER.size;
}
