<script lang="ts">
	import { resolve } from '$app/paths';
	import { t, locale } from 'svelte-i18n';
	import { seo } from '$lib/services/seo.svelte';
	import { ArrowLeft, BookOpen } from 'lucide-svelte';
	import SpeechYarmarok from '$lib/components/speech/SpeechYarmarok.svelte';

	const isEn = $derived($locale === 'en');

	$effect(() => {
		seo.update({
			title: isEn
				? `Exercise 2: Yarmarok Tongue-Twister - Stage Speech - ${$t('seo.brandTitle')}`
				: `Вправа 2: Довгомовка «Ярмарок» - Сценічна мова - ${$t('seo.brandTitle')}`,
			description: isEn
				? 'Ukrainian diction exercise based on Ostap Vyshnya’s "Fair" tongue-twister with accurate orthoepic accents and glossary.'
				: 'Вправа на тривале безперервне дихання та орфоепічні наголоси за текстом Остапа Вишні «Ярмарок» зі словничком.'
		});
	});
</script>

<div class="exercise-page" data-testid="yarmarok-page-section">
	<div class="container exercise-page__container">
		<header class="exercise-page__header">
			<a href={resolve('/projects/stage-speech')} class="back-link" data-testid="yarmarok-back-link">
				<ArrowLeft size={18} aria-hidden="true" />
				<span>{isEn ? 'Back to speech exercises' : 'До списку вправ зі сценічної мови'}</span>
			</a>

			<div class="yarmarok-page__content">
				<div class="header-badge">
					<BookOpen size={14} aria-hidden="true" />
					<span>{isEn ? 'Exercise 2' : 'Вправа 2'}</span>
				</div>
				<h1 class="header-title" data-testid="yarmarok-page-title">
					{isEn ? 'Tongue-twister "Yarmarok" (Ostap Vyshnya)' : 'Довгомовка «Ярмарок» (Остап Вишня)'}
				</h1>
				<p class="header-lead">
					{isEn
						? 'Practice sustained one-breath speaking, precise Ukrainian accents, and articulatory flexibility.'
						: 'Відпрацювання безперервного мовленнєвого видиху, швидкої артикуляції та нормативних наголосів зі словничком рідковживаних слів.'}
				</p>
			</div>
		</header>

		<div class="yarmarok-page__main">
			<SpeechYarmarok testIdPrefix="yarmarok-exercise" />
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
	.yarmarok-page__content { display: flex; flex-direction: column; gap: 0.5rem; }
	.header-badge {
		display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; font-weight: 700;
		text-transform: uppercase; letter-spacing: 0.05em; color: var(--palette-red);
	}
	.header-title { margin: 0; font-size: clamp(1.8rem, 3.5vw, 2.5rem); font-weight: 800; color: var(--text-title); line-height: 1.2; }
	.header-lead { margin: 0; font-size: 1.05rem; line-height: 1.6; color: var(--text-muted); }
	.yarmarok-page__main { display: flex; flex-direction: column; }
</style>
