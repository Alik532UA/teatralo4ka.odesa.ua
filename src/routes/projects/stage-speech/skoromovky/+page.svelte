<script lang="ts">
	import { resolve } from '$app/paths';
	import { t, locale } from 'svelte-i18n';
	import { seo } from '$lib/services/seo.svelte';
	import { ArrowLeft, BookOpen } from 'lucide-svelte';
	import SpeechSkoromovky from '$lib/components/speech/SpeechSkoromovky.svelte';

	const isEn = $derived($locale === 'en');

	$effect(() => {
		seo.update({
			title: isEn
				? `Exercise 4: Tongue-Twisters Anthology - Stage Speech - ${$t('seo.brandTitle')}`
				: `Вправа 4: Антологія скоромовок - Сценічна мова - ${$t('seo.brandTitle')}`,
			description: isEn
				? 'Comprehensive collection of classic and theatrical Ukrainian tongue-twisters with live search, sound filters, and warmup mode.'
				: 'Велика добірка класичних та сценічних українських скоромовок для розминки артикуляційного апарату з пошуком та фільтрами.'
		});
	});
</script>

<div class="exercise-page" data-testid="skoromovky-page-section">
	<div class="container exercise-page__container">
		<header class="exercise-page__header">
			<a href={resolve('/projects/stage-speech')} class="back-link" data-testid="skoromovky-back-link">
				<ArrowLeft size={18} aria-hidden="true" />
				<span>{isEn ? 'Back to speech exercises' : 'До списку вправ зі сценічної мови'}</span>
			</a>

			<div class="exercise-page__content">
				<div class="header-badge">
					<BookOpen size={14} aria-hidden="true" />
					<span>{isEn ? 'Exercise 4' : 'Вправа 4'}</span>
				</div>
				<h1 class="header-title" data-testid="skoromovky-page-title">
					{isEn ? 'Ukrainian Tongue-Twisters Anthology' : 'Антологія сценічних скоромовок'}
				</h1>
				<p class="header-lead">
					{isEn
						? 'Over 100 tongue-twisters for daily speech workout. Filter by letter, search for tricky phrases, or pick a random drill.'
						: 'Понад 100 скоромовок для щоденного акторського тренажу. Обирайте потрібну літеру, шукайте за змістом або запускайте випадкову скоромовку.'}
				</p>
			</div>
		</header>

		<div class="exercise-main">
			<SpeechSkoromovky testIdPrefix="skoromovky-exercise" />
		</div>
	</div>
</div>

<style>
	.exercise-page {
		padding: var(--page-pad-top, 140px) 0 var(--page-pad-bottom, 80px);
		min-height: 85dvh;
	}
	.exercise-page__container { display: flex; flex-direction: column; gap: 2rem; max-width: 1040px; margin: 0 auto; }
	.exercise-page__header { display: flex; flex-direction: column; gap: 1.25rem; }
	.back-link {
		display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.95rem; font-weight: 600;
		color: var(--text-muted); text-decoration: none; width: fit-content; transition: color 0.15s ease;
	}
	.back-link:hover { color: var(--accent-text); }
	.exercise-page__content { display: flex; flex-direction: column; gap: 0.5rem; }
	.header-badge {
		display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; font-weight: 700;
		text-transform: uppercase; letter-spacing: 0.05em; color: var(--warning-color);
	}
	.header-title { margin: 0; font-size: clamp(1.8rem, 3.5vw, 2.5rem); font-weight: 800; color: var(--text-title); line-height: 1.2; }
	.header-lead { margin: 0; font-size: 1.05rem; line-height: 1.6; color: var(--text-muted); }
	.exercise-main { display: flex; flex-direction: column; }
</style>
