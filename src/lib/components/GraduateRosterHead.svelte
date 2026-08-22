<script lang="ts">
	import { t } from 'svelte-i18n';

	interface Props {
		year: number | null;
		count?: number;
	}

	let { year, count }: Props = $props();
</script>

<!--
	Рік заголовком на початку своєї групи в окремій картці року.
	Лінія праворуч від року: заголовок має читатися як межа, а не як картка.
-->
<header class="head" data-year={year} data-testid="galaxy-roster-head-{year}-title">
	<h3>
		{year ?? $t('galaxy.allYears')}
		{#if count !== undefined}
			<span class="count">{count}</span>
		{/if}
	</h3>
</header>

<style>
	.head {
		display: flex;
		align-items: center;
	}

	h3 {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin: 0;
		font-size: 1rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		letter-spacing: 0.04em;
		color: var(--galaxy-text);
		width: 100%;
	}

	h3::after {
		content: '';
		flex: 1;
		height: 1px;
		background: rgb(255 255 255 / 0.12);
	}

	.count {
		font-size: 0.8rem;
		font-weight: 400;
		opacity: 0.6;
		color: var(--galaxy-muted, #a8bfe0);
	}
</style>
