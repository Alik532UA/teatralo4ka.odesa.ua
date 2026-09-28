<script lang="ts">
	import rawSkoromovky from '$lib/data/stage-speech/skoromovky.data.json';
	import { Search, Shuffle, Check, Copy, Sparkles } from 'lucide-svelte';

	interface Skoromovka {
		id: number;
		letter: string;
		text: string;
	}

	interface Props {
		testIdPrefix?: string;
	}

	let { testIdPrefix = 'skoromovky' }: Props = $props();

	const items = rawSkoromovky as Skoromovka[];

	let searchQuery = $state('');
	let selectedLetter = $state('ВСІ');
	let copiedId = $state<number | null>(null);
	let randomItem = $state<Skoromovka | null>(null);

	const letters = $derived([
		'ВСІ',
		...Array.from(new Set(items.map((it) => it.letter))).sort((a, b) => a.localeCompare(b, 'uk'))
	]);

	const filtered = $derived(
		items.filter((it) => {
			const matchesLetter = selectedLetter === 'ВСІ' || it.letter === selectedLetter;
			const q = searchQuery.trim().toLowerCase();
			const matchesSearch = !q || it.text.toLowerCase().includes(q);
			return matchesLetter && matchesSearch;
		})
	);

	function pickRandom() {
		const pool = filtered.length > 0 ? filtered : items;
		const rand = pool[Math.floor(Math.random() * pool.length)];
		randomItem = rand;
	}

	async function copyText(it: Skoromovka) {
		try {
			await navigator.clipboard.writeText(it.text);
			copiedId = it.id;
			setTimeout(() => {
				if (copiedId === it.id) copiedId = null;
			}, 1800);
		} catch {
			// clipboard permission
		}
	}
</script>

