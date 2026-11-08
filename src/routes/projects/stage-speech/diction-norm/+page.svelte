<script lang="ts">
	import { resolve } from '$app/paths';
	import { t, locale } from 'svelte-i18n';
	import { seo } from '$lib/services/seo.svelte';
	import { ArrowLeft, BookOpen, ListOrdered } from 'lucide-svelte';
	import SpeechDictionNorm from '$lib/components/speech/SpeechDictionNorm.svelte';
	import SpeechMetronomeWindow from '$lib/components/speech/SpeechMetronomeWindow.svelte';
	import SpeechStageNav from '$lib/components/speech/SpeechStageNav.svelte';
	import dictionData from '$lib/data/stage-speech/diction-norm.data.json';

	const isEn = $derived($locale === 'en');

	$effect(() => {
		seo.update({
			title: isEn
				? `Exercise 3: Diction Normative Practice - Stage Speech - ${$t('seo.brandTitle')}`
				: `Вправа 3: Дикційна нормативність - Сценічна мова - ${$t('seo.brandTitle')}`,
			description: isEn
				? '15 systematic speech exercises based on A. Gladysheva with text adaptation by Tkach Translator for precise consonant articulation.'
				: '15 нормативних дикційних вправ за книгою А. Гладишевої в адаптації «Ткач-перекладач» для постановки приголосних звуків.'
		});
	});

	let currentSoundIdx = $state(0);

	function selectSound(idx: number) {
		currentSoundIdx = idx;
		if (typeof window !== 'undefined') {
			const target = document.querySelector('[data-testid="diction-norm-exercise-panel"]');
			if (target) {
				const top = target.getBoundingClientRect().top + window.scrollY - 90;
				window.scrollTo({ top, behavior: 'smooth' });
			}
		}
	}
</script>

