import { localeFromPath } from '$lib/i18n/routing';
import {
	statsJsonUrl,
	statsHistoryJsonUrl,
	type StatsData,
	type HistoryDailySnapshot
} from '$lib/data/stats';

export const prerender = true;

export async function load({ fetch, url }) {
	const [statsRes, historyRes] = await Promise.all([
		fetch(statsJsonUrl()),
		fetch(statsHistoryJsonUrl())
	]);

	if (!statsRes.ok) {
		throw new Error(`Failed to load archive stats data: ${statsRes.status}`);
	}

	const stats = (await statsRes.json()) as StatsData;
	let history: HistoryDailySnapshot[] = [];
	if (historyRes.ok) {
		history = (await historyRes.json()) as HistoryDailySnapshot[];
	}

	const isEn = localeFromPath(url.pathname) === 'en';
	return {
		stats,
		history,
		seoTitle: isEn ? 'Archival Completeness Statistics' : 'Статистика наповнення архіву',
		seoDescription: isEn
			? 'Completeness statistics of the Galaxy of Graduates archive: count of profiles, plays, festivals, and photos.'
			: 'Статистика наповнення архіву «Галактики випускників»: кількість анкет, вистав, фестивалів та фотоматеріалів.',
		ogImageUrl: '/og/og-gg-1200x630.jpg'
	};
}
