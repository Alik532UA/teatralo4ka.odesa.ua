<script lang="ts">
	import { asset } from '$app/paths';
	import { imageSize, type LocalImage } from '$lib/config/localImages';
	import type { AcademicYear, VacationId } from '$lib/data/academicYears';
	import { pick, vacationLines, VACATION_SHORT_NAMES } from '$lib/data/calendarText';
	import type { Locale } from '$lib/i18n/routing';

	/**
	 * Панель «Канікули» плаката: три блоки з датами й прикрасами сезону.
	 *
	 * Окремо від плаката, бо це окрема річ зі своїм набором малюнків і власною
	 * розкладкою прикрас; місце в сітці плаката вона задає собі сама
	 * (п'ятий стовпець, два верхні рядки).
	 */
	interface Props {
		year: AcademicYear;
		locale?: Locale;
	}

	let { year, locale = 'uk' }: Props = $props();

	const VACATIONS: readonly VacationId[] = ['autumn', 'winter', 'spring'];

	/** Прикраси кожного блоку. Класи задають лише місце й розмір кожної. */
	const DECOR: Record<VacationId, readonly { file: LocalImage; cls: string }[]> = {
		autumn: [
			{ file: '/calendar/dec-maple-orange.svg', cls: 'dec-maple-orange' },
			{ file: '/calendar/dec-leaf-yellow.svg', cls: 'dec-leaf-yellow' },
			{ file: '/calendar/dec-maple-red.svg', cls: 'dec-maple-red' },
			{ file: '/calendar/dec-leaf-lime.svg', cls: 'dec-leaf-lime' },
			{ file: '/calendar/dec-leaf-drop.svg', cls: 'dec-leaf-drop' }
		],
		winter: [
			{ file: '/calendar/dec-snow-top.svg', cls: 'dec-snow-top' },
			{ file: '/calendar/dec-snow-mid.svg', cls: 'dec-snow-mid' },
			{ file: '/calendar/dec-snow-bot.svg', cls: 'dec-snow-bot' }
		],
		spring: [
			{ file: '/calendar/dec-leaf-green.svg', cls: 'dec-green-top' },
			{ file: '/calendar/dec-green-mid.svg', cls: 'dec-green-mid' },
			{ file: '/calendar/dec-green-bot.svg', cls: 'dec-green-bot' }
		]
	};
</script>

<aside class="poster-vacations-panel" data-testid="calendar-poster-panel">
	<h3 class="vacations-title">{locale === 'en' ? 'Vacations' : 'Канікули'}</h3>

	{#each VACATIONS as vacation (vacation)}
		{@const lines = vacationLines(year.vacations[vacation], locale)}
		<div class="vacation-block" data-testid={`calendar-vacation-${vacation}-item`}>
			{#each DECOR[vacation] as decor (decor.file)}
				{@const size = imageSize(decor.file)}
				<img
					src={asset(decor.file)}
					alt=""
					class="dec-icon {decor.cls}"
					width={size.width}
					height={size.height}
				/>
			{/each}
			<div class="vac-text-wrap">
				<span class="vac-type-name">{pick(VACATION_SHORT_NAMES[vacation], locale)}</span>
				<span class="vac-date-line">{lines[0]}</span>
				<span class="vac-date-line">{lines[1]}</span>
			</div>
		</div>
	{/each}
</aside>

<style>
	/* Палітра — спільна з рештою плаката (`CalendarPoster`), тут лише читається. */
	.poster-vacations-panel {
		grid-column: 5;
		grid-row: 1 / span 2;
		align-self: end;
		height: calc(100% - clamp(16px, 3.2cqi, 48px));
		background: var(--poster-card-bg);
		border: 1px solid var(--poster-card-border);
		border-radius: clamp(14px, 2cqi, 28px);
		padding: clamp(0.35rem, 0.8cqi, 0.75rem);
		backdrop-filter: blur(16px);
		box-shadow: 0 10px 24px rgba(0, 0, 0, 0.05);
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		position: relative;
		overflow: hidden;
	}

	.vacations-title {
		margin: 0 0 0.35rem;
		font-size: clamp(1.2rem, 2.2cqi, 2.8rem);
		font-weight: 400;
		color: var(--poster-text);
		text-align: center;
	}

	.vacation-block {
		position: relative;
		padding: 0.5rem 0.5rem;
	}

	.dec-icon {
		position: absolute;
		pointer-events: none;
		z-index: 1;
		object-fit: contain;
	}

	.dec-maple-orange { top: -8px; left: 4px; width: clamp(26px, 3.2cqi, 44px); height: clamp(26px, 3.2cqi, 44px); }
	.dec-leaf-lime { top: 36px; left: 2px; width: clamp(18px, 2.3cqi, 30px); height: clamp(15px, 1.9cqi, 25px); }
	.dec-leaf-yellow { top: -4px; right: 20px; width: clamp(20px, 2.5cqi, 34px); height: clamp(16px, 2cqi, 26px); }
	.dec-maple-red { top: 26px; right: 4px; width: clamp(26px, 3.2cqi, 42px); height: clamp(26px, 3.2cqi, 42px); }
	.dec-leaf-drop { bottom: -6px; left: 50%; transform: translateX(-50%); width: clamp(10px, 1.2cqi, 16px); height: clamp(9px, 1.1cqi, 14px); }

	.dec-snow-top { top: 2px; right: 24px; width: clamp(20px, 2.4cqi, 32px); height: clamp(18px, 2.1cqi, 28px); }
	.dec-snow-mid { top: 22px; left: 10px; width: clamp(20px, 2.4cqi, 32px); height: clamp(18px, 2.1cqi, 28px); }
	.dec-snow-bot { bottom: 2px; right: 16px; width: clamp(20px, 2.4cqi, 32px); height: clamp(18px, 2.1cqi, 28px); }

	.dec-green-top { top: 2px; right: 22px; width: clamp(22px, 2.6cqi, 34px); height: clamp(22px, 2.6cqi, 34px); }
	.dec-green-mid { top: 22px; left: 10px; width: clamp(20px, 2.4cqi, 30px); height: clamp(26px, 3.2cqi, 40px); }
	.dec-green-bot { bottom: 0px; right: 14px; width: clamp(22px, 2.6cqi, 34px); height: clamp(24px, 3cqi, 38px); }

	.vac-text-wrap {
		position: relative;
		z-index: 2;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
		text-align: center;
		max-width: 250px;
		margin: 0 auto;
	}

	.vac-type-name {
		font-size: clamp(1.05rem, 1.95cqi, 2.4rem);
		font-weight: 400;
		color: var(--poster-text);
		line-height: 1.2;
	}

	.vac-date-line {
		font-size: clamp(0.9rem, 1.55cqi, 1.9rem);
		font-weight: 400;
		color: var(--poster-text);
		line-height: 1.25;
	}

	/* Контейнер — сам плакат (`container-type` у CalendarPoster). */
	@container (max-width: 900px) {
		.poster-vacations-panel {
			grid-column: span 2;
			grid-row: auto;
			height: auto;
			align-self: stretch;
		}
	}

	@container (max-width: 520px) {
		.poster-vacations-panel {
			grid-column: span 1;
		}
	}
</style>
