<script lang="ts">
	import { t } from 'svelte-i18n';
	import { localizedPath } from '$lib/i18n/routing';
	import { graduationCaption } from '$lib/data/graduates';
	import type { ResolvedPathname } from '$app/types';

	/**
	 * Рядок «вступ 2006 · випуск 2014» під іменем випускника.
	 *
	 * Окремим файлом, бо `GraduateProfileView` — найбільший компонент проєкту,
	 * і після того, як рік випуску став посиланням, він переріс свою стелю в
	 * `structure.test.ts`. Роки — самодостатній шматок: два підписи, роздільник
	 * і одна адреса.
	 */
	interface Props {
		enrollmentYears: number[];
		graduationYear: number | null;
		/** Свій підпис замість «випуск» — див. `graduationCaption`. */
		graduationLabelKey?: string;
		isEn: boolean;
	}

	let { enrollmentYears, graduationYear, graduationLabelKey, isEn }: Props = $props();

	const enrollmentText = $derived(
		enrollmentYears.length > 0
			? `${$t('galaxy.enrolled')} ${enrollmentYears.join(', ')}`
			: null
	);

	const graduationText = $derived(
		graduationCaption({ graduationYear, graduationLabelKey }, $t)
	);

	/**
	 * Рік випуску веде в реєстр, відфільтрований по цьому ж року.
	 *
	 * Приведення типу тут не обхід правила `svelte/no-navigation-without-resolve`,
	 * а точне його виконання: шлях уже пройшов `localizedPath` (тобто
	 * `ResolvedPathname`), а рядок запиту резолвити нема чого — він не частина
	 * маршруту. Без приведення склейка дає звичайний `string`, і правило
	 * справедливо перестає впізнавати перевірену адресу.
	 */
	const graduationYearHref = $derived(
		graduationYear
			? (`${localizedPath('/projects/galaxy-graduates/', isEn ? 'en' : 'uk')}?roster=open&year=${graduationYear}` as ResolvedPathname)
			: null
	);
</script>

{#if enrollmentText || graduationText}
	<div class="years" data-testid="galaxy-card-years-text">
		{#if enrollmentText}<span class="years__item">{enrollmentText}</span>{/if}
		{#if enrollmentText && graduationText}<span class="years__sep" aria-hidden="true"
				>·</span
			>{/if}
		{#if graduationText}{#if graduationYearHref}<a
					class="years__item years__item--link"
					href={graduationYearHref}
					title={$t('galaxy.graduatesList', { default: 'Список випускників' })}
					data-testid="galaxy-card-graduation-year-link">{graduationText}</a
				>{:else}<span class="years__item">{graduationText}</span>{/if}{/if}
	</div>
{/if}

<style>
	.years {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		gap: 0.2rem 0.45rem;
		margin: 0 0 0.9rem;
		color: var(--galaxy-muted);
		font-variant-numeric: tabular-nums;
		text-align: center;
		font-size: 0.95rem;
		line-height: 1.35;
	}
	.years__item {
		white-space: nowrap;
	}
	/*
	 * КНОПКА, а не підкреслений текст.
	 *
	 * Пунктирне підкреслення обиралося колись, щоб не читатися як помилка
	 * розмітки поруч із роком вступу, який посиланням не є. Але воно й не
	 * читалося як щось натисне: рік випуску веде в реєстр, відфільтрований по
	 * цьому ж року, і про це не здогадувався ніхто. Пілюля з рамкою каже це
	 * сама, а рік вступу поруч лишається звичайним текстом — різниця між ними
	 * тепер видима, і саме та, що є насправді.
	 */
	.years__item--link {
		color: inherit;
		text-decoration: none;
		padding: 0.12rem 0.6rem;
		border: 1px solid rgb(140 190 255 / 0.35);
		border-radius: var(--radius-full, 9999px);
		background: rgb(140 190 255 / 0.08);
		line-height: 1.3;
		transition:
			color var(--transition-fast),
			background var(--transition-fast),
			border-color var(--transition-fast);
	}
	.years__item--link:hover,
	.years__item--link:focus-visible {
		color: var(--galaxy-accent);
		background: rgb(140 190 255 / 0.18);
		border-color: rgb(140 190 255 / 0.6);
	}
	.years__sep {
		opacity: 0.5;
	}
</style>
