<script lang="ts">
	import CountryFlag from '$lib/components/icons/CountryFlag.svelte';
	import { parseContentWithFlags } from '$lib/utils/formatFlags';

	interface Props {
		text: string;
	}

	let { text }: Props = $props();
	const tokens = $derived(parseContentWithFlags(text));
</script>

{#each tokens as token (token)}
	{#if token.type === 'flag'}
		<CountryFlag code={token.code} title={token.emoji} />
	{:else}
		<span>{token.value}</span>
	{/if}
{/each}
