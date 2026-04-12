import { base } from '$app/paths';
import type { ContentCardItem } from '$lib/components/ContentCard.svelte';

interface StaticProjectDef {
	id: string;
	slug: string;
	color: string;
	coverUrl?: string;
	externalUrl?: string;
	titles: { uk: string; en: string };
	excerpts: { uk: string; en: string };
}

const STATIC_PROJECT_DEFS: StaticProjectDef[] = [
	{
		id: 'teatr-pro',
		slug: 'teatr-pro',
		color: '#FF6B6B',
		coverUrl: `${base}/2025-2026/teatr-pro-2026.jpg`,
		titles: { uk: 'ТеатрPRO', en: 'TheaterPRO' },
		excerpts: { uk: 'Практичний проєкт для сценічної практики та командної роботи', en: 'Practical project for stage practice and teamwork' },
	},
	{
		id: 'support-production',
		slug: 'support-production',
		color: '#4ECDC4',
		coverUrl: `${base}/png/support-production.png`,
		titles: { uk: 'ДТШ-production', en: 'DTSH-production' },
		excerpts: { uk: 'Наш власний медіа-центр: відеопроєкти, короткометражки та творчі колаборації', en: 'Our own media center: video projects, short films, and creative collaborations' },
	},
	{
		id: 'photo-archive',
		slug: 'photo-archive',
		color: '#FFE66D',
		coverUrl: `${base}/png/photo-archive.png`,
		titles: { uk: 'Фотоархів', en: 'Photo Archive' },
		excerpts: { uk: 'Історія школи у світлинах: від перших вистав до сучасних подій', en: "The school's history in photographs: from first performances to modern events" },
	},
	{
		id: 'galaxy-graduates',
		slug: 'galaxy-graduates',
		color: '#A78BFA',
		coverUrl: `${base}/png/galaxy-graduates.png`,
		externalUrl: 'https://sites.google.com/view/ats-ua',
		titles: { uk: 'Галактика випускників', en: 'Galaxy of Graduates' },
		excerpts: { uk: 'Спільнота випускників: зустрічі, майстер-класи та творча підтримка', en: 'Graduate community: reunions, masterclasses, and creative support' },
	},
];

/**
 * Returns translated static project cards, excluding any slugs already loaded from Firebase.
 */
export function getStaticProjects(
	lang: 'uk' | 'en',
	excludeSlugs?: Set<string | undefined>,
): ContentCardItem[] {
	return STATIC_PROJECT_DEFS
		.filter(def => !excludeSlugs || !excludeSlugs.has(def.slug))
		.map(def => ({
			id: def.id,
			slug: def.slug,
			title: def.titles[lang],
			date: '',
			category: '',
			excerpt: def.excerpts[lang],
			color: def.color,
			coverUrl: def.coverUrl || '',
			...(def.externalUrl
				? { href: def.externalUrl, isExternal: true }
				: { href: `${base}/projects/${def.slug}` }),
		}));
}

/**
 * Returns static project definitions as slug/title pairs for use in article pickers.
 */
export function getStaticProjectEntries(): { slug: string; path: string; titleUk: string; titleEn: string }[] {
	return STATIC_PROJECT_DEFS.map(def => ({
		slug: def.slug,
		path: `/projects/${def.slug}`,
		titleUk: def.titles.uk,
		titleEn: def.titles.en,
	}));
}
