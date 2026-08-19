/**
 * Версія збірки для позначок (BETA-CHECKLIST-v8 § 3.1).
 *
 * Береться з `app-version.json` — того самого файлу, який тягне
 * `services/version.ts`, тобто з ЄДИНОГО джерела версії в проєкті. Хардкод тут
 * заборонений інваріантом `src/version.test.ts`, і не формально: число, вписане
 * руками, розсинхронізується з релізом і починає брехати саме в тому місці, де
 * від нього залежить сенс усіх позначок.
 *
 * Читається під час prerender, тобто значення запікається в HTML. Це правильно
 * для позначки версії: тестувальник на старій сторінці з кешу мусить бачити
 * версію ТОЇ сторінки, а не найсвіжішу.
 */
export const prerender = true;

export async function load({ fetch }: { fetch: typeof globalThis.fetch }) {
	// Без try/catch навмисно: `handleHttpError: 'fail'` завалить збірку, і це
	// краще за сторінку, де позначки тихо носять версію «невідомо».
	const response = await fetch('/app-version.json');
	const data = (await response.json()) as { version?: string };
	return { appVersion: data.version ?? '' };
}