<div class="skoromovky-hub" data-testid={`${testIdPrefix}-container`}>
	<div class="controls-card">
		<div class="search-row">
			<div class="search-input-wrap">
				<span class="search-icon" aria-hidden="true"><Search size={18} /></span>
				<input
					type="search"
					class="search-input"
					placeholder="Пошук скоромовки за текстом..."
					bind:value={searchQuery}
					data-testid={`${testIdPrefix}-search-input`}
				/>
			</div>

			<button
				type="button"
				class="random-btn"
				onclick={pickRandom}
				title="Обрати випадкову скоромовку для розминки"
				data-testid={`${testIdPrefix}-random-btn`}
			>
				<Shuffle size={16} aria-hidden="true" />
				<span>Випадкова</span>
			</button>
		</div>

		<div class="letters-bar" aria-label="Фільтр за першою літерою">
			{#each letters as l (l)}
				<button
					type="button"
					class="letter-chip"
					class:letter-chip--active={selectedLetter === l}
					onclick={() => { selectedLetter = l; }}
					data-testid={`${testIdPrefix}-filter-btn-${l}`}
				>
					{l}
				</button>
			{/each}
		</div>
	</div>

	{#if randomItem}
		<div class="spotlight-card" data-testid={`${testIdPrefix}-spotlight-card`}>
			<div class="spotlight-header">
				<div class="spotlight-badge">
					<Sparkles size={14} aria-hidden="true" />
					<span>Випадкова для розминки (#{randomItem.id})</span>
				</div>
				<button
					type="button"
					class="close-spotlight"
					onclick={() => { randomItem = null; }}
					aria-label="Закрити"
					data-testid={`${testIdPrefix}-close-btn`}
				>
					✕
				</button>
			</div>
			<p class="spotlight-text">{randomItem.text}</p>
			<div class="spotlight-actions">
				<button type="button" class="copy-btn" onclick={() => copyText(randomItem!)} data-testid={`${testIdPrefix}-copy-btn`}>
					{#if copiedId === randomItem.id}
						<Check size={14} /> <span>Скопійовано</span>
					{:else}
						<Copy size={14} /> <span>Скопіювати</span>
					{/if}
				</button>
				<button type="button" class="next-random-btn" onclick={pickRandom} data-testid={`${testIdPrefix}-next-random-btn`}>
					<Shuffle size={14} /> <span>Інша</span>
				</button>
			</div>
		</div>
	{/if}

	<div class="results-meta">
		<span>Знайдено: <strong>{filtered.length}</strong> скоромовок</span>
	</div>

	<div class="cards-grid">
		{#each filtered as it (it.id)}
			<article class="twister-card" data-testid={`${testIdPrefix}-card-${it.id}`}>
				<div class="twister-top">
					<span class="letter-badge">{it.letter}</span>
					<button
						type="button"
						class="copy-icon-btn"
						onclick={() => copyText(it)}
						title="Скопіювати текст"
						aria-label="Скопіювати текст"
						data-testid={`${testIdPrefix}-copy-btn-${it.id}`}
					>
						{#if copiedId === it.id}
							<span class="copied-check"><Check size={14} /></span>
						{:else}
							<Copy size={14} />
						{/if}
					</button>
				</div>
				<p class="twister-text">{it.text}</p>
			</article>
		{/each}
	</div>
</div>

<style>
	.skoromovky-hub { display: flex; flex-direction: column; gap: 1.5rem; }
	.controls-card {
		background: var(--bg-card); border: 1px solid var(--color-border);
		border-radius: 18px; padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1rem;
	}
	.search-row { display: flex; gap: 0.75rem; flex-wrap: wrap; }
	.search-input-wrap {
		position: relative; flex: 1; min-width: min(100%, 280px);
		display: flex; align-items: center;
	}
	.search-icon { position: absolute; left: 1rem; color: var(--text-muted); pointer-events: none; }
	.search-input {
		width: 100%; padding: 0.75rem 1rem 0.75rem 2.75rem; border-radius: 12px;
		background: var(--color-surface); border: 1px solid var(--color-border);
		color: var(--text-title); font-size: 0.95rem; font-family: inherit;
	}
	.search-input:focus { outline: none; border-color: var(--accent-text); }
	.random-btn {
		display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.75rem 1.25rem;
		border-radius: 12px; background: var(--palette-yellow); border: none;
		color: var(--palette-black); font-size: 0.9rem; font-weight: 700; cursor: pointer;
		transition: opacity 0.15s ease;
	}
	.random-btn:hover { opacity: 0.9; }
	.letters-bar {
		display: flex; gap: 0.4rem; flex-wrap: wrap; align-items: center;
	}
	.letter-chip {
		display: inline-flex; align-items: center; justify-content: center;
		min-width: 2rem; height: 2rem; padding: 0 0.5rem; border-radius: 8px;
		background: var(--color-surface); border: 1px solid var(--color-border);
		color: var(--text-muted); font-size: 0.82rem; font-weight: 700; cursor: pointer;
		transition: all 0.15s ease;
	}
	.letter-chip:hover { border-color: var(--accent-text); color: var(--text-title); }
	.letter-chip--active {
		background: var(--palette-yellow); color: var(--palette-black); border-color: transparent;
	}
	.spotlight-card {
		background: var(--color-surface); border: 2px solid var(--palette-yellow);
		border-radius: 16px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem;
		box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
	}
	.spotlight-header { display: flex; justify-content: space-between; align-items: center; }
	.spotlight-badge {
		display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.8rem;
		font-weight: 800; text-transform: uppercase; color: var(--palette-orange);
	}
	.close-spotlight {
		background: none; border: none; color: var(--text-muted); cursor: pointer;
		font-size: 1.1rem; padding: 0.2rem 0.5rem;
	}
	.spotlight-text {
		margin: 0; font-size: 1.3rem; font-weight: 700; color: var(--text-title);
		line-height: 1.5; white-space: pre-line;
	}
	.spotlight-actions { display: flex; gap: 0.75rem; }
	.copy-btn, .next-random-btn {
		display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.5rem 0.9rem;
		border-radius: 10px; border: 1px solid var(--color-border); background: var(--bg-card);
		color: var(--text-title); font-size: 0.85rem; font-weight: 600; cursor: pointer;
	}
	.results-meta { font-size: 0.9rem; color: var(--text-muted); }
	.cards-grid {
		display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
		gap: 1.25rem;
	}
	.twister-card {
		background: var(--bg-card); border: 1px solid var(--color-border);
		border-radius: 16px; padding: 1.25rem; display: flex; flex-direction: column;
		gap: 0.75rem; transition: transform 0.15s ease, border-color 0.15s ease;
	}
	.twister-card:hover { transform: translateY(-2px); border-color: var(--accent-text); }
	.twister-top { display: flex; justify-content: space-between; align-items: center; }
	.letter-badge {
		display: inline-flex; align-items: center; justify-content: center;
		width: 1.75rem; height: 1.75rem; border-radius: 6px; background: var(--color-surface);
		border: 1px solid var(--color-border); font-size: 0.85rem; font-weight: 800;
		color: var(--text-title);
	}
	.copy-icon-btn {
		background: none; border: none; color: var(--text-muted); cursor: pointer;
		padding: 0.3rem; border-radius: 6px; display: inline-flex;
	}
	.copy-icon-btn:hover { color: var(--text-title); }
	.copied-check { color: #22c55e; }
	.twister-text {
		margin: 0; font-size: 1.05rem; font-weight: 600; color: var(--text-title);
		line-height: 1.5; white-space: pre-line;
	}
</style>
