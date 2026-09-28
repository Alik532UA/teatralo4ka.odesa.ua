<script lang="ts">
	interface Props {
		mode: 'merger' | 'split';
		count?: number;
		width?: number;
		height?: number;
		class?: string;
	}

	let {
		mode,
		count = 2,
		width,
		height,
		class: className = ''
	}: Props = $props();
</script>

{#if mode === 'merger'}
	{#if count === 1}
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={width ?? 22}
			height={height ?? 24}
			viewBox="0 0 22 24"
			fill="none"
			class="lineage-connector-svg {className}"
			aria-hidden="true"
		>
			<path
				d="M 2,12 L 17,12"
				stroke="currentColor"
				stroke-width="1.8"
				stroke-linecap="round"
			/>
			<path
				d="M 12,7 L 17,12 L 12,17"
				stroke="currentColor"
				stroke-width="1.8"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	{:else}
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={width ?? 28}
			height={height ?? 52}
			viewBox="0 0 28 52"
			fill="none"
			class="lineage-connector-svg {className}"
			aria-hidden="true"
		>
			<path
				d="M 2,12 C 14,12 16,26 22,26 M 2,40 C 14,40 16,26 22,26"
				stroke="currentColor"
				stroke-width="1.8"
				stroke-linecap="round"
			/>
			<path
				d="M 17,21 L 23,26 L 17,31"
				stroke="currentColor"
				stroke-width="1.8"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	{/if}
{:else}
	{#if count === 1}
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={width ?? 22}
			height={height ?? 24}
			viewBox="0 0 22 24"
			fill="none"
			class="lineage-connector-svg {className}"
			aria-hidden="true"
		>
			<path
				d="M 2,12 L 17,12"
				stroke="currentColor"
				stroke-width="1.8"
				stroke-linecap="round"
			/>
			<path
				d="M 12,7 L 17,12 L 12,17"
				stroke="currentColor"
				stroke-width="1.8"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	{:else}
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={width ?? 28}
			height={height ?? 52}
			viewBox="0 0 28 52"
			fill="none"
			class="lineage-connector-svg {className}"
			aria-hidden="true"
		>
			<path
				d="M 2,26 C 8,26 12,12 22,12 M 2,26 C 8,26 12,40 22,40"
				stroke="currentColor"
				stroke-width="1.8"
				stroke-linecap="round"
			/>
			<path
				d="M 17,7 L 23,12 L 17,17 M 17,35 L 23,40 L 17,45"
				stroke="currentColor"
				stroke-width="1.8"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	{/if}
{/if}

<style>
	.lineage-connector-svg {
		flex-shrink: 0;
		color: var(--accent-primary);
		filter: drop-shadow(0 0 4px color-mix(in srgb, var(--accent-primary), transparent 70%));
	}
</style>
