<script lang="ts">
	import { locale } from 'svelte-i18n';
	import { asset } from '$app/paths';
	import { localizedPath } from '$lib/i18n/routing';
	import { groupProfilePath } from '$lib/data/groups';
	import { LINKED_GRADUATES } from '$lib/data/graduates';
	import LineageBranchConnector from '$lib/components/icons/LineageBranchConnector.svelte';
	import type { GalaxyRowLineageTree, GalaxyRowLineageNode } from '$lib/data/groupLineage';

	interface Props {
		tree: GalaxyRowLineageTree;
		mode: 'merger' | 'split' | 'fork';
		testIdPrefix: string;
		primary?: import('svelte').Snippet;
	}

	let { tree, mode, testIdPrefix, primary }: Props = $props();

	const lang = $derived<'uk' | 'en'>($locale === 'en' ? 'en' : 'uk');
	const isEn = $derived(lang === 'en');

	function studentCountLabel(count: number): string {
		if (isEn) return count === 1 ? '1 student' : `${count} students`;
		if (count % 10 === 1 && count % 100 !== 11) return `${count} учень`;
		if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return `${count} учні`;
		return `${count} учнів`;
	}

	function shuffle<T>(list: readonly T[]): T[] {
		const out = [...list];
		for (let i = out.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[out[i], out[j]] = [out[j], out[i]];
		}
		return out;
	}

	function getTargetGraduates(node: GalaxyRowLineageNode) {
		const targetIds = node.relatedMemberIds?.length ? node.relatedMemberIds : (node.memberIds ?? []);
		return targetIds
			.map((id) => LINKED_GRADUATES.find((g) => g.id === id))
			.filter((g): g is NonNullable<typeof g> => Boolean(g));
	}

	let shuffledMap = $state<Record<string, ReturnType<typeof getTargetGraduates>>>({});

	$effect(() => {
		const nextMap: Record<string, ReturnType<typeof getTargetGraduates>> = {};
		const allNodes = [...tree.predecessors, ...tree.successors, ...(tree.siblings ?? [])];
		for (const node of allNodes) {
			const grads = getTargetGraduates(node);
			const withPhoto = shuffle(grads.filter((g) => g.hasPhoto));
			const withoutPhoto = shuffle(grads.filter((g) => !g.hasPhoto));
			nextMap[node.slug] = [...withPhoto, ...withoutPhoto].slice(0, 3);
		}
		shuffledMap = nextMap;
	});

	function getMicroFaces(node: GalaxyRowLineageNode) {
		if (shuffledMap[node.slug]) {
			return shuffledMap[node.slug];
		}
		const grads = getTargetGraduates(node);
		const withPhoto = grads.filter((g) => g.hasPhoto);
		const withoutPhoto = grads.filter((g) => !g.hasPhoto);
		return [...withPhoto, ...withoutPhoto].slice(0, 3);
	}
</script>

