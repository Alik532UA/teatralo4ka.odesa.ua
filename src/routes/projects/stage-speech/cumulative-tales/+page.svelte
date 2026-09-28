<script lang="ts">
	import { resolve } from '$app/paths';
	import { t, locale } from 'svelte-i18n';
	import { seo } from '$lib/services/seo.svelte';
	import { ArrowLeft, BookOpen } from 'lucide-svelte';
	import SpeechCumulativeTales from '$lib/components/speech/SpeechCumulativeTales.svelte';

	const isEn = $derived($locale === 'en');

	$effect(() => {
		seo.update({
			title: isEn
				? `Exercise 5: Cumulative Breath Tales - Stage Speech - ${$t('seo.brandTitle')}`
				: `Вправа 5: Довгомовки на дихання - Сценічна мова - ${$t('seo.brandTitle')}`,
			description: isEn
				? 'Cumulative breath training exercises: "The House That Jack Built" (Malkovych/Andrukhovych) and "Japanese Name" by Ivan Nekhoda.'
				: 'Вправи на нарощування об’єму дихання: «Хатка, яку збудував собі Джек» та довгомовка «Японське ім’я» Івана Неходи.'
		});
	});
</script>

<svelte:head>
	<title>
		{isEn ? 'Exercise 5: Cumulative Breath Tales' : 'Вправа 5: Довгомовки на дихання'} | {$t('seo.brandTitle')}
	</title>
</svelte:head>

<div class="exercise-page" data-testid="cumulative-tales-page-section">
	<div class="container exercise-page__container">
		<header class="exercise-page__header">
			<a href={resolve('/projects/stage-speech')} class="back-link" data-testid="cumulative-tales-back-link">
				<ArrowLeft size={18} aria-hidden="true" />
				<span>{isEn ? 'Back to speech exercises' : 'До списку вправ зі сценічної мови'}</span>
			</a>

			<div class="exercise-page__content">
				<div class="header-badge">
					<BookOpen size={14} aria-hidden="true" />
					<span>{isEn ? 'Exercise 5' : 'Вправа 5'}</span>
				</div>
				<h1 class="header-title" data-testid="cumulative-tales-page-title">
					{isEn ? 'Cumulative Breath Tales' : 'Довгомовки на нарощування дихання'}
				</h1>
				<p class="header-lead">
					{isEn
						? 'Practice holding phrase structure and breath volume through cumulative chaining and rapid rhythm.'
						: '«Хатка Джека» та «Японське ім’я»: тренування тривалого мовленнєвого видиху через послідовне нашарування сюжетних ліній.'}
				</p>
			</div>
		</header>

		<div class="exercise-main">
			<SpeechCumulativeTales testIdPrefix="cumulative-tales-exercise" />
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
