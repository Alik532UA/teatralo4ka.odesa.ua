<script lang="ts">
	interface Props {
		code: string;
		title?: string;
		class?: string;
	}

	let { code, title, class: className = '' }: Props = $props();

	const upperCode = $derived(code.toUpperCase());
</script>

<span class="flag-wrapper {className}" {title} role="img" aria-label={title || code}>
	{#if upperCode === 'UA' || upperCode === 'UK'}
		<svg viewBox="0 0 32 24" width="20" height="15" aria-hidden="true" class="flag-svg">
			<rect width="32" height="12" y="0" fill="#0057B7" />
			<rect width="32" height="12" y="12" fill="#FFD700" />
		</svg>
	{:else if upperCode === 'BG'}
		<svg viewBox="0 0 32 24" width="20" height="15" aria-hidden="true" class="flag-svg">
			<rect width="32" height="8" y="0" fill="#fff" />
			<rect width="32" height="8" y="8" fill="#00966E" />
			<rect width="32" height="8" y="16" fill="#D62612" />
		</svg>
	{:else if upperCode === 'CZ' || upperCode === 'CS'}
		<svg viewBox="0 0 32 24" width="20" height="15" aria-hidden="true" class="flag-svg">
			<rect width="32" height="12" y="0" fill="#fff" />
			<rect width="32" height="12" y="12" fill="#D7141A" />
			<path d="M0 0 L16 12 L0 24 Z" fill="#11457E" />
		</svg>
	{:else if upperCode === 'AT'}
		<svg viewBox="0 0 32 24" width="20" height="15" aria-hidden="true" class="flag-svg">
			<rect width="32" height="8" y="0" fill="#ED2939" />
			<rect width="32" height="8" y="8" fill="#fff" />
			<rect width="32" height="8" y="16" fill="#ED2939" />
		</svg>
	{:else if upperCode === 'DE'}
		<svg viewBox="0 0 32 24" width="20" height="15" aria-hidden="true" class="flag-svg">
			<rect width="32" height="8" y="0" fill="#000" />
			<rect width="32" height="8" y="8" fill="#DD0000" />
			<rect width="32" height="8" y="16" fill="#FFCE00" />
		</svg>
	{:else if upperCode === 'PL'}
		<svg viewBox="0 0 32 24" width="20" height="15" aria-hidden="true" class="flag-svg">
			<rect width="32" height="12" y="0" fill="#fff" />
			<rect width="32" height="12" y="12" fill="#DC143C" />
		</svg>
	{:else if upperCode === 'SK'}
		<svg viewBox="0 0 900 600" width="20" height="15" aria-hidden="true" class="flag-svg">
			<path fill="#254aa5" d="M0 400h900V200H0Z" />
			<path fill="#fff" d="M0 200h900V0H0Z" />
			<path fill="#ed1c24" d="M0 600h900V400H0Z" />
			<g><path fill="#fff" d="m270 460-4-2c-25-12-56-30-81-58-25-28-44-65-44-114 0-94 5-137 5-137l1-8h247l1 8s5 43 5 137c0 49-19 87-44 114-25 28-56 46-81 58Z" /><path fill="#ed1c24" d="M270 450c-49-24-120-71-120-164S154 150 154 150h232s4 42 4 136-71 140-120 164" /><path fill="#fff" d="M281 261c13 0 39 1 62-7 0 0 0 8 0 18s0 18 0 18c-21-7-47-7-62-7v52h-21v-52c-15 0-41 0-63 7 0 0 1-8 1-18s-1-18-1-18c23 8 49 7 63 7v-32c-12 0-30 0-50 7 0 0 1-8 1-18s-1-18-1-18c20 7 37 7 50 7 0-20-7-46-7-46s12 1 17 1 17-1 17-1-6 26-7 46c13 0 30 0 50-7 0 0-1 8-1 18s1 18 1 18c-20-7-38-7-50-7v32" /><path fill="#254aa5" d="M270 329c-25 0-38 35-38 35s-8-17-28-17c-14 0-24 13-30 24 25 40 65 64 96 79 31-15 71-39 96-79-6-11-16-24-30-24s-28 17-28 17-13-35-38-35Z" /></g>
		</svg>
	{:else if upperCode === 'FR'}
		<svg viewBox="0 0 32 24" width="20" height="15" aria-hidden="true" class="flag-svg">
			<rect width="10.66" height="24" x="0" fill="#002395" />
			<rect width="10.66" height="24" x="10.66" fill="#fff" />
			<rect width="10.68" height="24" x="21.32" fill="#ED2939" />
		</svg>
	{:else if upperCode === 'IT'}
		<svg viewBox="0 0 32 24" width="20" height="15" aria-hidden="true" class="flag-svg">
			<rect width="10.66" height="24" x="0" fill="#009246" />
			<rect width="10.66" height="24" x="10.66" fill="#fff" />
			<rect width="10.68" height="24" x="21.32" fill="#CE2B37" />
		</svg>
	{:else if upperCode === 'ES'}
		<svg viewBox="0 0 32 24" width="20" height="15" aria-hidden="true" class="flag-svg">
			<rect width="32" height="6" y="0" fill="#AA151B" />
			<rect width="32" height="12" y="6" fill="#F1BF00" />
			<rect width="32" height="6" y="18" fill="#AA151B" />
		</svg>
	{:else if upperCode === 'RO'}
		<svg viewBox="0 0 32 24" width="20" height="15" aria-hidden="true" class="flag-svg">
			<rect width="10.66" height="24" x="0" fill="#002B7F" />
			<rect width="10.66" height="24" x="10.66" fill="#FCD116" />
			<rect width="10.68" height="24" x="21.32" fill="#CE1126" />
		</svg>
	{:else if upperCode === 'MD'}
		<svg viewBox="0 0 32 24" width="20" height="15" aria-hidden="true" class="flag-svg">
			<rect width="10.66" height="24" x="0" fill="#002B7F" />
			<rect width="10.66" height="24" x="10.66" fill="#FCD116" />
			<rect width="10.68" height="24" x="21.32" fill="#CE1126" />
			<circle cx="16" cy="12" r="2.5" fill="#C18B22" />
		</svg>
	{:else if upperCode === 'HU'}
		<svg viewBox="0 0 32 24" width="20" height="15" aria-hidden="true" class="flag-svg">
			<rect width="32" height="8" y="0" fill="#CE2939" />
			<rect width="32" height="8" y="8" fill="#fff" />
			<rect width="32" height="8" y="16" fill="#477050" />
		</svg>
	{:else if upperCode === 'GB'}
		<svg viewBox="0 0 50 30" width="20" height="15" aria-hidden="true" class="flag-svg">
			<clipPath id="uk-clip"><path d="M25,15h25v15zv15h-25zh-25v-15zv-15h25z" /></clipPath>
			<path d="M0,0v30h50v-30z" fill="#012169" />
			<path d="M0,0 50,30M50,0 0,30" stroke="#fff" stroke-width="6" />
			<path d="M0,0 50,30M50,0 0,30" clip-path="url(#uk-clip)" stroke="#C8102E" stroke-width="4" />
			<path d="M-1 11h22v-12h8v12h22v8h-22v12h-8v-12h-22z" fill="#C8102E" stroke="#FFF" stroke-width="2" />
		</svg>
	{:else if upperCode === 'US'}
		<svg viewBox="0 0 32 24" width="20" height="15" aria-hidden="true" class="flag-svg">
			<rect width="32" height="24" fill="#B22234" />
			<path stroke="#fff" stroke-width="1.8" d="M0 3h32M0 7h32M0 11h32M0 15h32M0 19h32M0 23h32" />
			<rect width="13" height="13" fill="#3C3B6E" />
		</svg>
	{:else if upperCode === 'GE'}
		<svg viewBox="0 0 32 24" width="20" height="15" aria-hidden="true" class="flag-svg">
			<rect width="32" height="24" fill="#fff" />
			<rect width="5" height="24" x="13.5" fill="#FF0000" />
			<rect width="32" height="5" y="9.5" fill="#FF0000" />
		</svg>
	{:else if upperCode === 'TR'}
		<svg viewBox="0 0 32 24" width="20" height="15" aria-hidden="true" class="flag-svg">
			<rect width="32" height="24" fill="#E30A17" />
			<circle cx="12" cy="12" r="6" fill="#fff" />
			<circle cx="13.8" cy="12" r="4.8" fill="#E30A17" />
			<polygon points="17,12 21,13.5 19.5,12 21,10.5" fill="#fff" />
		</svg>
	{:else if upperCode === 'IL'}
		<svg viewBox="0 0 32 24" width="20" height="15" aria-hidden="true" class="flag-svg">
			<rect width="32" height="24" fill="#fff" />
			<rect width="32" height="3" y="3" fill="#0038B8" />
			<rect width="32" height="3" y="18" fill="#0038B8" />
			<polygon points="16,8 19,14 13,14" fill="none" stroke="#0038B8" stroke-width="1" />
			<polygon points="16,16 19,10 13,10" fill="none" stroke="#0038B8" stroke-width="1" />
		</svg>
	{:else}
		<span class="flag-fallback">{code}</span>
	{/if}
</span>

<style>
	.flag-wrapper {
		display: inline-flex;
		align-items: center;
		vertical-align: -0.15em;
		margin-right: 0.35em;
		border-radius: 3px;
		overflow: hidden;
		box-shadow: 0 1px 4px rgb(0 0 0 / 0.45);
		line-height: 1;
		flex-shrink: 0;
	}
	.flag-svg {
		display: block;
		width: 1.3em;
		height: 0.95em;
		object-fit: cover;
	}
	.flag-fallback {
		font-size: 0.75em;
		font-weight: bold;
		padding: 0 2px;
		background: rgb(255 255 255 / 0.2);
		border-radius: 2px;
	}
</style>
