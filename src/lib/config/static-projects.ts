import { asset, resolve } from '$app/paths';
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
		coverUrl: asset('/2025-2026/teatr-pro-2026.jpg'),
		titles: { uk: 'Театр.PRO', en: 'Theater.PRO' },
		excerpts: { uk: 'Фестиваль абітурієнтів закладів мистецької освіти України', en: 'A festival for applicants to Ukraine’s arts education institutions' },
	},
	{
		id: 'support-production',
		slug: 'support-production',
		color: '#4ECDC4',
		coverUrl: asset('/png/support-production.png'),
		titles: { uk: 'ДТШ-production', en: 'DTSH-production' },
		excerpts: { uk: 'Наш власний медіа-центр: відеопроєкти, короткометражки та творчі колаборації', en: 'Our own media center: video projects, short films, and creative collaborations' },
	},
	{
		id: 'photo-archive',
		slug: 'photo-archive',
		color: '#FFE66D',
		coverUrl: asset('/png/photo-archive.png'),
		titles: { uk: 'Фотоархів', en: 'Photo Archive' },
		excerpts: { uk: 'Історія школи у світлинах: від перших вистав до сучасних подій', en: "The school's history in photographs: from first performances to modern events" },
	},
	{
		id: 'galaxy-graduates',
		slug: 'galaxy-graduates',
		color: '#A78BFA',
		coverUrl: asset('/png/galaxy-graduates.png'),
		titles: { uk: 'Галактика випускників', en: 'Galaxy of Graduates' },
		excerpts: { uk: 'Спільнота випускників: зустрічі, майстер-класи та творча підтримка', en: 'Graduate community: reunions, masterclasses, and creative support' },
	},
	{
		id: 'creativity-planet',
		slug: 'creativity-planet',
		color: '#5EEAD4',
		coverUrl: asset('/png/creativity-planet.webp'),
		titles: { uk: 'Планета творчості', en: 'Planet of Creativity' },
		excerpts: {
			uk: 'Шлях починається тут: спершу планета, потім — галактика випускників',
			en: 'The journey starts here: first the planet, then the galaxy of graduates'
		},
	},
	{
		id: 'tkach-perekladach',
		slug: 'tkach-perekladach',
		color: '#E1306C',
		coverUrl: asset('/png/tkach-perekladach.webp'),
		titles: { uk: '«Ткач Перекладач»', en: '«Tkach Translator»' },
		excerpts: {
			uk: 'Переклади сучасної світової драматургії та театральних пʼєс українською мовою',
			en: 'Ukrainian translations of contemporary world drama and theatre plays'
		},
	},
	{
		id: 'stage-speech',
		slug: 'stage-speech',
		color: '#F9B31D',
		coverUrl: asset('/png/stage-speech.webp'),
		titles: { uk: 'Вправи зі сценічної мови', en: 'Stage Speech Exercises' },
		excerpts: {
			uk: 'Практичні вправи для дикції та дихання: гекзаметр і довгомовка «Ярмарок» Остапа Вишні',
			en: 'Practical diction and breathing exercises: hexameter and the "Fair" tongue-twister by Ostap Vyshnya'
		},
	},
	{
		id: 'brandbook',
		slug: 'brandbook',
		color: '#FFED00',
		coverUrl: asset('/png/brandbook.webp'),
		titles: { uk: 'BrandBook', en: 'BrandBook' },
		excerpts: {
			uk: 'Фірмовий стиль школи: кольори (#ffed00, #00b5ec, #e20413, #f9b31d, #1d1d1d), шрифт e-Ukraine, логотипи',
			en: 'School brand identity: colors (#ffed00, #00b5ec, #e20413, #f9b31d, #1d1d1d), e-Ukraine font, logos'
		},
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
				: { href: resolve('/projects/[slug]', { slug: def.slug }) }),
		}));
}

/**
 * Returns static project definitions as slug/title pairs for use in article pickers.
 */
export function getStaticProjectEntries(): { slug: string; path: string; titleUk: string; titleEn: string }[] {
	return STATIC_PROJECT_DEFS.map(def => ({
		slug: def.slug,
		path: def.externalUrl || `/projects/${def.slug}`,
		titleUk: def.titles.uk,
		titleEn: def.titles.en,
	}));
}
