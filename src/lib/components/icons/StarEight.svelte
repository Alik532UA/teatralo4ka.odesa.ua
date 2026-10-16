<script lang="ts">
	let { size = 24, className = '' }: { size?: number; className?: string } = $props();
</script>

<svg
	viewBox="0 0 24 24"
	width={size}
	height={size}
	class={className}
	aria-hidden="true"
	fill="currentColor"
	xmlns="http://www.w3.org/2000/svg"
>
	<path
		d="M 12 1 L 13.72 7.84 L 19.78 4.22 L 16.16 10.28 L 23 12 L 16.16 13.72 L 19.78 19.78 L 13.72 16.16 L 12 23 L 10.28 16.16 L 4.22 19.78 L 7.84 13.72 L 1 12 L 7.84 10.28 L 4.22 4.22 L 10.28 7.84 Z"
	/>
</svg>
