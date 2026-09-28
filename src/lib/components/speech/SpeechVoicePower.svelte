<script lang="ts">
	import voicePowerData from '$lib/data/stage-speech/voice-power.data.json';
	import { Activity, Mic, Volume2, Sparkles } from 'lucide-svelte';

	interface Props {
		testIdPrefix?: string;
	}

	let { testIdPrefix = 'voice-power' }: Props = $props();

	let activeTab = $state<'ivanko' | 'skakalka'>('ivanko');
</script>

<div class="voice-power-hub" data-testid={`${testIdPrefix}-container`}>
	<div class="tabs-bar" role="tablist">
		<button
			type="button"
			role="tab"
			class="tab-btn"
			class:tab-btn--active={activeTab === 'ivanko'}
			aria-selected={activeTab === 'ivanko'}
			onclick={() => { activeTab = 'ivanko'; }}
			data-testid={`${testIdPrefix}-tab-ivanko`}
		>
			<Mic size={16} aria-hidden="true" />
			<span>«Іванко» (сила та регістри)</span>
		</button>
		<button
			type="button"
			role="tab"
			class="tab-btn"
			class:tab-btn--active={activeTab === 'skakalka'}
			aria-selected={activeTab === 'skakalka'}
			onclick={() => { activeTab = 'skakalka'; }}
			data-testid={`${testIdPrefix}-tab-skakalka`}
		>
			<Activity size={16} aria-hidden="true" />
			<span>«Скакалка» (дихання в русі)</span>
		</button>
	</div>

	{#if activeTab === 'ivanko'}
		<article class="content-card" data-testid={`${testIdPrefix}-ivanko-card`}>
			<header class="card-header">
				<div class="header-titles">
					<span class="badge">
						<Volume2 size={13} aria-hidden="true" />
						<span>Вправа на акустичну польотність</span>
					</span>
					<h2 class="title">{voicePowerData.ivanko.title}</h2>
					<span class="subtitle">{voicePowerData.ivanko.subtitle}</span>
				</div>
			</header>

			<div class="advice-box">
				<span class="advice-icon" aria-hidden="true"><Sparkles size={18} /></span>
				<p class="advice-text">
					<strong>Методична порада:</strong> Працюйте в парі на відстані або уявіть партнера на іншому кінці зали чи поля.
					«Гукач» спрямовує звук вперед і вгору (головний регістр, широкі плавні голосні), а «Іванко» відповідає впевнено та заземлено (грудний регістр, короткі чіткі фрази).
				</p>
			</div>

			<div class="dialogue-flow">
				{#each voicePowerData.ivanko.dialogue as item, idx (idx)}
					{@const isCaller = item.speaker.includes('Гукач')}
					<div
						class="dialogue-row"
						class:dialogue-row--caller={isCaller}
						class:dialogue-row--reply={!isCaller}
						data-testid={`${testIdPrefix}-dialogue-row-${idx}`}
					>
						<span class="speaker-label">{item.speaker}</span>
						<p class="dialogue-line">{item.line}</p>
					</div>
				{/each}
			</div>
		</article>
	{:else}
		<article class="content-card" data-testid={`${testIdPrefix}-skakalka-card`}>
			<header class="card-header">
				<div class="header-titles">
					<span class="badge badge--activity">
						<Activity size={13} aria-hidden="true" />
						<span>Координація руху та звуку</span>
					</span>
					<h2 class="title">{voicePowerData.skakalka.title}</h2>
					<span class="subtitle">{voicePowerData.skakalka.subtitle}</span>
				</div>
			</header>

			<div class="advice-box advice-box--activity">
				<span class="advice-icon" aria-hidden="true"><Sparkles size={18} /></span>
				<p class="advice-text">
					<strong>Методична порада:</strong> Виконуйте вправу, стрибаючи на скакалці або пружно карбуючи крок на кожен склад.
					Головна мета — навчитися не збивати дихання та вести звучну рівну лінію голосу навіть при активному пульсі.
				</p>
			</div>

			<div class="poem-wrapper">
				<div class="poem-box">
					{#each voicePowerData.skakalka.lines as line, idx (idx)}
						<p class="poem-line" class:poem-line--count={line.startsWith('Раз-два')}>
							{line}
						</p>
					{/each}
				</div>
			</div>
		</article>
	{/if}
</div>

<style>
	.voice-power-hub { display: flex; flex-direction: column; gap: 1.5rem; }
	.tabs-bar {
		display: flex; gap: 0.75rem; background: var(--bg-card);
		border: 1px solid var(--color-border); border-radius: 16px; padding: 0.5rem;
	}
	.tab-btn {
		display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem;
		border-radius: 12px; border: none; background: transparent; color: var(--text-muted);
		font-size: 0.95rem; font-weight: 700; cursor: pointer; transition: all 0.15s ease;
	}
	.tab-btn:hover { color: var(--text-title); background: var(--color-surface); }
	.tab-btn--active { background: var(--palette-yellow); color: var(--palette-black); }
	.content-card {
		background: var(--bg-card); border: 1px solid var(--color-border);
		border-radius: 20px; padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem;
	}
	.card-header { border-bottom: 1px solid var(--color-border); padding-bottom: 1.25rem; }
	.header-titles { display: flex; flex-direction: column; gap: 0.35rem; }
	.badge {
		display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.75rem;
		font-weight: 800; text-transform: uppercase; color: var(--palette-orange);
	}
	.badge--activity { color: var(--palette-blue); }
	.title { margin: 0; font-size: 1.6rem; font-weight: 800; color: var(--text-title); }
	.subtitle { font-size: 0.95rem; color: var(--text-muted); font-style: italic; }
	.advice-box {
		display: flex; gap: 0.85rem; padding: 1.1rem 1.3rem; border-radius: 12px;
		background: var(--color-surface); border: 1px solid var(--color-border);
		border-left: 4px solid var(--palette-orange);
	}
	.advice-box--activity { border-left-color: var(--palette-blue); }
	.advice-icon { color: var(--palette-orange); flex-shrink: 0; margin-top: 0.2rem; }
	.advice-box--activity .advice-icon { color: var(--palette-blue); }
	.advice-text { margin: 0; font-size: 0.95rem; line-height: 1.55; color: var(--text-muted); }
	.advice-text strong { color: var(--text-title); }
	.dialogue-flow { display: flex; flex-direction: column; gap: 1rem; }
	.dialogue-row {
		display: flex; flex-direction: column; gap: 0.3rem; padding: 1rem 1.25rem;
		border-radius: 14px; border: 1px solid var(--color-border); background: var(--color-surface);
	}
	.dialogue-row--caller { border-left: 4px solid var(--palette-orange); }
	.dialogue-row--reply { border-left: 4px solid var(--palette-blue); margin-left: min(2rem, 5%); }
	.speaker-label { font-size: 0.8rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); }
	.dialogue-line { margin: 0; font-size: 1.2rem; font-weight: 700; color: var(--text-title); line-height: 1.4; }
	.poem-wrapper { display: flex; justify-content: center; }
	.poem-box {
		background: var(--color-surface); border: 1px solid var(--color-border);
		border-radius: 16px; padding: 2rem 2.5rem; max-width: 520px; width: 100%;
		display: flex; flex-direction: column; gap: 0.4rem;
	}
	.poem-line { margin: 0; font-size: 1.1rem; font-weight: 600; line-height: 1.6; color: var(--text-title); }
	.poem-line--count { font-weight: 800; color: var(--palette-orange); margin-top: 0.5rem; }
</style>
