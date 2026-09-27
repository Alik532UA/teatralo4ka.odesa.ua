<script lang="ts">
	import { resolve } from '$app/paths';
	import { t, locale } from 'svelte-i18n';
	import { seo } from '$lib/services/seo.svelte';
	import { ArrowLeft, Activity, Volume2, Sparkles } from 'lucide-svelte';
	import SpeechMetronome from '$lib/components/speech/SpeechMetronome.svelte';

	const isEn = $derived($locale === 'en');

	$effect(() => {
		seo.update({
			title: isEn
				? `Rhythm Trainer - Metronome for Diction - ${$t('seo.brandTitle')}`
				: `Ритм-тренажер - Метроном для дикції - ${$t('seo.brandTitle')}`,
			description: isEn
				? 'Interactive speech metronome (40-180 BPM) for diction, tempo-rhythm control, and stage speech practice.'
				: 'Інтерактивний метроном (40-180 BPM) для контролю темпоритму мовлення, артикуляційних тренувань та скоромовок.'
		});
	});
</script>

<svelte:head>
	<title>
		{isEn ? 'Rhythm Trainer' : 'Ритм-тренажер для дикції'} | {$t('seo.brandTitle')}
	</title>
</svelte:head>

<div class="trainer-page" data-testid="rhythm-trainer-page-section">
	<div class="container trainer-page__container">
		<header class="trainer-page__header">
			<a href={resolve('/projects/stage-speech')} class="back-link" data-testid="rhythm-trainer-back-link">
				<ArrowLeft size={18} aria-hidden="true" />
				<span>{isEn ? 'Back to speech exercises' : 'До списку вправ зі сценічної мови'}</span>
			</a>

			<div class="rhythm-page__content">
				<div class="header-badge">
					<Activity size={14} aria-hidden="true" />
					<span>{isEn ? 'Audio Tool' : 'Тренажер темпоритму'}</span>
				</div>
				<h1 class="header-title" data-testid="rhythm-trainer-page-title">
					{isEn ? 'Rhythm Trainer: Metronome for Diction' : 'Ритм-тренажер: Метроном для дикції'}
				</h1>
				<p class="header-lead">
					{isEn
						? 'Practice keeping a stable tempo, internal rhythmic pulse, and crisp speech delivery from 40 to 180 BPM.'
						: 'Розвиток відчуття темпоритму, внутрішнього пульсу та рівномірності мовного дихання. Оберіть темп від 40 до 180 BPM.'}
				</p>
			</div>
		</header>

		<div class="trainer-grid">
			<div class="metronome-col">
				<SpeechMetronome defaultBpm={80} testIdPrefix="page-metronome" />
			</div>

			<div class="guides-col">
				<div class="guide-card">
					<div class="guide-header">
						<Volume2 size={16} aria-hidden="true" />
						<strong>{isEn ? 'Tempo Recommendations' : 'Рекомендовані темпи роботи:'}</strong>
					</div>
					<ul class="guide-list">
						<li>
							<strong>60 BPM:</strong>
							<span>{isEn ? 'Slow analytical drill for difficult consonant clusters.' : 'Повільний розбір та аналіз важких звукосполучень.'}</span>
						</li>
						<li>
							<strong>80 BPM:</strong>
							<span>{isEn ? 'Comfortable storytelling and classic verse rhythm.' : 'Спокійний розмовний темп сценічної прози та поезії.'}</span>
						</li>
						<li>
							<strong>100 BPM:</strong>
							<span>{isEn ? 'Energetic dialogue tempo with active articulation.' : 'Рухливий темп динамічного діалогу та взаємодії.'}</span>
						</li>
						<li>
							<strong>120+ BPM:</strong>
							<span>{isEn ? 'Fast tongue-twisters without losing consonants.' : 'Швидкомовки та вербатім без «проковтування» звуків.'}</span>
						</li>
					</ul>
				</div>

				<div class="guide-card guide-card--tips">
					<div class="guide-header">
						<Sparkles size={16} aria-hidden="true" />
						<strong>{isEn ? 'How to train' : 'Як тренуватися:'}</strong>
					</div>
					<p class="guide-text">
						{isEn
							? 'Speak each syllable or metric foot precisely on the beat. Once the text flows easily without tension, increase tempo by 5 BPM.'
							: 'Промовляйте кожен наголос або метричну стопу суворо на клацання метронома. Щойно текст ллється вільно й без затискань у щелепі — додавайте 5 BPM.'}
					</p>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.trainer-page {
		padding: var(--page-pad-top, 140px) 0 var(--page-pad-bottom, 80px);
		min-height: 85dvh;
	}
	.trainer-page__container { display: flex; flex-direction: column; gap: 2rem; max-width: 960px; margin: 0 auto; }
	.trainer-page__header { display: flex; flex-direction: column; gap: 1.25rem; }
	.back-link {
		display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.95rem; font-weight: 600;
		color: var(--text-muted); text-decoration: none; width: fit-content; transition: color 0.15s ease;
	}
	.back-link:hover { color: var(--accent-text); }
	.rhythm-page__content { display: flex; flex-direction: column; gap: 0.5rem; }
	.header-badge {
		display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; font-weight: 700;
		text-transform: uppercase; letter-spacing: 0.05em; color: var(--palette-orange);
	}
	.header-title { margin: 0; font-size: clamp(1.8rem, 3.5vw, 2.5rem); font-weight: 800; color: var(--text-title); line-height: 1.2; }
	.header-lead { margin: 0; font-size: 1.05rem; line-height: 1.6; color: var(--text-muted); }
	.trainer-grid {
		display: grid;
		grid-template-columns: minmax(min(100%, 340px), 380px) 1fr;
		gap: 2rem;
		align-items: start;
	}
	.guides-col { display: flex; flex-direction: column; gap: 1.25rem; }
	.guide-card {
		background: var(--bg-card);
		border: 1px solid var(--color-border);
		border-radius: 16px;
		padding: 1.5rem;
	}
	.guide-card--tips { background: var(--color-surface); }
	.guide-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; color: var(--text-title); font-size: 1rem; }
	.guide-list {
		margin: 0; padding-left: 0; list-style: none; display: flex; flex-direction: column; gap: 0.75rem;
		font-size: 0.92rem; color: var(--text-muted);
	}
	.guide-list strong { color: var(--text-title); margin-right: 0.35rem; }
	.guide-text { margin: 0; font-size: 0.92rem; line-height: 1.6; color: var(--text-muted); }
</style>
