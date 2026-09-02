// JSON читається НАПРЯМУ, а не через `masters.ts`/`graduates.ts`, і причина не
// в економії: `masters.ts` імпортує цей модуль (`getStudentsByMaster` вирішує,
// якою зіркою летить подвійна людина), тож зворотний імпорт дав би цикл. Тут
// потрібні лише ключі й рівень видимості — типи нижче описують рівно їх.
import mastersIndexData from './masters.index.json';
import graduatesIndexData from './graduates.index.json';
import { isLinked } from '../config/visibility';

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
 * ## Рівень `direct` зв'язку НЕ отримує — у ЖОДНОМУ напрямку
 *
 * Кнопка «також працівник» / «також випускник» — це зв'язок, тож рівень
 * `linked` («показуємо там, де є зв'язок», `config/visibility.ts`) її отримує:
 * так вирішив автор 2026-09-02, і саме тому двоє працівників рівня `linked`
 * серед одинадцяти — Діана Руденко і Владислав Цобенко — тепер мають кнопку,
 * якої за колишнім `visible: false` не мали. Обривається лише `direct`: його не
 * показують нізвідки, і кнопка стала б єдиною поверхнею, де він з'являється.
 *
 * Обривається в ОБИДВА боки, і це не надмірність: односторонній зв'язок дав би
 * зірку, що на сторінці майстра підписана «колега», а веде на сторінку, якої не
 * показують. Симетричність стереже `src/dual-role.test.ts`.
 */
interface LinkableMaster {
	id: string;
	visibility?: string;
	alsoGraduateId?: string;
}

interface LinkableGraduate {
	id: string;
	visibility?: string;
}

const MASTER_ROWS = mastersIndexData satisfies readonly LinkableMaster[];
const GRADUATE_ROWS = graduatesIndexData satisfies readonly LinkableGraduate[];

/* Випускників рівня `direct` пропускаємо: `LINKED_GRADUATES` їх відфільтровує,
 * тож посилання вело б у нікуди. Заміряно: серед одинадцяти таких немає жодного —
 * перевірка на майбутнє, а не на теперішній стан. */
const LINKED_GRADUATE_IDS: ReadonlySet<string> = new Set(
	(GRADUATE_ROWS as LinkableGraduate[]).filter(isLinked).map((g) => g.id)
);

/** `masterId → graduateId` і навпаки. Обидві мапи вже без рівня `direct`. */
const GRADUATE_BY_MASTER = new Map<string, string>();
const MASTER_BY_GRADUATE = new Map<string, string>();

for (const master of MASTER_ROWS as LinkableMaster[]) {
	const graduateId = master.alsoGraduateId;
	if (!graduateId) continue;
	if (!isLinked(master)) continue;
	if (!LINKED_GRADUATE_IDS.has(graduateId)) continue;
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
