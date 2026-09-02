/**
 * Ролі по номерах програми — чиста логіка підпису під ім'ям на картці складу.
 *
 * ## Чому окремо від `playCast.ts`
 *
 * Той модуль тягне зріз складу (JSON) і має лишатися імпортом лише маршруту
 * вистави — так записано в його докблоці. Тут даних немає: дві функції, які
 * блок «Хто грав» викликає на кожну картку, і правило роздільника, яке краще
 * перевіряти тестом, а не оком на сторінці.
 */

/** Роль у ОДНОМУ номері програми. Перелік таких пар лежить у `CastEntry.roles`. */
export interface CastRole {
	item: string;
	role: string;
}

/** Роль людини в конкретному номері, або `undefined`, якщо там її не названо. */
export function roleInItem(
	roles: readonly CastRole[] | undefined,
	itemId: string
): string | undefined {
	return roles?.find((r) => r.item === itemId)?.role;
}

/**
 * Усі ролі вечора одним рядком, у порядку програми.
 *
 * Роздільник — кома, як пишуть у програмках («Учитель, Доктор, Біллі»). Але
 * коли сама роль містить кому («Людина, що читала Жана Ануя»), кома між ролями
 * зливає сусідні в одну — тоді роздільником стає крапка з комою. Однакова роль
 * у кількох номерах («Хор») називається раз.
 *
 * `null`, коли ролей по номерах не розкладено: картка тоді бере `role` або рік.
 */
export function rolesLine(
	roles: readonly CastRole[] | undefined,
	programmeOrder: readonly string[]
): string | null {
	if (!roles?.length) return null;
	const sorted = [...roles].sort(
		(a, b) => programmeOrder.indexOf(a.item) - programmeOrder.indexOf(b.item)
	);
	const distinct = [...new Set(sorted.map((r) => r.role))];
	return distinct.join(distinct.some((r) => r.includes(',')) ? '; ' : ', ');
}

/**
 * Склад номера в порядку АФІШІ, а не за абеткою.
 *
 * Програмка перелічує ролі у своєму порядку — головні спершу, «Хор — усі»
 * наприкінці, — і читач чекає побачити людей саме так: у «Незнайомці» спершу
 * Незнайомка, потім Пан у блакитному, потім Поет. Абетка ставила Аліка
 * Запольнова першим у кожному номері.
 *
 * Хто грав роль, якої в переліку немає, або ролі не названо взагалі («Актори —
 * усі» в «Сонетах»), іде після названих — у тому порядку, у якому прийшов,
 * тобто за абеткою. Без переліку ролей порядок не змінюється зовсім.
 */
export function byBilling<T extends { roles?: readonly CastRole[] }>(
	members: readonly T[],
	itemId: string,
	billing: readonly string[] | undefined
): T[] {
	if (!billing?.length) return [...members];
	const rank = (member: T): number => {
		const at = billing.indexOf(roleInItem(member.roles, itemId) ?? '');
		return at === -1 ? billing.length : at;
	};
	return [...members].sort((a, b) => rank(a) - rank(b));
}
