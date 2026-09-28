<script lang="ts">
	import { resolve } from '$app/paths';
	import { t, locale } from 'svelte-i18n';
	import { seo } from '$lib/services/seo.svelte';
	import { ArrowLeft, BookOpen } from 'lucide-svelte';
	import SpeechVoicePower from '$lib/components/speech/SpeechVoicePower.svelte';

	const isEn = $derived($locale === 'en');

	$effect(() => {
		seo.update({
			title: isEn
				? `Exercise 6: Voice Power & Registers - Stage Speech - ${$t('seo.brandTitle')}`
				: `Вправа 6: Сила голосу та регістри - Сценічна мова - ${$t('seo.brandTitle')}`,
			description: isEn
				? 'Voice projection and register exercises: "Ivanko" calling dialogue by Tkach Translator and "Jump Rope" breath rhythm drill.'
				: 'Тренування сили та регістрів голосу: сценічний діалог-гукання «Іванко» («Ткач-перекладач») та вправа «Скакалка».'
		});
	});
</script>

<svelte:head>
	<title>
		{isEn ? 'Exercise 6: Voice Power & Registers' : 'Вправа 6: Сила голосу та регістри'} | {$t('seo.brandTitle')}
	</title>
</svelte:head>

<div class="exercise-page" data-testid="voice-power-page-section">
	<div class="container exercise-page__container">
		<header class="exercise-page__header">
			<a href={resolve('/projects/stage-speech')} class="back-link" data-testid="voice-power-back-link">
				<ArrowLeft size={18} aria-hidden="true" />
				<span>{isEn ? 'Back to speech exercises' : 'До списку вправ зі сценічної мови'}</span>
			</a>

			<div class="exercise-page__content">
				<div class="header-badge">
					<BookOpen size={14} aria-hidden="true" />
					<span>{isEn ? 'Exercise 6' : 'Вправа 6'}</span>
				</div>
				<h1 class="header-title" data-testid="voice-power-page-title">
					{isEn ? 'Voice Power & Dynamic Registers' : 'Сила голосу та регістри'}
				</h1>
				<p class="header-lead">
					{isEn
						? 'Practice acoustic voice projection, distance perception, and breathing under physical exertion.'
						: '«Іванко» та «Скакалка»: польотність звуку, вільне перемикання між регістрами та тримання дихання під час руху.'}
				</p>
			</div>
		</header>

		<div class="exercise-main">
			<SpeechVoicePower testIdPrefix="voice-power-exercise" />
		</div>
	</div>
</div>

<style>
	.exercise-page {
		padding: var(--page-pad-top, 140px) 0 var(--page-pad-bottom, 80px);
		min-height: 85dvh;
	}
	.exercise-page__container { display: flex; flex-direction: column; gap: 2rem; max-width: 960px; margin: 0 auto; }
	.exercise-page__header { display: flex; flex-direction: column; gap: 1.25rem; }
	.back-link {
		display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.95rem; font-weight: 600;
		color: var(--text-muted); text-decoration: none; width: fit-content; transition: color 0.15s ease;
	}
	.back-link:hover { color: var(--accent-text); }
	.exercise-page__content { display: flex; flex-direction: column; gap: 0.5rem; }
	.header-badge {
		display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; font-weight: 700;
		text-transform: uppercase; letter-spacing: 0.05em; color: var(--palette-orange);
	}
	.header-title { margin: 0; font-size: clamp(1.8rem, 3.5vw, 2.5rem); font-weight: 800; color: var(--text-title); line-height: 1.2; }
	.header-lead { margin: 0; font-size: 1.05rem; line-height: 1.6; color: var(--text-muted); }
	.exercise-main { display: flex; flex-direction: column; }
</style>
