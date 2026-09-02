import {
	statsJsonUrl,
	statsHistoryJsonUrl,
	type StatsData,
	type HistoryDailySnapshot
} from '$lib/data/stats';

export const prerender = true;

export async function load({ fetch }) {
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

	return { stats, history };
}
