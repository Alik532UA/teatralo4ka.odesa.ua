import { asset } from '$app/paths';
import type { Pathname } from '$app/types';

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

export interface HistoryMetricSummary {
	completed: number;
	total: number;
	percent: number;
}

export interface HistoryDailySnapshot {
	date: string;
	commitHash?: string;
	overallPercent: number;
	categoryPercents: {
		graduates: number;
		groups: number;
		plays: number;
		masters: number;
		festivals: number;
	};
	metrics: Record<string, HistoryMetricSummary>;
}

export function statsJsonUrl(): string {
	return asset('/galaxy/stats.json');
}

export function statsHistoryJsonUrl(): string {
	return asset('/galaxy/stats-history.json');
}

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

/**
 * Колір показника «як воно»: зелений від 80 %, бурштиновий від 50 %, інакше
 * червоний. Пороги ті самі, що в кружечках звіту (`generateTextReport`).
 *
 * ## Чому `light-dark()`, а не три хекси
 *
 * Було по три хекси В ДВОХ місцях — на сторінці статистики і в
 * `StatsMetricCard`, — і обидві копії світлі: #10b981, #f59e0b, #f43f5e. Ці
 * значення розраховані на темне тло, а сторінка живе в ТЕМІ САЙТУ. Заміряно
 * 7 вересня 2026 у шести темах: «32 %» у підсумку давало 2,47 у «темній синій»
 * (#f43f5e на #0f4c75), «36 %» у картці — 3,35 у «жовтій» (#f43f5e на #fff89a).
 * Потрібно 4,5.
 *
 * `light-dark()` питає не назву теми, а `color-scheme` документа — і саме тому
 * витримує ще не придумані теми: `global.css` звужує схему для кожної з шести
 * (жовті — до `light`), тож нова тема отримає правильний бік автоматично.
 *
 * Значення взяті парами з тієї самої шкали Tailwind, у якій були старі:
 * emerald-800/300, amber-800/300, rose-800/300. Перший підхід брав пари на два
 * кроки слабші (700/400) — і гейт `galaxy-theme-colors.spec.ts` показав, що на
 * ВЛАСНІЙ підфарбованій плашці («Сьогодні (Актуальні дані)» має тло
 * `rgba(16 185 129 / 0.15)`) цього мало: 4,39 у світлій і 3,85 у «темній
 * синій». Тому пари саме такі — вони проходять і на чистій поверхні, і на
 * підфарбованій.
 */
export const STATUS_GOOD = 'light-dark(#065f46, #6ee7b7)';
export const STATUS_MID = 'light-dark(#92400e, #fcd34d)';
export const STATUS_BAD = 'light-dark(#9f1239, #fda4af)';

export function metricStatusColor(percent: number): string {
	if (percent >= 80) return STATUS_GOOD;
	if (percent >= 50) return STATUS_MID;
	return STATUS_BAD;
}

/**
 * Текст НА плашці, пофарбованій `metricStatusColor`.
 *
 * Окрема функція, бо пара «тло + те, що на ньому» перевертається разом зі
 * схемою: у світлій плашка темна й напис білий, у темній навпаки. Жорсткий
 * `color: #fff` давав на світлій плашці 3,67 замість 4,5 — і однаково погано в
 * усіх шести темах, бо не залежав від жодної.
 */
export const METRIC_STATUS_INK = 'light-dark(#ffffff, #0b1120)';
