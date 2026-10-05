<script lang="ts">
	import { resolve } from '$app/paths';
	import { locale } from 'svelte-i18n';
	import { ArrowLeft, ArrowRight, Grid } from 'lucide-svelte';

	interface Props {
		current:
			| 'hexameter'
			| 'yarmarok'
			| 'diction-norm'
			| 'skoromovky'
			| 'cumulative-tales'
			| 'voice-power'
			| 'rhythm-trainer';
		testIdPrefix?: string;
	}

	let { current, testIdPrefix = 'speech-nav' }: Props = $props();

	const isEn = $derived($locale === 'en');

	interface StepInfo {
		id: Props['current'];
		path:
			| '/projects/stage-speech/hexameter'
			| '/projects/stage-speech/yarmarok'
			| '/projects/stage-speech/diction-norm'
			| '/projects/stage-speech/skoromovky'
			| '/projects/stage-speech/cumulative-tales'
			| '/projects/stage-speech/voice-power'
			| '/projects/stage-speech/rhythm-trainer';
		badge: string;
		badgeEn: string;
		title: string;
		titleEn: string;
	}

	const STEPS: readonly StepInfo[] = [
		{
			id: 'hexameter',
			path: '/projects/stage-speech/hexameter',
			badge: 'Вправа 1',
			badgeEn: 'Exercise 1',
			title: 'Гекзаметр',
			titleEn: 'Hexameter'
		},
		{
			id: 'yarmarok',
			path: '/projects/stage-speech/yarmarok',
			badge: 'Вправа 2',
			badgeEn: 'Exercise 2',
			title: 'Довгомовка «Ярмарок»',
			titleEn: 'Tongue-twister "Yarmarok"'
		},
		{
			id: 'diction-norm',
			path: '/projects/stage-speech/diction-norm',
			badge: 'Вправа 3',
			badgeEn: 'Exercise 3',
			title: 'Дикційна нормативність',
			titleEn: 'Diction Normative Practice'
		},
		{
			id: 'skoromovky',
			path: '/projects/stage-speech/skoromovky',
			badge: 'Вправа 4',
			badgeEn: 'Exercise 4',
			title: 'Антологія скоромовок',
			titleEn: 'Tongue-Twisters Anthology'
		},
		{
			id: 'cumulative-tales',
			path: '/projects/stage-speech/cumulative-tales',
			badge: 'Вправа 5',
			badgeEn: 'Exercise 5',
			title: 'Довгомовки на дихання',
			titleEn: 'Cumulative Breath Tales'
		},
		{
			id: 'voice-power',
			path: '/projects/stage-speech/voice-power',
			badge: 'Вправа 6',
			badgeEn: 'Exercise 6',
			title: 'Сила голосу та регістри',
			titleEn: 'Voice Power & Registers'
		},
		{
			id: 'rhythm-trainer',
			path: '/projects/stage-speech/rhythm-trainer',
			badge: 'Інструмент',
			badgeEn: 'Audio Tool',
			title: 'Ритм-тренажер',
			titleEn: 'Rhythm Trainer'
		}
	];

	const currentIndex = $derived(STEPS.findIndex((s) => s.id === current));
	const prevStep = $derived(currentIndex > 0 ? STEPS[currentIndex - 1] : null);
	const nextStep = $derived(currentIndex < STEPS.length - 1 ? STEPS[currentIndex + 1] : null);
</script>

<nav
	class="stage-nav"
	aria-label={isEn ? 'Speech exercises navigation' : 'Навігація циклом вправ'}
	data-testid={`${testIdPrefix}-container`}
>
	<div class="nav-slot nav-slot--prev">
		{#if prevStep}
			<a
				href={resolve(prevStep.path)}
				class="nav-card nav-card--prev"
				data-testid={`${testIdPrefix}-prev-link`}
			>
				<span class="nav-arrow" aria-hidden="true">
					<ArrowLeft size={18} />
				</span>
				<div class="nav-meta">
					<span class="nav-hint">{isEn ? 'Previous exercise' : 'Попередня вправа'}</span>
					<span class="nav-title">{isEn ? prevStep.titleEn : prevStep.title}</span>
				</div>
			</a>
		{/if}
	</div>

	<div class="nav-slot nav-slot--hub">
		<a
			href={resolve('/projects/stage-speech')}
			class="hub-link"
			data-testid={`${testIdPrefix}-hub-link`}
		>
			<Grid size={15} aria-hidden="true" />
			<span>{isEn ? 'All Speech Exercises' : 'Усі вправи курсу'}</span>
		</a>
	</div>

	<div class="nav-slot nav-slot--next">
		{#if nextStep}
			<a
				href={resolve(nextStep.path)}
				class="nav-card nav-card--next"
				data-testid={`${testIdPrefix}-next-link`}
			>
				<div class="nav-meta nav-meta--right">
					<span class="nav-hint">{isEn ? 'Next exercise' : 'Наступна вправа'}</span>
					<span class="nav-title">{isEn ? nextStep.titleEn : nextStep.title}</span>
				</div>
				<span class="nav-arrow nav-arrow--accent" aria-hidden="true">
					<ArrowRight size={18} />
				</span>
			</a>
		{/if}
	</div>
</nav>

<style>
	.stage-nav {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		gap: 1rem;
		margin-top: 2.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--color-border);
	}

	.nav-slot {
		display: flex;
	}
	.nav-slot--prev { justify-content: flex-start; }
	.nav-slot--hub { justify-content: center; }
	.nav-slot--next { justify-content: flex-end; }

	.nav-card {
		display: inline-flex;
		align-items: center;
		gap: 0.85rem;
		padding: 0.75rem 1.1rem;
		border-radius: 14px;
		background: var(--bg-card);
		border: 1px solid var(--color-border);
		text-decoration: none;
		color: var(--text-title);
		transition: all 0.18s ease;
		max-width: 290px;
	}

	.nav-card:hover {
		border-color: var(--accent-text);
		transform: translateY(-2px);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
	}

	.nav-arrow {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: 8px;
		background: var(--color-surface);
		color: var(--text-muted);
		flex-shrink: 0;
		transition: all 0.18s ease;
	}

	.nav-card:hover .nav-arrow {
		background: var(--accent-primary);
		color: var(--text-on-accent);
	}

	.nav-arrow--accent {
		background: var(--palette-yellow);
		color: var(--palette-black);
	}

	.nav-meta {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		min-width: 0;
	}
	.nav-meta--right {
		text-align: right;
	}

	.nav-hint {
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 700;
		color: var(--text-muted);
	}

	.nav-title {
		font-size: 0.92rem;
		font-weight: 700;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.hub-link {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.55rem 0.95rem;
		border-radius: 20px;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		color: var(--text-muted);
		font-size: 0.82rem;
		font-weight: 600;
		text-decoration: none;
		white-space: nowrap;
		transition: all 0.15s ease;
	}

	.hub-link:hover {
		color: var(--text-title);
		border-color: var(--accent-text);
	}

	@media (max-width: 720px) {
		.stage-nav {
			grid-template-columns: 1fr;
			gap: 0.75rem;
		}
		.nav-slot {
			width: 100%;
			justify-content: stretch;
		}
		.nav-card {
			width: 100%;
			max-width: 100%;
			justify-content: space-between;
		}
		.nav-slot--hub {
			order: 3;
		}
		.hub-link {
			width: 100%;
			justify-content: center;
		}
	}
</style>
