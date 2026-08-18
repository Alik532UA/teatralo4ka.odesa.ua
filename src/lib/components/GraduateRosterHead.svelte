<script lang="ts">
	import { t } from 'svelte-i18n';

	interface Props {
		year: number | null;
		/** Рядок сітки переліку: заголовок живе в тій самій сітці, що й картки. */
		row: number;
	}

	let { year, row }: Props = $props();
</script>

<!--
	Рік заголовком на початку своєї групи, а не дрібним написом у кожній картці.

	Так було спершу — і 482 картки з роком читалися як суцільна стіна, у якій межу
	між 2019 і 2018 доводилося вишукувати очима. Заодно напис у картці займав 49px
	ширини (заміряно), тобто в кожен рядок влазило менше людей.
-->
<li class="head" style="grid-row: {row}; grid-column: 1 / -1" data-testid="galaxy-roster-head-{year}-title">
	<h3>{year ?? $t('galaxy.allYears')}</h3>
</li>

<style>
	.head {
		align-self: end;
		padding: 0.55rem 0 0.15rem;
	}

	h3 {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin: 0;
		font-size: 0.95rem;
		font-variant-numeric: tabular-nums;
		letter-spacing: 0.04em;
		color: var(--galaxy-text);
	}

	/* Лінія праворуч від року: заголовок має читатися як межа, а не як картка. */
	h3::after {
		content: '';
		flex: 1;
		height: 1px;
		background: rgb(255 255 255 / 0.14);
	}
</style>
