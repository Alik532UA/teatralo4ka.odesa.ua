<script lang="ts">
	import { Drama, Piano, MicVocal, Music, Palette, Guitar, GraduationCap } from 'lucide-svelte';

	interface Props {
		department?: string | null;
		size?: number;
		class?: string;
	}

	let { department = null, size = 16, class: className = '' }: Props = $props();
</script>

{#if department === 'theatre'}
	<Drama {size} class="dept-icon {className}" aria-hidden="true" />
{:else if department === 'piano'}
	<Piano {size} class="dept-icon {className}" aria-hidden="true" />
{:else if department === 'vocal'}
	<MicVocal {size} class="dept-icon {className}" aria-hidden="true" />
{:else if department === 'music'}
	<Music {size} class="dept-icon {className}" aria-hidden="true" />
{:else if department === 'art'}
	<Palette {size} class="dept-icon {className}" aria-hidden="true" />
{:else if department === 'guitar'}
	<Guitar {size} class="dept-icon {className}" aria-hidden="true" />
{:else}
	<GraduationCap {size} class="dept-icon {className}" aria-hidden="true" />
{/if}

<style>
	:global(.dept-icon) {
		display: inline-block;
		vertical-align: middle;
		flex-shrink: 0;
	}
</style>
