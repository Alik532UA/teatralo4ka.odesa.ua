<script lang="ts">
	import { resolve } from '$app/paths';
	import { t, locale } from 'svelte-i18n';
	import { seo } from '$lib/services/seo.svelte';
	import { ArrowLeft, BookOpen, Volume2 } from 'lucide-svelte';
	import SpeechDictionNorm from '$lib/components/speech/SpeechDictionNorm.svelte';
	import SpeechMetronome from '$lib/components/speech/SpeechMetronome.svelte';

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
</script>

<div class="exercise-page" data-testid="diction-norm-page-section">
	<div class="container exercise-page__container">
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

		<div class="exercise-layout">
			<aside class="exercise-sidebar">
				<div class="sidebar-sticky">
					<SpeechMetronome defaultBpm={84} testIdPrefix="diction-norm-metronome" />

					<div class="advice-card">
						<div class="advice-header">
							<Volume2 size={16} aria-hidden="true" />
							<span class="advice-title">{isEn ? 'Methodology' : 'Методичні поради'}</span>
						</div>
						<ul class="advice-list">
							<li>{isEn ? 'Start slowly (60–70 BPM), strictly checking tongue and lip positions.' : 'Починайте в повільному темпі (60–70 BPM), відчуваючи положення язика та щелепи.'}</li>
							<li>{isEn ? 'Keep sound energy focused on consonants without muffling vowels.' : 'Чітко вистрілюйте приголосні, не «ковтаючи» закінчення складів.'}</li>
							<li>{isEn ? 'Gradually accelerate to 100–120 BPM once accuracy is solid.' : 'Прискорюйте метроном лише тоді, коли всі склади звучать кришталево чисто.'}</li>
						</ul>
					</div>
				</div>
			</aside>

			<div class="exercise-main">
				<SpeechDictionNorm testIdPrefix="diction-norm-exercise" />
			</div>
		</div>
	</div>
</div>

<style>
	.exercise-page {
		padding: var(--page-pad-top, 140px) 0 var(--page-pad-bottom, 80px);
		min-height: 85dvh;
	}
	.exercise-page__container { display: flex; flex-direction: column; gap: 2rem; max-width: 1140px; margin: 0 auto; }
	.exercise-page__header { display: flex; flex-direction: column; gap: 1.25rem; }
	.back-link {
		display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.95rem; font-weight: 600;
		color: var(--text-muted); text-decoration: none; width: fit-content; transition: color 0.15s ease;
	}
	.back-link:hover { color: var(--accent-text); }
	.exercise-page__content { display: flex; flex-direction: column; gap: 0.5rem; max-width: 820px; }
	.header-badge {
		display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; font-weight: 700;
		text-transform: uppercase; letter-spacing: 0.05em; color: var(--palette-orange);
	}
	.header-title { margin: 0; font-size: clamp(1.8rem, 3.5vw, 2.5rem); font-weight: 800; color: var(--text-title); line-height: 1.2; }
	.header-lead { margin: 0; font-size: 1.05rem; line-height: 1.6; color: var(--text-muted); }
	.exercise-layout {
		display: grid; grid-template-columns: minmax(280px, 320px) 1fr;
		gap: 2rem; align-items: start;
	}
	@media (max-width: 900px) {
		.exercise-layout { grid-template-columns: 1fr; }
	}
	.sidebar-sticky { position: sticky; top: calc(var(--header-height, 72px) + 20px); display: flex; flex-direction: column; gap: 1.5rem; }
	.advice-card {
		background: var(--bg-card); border: 1px solid var(--color-border);
		border-radius: 16px; padding: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem;
	}
	.advice-header { display: flex; align-items: center; gap: 0.5rem; color: var(--palette-orange); }
	.advice-title { font-weight: 700; font-size: 0.92rem; color: var(--text-title); }
	.advice-list { margin: 0; padding-left: 1.2rem; display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.88rem; color: var(--text-muted); line-height: 1.45; }
	.exercise-main { display: flex; flex-direction: column; }
</style>
