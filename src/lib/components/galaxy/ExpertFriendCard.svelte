<script lang="ts">
	import { asset } from '$app/paths';
	import { t } from 'svelte-i18n';
	import { localizedPath } from '$lib/i18n/routing';
	import { ArrowRight } from 'lucide-svelte';
	import { FRIENDS_DIR, type Friend } from '$lib/data/friends';
	import PhotoLightbox from '$lib/components/PhotoLightbox.svelte';

	interface Props {
		friend: Friend;
		name: string;
		currentLang: 'uk' | 'en';
	}

	let { friend, name, currentLang }: Props = $props();

	let open = $state(false);

	const images = $derived([
		{
			src: asset(`${FRIENDS_DIR}/${friend.slug}.webp`),
			alt: name,
			title: `${name} — ${friend.role[currentLang]}`
		}
	]);
</script>

<section class="expert-friend" data-testid="expert-friend-section">
	<div class="expert-friend__header">
		<h2 class="expert-friend__title">
			{$t('galaxy.friendsTitle')}
		</h2>
		<a
			class="expert-friend__all-link"
			href={localizedPath('/projects/galaxy-graduates/friends/', currentLang)}
			data-testid="expert-to-friends-link"
		>
			<span>{$t('galaxy.allFriends')}</span>
			<ArrowRight size={14} aria-hidden="true" />
		</a>
	</div>
	<button
		type="button"
		class="expert-friend__shot"
		onclick={() => (open = true)}
		aria-label={`${name} — ${$t('galaxy.friendOpenCard')}`}
		data-testid="expert-friend-card-btn"
	>
		<img
			src={asset(`${FRIENDS_DIR}/${friend.slug}-480.webp`)}
			width={friend.thumb.w}
			height={friend.thumb.h}
			alt={`${name} — ${$t('galaxy.friendsTitle')}`}
			loading="lazy"
		/>
		<span class="expert-friend__badge">
			{$t('galaxy.friendOpenCard')}
		</span>
	</button>
</section>

<PhotoLightbox {images} currentIndex={0} isOpen={open} onclose={() => (open = false)} />

<style>
	.expert-friend {
		margin-bottom: 2.5rem;
	}

	.expert-friend__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0.75rem 1rem;
		margin-bottom: 1rem;
	}

	.expert-friend__title {
		font-family: var(--font-heading);
		font-size: 1.3rem;
		color: var(--text-title);
		margin: 0;
	}

	.expert-friend__all-link {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.4rem 0.9rem;
		font-size: 0.85rem;
		font-weight: 600;
		border-radius: var(--radius-full, 9999px);
		border: var(--hairline-width) solid var(--border-main);
		background: var(--bg-surface);
		color: var(--text-main);
		text-decoration: none;
		transition:
			border-color var(--transition-base),
			transform var(--transition-base);
	}

	.expert-friend__all-link:hover {
		border-color: var(--accent-primary);
		transform: translateX(2px);
	}

	.expert-friend__shot {
		position: relative;
		display: block;
		width: 100%;
		max-width: 480px;
		padding: 0;
		border: var(--hairline-width) solid var(--border-main);
		border-radius: var(--radius-md, 12px);
		background: none;
		overflow: hidden;
		cursor: pointer;
		transition:
			border-color var(--transition-base),
			transform var(--transition-base);
	}

	.expert-friend__shot:hover {
		border-color: var(--accent-primary);
		transform: translateY(-2px);
	}

	.expert-friend__shot img {
		display: block;
		width: 100%;
		height: auto;
	}

	.expert-friend__badge {
		position: absolute;
		bottom: 0.75rem;
		right: 0.75rem;
		padding: 0.35rem 0.75rem;
		border-radius: var(--radius-full, 9999px);
		background: rgba(0, 0, 0, 0.75);
		backdrop-filter: blur(4px);
		color: #fff;
		font-size: 0.8rem;
		font-weight: 600;
		opacity: 0;
		transform: translateY(4px);
		transition:
			opacity var(--transition-base),
			transform var(--transition-base);
		pointer-events: none;
	}

	.expert-friend__shot:hover .expert-friend__badge,
	.expert-friend__shot:focus-visible .expert-friend__badge {
		opacity: 1;
		transform: translateY(0);
	}
</style>
