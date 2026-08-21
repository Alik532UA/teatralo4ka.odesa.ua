<script lang="ts">
	interface Props {
		department?: string | null;
		size?: number;
		class?: string;
	}

	let { department = null, size = 16, class: className = '' }: Props = $props();
</script>

{#if department === 'theatre'}
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class="dept-icon {className}"
		aria-hidden="true"
	>
		<path d="M2 10s2-4 6-4 6 4 6 4-2 6-6 6-6-6-6-6Z" />
		<path d="M6 9h.01" />
		<path d="M10 9h.01" />
		<path d="M6 13a3 3 0 0 0 4 0" />
		<path d="M14 6c3 0 6 3 8 7s-1 6-4 6a6 6 0 0 1-4-3" />
		<path d="M18 11h.01" />
		<path d="M18 15a2.5 2.5 0 0 1-3-1" />
	</svg>
{:else if department === 'piano'}
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class="dept-icon {className}"
		aria-hidden="true"
	>
		<rect width="20" height="16" x="2" y="4" rx="2" />
		<path d="M6 4v8" />
		<path d="M10 4v8" />
		<path d="M14 4v8" />
		<path d="M18 4v8" />
		<path d="M2 12h20" />
	</svg>
{:else if department === 'vocal'}
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class="dept-icon {className}"
		aria-hidden="true"
	>
		<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
		<path d="M19 10v2a7 7 0 0 1-14 0v-2" />
		<line x1="12" x2="12" y1="19" y2="22" />
	</svg>
{:else if department === 'music'}
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class="dept-icon {className}"
		aria-hidden="true"
	>
		<path d="M9 18V5l12-2v13" />
		<circle cx="6" cy="18" r="3" />
		<circle cx="18" cy="16" r="3" />
	</svg>
{:else if department === 'art'}
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class="dept-icon {className}"
		aria-hidden="true"
	>
		<circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
		<circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
		<circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
		<circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
		<path
			d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.563-2.512 5.563-5.563C22 6.5 17.5 2 12 2Z"
		/>
	</svg>
{:else if department === 'guitar'}
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class="dept-icon {className}"
		aria-hidden="true"
	>
		<path d="m19 2-3 3" />
		<path d="m15 5 4 4" />
		<path d="M12 8 8 12" />
		<path
			d="M6 14a4 4 0 1 0 4 4c0-1.5-1-2-1-3l3-3c1 0 1.5 1 3 1a4 4 0 1 0-4-4c-1 0-1.5 1-3 1l-3-3c0-1-1-1.5-1-3a4 4 0 1 0-4 4c1.5 0 2 1 3 1l3 3c0 1-1 1.5-1 3Z"
		/>
	</svg>
{:else}
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class="dept-icon {className}"
		aria-hidden="true"
	>
		<path
			d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"
		/>
		<path d="M22 10v6" />
		<path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
	</svg>
{/if}

<style>
	.dept-icon {
		display: inline-block;
		vertical-align: middle;
		flex-shrink: 0;
	}
</style>
