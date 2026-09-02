import { loadPageWithMetadata } from '$lib/i18n/loader';
import { getListedMasters, getGraduatesByMaster } from '$lib/data/masters';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = async () => {
	const uk = loadPageWithMetadata('uk', 'residents-adults');
	const en = loadPageWithMetadata('en', 'residents-adults');

	/*
	 * `getListedMasters`, а не `getAllMasters`: відсів робиться ТУТ, а не у
	 * розмітці. Фільтр у `{#each}` прибрав би картку з екрана й лишив би запис у
	 * серіалізованих даних сторінки.
	 *
	 * Межа перевірена й названа вголос: сам `masters.index.json` імпортується
	 * модулем і потрапляє в клієнтський чанк ЦІЛКОМ, тож запис із
	 * рівня `linked` у бандлі лишається (заміряно у `build/_app/immutable/`).
	 * «Не показуємо» тут означає «немає в списку, немає в мапі сайту, сторінка
	 * має `noindex`» — а не «дані недосяжні». Це прийнято свідомо: репозиторій
	 * відкритий, і довжина шляху до JSON нічого не додає до захисту.
	 */
	const masters = getListedMasters().map((m) => {
		const graduates = getGraduatesByMaster(m.id);
		return {
			...m,
			graduatesCount: graduates.length
		};
	});

	return { uk, en, masters };
};
