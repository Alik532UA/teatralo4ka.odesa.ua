import type { Pathname } from '$app/types';
import statsData from './stats.data.json';

export type MissingItemTuple = [id: string, title: string, subtitle?: string];

export interface StatMetric {
	id: string;
	labelUk: string;
	labelEn: string;
	descriptionUk?: string;
	descriptionEn?: string;
	total: number;
	completed: number;
	percent: number;
	missingItems: MissingItemTuple[];
}

export interface StatCategory {
	id: 'graduates' | 'groups' | 'plays' | 'masters' | 'festivals';
	titleUk: string;
	titleEn: string;
	icon: string;
	totalEntities: number;
	overallPercent: number;
	metrics: StatMetric[];
}

export interface StatsData {
	generatedAt: string;
	overallPercent: number;
	categories: StatCategory[];
}

export const STATS = statsData as unknown as StatsData;

/**
 * Генерує канонічний шлях до сутності за її категорією та ID.
 */
export function getEntityHref(
	category: 'graduates' | 'groups' | 'plays' | 'masters' | 'festivals',
	id: string
): Pathname {
	switch (category) {
		case 'graduates':
			return `/projects/galaxy-graduates/${id}/` as Pathname;
		case 'groups':
			return `/projects/galaxy-graduates/groups/${id}/` as Pathname;
		case 'plays':
			return `/projects/galaxy-graduates/plays/${id}/` as Pathname;
		case 'masters':
			return `/residents/adults/${id}/` as Pathname;
		case 'festivals':
			return `/projects/galaxy-graduates/festivals/${id}/` as Pathname;
		default:
			return `/projects/galaxy-graduates/` as Pathname;
	}
}

/**
 * Формує структурований текстовий звіт про стан наповнення архіву для копіювання в буфер обміну.
 */
export function generateTextReport(data: StatsData): string {
	const date = new Date(data.generatedAt).toLocaleDateString('uk-UA');
	const lines: string[] = [
		`📊 ЗВІТ НАПОВНЕННЯ АРХІВУ «СУЗІР'Я ВИПУСКНИКІВ» (${date})`,
		`Загальний індекс повноти бази: ${data.overallPercent}%`,
		'-------------------------------------------------------'
	];

	for (const cat of data.categories) {
		lines.push(`\n📌 ${cat.titleUk.toUpperCase()} — ${cat.overallPercent}% (усього об'єктів: ${cat.totalEntities})`);
		for (const m of cat.metrics) {
			const bar = m.percent >= 80 ? '🟢' : m.percent >= 50 ? '🟡' : '🔴';
			lines.push(`  ${bar} ${m.labelUk}: ${m.completed}/${m.total} (${m.percent}%) — бракує: ${m.missingItems.length}`);
		}
	}

	lines.push('\n-------------------------------------------------------');
	lines.push('Допомогти заповнити архів: https://teatralo4ka.odesa.ua/projects/galaxy-graduates/stats');
	return lines.join('\n');
}
