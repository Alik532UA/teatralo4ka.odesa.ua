<script lang="ts">
	import cumulativeData from '$lib/data/stage-speech/cumulative-tales.data.json';
	import { Wind, BookOpen, Layers, Zap, ArrowLeft, ArrowRight } from 'lucide-svelte';

	interface Props {
		testIdPrefix?: string;
	}

	let { testIdPrefix = 'cumulative-tales' }: Props = $props();

	let activeTab = $state<'jack' | 'japanese'>('jack');
	let jackStep = $state<number>(cumulativeData.jack.stanzas.length); // default show all, or step 1..7

	const isAllJack = $derived(jackStep === cumulativeData.jack.stanzas.length);
</script>

<div class="tales-hub" data-testid={`${testIdPrefix}-container`}>
	<div class="tales-tabs" role="tablist">
		<button
			type="button"
			role="tab"
			class="tab-btn"
			class:tab-btn--active={activeTab === 'jack'}
			aria-selected={activeTab === 'jack'}
			onclick={() => { activeTab = 'jack'; }}
			data-testid={`${testIdPrefix}-tab-jack`}
		>
			<Layers size={16} aria-hidden="true" />
			<span>Хатка Джека</span>
		</button>
		<button
			type="button"
			role="tab"
			class="tab-btn"
			class:tab-btn--active={activeTab === 'japanese'}
			aria-selected={activeTab === 'japanese'}
			onclick={() => { activeTab = 'japanese'; }}
			data-testid={`${testIdPrefix}-tab-japanese`}
		>
			<Zap size={16} aria-hidden="true" />
			<span>Японське ім’я</span>
		</button>
	</div>

	{#if activeTab === 'jack'}
		<article class="tale-card" data-testid={`${testIdPrefix}-jack-section`}>
			<header class="tale-header">
				<div class="tale-titles">
					<span class="tale-badge">
						<BookOpen size={13} aria-hidden="true" />
						<span>Кумулятивна довгомовка</span>
					</span>
					<h2 class="tale-title">{cumulativeData.jack.title}</h2>
					<span class="tale-subtitle">{cumulativeData.jack.subtitle}</span>
				</div>

				<div class="stepper-wrap">
					<span class="stepper-label">Режим тренування видиху:</span>
					<div class="stepper-buttons">
						{#each cumulativeData.jack.stanzas as _, i (i)}
							<button
								type="button"
								class="step-chip"
								class:step-chip--active={jackStep === i + 1}
								onclick={() => { jackStep = i + 1; }}
								title={`Показати до строфи ${i + 1}`}
								data-testid={`${testIdPrefix}-step-btn-${i + 1}`}
							>
								{i + 1}
							</button>
						{/each}
						<button
							type="button"
							class="step-chip step-chip--all"
							class:step-chip--active={isAllJack}
							onclick={() => { jackStep = cumulativeData.jack.stanzas.length; }}
							data-testid={`${testIdPrefix}-step-btn-all`}
						>
							Всі
						</button>
					</div>
				</div>
			</header>

			<div class="methodology-banner">
				<span class="banner-icon" aria-hidden="true"><Wind size={18} /></span>
				<p class="banner-text">
					<strong>Завдання:</strong> кожну строфу вимовляйте на <em>єдиному безперервному видиху</em>.
					З кожною наступною строфою ланцюжок подовжується — дозуйте повітря так, щоб фінальний вигук звучав на повну силу!
				</p>
			</div>

			<div class="stanzas-list">
				{#each cumulativeData.jack.stanzas.slice(0, jackStep) as stanza, sIdx (sIdx)}
					<div class="stanza-card" data-testid={`${testIdPrefix}-card-stanza-${sIdx + 1}`}>
						<div class="stanza-number">
							<span class="st-num">#{sIdx + 1}</span>
						</div>
						<div class="stanza-lines">
							{#each stanza as line, lIdx (lIdx)}
								<p class="stanza-line" class:stanza-line--new={lIdx === 0}>
									{line}
								</p>
							{/each}
						</div>
					</div>
				{/each}
			</div>

			<footer class="tale-bottom-nav">
				{#if jackStep < cumulativeData.jack.stanzas.length}
					<button
						type="button"
						class="tale-action-btn"
						onclick={() => { jackStep += 1; }}
						data-testid={`${testIdPrefix}-next-stanza-btn`}
					>
						<span>Додати строфу #{jackStep + 1} (збільшити видих)</span>
						<ArrowRight size={16} aria-hidden="true" />
					</button>
				{:else}
					<button
						type="button"
						class="tale-action-btn tale-action-btn--accent"
						onclick={() => { activeTab = 'japanese'; }}
						data-testid={`${testIdPrefix}-to-japanese-btn`}
					>
						<span>Перейти до другої вправи: «Японське ім’я»</span>
						<ArrowRight size={16} aria-hidden="true" />
					</button>
				{/if}
			</footer>
		</article>
	{:else}
		<article class="tale-card" data-testid={`${testIdPrefix}-japanese-section`}>
			<header class="tale-header">
				<div class="tale-titles">
					<span class="tale-badge">
						<Zap size={13} aria-hidden="true" />
						<span>Швидкомовка-довгомовка</span>
					</span>
					<h2 class="tale-title">{cumulativeData.japaneseName.title}</h2>
					<span class="tale-subtitle">{cumulativeData.japaneseName.subtitle}</span>
				</div>
			</header>

			<div class="methodology-banner">
				<span class="banner-icon" aria-hidden="true"><Wind size={18} /></span>
				<p class="banner-text">
					{cumulativeData.japaneseName.desc} Чітко артикулюйте кожен склад, тримаючи пружний синкопований ритм.
				</p>
			</div>

			<div class="japanese-content">
				<div class="japanese-box">
					{#each cumulativeData.japaneseName.lines as line, i (i)}
						<p class="japanese-line">{line}</p>
					{/each}
				</div>
			</div>

			<footer class="tale-bottom-nav">
				<button
					type="button"
					class="tale-action-btn"
					onclick={() => { activeTab = 'jack'; }}
					data-testid={`${testIdPrefix}-to-jack-btn`}
				>
					<ArrowLeft size={16} aria-hidden="true" />
					<span>Повернутися до вправи «Хатка Джека»</span>
				</button>
			</footer>
		</article>
	{/if}
</div>

<style>
	.tales-hub { display: flex; flex-direction: column; gap: 1.5rem; }
	.tales-tabs {
		display: flex; flex-wrap: wrap; gap: 0.75rem; background: var(--bg-card);
		border: 1px solid var(--color-border); border-radius: 16px; padding: 0.5rem;
	}
	.tab-btn {
		display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem;
		border-radius: 12px; border: none; background: transparent; color: var(--text-muted);
		font-size: 0.95rem; font-weight: 700; cursor: pointer; transition: all 0.15s ease;
	}
	.tab-btn:hover { color: var(--text-title); background: var(--color-surface); }
	.tab-btn--active { background: var(--palette-yellow); color: var(--palette-black); }
	.tale-card {
		background: var(--bg-card); border: 1px solid var(--color-border);
		border-radius: 20px; padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem;
	}
	.tale-header {
		display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start;
		gap: 1.25rem; border-bottom: 1px solid var(--color-border); padding-bottom: 1.25rem;
	}
	.tale-titles { display: flex; flex-direction: column; gap: 0.35rem; }
	.tale-badge {
		display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.75rem;
		font-weight: 800; text-transform: uppercase; color: var(--warning-color);
	}
	.tale-title { margin: 0; font-size: 1.6rem; font-weight: 800; color: var(--text-title); }
	.tale-subtitle { font-size: 0.95rem; color: var(--text-muted); font-style: italic; }
	.stepper-wrap { display: flex; flex-direction: column; gap: 0.4rem; align-items: flex-end; }
	.stepper-label { font-size: 0.82rem; color: var(--text-muted); font-weight: 600; }
	.stepper-buttons { display: flex; gap: 0.35rem; flex-wrap: wrap; }
	.step-chip {
		min-width: 2rem; height: 2rem; padding: 0 0.5rem; border-radius: 8px;
		background: var(--color-surface); border: 1px solid var(--color-border);
		color: var(--text-title); font-size: 0.85rem; font-weight: 700; cursor: pointer;
	}
	.step-chip--active { background: var(--palette-yellow); color: var(--palette-black); border-color: transparent; }
	.methodology-banner {
		display: flex; gap: 0.85rem; padding: 1rem 1.25rem; border-radius: 12px;
		background: var(--color-surface); border: 1px solid var(--color-border);
		border-left: 4px solid var(--palette-blue);
	}
	.banner-icon { color: var(--palette-blue); flex-shrink: 0; margin-top: 0.2rem; }
	.banner-text { margin: 0; font-size: 0.95rem; line-height: 1.55; color: var(--text-muted); }
	.banner-text strong { color: var(--text-title); }
	.stanzas-list { display: flex; flex-direction: column; gap: 1.25rem; }
	.stanza-card {
		background: var(--color-surface); border: 1px solid var(--color-border);
		border-radius: 14px; padding: 1.25rem 1.5rem; display: flex; gap: 1.25rem;
	}
	.stanza-number {
		display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
		min-width: 2.2rem; padding-right: 0.75rem; border-right: 1px solid var(--color-border);
	}
	.st-num { font-size: 0.95rem; font-weight: 800; color: var(--warning-color); }
	.stanza-lines { display: flex; flex-direction: column; gap: 0.25rem; }
	.stanza-line { margin: 0; font-size: 1.05rem; line-height: 1.5; color: var(--text-title); }
	.stanza-line--new { font-weight: 700; color: var(--accent-text, var(--palette-orange)); }
	.japanese-content { display: flex; justify-content: center; }
	.japanese-box {
		background: var(--color-surface); border: 1px solid var(--color-border);
		border-radius: 16px; padding: 2rem 2.5rem; max-width: 540px; width: 100%;
		display: flex; flex-direction: column; gap: 0.4rem;
	}
	.japanese-line { margin: 0; font-size: 1.15rem; font-weight: 700; line-height: 1.6; color: var(--text-title); }

	.tale-bottom-nav {
		display: flex;
		justify-content: flex-end;
		margin-top: 1.5rem;
		padding-top: 1.25rem;
		border-top: 1px solid var(--color-border);
	}
	.tale-action-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.75rem 1.25rem;
		border-radius: 12px;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		color: var(--text-title);
		font-weight: 700;
		font-size: 0.95rem;
		cursor: pointer;
		transition: all 0.18s ease;
	}
	.tale-action-btn:hover {
		border-color: var(--accent-text);
		transform: translateY(-2px);
		box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
	}
	.tale-action-btn--accent {
		background: var(--palette-yellow);
		color: var(--palette-black);
		border-color: transparent;
	}
</style>
