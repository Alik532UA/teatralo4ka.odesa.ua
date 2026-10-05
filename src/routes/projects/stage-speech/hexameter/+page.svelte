<script lang="ts">
	import { resolve } from '$app/paths';
	import { t, locale } from 'svelte-i18n';
	import { seo } from '$lib/services/seo.svelte';
	import { ArrowLeft, BookOpen, Volume2 } from 'lucide-svelte';
	import SpeechHexameter from '$lib/components/speech/SpeechHexameter.svelte';
	import SpeechMetronome from '$lib/components/speech/SpeechMetronome.svelte';
	import SpeechStageNav from '$lib/components/speech/SpeechStageNav.svelte';

	const isEn = $derived($locale === 'en');

	$effect(() => {
		seo.update({
			title: isEn
				? `Exercise 1: Hexameter - Stage Speech - ${$t('seo.brandTitle')}`
				: `Вправа 1: Гекзаметр - Сценічна мова - ${$t('seo.brandTitle')}`,
			description: isEn
				? 'Ancient Homeric hexameter exercise with breathing and caesura practice, accompanied by a rhythm metronome.'
				: 'Вправа на античний гекзаметр Гомера («Одіссея») для опрацювання дихання, цезури та ритму з метрономом.'
		});
	});
</script>

<div class="exercise-page" data-testid="hexameter-page-section">
	<div class="container exercise-page__container">
		<header class="exercise-page__header">
			<a href={resolve('/projects/stage-speech')} class="back-link" data-testid="hexameter-back-link">
				<ArrowLeft size={18} aria-hidden="true" />
				<span>{isEn ? 'Back to speech exercises' : 'До списку вправ зі сценічної мови'}</span>
			</a>

			<div class="hexameter-page__content">
				<div class="header-badge">
					<BookOpen size={14} aria-hidden="true" />
					<span>{isEn ? 'Exercise 1' : 'Вправа 1'}</span>
				</div>
				<h1 class="header-title" data-testid="hexameter-page-title">
					{isEn ? 'Hexameter: Epic Breath & Rhythm' : 'Гекзаметр: Дихання та цезура'}
				</h1>
				<p class="header-lead">
					{isEn
						? 'Recite Homer’s Odyssey with steady metric pauses and synchronize your phrasing with the rhythm trainer.'
						: 'Античний віршований розмір на широке дихання. Відпрацьовуйте паузи (цезуру) та синхронізуйте вимову з ритм-тренажером.'}
				</p>
			</div>
		</header>

		<div class="exercise-layout">
			<aside class="exercise-sidebar">
				<div class="sidebar-sticky">
					<SpeechMetronome defaultBpm={76} testIdPrefix="hexameter-metronome" />

					<div class="advice-card">
						<div class="advice-header">
							<Volume2 size={16} aria-hidden="true" />
							<span class="advice-title">{isEn ? 'Methodology' : 'Методичні поради'}</span>
						</div>
						<ul class="advice-list">
							<li>{isEn ? 'Take breath strictly on caesura pauses (marked with //).' : 'Беріть дихання точно в місці цезури (позначено двома похилими //).'}</li>
							<li>{isEn ? 'Keep an even tempo of 72–80 BPM without rushing.' : 'Тримайте рівний темп 72–80 BPM, не прискорюючись до кінця рядка.'}</li>
							<li>{isEn ? 'Sound the vowels broadly with free lower jaw.' : 'Звучіть голосні широко, звільнивши нижню щелепу.'}</li>
						</ul>
					</div>
				</div>
			</aside>

			<div class="hexameter-page__main">
				<SpeechHexameter testIdPrefix="hexameter-exercise" />
			</div>
		</div>

		<SpeechStageNav current="hexameter" testIdPrefix="hexameter-stage-nav" />
	</div>
</div>

<style>
	.exercise-page {
		padding: var(--page-pad-top, 140px) 0 var(--page-pad-bottom, 80px);
		min-height: 85dvh;
	}
	.exercise-page__container { display: flex; flex-direction: column; gap: 2rem; }
	.exercise-page__header { display: flex; flex-direction: column; gap: 1.25rem; }
	.back-link {
		display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.95rem; font-weight: 600;
		color: var(--text-muted); text-decoration: none; width: fit-content; transition: color 0.15s ease;
	}
	.back-link:hover { color: var(--accent-text); }
	.hexameter-page__content { display: flex; flex-direction: column; gap: 0.5rem; max-width: 820px; }
	.header-badge {
		display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; font-weight: 700;
		text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent-text);
	}
	.header-title { margin: 0; font-size: clamp(1.8rem, 3.5vw, 2.5rem); font-weight: 800; color: var(--text-title); line-height: 1.2; }
	.header-lead { margin: 0; font-size: 1.05rem; line-height: 1.6; color: var(--text-muted); }
	.exercise-layout {
		display: grid;
		grid-template-columns: minmax(280px, 320px) 1fr;
		gap: 2rem;
		align-items: start;
	}
	.sidebar-sticky {
		position: sticky;
		top: calc(var(--header-height, 72px) + 1.5rem);
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	.hexameter-page__main { display: flex; flex-direction: column; }
	.advice-card {
		background: var(--bg-card);
		border: 1px solid var(--color-border);
		border-radius: 16px;
		padding: 1.25rem;
	}
	.advice-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; color: var(--text-title); font-weight: 700; }
	.advice-title { font-size: 0.9rem; }
	.advice-list {
		margin: 0; padding-left: 1.2rem; font-size: 0.85rem; line-height: 1.55; color: var(--text-muted);
		display: flex; flex-direction: column; gap: 0.45rem;
	}
</style>