<div class="exercise-page" data-testid="diction-norm-page-section">
	<div class="container exercise-page__container">
		<div class="exercise-layout">
			<!-- Ліва колонка: завжди закріплений зміст звуків (як у брендбуку) -->
			<aside class="diction-sidebar" aria-label={isEn ? 'Exercise sidebar' : 'Бічна панель вправи'}>
				<nav
					class="sidebar-toc"
					aria-label={isEn ? 'Sound exercises index' : 'Зміст 15 вправ за звуками'}
					data-testid="diction-norm-toc-container"
				>
					<div class="sidebar-toc__header">
						<ListOrdered size={14} aria-hidden="true" />
						<span class="sidebar-toc__title">{isEn ? 'Sounds' : 'Звуки'}</span>
					</div>
					<ol class="sidebar-toc__list">
						{#each dictionData as ex, idx (ex.id)}
							<li>
								<button
									type="button"
									class="toc-row-btn"
									class:toc-row-btn--active={idx === currentSoundIdx}
									onclick={() => selectSound(idx)}
									data-testid={`diction-norm-toc-btn-${ex.id}`}
									title={`${ex.title}: ${ex.sounds}`}
									aria-label={`${ex.title}: ${ex.sounds}`}
								>
									<span class="toc-row__sounds">{ex.sounds}</span>
								</button>
							</li>
						{/each}
					</ol>
				</nav>
			</aside>

			<!-- Права частина: шапка сторінки (назва, опис) не займають ліву сторону -->
			<header class="exercise-page__header">
				<a href={resolve('/projects/stage-speech')} class="back-link" data-testid="diction-norm-back-link">
					<ArrowLeft size={18} aria-hidden="true" />
					<span>{isEn ? 'Back to speech exercises' : 'До списку вправ зі сценічної мови'}</span>
				</a>

				<div class="exercise-page__content">
					<div class="header-badge">
						<BookOpen size={14} aria-hidden="true" />
						<span>{isEn ? 'Exercise 3' : 'Вправа 3'}</span>
					</div>
					<h1 class="header-title" data-testid="diction-norm-page-title">
						{isEn ? 'Diction Normative Practice (15 Exercises)' : 'Дикційна нормативність (15 вправ)'}
					</h1>
					<p class="header-lead">
						{isEn
							? 'Based on A. Gladysheva, text adaptation by "Tkach Translator". Practice articulation points, syllables, and rhymes with a metronome.'
							: 'За книгою А. Гладишевої, адаптація текстів — «Ткач-перекладач». 15 комплексних вправ для точного звукоутворення приголосних.'}
					</p>
				</div>
			</header>

			<!-- Основний блок вправи -->
			<div class="exercise-main">
				<SpeechDictionNorm
					bind:currentIdx={currentSoundIdx}
					testIdPrefix="diction-norm-exercise"
				/>
			</div>

			<!-- Навігація циклом: перехід до наступної / попередньої вправи курсу -->
			<div class="exercise-nav">
				<SpeechStageNav current="diction-norm" testIdPrefix="diction-norm-stage-nav" />
			</div>
		</div>

		<!-- Метроном / Ритм-тренажер: окрема кнопка праворуч із плаваючим вікном -->
		<SpeechMetronomeWindow
			defaultBpm={84}
			testIdPrefix="diction-norm-metronome"
		/>
	</div>
</div>

<style>
	.exercise-page {
		padding: var(--page-pad-top, 140px) 0 var(--page-pad-bottom, 80px);
		min-height: 85dvh;
	}
	.exercise-page__container {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		max-width: 1140px;
		margin: 0 auto;
	}
	.exercise-layout {
		display: grid;
		grid-template-areas:
			"sidebar header"
			"sidebar main"
			"sidebar nav";
		grid-template-columns: 115px minmax(0, 1fr);
		column-gap: 2rem;
		row-gap: 2rem;
		align-items: start;
	}
	.diction-sidebar {
		grid-area: sidebar;
		position: sticky;
		top: calc(var(--header-height, 72px) + 20px);
		align-self: start;
		max-height: calc(100dvh - var(--header-height, 72px) - 2rem);
		overflow-y: auto;
		scrollbar-width: thin;
		padding-right: 0.15rem;
		z-index: 20;
	}
	.exercise-page__header {
		grid-area: header;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--text-muted);
		text-decoration: none;
		width: fit-content;
		transition: color 0.15s ease;
	}
	.back-link:hover {
		color: var(--accent-text);
	}
	.exercise-page__content {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-width: 820px;
	}
	.header-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.8rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--warning-color);
	}
	.header-title {
		margin: 0;
		font-size: clamp(1.8rem, 3.5vw, 2.5rem);
		font-weight: 800;
		color: var(--text-title);
		line-height: 1.2;
	}
	.header-lead {
		margin: 0;
		font-size: 1.05rem;
		line-height: 1.6;
		color: var(--text-muted);
	}
	.exercise-main {
		grid-area: main;
		display: flex;
		flex-direction: column;
		min-width: 0;
		max-width: 100%;
	}
	.exercise-nav {
		grid-area: nav;
	}
	@media (max-width: 900px) {
		.exercise-layout {
			grid-template-areas:
				"header"
				"sidebar"
				"main"
				"nav";
			grid-template-columns: minmax(0, 1fr);
			row-gap: 1.25rem;
		}
		.diction-sidebar {
			position: static;
			max-height: none;
			overflow: visible;
			padding-right: 0;
		}
		.sidebar-toc__list {
			flex-direction: row;
			flex-wrap: wrap;
			gap: 0.35rem;
		}
		.toc-row-btn {
			width: auto;
			border: 1px solid var(--color-border);
		}
	}

	/* ─── Sidebar Table of Contents (Вузький стовпець звуків) ─── */
	.sidebar-toc {
		background: var(--bg-card);
		border: 1px solid var(--color-border);
		border-radius: 16px;
		padding: 0.75rem 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
	}
	.sidebar-toc__header {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		color: var(--accent-text);
		padding-bottom: 0.45rem;
		border-bottom: 1px solid var(--color-border);
	}
	.sidebar-toc__title {
		font-size: 0.75rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-title);
	}
	.sidebar-toc__list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.toc-row-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		padding: 0.45rem 0.5rem;
		border-radius: 8px;
		background: transparent;
		border: 1px solid transparent;
		border-left: 3px solid transparent;
		color: var(--text-muted);
		cursor: pointer;
		text-align: center;
		transition: all 0.15s ease;
	}
	.toc-row-btn:hover {
		background: var(--color-surface);
		color: var(--text-title);
		border-left-color: var(--accent-text);
		transform: translateX(1px);
	}
	.toc-row-btn--active {
		background: var(--color-surface);
		color: var(--text-title);
		border-left-color: var(--palette-yellow);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
	}
	.toc-row__sounds {
		font-family: var(--font-heading, monospace);
		font-size: 0.84rem;
		font-weight: 800;
		color: var(--accent-text, var(--palette-orange));
		white-space: nowrap;
		letter-spacing: 0.02em;
	}
	.toc-row-btn--active .toc-row__sounds {
		color: var(--palette-orange);
		font-weight: 900;
	}

	.exercise-main { display: flex; flex-direction: column; min-width: 0; max-width: 100%; }
</style>
