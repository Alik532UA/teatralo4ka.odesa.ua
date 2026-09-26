import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = () => {
	return {
		seoTitle: 'Навчальний календар 2025–2026',
		seoDescription:
			'Академічний календар Одеської театральної школи на 2025–2026 навчальний рік: семестри, канікули, вихідні та святкові дні.'
	};
};
