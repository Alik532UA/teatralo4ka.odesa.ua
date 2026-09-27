<script lang="ts">
	import { resolve } from '$app/paths';
	import { t, locale } from 'svelte-i18n';
	import { seo } from '$lib/services/seo.svelte';
	import { ArrowLeft, ArrowRight, Mic, BookOpen, Activity, Sparkles } from 'lucide-svelte';

	const isEn = $derived($locale === 'en');

	$effect(() => {
		seo.update({
			title: isEn
				? `Stage Speech Exercises - ${$t('seo.brandTitle')}`
				: `Вправи зі сценічної мови - ${$t('seo.brandTitle')}`,
			description: isEn
				? 'Practical exercises for diction, breathing, and rhythm: hexameter, the "Fair" tongue-twister by Ostap Vyshnya, and rhythm trainer.'
				: 'Практичні матеріали та тренажери для розвитку акторської дикції, дихання та темпоритму: гекзаметр, довгомовка «Ярмарок» та ритм-тренажер.'
		});
	});

	interface ExerciseCard {
		id: string;
		path: '/projects/stage-speech/hexameter' | '/projects/stage-speech/yarmarok' | '/projects/stage-speech/rhythm-trainer';
		badge: string;
		badgeEn: string;
		badgeColor: string;
		title: string;
		titleEn: string;
		subtitle: string;
		subtitleEn: string;
		desc: string;
		descEn: string;
		cta: string;
		ctaEn: string;
	}

	const EXERCISES: readonly ExerciseCard[] = [
		{
			id: 'hexameter',
			path: '/projects/stage-speech/hexameter',
			badge: 'Вправа 1',
			badgeEn: 'Exercise 1',
			badgeColor: 'blue',
			title: 'Гекзаметр',
			titleEn: 'Hexameter',
			subtitle: '«Одіссея» (Гомер, Борис Тен / «Ткач Перекладач»)',
			subtitleEn: 'The Odyssey (Homer, Borys Ten / Tkach Translator)',
			desc: 'Античний віршований розмір для відпрацювання широкого мовного дихання, цезури (пауз) та епічного звучання. Доступні версії перекладу та вбудований ритм-тренажер.',
			descEn: 'Classic epic meter for breathing support, caesura pauses, and metered delivery. Features translation versions and an integrated rhythm trainer.',
			cta: 'Відкрити вправу',
			ctaEn: 'Open exercise'
		},
		{
			id: 'yarmarok',
			path: '/projects/stage-speech/yarmarok',
			badge: 'Вправа 2',
			badgeEn: 'Exercise 2',
			badgeColor: 'red',
			title: 'Довгомовка «Ярмарок»',
			titleEn: 'Tongue-twister "Yarmarok"',
			subtitle: 'Остап Вишня',
			subtitleEn: 'Ostap Vyshnya',
			desc: 'Швидкомовка-довгомовка на тривалий безперервний видих, рухливість артикуляційного апарату, точні акцентовані наголоси та словничок рідковживаних слів.',
			descEn: 'Sustained-breath diction exercise with authentic Ukrainian accents, dynamic tempo shifts, and vocabulary reference.',
			cta: 'Відкрити вправу',
			ctaEn: 'Open exercise'
		},
		{
			id: 'rhythm-trainer',
			path: '/projects/stage-speech/rhythm-trainer',
			badge: 'Інструмент',
			badgeEn: 'Audio Tool',
			badgeColor: 'orange',
			title: 'Ритм-тренажер',
			titleEn: 'Rhythm Trainer',
			subtitle: 'Метроном для дикції (40–180 BPM)',
			subtitleEn: 'Diction metronome (40–180 BPM)',
			desc: 'Окремий інтерактивний аудіометроном для налаштування сценічного темпоритму, відпрацювання скоромовок та тримання внутрішнього пульсу.',
			descEn: 'Dedicated interactive metronome with tempo guidelines for speech clarity, speed drilling, and rhythmic stability.',
			cta: 'Запустити тренажер',
			ctaEn: 'Launch trainer'
		}
	];
</script>

<svelte:head>
	<title>
		{isEn ? 'Stage Speech Exercises' : 'Вправи зі сценічної мови'} | {$t('seo.brandTitle')}
	</title>
</svelte:head>

