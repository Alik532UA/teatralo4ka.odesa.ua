import { statsJsonUrl, type StatsData } from '$lib/data/stats';

export const prerender = true;

export async function load({ fetch }) {
	const res = await fetch(statsJsonUrl());
	if (!res.ok) {
		throw new Error(`Failed to load archive stats data: ${res.status}`);
	}
	const stats = (await res.json()) as StatsData;
	return { stats };
}
