<script lang="ts">
	import { asset } from '$app/paths';

	interface Props {
		name: string;
		photo?: string | null;
		countText?: string | null;
		roleTitle?: string | null;
		askText?: string;
		x: number;
		onmouseenter?: () => void;
		onmouseleave?: () => void;
	}

	let {
		name,
		photo,
		countText,
		roleTitle,
		askText = 'якщо це твій викладач, то напиши мені',
		x,
		onmouseenter,
		onmouseleave
	}: Props = $props();

	const CONTACTS = [
		{ name: 'Telegram', url: 'https://t.me/alik532', icon: 'message_telegram_512.svg' },
		{ name: 'Viber', url: 'viber://chat?number=%2B380937251208', icon: 'message_viber_512.svg' },
		{ name: 'WhatsApp', url: 'https://wa.me/380937251208', icon: 'message_whatsapp_512.svg' },
		{ name: 'LinkedIn', url: 'https://linkedin.com/in/alik-qa-engineer', icon: 'message_linkedin_512.svg' }
	] as const;
</script>

<div
	class="sitemap-tip"
	style="--tip-x: {x}px;"
	{onmouseenter}
	{onmouseleave}
	role="tooltip"
	data-testid="sitemap-person-tip-panel"
>
	{#if photo}
		<img
			src={photo}
			alt=""
			width="62"
			height="80"
			class="sitemap-tip__portrait"
			data-testid="sitemap-person-tip-photo-img"
		/>
	{:else}
		<div class="sitemap-tip__portrait sitemap-tip__portrait--fallback" aria-hidden="true">
			{name.charAt(0)}
		</div>
	{/if}

	<div class="sitemap-tip__body">
		<span class="sitemap-tip__name">{name}</span>
		{#if countText}
			<span class="sitemap-tip__count">{countText}</span>
		{/if}
		{#if roleTitle}
			<span class="sitemap-tip__role">{roleTitle}</span>
		{/if}

		<div class="sitemap-tip__ask">
			<img
				src={asset('/graduates/alik-zapolnov-96.webp')}
				alt="Алік Запольнов"
				width="24"
				height="24"
				class="sitemap-tip__admin"
			/>
			<span class="sitemap-tip__cta">{askText}</span>
			<div class="sitemap-tip__icons">
				{#each CONTACTS as c (c.name)}
					<a
						href={c.url}
						target="_blank"
						rel="external noopener noreferrer"
						class="sitemap-tip__link"
						aria-label={c.name}
						data-testid={`sitemap-person-tip-${c.name.toLowerCase()}-link`}
					>
						<img src={asset(`/social_media/${c.icon}`)} alt="" width="20" height="20" />
					</a>
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	.sitemap-tip {
		position: absolute;
		bottom: calc(100% + 10px);
		left: clamp(12px, calc(var(--tip-x) - 130px), calc(100% - 310px));
		z-index: 50;
		display: flex;
		align-items: stretch;
		gap: 0.65rem;
		width: 300px;
		padding: 0.55rem 0.65rem;
		border-radius: 0.9rem;
		background: rgba(10, 18, 30, 0.95);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid rgba(140, 190, 255, 0.35);
		box-shadow: 0 14px 34px rgba(0, 0, 0, 0.6);
		color: #fff;
		text-align: left;
		pointer-events: auto;
		animation: tip-in 0.15s ease-out;
	}
	@keyframes tip-in {
		from { opacity: 0; transform: translateY(6px); }
		to { opacity: 1; transform: translateY(0); }
	}
	.sitemap-tip__portrait {
		width: 62px;
		height: 80px;
		object-fit: cover;
		border-radius: 0.6rem;
		border: 1px solid rgba(140, 190, 255, 0.25);
		flex-shrink: 0;
	}
	.sitemap-tip__portrait--fallback {
		display: grid;
		place-items: center;
		font-size: 1.8rem;
		font-weight: 700;
		color: var(--accent-text, #38bdf8);
		background: rgba(255, 255, 255, 0.08);
	}
	.sitemap-tip__body {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		min-width: 0;
		flex: 1;
	}
	.sitemap-tip__name {
		font-weight: 700;
		font-size: 0.88rem;
		line-height: 1.2;
		color: #fff;
	}
	.sitemap-tip__count {
		font-size: 0.74rem;
		font-weight: 600;
		color: var(--accent-text, #38bdf8);
	}
	.sitemap-tip__role {
		font-size: 0.68rem;
		line-height: 1.25;
		color: var(--text-muted, #9ca3af);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.sitemap-tip__ask {
		display: grid;
		grid-template-columns: auto 1fr;
		align-items: center;
		gap: 0.15rem 0.35rem;
		margin-top: 0.25rem;
		padding: 0.35rem 0.4rem;
		border-radius: 0.55rem;
		background: rgba(140, 190, 255, 0.08);
		border: 1px solid rgba(140, 190, 255, 0.2);
	}
	.sitemap-tip__admin {
		border-radius: 50%;
		flex-shrink: 0;
	}
	.sitemap-tip__cta {
		font-size: 0.7rem;
		font-weight: 700;
		line-height: 1.15;
		color: var(--accent-text, #38bdf8);
	}
	.sitemap-tip__icons {
		grid-column: 1 / -1;
		display: flex;
		align-items: center;
		gap: 0.35rem;
		margin-top: 0.15rem;
	}
	.sitemap-tip__link {
		display: grid;
		place-items: center;
		border-radius: 50%;
		transition: transform 0.15s ease;
	}
	.sitemap-tip__link:hover {
		transform: scale(1.15);
	}
</style>
