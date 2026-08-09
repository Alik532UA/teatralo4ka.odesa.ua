/**
 * Заглушка `$app/paths` для юніт-тестів.
 *
 * Ці модулі створює плагін SvelteKit під час збірки, тож у vitest їх немає
 * взагалі — імпорт падає ще на резолві. Досі це не заважало лише тому, що
 * жоден тестований модуль їх не імпортував.
 *
 * Заглушка відтворює поведінку ПРОЄКТУ, а не SvelteKit узагалі:
 * `base` тут порожній, бо сайт стоїть на власному домені (`paths.base: ''`).
 *
 * Чого заглушка НЕ відтворює: справжній `resolve()` поважає `paths.relative`
 * і під час prerender віддає відносний шлях (`../../news/x`). У тестах це не
 * потрібно — вони перевіряють логіку побудови меню, а не форму шляху, — але
 * пам'ятати про різницю варто: саме відносні шляхи колись дали
 * `https://teatralo4ka.odesa.ua../logo/…` в JSON-LD.
 */
export const base = '';
export const assets = '';

/** Підстановка параметрів у шаблон маршруту: '/news/[id]' + { id } → '/news/x'. */
export function resolve(id: string, params?: Record<string, string>): string {
	if (!id.startsWith('/')) {
		throw new Error(`resolve() приймає лише абсолютні шляхи та ідентифікатори маршрутів (отримано "${id}")`);
	}
	if (!params) return id;
	return id.replace(/\[(?:\.\.\.)?([^\]]+)\]/g, (_, name: string) => {
		const value = params[name];
		if (value === undefined) throw new Error(`resolve(): не передано параметр "${name}" для "${id}"`);
		return value;
	});
}

export function asset(file: string): string {
	return file;
}

export const resolveRoute = resolve;
