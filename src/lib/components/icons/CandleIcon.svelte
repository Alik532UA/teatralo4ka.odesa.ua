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
	class="lucide-icon lucide lucide-candle {className}"
	{...restProps}
>
	<path d="M6 21h12" />
	<rect x="9" y="11" width="6" height="10" rx="1" />
	<line x1="12" y1="8" x2="12" y2="11" />
	<path d="M12 2c-.8 1.2-1.5 2.1-1.5 3a1.5 1.5 0 0 0 3 0c0-.9-.7-1.8-1.5-3z" />
</svg>