{#snippet nodeCard(node: GalaxyRowLineageNode, prefix: string)}
	<a
		class="lineage-node"
		href={localizedPath(groupProfilePath(node.slug), lang)}
		data-testid="{prefix}-node-link-{node.slug}"
		title={isEn ? `Go to group ${node.name}` : `Перейти до групи «${node.name}»`}
	>
		<span class="lineage-node__year">{node.yearLabel}</span>
		<span class="lineage-node__name">{node.name}</span>
		<span class="lineage-node__count">({studentCountLabel(node.memberCount)})</span>
		{#if (node.relatedMemberIds?.length ?? node.memberIds?.length)}
			<span class="lineage-node__faces" aria-hidden="true">
				{#each getMicroFaces(node) as face (face.id)}
					{#if face.hasPhoto}
						<img
							src={asset(`/graduates/${face.slug}-96.webp`)}
							alt={face.name}
							class="lineage-face"
							loading="lazy"
							width="16"
							height="16"
							title={face.name}
						/>
					{:else}
						<span class="lineage-face lineage-face--letter" title={face.name}>{face.name.slice(0, 1)}</span>
					{/if}
				{/each}
			</span>
		{/if}
	</a>
{/snippet}

{#if mode === 'merger' && tree.predecessors.length > 0}
	<!-- Ліворуч: попередниці стовпчиком, що зливаються стрілкою в назву ТУ-154 -->
	<div class="lineage-merger" data-testid="{testIdPrefix}-lineage-merger-panel">
		<div class="lineage-merger__stack">
			{#each tree.predecessors as pred (pred.slug)}
				{@render nodeCard(pred, testIdPrefix)}
			{/each}
		</div>

		<LineageBranchConnector mode="merger" count={tree.predecessors.length} />
	</div>
{:else if mode === 'fork' && tree.predecessors.length > 0}
	<!-- Попередниця розгалужується на поточну групу (основа) та споріднену (в контейнері) -->
	<div class="lineage-fork" data-testid="{testIdPrefix}-lineage-fork-panel">
		<div class="lineage-fork__source">
			{@render nodeCard(tree.predecessors[0], testIdPrefix)}
		</div>

		<LineageBranchConnector mode="split" count={2} />

		<div class="lineage-fork__stack">
			<div class="lineage-fork__primary">
				{#if primary}
					{@render primary()}
				{/if}
			</div>

			<div class="lineage-fork__siblings">
				{#each tree.siblings ?? [] as sib (sib.slug)}
					{@render nodeCard(sib, testIdPrefix)}
				{/each}
			</div>
		</div>
	</div>
{:else if mode === 'split' && tree.successors.length > 0}
	<!-- Праворуч: розгалуження зі стрілками на наступниці -->
	<div class="lineage-split" data-testid="{testIdPrefix}-lineage-split-panel">
		<LineageBranchConnector mode="split" count={tree.successors.length} />

		<div class="lineage-split__stack">
			{#each tree.successors as succ (succ.slug)}
				{@render nodeCard(succ, testIdPrefix)}
			{/each}
		</div>
	</div>
{/if}

<style>
	.lineage-merger,
	.lineage-split,
	.lineage-fork {
		display: inline-flex;
		align-items: center;
		position: relative;
		z-index: 2;
	}

	.lineage-fork__source {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.lineage-fork__stack {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.lineage-fork__primary {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		height: 24px;
	}

	.lineage-fork__siblings {
		display: flex;
		align-items: center;
		gap: 4px;
		height: 24px;
	}

	.lineage-merger__stack,
	.lineage-split__stack {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.lineage-node {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		height: 24px;
		padding: 0 0.45rem;
		border-radius: var(--radius-sm, 6px);
		background: color-mix(in srgb, var(--bg-surface), transparent 25%);
		border: var(--hairline-width) solid color-mix(in srgb, var(--border-main), transparent 30%);
		color: var(--text-title);
		text-decoration: none;
		line-height: 1;
		white-space: nowrap;
		font-size: 0.76rem;
		box-sizing: border-box;
		transition:
			border-color var(--transition-fast),
			background var(--transition-fast),
			transform var(--transition-fast);
		cursor: pointer;
	}

	.lineage-node:hover {
		border-color: var(--accent-primary);
		background: var(--bg-surface);
		transform: translateY(-1px);
	}

	.lineage-node__year {
		font-size: 0.72rem;
		color: var(--text-muted);
		font-weight: 600;
	}

	.lineage-node__name {
		font-weight: 700;
		color: var(--text-title);
	}

	.lineage-node:hover .lineage-node__name {
		color: var(--accent-primary);
	}

	.lineage-node__count {
		font-size: 0.7rem;
		color: var(--accent-text, #8cb4ff);
		font-weight: 600;
	}

	.lineage-node__faces {
		display: inline-flex;
		align-items: center;
		margin-left: 0.15rem;
	}

	.lineage-face {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		border: 1px solid var(--bg-surface);
		object-fit: cover;
		margin-left: -4px;
		flex-shrink: 0;
	}

	.lineage-face:first-child {
		margin-left: 0;
	}

	.lineage-face--letter {
		display: inline-grid;
		place-items: center;
		background: color-mix(in srgb, var(--accent-text, #8cb4ff), transparent 85%);
		color: var(--accent-text, #8cb4ff);
		font-size: 0.6rem;
		font-weight: 700;
	}
</style>
