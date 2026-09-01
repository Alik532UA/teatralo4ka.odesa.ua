/**
 * Один кеш анкет випускників на весь сайт.
 *
 * ЧОМУ ЦЕ ОКРЕМИЙ МОДУЛЬ, А НЕ ЗМІННА В `+page.svelte` ГАЛАКТИКИ. Місць,
 * звідки можна відкрити випускника, більше ніж одне: галактика, сторінка
 * майстра, сторінка навчальної групи — і список ростиме. Доки читання файлу
 * жило всередині сторінки галактики, решта не вміла його читати ВЗАГАЛІ: там
 * з'явився другий, спрощений вигляд картки, який показував людину так, ніби
 * анкети немає, навіть коли вона є. Кеш винесено сюди саме щоб цей другий
 * вигляд більше не був потрібен.
 *
 * `SvelteMap`, а не звичайна `Map`: у звичайної руни не бачать `set()`, і
 * картка лишалася б із порожніми подробицями, доки щось інше не перемалює
 * компонент. Правило `svelte/prefer-svelte-reactivity` ловить саме це.
 */
import { SvelteMap } from 'svelte/reactivity';
import { browser } from '$app/environment';
import { errorLogger } from '$lib/services/errorLogger';
import { graduateProfileJson, type GraduateProfile } from '$lib/data/graduates';

const cache = new SvelteMap<string, GraduateProfile>();

/**
 * Уже прочитана анкета або `null`. Читати можна з `$derived`: `SvelteMap`
 * будить руни на `set()`, тож картка перемалюється сама, коли файл прийде.
 */
/** Ключ кешу — АДРЕСА випускника (див. `graduateProfileJson`), не `code`. */
export function cachedGraduateProfile(
	address: string | null | undefined
): GraduateProfile | null {
	return address ? (cache.get(address) ?? null) : null;
}

/**
 * Читає анкету, якщо її ще немає в кеші. Повторний виклик для того самого коду
 * безкоштовний, тож викликати можна з `$effect` без власних перевірок.
 *
 * Сигнал приходить ЗЗОВНІ, а не береться всередині: `getAbortSignal()` читає
 * поточну реакцію, тож викликати його треба в тілі ефекту, доки та реакція ще
 * та сама. Досить швидко клацнути дві зірки поспіль — і перший запит перестає
 * бути потрібним ще до відповіді.
 *
 * `AbortError` мовчазний навмисно: це не збій, а рівно те, чого ми просили.
 * Решта йде рівнем `warn`, а не `error` (ERROR-HANDLING-v8, DEBUGGING-v8):
 * недоступна мережа — очікувана ситуація, і засмічувати нею лічильник помилок
 * означає перестати його читати.
 */
export async function ensureGraduateProfile(
	address: string | null | undefined,
	signal?: AbortSignal
): Promise<void> {
	if (!address || !browser || cache.has(address)) return;
	try {
		const response = await fetch(graduateProfileJson(address), { signal });
		if (!response.ok) {
			errorLogger.logWarning(`профіль ${address} не читається (${response.status})`, {
				component: 'graduate-profiles'
			});
			return;
		}
		cache.set(address, (await response.json()) as GraduateProfile);
	} catch (error) {
		if (error instanceof DOMException && error.name === 'AbortError') return;
		errorLogger.logWarning(
			`профіль ${address} не завантажився`,
			{ component: 'graduate-profiles' },
			error
		);
	}
}
