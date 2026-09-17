<script lang="ts">
	interface Props {
		size?: number | string;
		color?: string;
		strokeWidth?: number | string;
		class?: string;
		[key: string]: unknown;
	}

	let {
		size = 24,
		color = 'currentColor',
		strokeWidth = 2,
		class: className = '',
		...restProps
	}: Props = $props();
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke={color}
	stroke-width={strokeWidth}
	stroke-linecap="round"
	stroke-linejoin="round"
	class="lucide-icon lucide lucide-user-round-group {className}"
	{...restProps}
>
	<path d="M17 21a5 5 0 0 0-10 0" />
	<path d="M22 10.5a3.5 3.5 0 0 0-5.507-2.868" />
	<path d="M7.507 7.632A3.5 3.5 0 0 0 2 10.5" />
	<circle cx="12" cy="13" r="3" />
	<circle cx="18.5" cy="4.5" r="2.5" />
	<circle cx="5.5" cy="4.5" r="2.5" />
</svg>
