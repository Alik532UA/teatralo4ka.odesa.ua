import type { BrandAsset } from './types';

// 1. Герб (дві маски) — кольоровий, білий, прозорий
export const EMBLEM_VARIANTS: BrandAsset[] = [
	{
		id: 'emblem-color',
		nameUk: 'Герб (Кольоровий)',
		nameEn: 'Crest (Color)',
		descUk: 'Офіційний фірмовий герб Одеської театральної школи в повному кольорі.',
		descEn: 'Official full-color brand crest of the Odesa Theatre School.',
		previewUrl: '/brand/emblem/preview/emblem-color.webp',
		downloads: [
			{
				format: 'SVG',
				file: '/logo/svg/t4_logo_IndividualParticles_MasksTwo_2026.svg',
				label: 'SVG',
				downloadName: 'teatralo4ka-crest.svg'
			},
			{
				format: 'PNG',
				file: '/brand/emblem/emblem-color-800x484.png',
				label: 'PNG (800×484)',
				downloadName: 'teatralo4ka-crest-800x484.png',
				sizeSpec: '800×484 px'
			},
			{
				format: 'PNG',
				file: '/brand/emblem/emblem-color-2008x1216.png',
				label: 'PNG (2008×1216)',
				downloadName: 'teatralo4ka-crest-2008x1216.png',
				sizeSpec: '2008×1216 px'
			}
		]
	},
	{
		id: 'emblem-white',
		nameUk: 'Герб (Білий)',
		nameEn: 'Crest (White)',
		descUk: 'Монохромна інверсна версія для темних і контрастних фонів.',
		descEn: 'Monochrome inverse version for dark and high-contrast backgrounds.',
		previewUrl: '/brand/emblem/preview/emblem-white.webp',
		downloads: [
			{
				format: 'SVG',
				file: '/logo/svg/t4_logo_IndividualParticles_MasksTwo_White_2026.svg',
				label: 'SVG',
				downloadName: 'teatralo4ka-crest-white.svg'
			},
			{
				format: 'PNG',
				file: '/brand/emblem/emblem-white-2008x1216.png',
				label: 'PNG (2008×1216)',
				downloadName: 'teatralo4ka-crest-white-2008x1216.png',
				sizeSpec: '2008×1216 px'
			}
		]
	},
	{
		id: 'emblem-transparent',
		nameUk: 'Герб (Прозорий / Контурний)',
		nameEn: 'Crest (Outline / Transparent)',
		descUk: 'Прозора контурна версія для тиснення, гравіювання та накладання.',
		descEn: 'Transparent outline version for stamping, engraving, and overlays.',
		previewUrl: '/brand/emblem/preview/emblem-transparent.webp',
		downloads: [
			{
				format: 'SVG',
				file: '/logo/svg/t4_logo_IndividualParticles_MasksTwo_Transparent_2026.svg',
				label: 'SVG',
				downloadName: 'teatralo4ka-crest-outline.svg'
			},
			{
				format: 'PNG',
				file: '/brand/emblem/emblem-transparent-2008x1216.png',
				label: 'PNG (2008×1216)',
				downloadName: 'teatralo4ka-crest-outline-2008x1216.png',
				sizeSpec: '2008×1216 px'
			}
		]
	}
];

// 2. Аватарки для соціальних мереж
export const AVATAR_ASSETS: BrandAsset[] = [
	{
		id: 'avatar-square',
		nameUk: 'Квадратна аватарка (1200×1200)',
		nameEn: 'Square Avatar (1200×1200)',
		descUk: 'Універсальний квадратний формат для Facebook, Instagram, сайтів та каталогів.',
		descEn: 'Universal square format for social platforms and catalogues.',
		previewUrl: '/brand/avatar/preview/avatar-square.webp',
		downloads: [
			{
				format: 'PNG',
				file: '/brand/avatar/avatar-square-1200px.png',
				label: 'PNG (1200×1200)',
				downloadName: 'teatralo4ka-avatar-square-1200px.png',
				sizeSpec: '1200×1200 px'
			}
		]
	},
	{
		id: 'avatar-round',
		nameUk: 'Кругла аватарка (1200×1200)',
		nameEn: 'Round Avatar (1200×1200)',
		descUk: 'Оптимізована кругла маска для Telegram, Viber, TikTok та YouTube.',
		descEn: 'Optimized circular avatar for messaging apps and social video channels.',
		previewUrl: '/brand/avatar/preview/avatar-round.webp',
		downloads: [
			{
				format: 'PNG',
				file: '/brand/avatar/avatar-round-1200px.png',
				label: 'PNG (1200×1200)',
				downloadName: 'teatralo4ka-avatar-round-1200px.png',
				sizeSpec: '1200×1200 px'
			}
		]
	}
];