<div class="speech-hub-page" data-testid="stage-speech-hub-section">
	<div class="container speech-hub-page__container">
		<header class="speech-hub-page__header">
			<a href={resolve('/projects')} class="back-link" data-testid="stage-speech-back-link">
				<ArrowLeft size={18} aria-hidden="true" />
				<span>{$t('projects.backToProjects')}</span>
			</a>

			<div class="speech-hub-page__content">
				<div class="header-badge">
					<Mic size={14} aria-hidden="true" />
					<span>{isEn ? 'Studio Practice' : 'Практикум акторської майстерності'}</span>
				</div>
				<h1 class="header-title" data-testid="stage-speech-title">
					{isEn ? 'Stage Speech Exercises' : 'Вправи зі сценічної мови'}
				</h1>
				<p class="header-lead">
					{isEn
						? 'Select an exercise below or open the dedicated rhythm trainer to practice articulation, breathing, and tempo.'
						: 'Оберіть потрібну вправу зі списку або відкрийте ритм-тренажер для тренування темпоритму, дикції та дихання.'}
				</p>
			</div>
		</header>

		<div class="exercises-grid">
			{#each EXERCISES as item (item.id)}
				<article class="exercise-card" data-testid={`stage-speech-card-${item.id}`}>
					<div class="card-top">
						<span class={`card-badge card-badge--${item.badgeColor}`}>
							{#if item.id === 'rhythm-trainer'}
								<Activity size={12} aria-hidden="true" />
							{:else}
								<BookOpen size={12} aria-hidden="true" />
							{/if}
							<span>{isEn ? item.badgeEn : item.badge}</span>
						</span>
						<h2 class="card-title">{isEn ? item.titleEn : item.title}</h2>
						<span class="card-subtitle">{isEn ? item.subtitleEn : item.subtitle}</span>
					</div>

					<p class="card-desc">{isEn ? item.descEn : item.desc}</p>

					<div class="card-footer">
						<a
							href={resolve(item.path)}
							class="action-btn"
							data-testid={`stage-speech-link-${item.id}`}
						>
							<span>{isEn ? item.ctaEn : item.cta}</span>
							<ArrowRight size={16} aria-hidden="true" />
						</a>
					</div>
				</article>
			{/each}
		</div>

		<footer class="hub-footer">
			<div class="footer-card">
				<div class="footer-icon" aria-hidden="true">
					<Sparkles size={20} />
				</div>
				<div class="footer-text">
					<strong>{isEn ? 'Pedagogical Note:' : 'Порада викладача:'}</strong>
					<span>
						{isEn
							? 'Work through exercises sequentially: start with breath and rhythm in Hexameter, then proceed to the rapid diction challenge of Yarmarok.'
							: 'Працюйте послідовно: спершу відчуйте спокійне широке дихання в «Гекзаметрі», а потім переходьте до швидкої зміни звукових образів у «Ярмарку».'}
					</span>
				</div>
			</div>
		</footer>
	</div>
</div>

<style>
	.speech-hub-page {
		padding: var(--page-pad-top, 140px) 0 var(--page-pad-bottom, 80px);
		min-height: 85dvh;
	}
	.speech-hub-page__container { display: flex; flex-direction: column; gap: 2.5rem; max-width: 1040px; margin: 0 auto; }
	.speech-hub-page__header { display: flex; flex-direction: column; gap: 1.25rem; }
	.back-link {
		display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.95rem; font-weight: 600;
		color: var(--text-muted); text-decoration: none; width: fit-content; transition: color 0.15s ease;
	}
	.back-link:hover { color: var(--accent-text); }
	.speech-hub-page__content { display: flex; flex-direction: column; gap: 0.5rem; max-width: 800px; }
	.header-badge {
		display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; font-weight: 700;
		text-transform: uppercase; letter-spacing: 0.05em; color: var(--palette-orange);
	}
	.header-title { margin: 0; font-size: clamp(2rem, 4vw, 2.75rem); font-weight: 800; color: var(--text-title); line-height: 1.15; }
	.header-lead { margin: 0; font-size: 1.1rem; line-height: 1.6; color: var(--text-muted); }
	.exercises-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
		gap: 1.5rem;
	}
	.exercise-card {
		background: var(--bg-card);
		border: 1px solid var(--color-border);
		border-radius: 20px;
		padding: 1.75rem;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
		transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
	}
	.exercise-card:hover {
		transform: translateY(-3px);
		border-color: var(--accent-text);
		box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
	}
	.card-top { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1rem; }
	.card-badge {
		display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.75rem; font-weight: 800;
		text-transform: uppercase; letter-spacing: 0.05em; padding: 0.25rem 0.6rem; border-radius: 20px;
		width: fit-content; margin-bottom: 0.25rem;
	}
	.card-badge--blue { background: var(--palette-blue); color: var(--palette-black); }
	.card-badge--red { background: var(--palette-red); color: #ffffff; }
	.card-badge--orange { background: var(--palette-orange); color: var(--palette-black); }
	.card-title { margin: 0; font-size: 1.35rem; font-weight: 800; color: var(--text-title); line-height: 1.3; }
	.card-subtitle { font-size: 0.88rem; color: var(--text-muted); font-style: italic; }
	.card-desc { margin: 0 0 1.5rem; font-size: 0.95rem; line-height: 1.6; color: var(--text-main); flex: 1; }
	.card-footer { margin-top: auto; }
	.action-btn {
		display: inline-flex; align-items: center; justify-content: space-between; width: 100%;
		padding: 0.8rem 1.25rem; border-radius: 12px; background: var(--color-surface);
		border: 1px solid var(--color-border); color: var(--text-title); font-size: 0.95rem; font-weight: 700;
		text-decoration: none; transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
	}
	.action-btn:hover { background: var(--palette-yellow); border-color: transparent; color: var(--palette-black); }
	.hub-footer { margin-top: 1rem; }
	.footer-card {
		display: flex; align-items: flex-start; gap: 1rem; background: var(--color-surface);
		border: 1px solid var(--color-border); border-radius: 16px; padding: 1.25rem 1.5rem;
	}
	.footer-icon { color: var(--palette-orange); flex-shrink: 0; margin-top: 0.15rem; }
	.footer-text { font-size: 0.92rem; line-height: 1.6; color: var(--text-muted); }
	.footer-text strong { color: var(--text-title); margin-right: 0.35rem; }
</style>
