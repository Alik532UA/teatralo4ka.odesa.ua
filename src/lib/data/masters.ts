import type { Department } from './graduates';

export interface Master {
	id: string;
	slug: string;
	displayName: string;
	fullName: string;
	displayNameEn: string;
	fullNameEn: string;
	departments: Department[];
	photo?: string;
	bio?: string;
	isHonorary?: boolean;
}

export const MASTERS: Master[] = [
	{
		id: 'svitlana-ryskina',
		slug: 'svitlana-ryskina',
		displayName: 'Світлана РИСЬКІНА',
		fullName: 'Риськіна Світлана Миколаївна',
		displayNameEn: 'Svitlana RYSKINA',
		fullNameEn: 'Svitlana Ryskina',
		departments: ['theatre']
	},
	{
		id: 'tetiana-isachkina',
		slug: 'tetiana-isachkina',
		displayName: 'Тетяна ІСАЧКІНА',
		fullName: 'Ісачкіна Тетяна Валеріївна',
		displayNameEn: 'Tetiana ISACHKINA',
		fullNameEn: 'Tetiana Isachkina',
		departments: ['theatre']
	},
	{
		id: 'fedir-tkach',
		slug: 'fedir-tkach',
		displayName: 'Федір ТКАЧ',
		fullName: 'Ткач Федір Федорович',
		displayNameEn: 'Fedir TKACH',
		fullNameEn: 'Fedir Tkach',
		departments: ['theatre']
	},
	{
		id: 'hanna-tkach',
		slug: 'hanna-tkach',
		displayName: 'Ганна ТКАЧ',
		fullName: 'Ткач Ганна Федорівна',
		displayNameEn: 'Hanna TKACH',
		fullNameEn: 'Hanna Tkach',
		departments: ['theatre']
	},
	{
		id: 'samuil-imas',
		slug: 'samuil-imas',
		displayName: 'Самуїл ІМАС',
		fullName: 'Імас Самуїл Михайлович',
		displayNameEn: 'Samuil IMAS',
		fullNameEn: 'Samuil Imas',
		departments: ['theatre'],
		isHonorary: true
	},
	{
		id: 'oleh-shevchuk',
		slug: 'oleh-shevchuk',
		displayName: 'Олег ШЕВЧУК',
		fullName: 'Шевчук Олег В.',
		displayNameEn: 'Oleh SHEVCHUK',
		fullNameEn: 'Oleh Shevchuk',
		departments: ['theatre']
	},
	{
		id: 'olena-prorok',
		slug: 'olena-prorok',
		displayName: 'Олена ПРОРОК',
		fullName: 'Пророк Олена Володимирівна',
		displayNameEn: 'Olena PROROK',
		fullNameEn: 'Olena Prorok',
		departments: ['piano', 'music']
	},
	{
		id: 'pavlo-koshka',
		slug: 'pavlo-koshka',
		displayName: 'Павло КОШКА',
		fullName: 'Кошка Павло Володимирович',
		displayNameEn: 'Pavlo KOSHKA',
		fullNameEn: 'Pavlo Koshka',
		departments: ['theatre']
	},
	{
		id: 'vira-koval',
		slug: 'vira-koval',
		displayName: 'Віра КОВАЛЬ',
		fullName: 'Коваль Віра Борисівна',
		displayNameEn: 'Vira KOVAL',
		fullNameEn: 'Vira Koval',
		departments: ['art']
	},
	{
		id: 'iryna-ovcharenko',
		slug: 'iryna-ovcharenko',
		displayName: 'Ірина ОВЧАРЕНКО',
		fullName: 'Овчаренко Ірина Григорівна',
		displayNameEn: 'Iryna OVCHARENKO',
		fullNameEn: 'Iryna Ovcharenko',
		departments: ['vocal']
	},
	{
		id: 'tereza-zaurbekova',
		slug: 'tereza-zaurbekova',
		displayName: 'Тереза ЗАУРБЕКОВА',
		fullName: 'Заурбекова Тереза Валеріївна',
		displayNameEn: 'Tereza ZAURBEKOVA',
		fullNameEn: 'Tereza Zaurbekova',
		departments: ['theatre']
	},
	{
		id: 'liliia-velychko',
		slug: 'liliia-velychko',
		displayName: 'Лілія ВЕЛИЧКО',
		fullName: 'Величко Лілія М.',
		displayNameEn: 'Liliia VELYCHKO',
		fullNameEn: 'Liliia Velychko',
		departments: ['vocal']
	},
	{
		id: 'oksana-panchenko',
		slug: 'oksana-panchenko',
		displayName: 'Оксана ПАНЧЕНКО',
		fullName: 'Панченко Оксана Костянтинівна',
		displayNameEn: 'Oksana PANCHENKO',
		fullNameEn: 'Oksana Panchenko',
		departments: ['music']
	},
	{
		id: 'natalia-bakina',
		slug: 'natalia-bakina',
		displayName: 'Наталя БАКІНА',
		fullName: 'Бакіна Наталя Г.',
		displayNameEn: 'Natalia BAKINA',
		fullNameEn: 'Natalia Bakina',
		departments: ['vocal']
	},
	{
		id: 'anastasiia-nikolaieva',
		slug: 'anastasiia-nikolaieva',
		displayName: 'Анастасія НІКОЛАЄВА',
		fullName: 'Ніколаєва Анастасія Олексіївна',
		displayNameEn: 'Anastasiia NIKOLAIEVA',
		fullNameEn: 'Anastasiia Nikolaieva',
		departments: ['vocal']
	},
	{
		id: 'hanna-serebriannikova',
		slug: 'hanna-serebriannikova',
		displayName: 'Ганна СЕРЕБРЯННІКОВА',
		fullName: 'Серебряннікова Ганна Іванівна',
		displayNameEn: 'Hanna SEREBRYANNIKOVA',
		fullNameEn: 'Hanna Serebryannikova',
		departments: ['theatre']
	},
	{
		id: 'iryna-kulbaba',
		slug: 'iryna-kulbaba',
		displayName: 'Ірина КУЛЬБАБА',
		fullName: 'Кульбаба Ірина Борисівна',
		displayNameEn: 'Iryna KULBABA',
		fullNameEn: 'Iryna Kulbaba',
		departments: ['theatre']
	},
	{
		id: 'myroslava-derepa',
		slug: 'myroslava-derepa',
		displayName: 'Мирослава ДЕРЕПА',
		fullName: 'Дерепа Мирослава Ігорівна',
		displayNameEn: 'Myroslava DEREPA',
		fullNameEn: 'Myroslava Derepa',
		departments: ['theatre']
	},
	{
		id: 'natalia-shkolna',
		slug: 'natalia-shkolna',
		displayName: 'Наталя ШКОЛЬНА',
		fullName: 'Школьна Наталя А.',
		displayNameEn: 'Natalia SHKOLNA',
		fullNameEn: 'Natalia Shkolna',
		departments: ['vocal']
	},
	{
		id: 'n-rybakova',
		slug: 'n-rybakova',
		displayName: 'Н. РИБАКОВА',
		fullName: 'Рибакова Н.В.',
		displayNameEn: 'N. RYBAKOVA',
		fullNameEn: 'N. Rybakova',
		departments: ['theatre']
	},
	{
		id: 'd-rybalchenko',
		slug: 'd-rybalchenko',
		displayName: 'Д. РИБАЛЬЧЕНКО',
		fullName: 'Рибальченко Д.Д.',
		displayNameEn: 'D. RYBALCHENKO',
		fullNameEn: 'D. Rybalchenko',
		departments: ['theatre']
	},
	{
		id: 'k-bilenko',
		slug: 'k-bilenko',
		displayName: 'Катерина БІЛЕНКО',
		fullName: 'Біленко Катерина Юріївна',
		displayNameEn: 'Kateryna BILENKO',
		fullNameEn: 'Kateryna Bilenko',
		departments: ['music']
	}
];

import indexData from './graduates.index.json';
import type { GraduateIndexEntry } from './graduates';

const MASTERS_BY_ID = new Map<string, Master>(MASTERS.map((m) => [m.id, m]));
const MASTERS_BY_SLUG = new Map<string, Master>(MASTERS.map((m) => [m.slug, m]));

export function getMasterById(id: string): Master | undefined {
	return MASTERS_BY_ID.get(id);
}

export function getMasterBySlug(slug: string): Master | undefined {
	return MASTERS_BY_SLUG.get(slug);
}

export function getAllMasters(): Master[] {
	return MASTERS;
}

export function masterProfilePath(slug: string, lang = 'uk'): string {
	const base = `/residents/adults/${slug}`;
	return lang === 'en' ? `/en${base}` : base;
}

export function getGraduatesByMaster(masterId: string): GraduateIndexEntry[] {
	return (indexData as GraduateIndexEntry[]).filter((g) => {
		if (!g.masters) return false;
		return g.masters.some((m) => (typeof m === 'string' ? m === masterId : m.id === masterId));
	});
}
