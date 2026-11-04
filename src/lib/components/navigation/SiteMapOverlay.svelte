<script lang="ts">
	import { locale, t } from 'svelte-i18n';
	import { X, Compass, Search } from 'lucide-svelte';
	import { asset } from '$app/paths';
	import { withLocale, type Locale } from '$lib/i18n/routing';
	import { focusTrap } from '$lib/utils/focusTrap';
	import { SITE_MAP_COLUMNS } from '$lib/config/siteMapStructure';
	import { captureKeyboard, isTypingTarget } from '$lib/services/keyboard';
	import SiteMapNewsCarousel from './SiteMapNewsCarousel.svelte';
	import SiteMapTeachersBar from './SiteMapTeachersBar.svelte';
	import SiteMapGraduatesBar from './SiteMapGraduatesBar.svelte';
	import SiteMapIcon from './SiteMapIcon.svelte';

	interface Props {
		open: boolean;
		onclose: () => void;
	}

	let { open = $bindable(), onclose }: Props = $props();

	const lang = $derived((($locale as string) === 'en' ? 'en' : 'uk') as Locale);
	const isEn = $derived(lang === 'en');

	let filterQuery = $state('');
	let closeBtn = $state<HTMLButtonElement | null>(null);

	$effect(() => (open ? captureKeyboard() : undefined));

	function close() {
		open = false;
		filterQuery = '';
		onclose();
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' || (e.code === 'KeyE' && !isTypingTarget(e.target))) {
			e.preventDefault();
			close();
		}
	}

	function matchesFilter(text: string): boolean {
		return !filterQuery.trim() || text.toLowerCase().includes(filterQuery.trim().toLowerCase());
	}

	const socials = [
		{ k: 'facebook', label: 'Facebook', icon: '/social_media/social_media_facebook_se512.svg' },
		{ k: 'instagram', label: 'Instagram', icon: '/social_media/social_media_instagram_se512.svg' },
		{ k: 'telegram', label: 'Telegram', icon: '/social_media/social_media_telegram_se512.svg' },
		{ k: 'youtube', label: 'YouTube', icon: '/social_media/social_media_youtube_se512.svg' },
		{ k: 'tiktok', label: 'TikTok', icon: '/social_media/social_media_tiktok_se512.svg' }
	] as const;
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
	<div
		class="sitemap-modal"
		role="dialog"
		aria-modal="true"
		aria-label={$t('nav.siteMap')}
		data-testid="sitemap-modal"
		{@attach focusTrap({ initial: () => closeBtn })}
	>
		<header class="sitemap-header">
			<div class="sitemap-header__inner">
				<div class="sitemap-header__title-box">
					<Compass size={22} class="sitemap-header__icon" aria-hidden="true" />
					<h2 class="sitemap-header__title">{$t('nav.siteMap')}</h2>
				</div>

				<div class="sitemap-search">
					<Search size={16} class="sitemap-search__icon" aria-hidden="true" />
					<input
						type="search"
						class="sitemap-search__input"
						bind:value={filterQuery}
						placeholder={$t('search.placeholder')}
						aria-label={$t('search.placeholder')}
						data-testid="sitemap-search-input"
					/>
					{#if filterQuery}
						<button type="button" class="sitemap-search__clear" onclick={() => (filterQuery = '')} aria-label="Очистити" data-testid="sitemap-search-clear-btn"><X size={14} /></button>
					{/if}
				</div>

				<div class="sitemap-close-wrap">
					<span class="sitemap-close-hint"><kbd class="sitemap-close-kbd">Esc</kbd> / <kbd class="sitemap-close-kbd">E</kbd></span>
					<button type="button" bind:this={closeBtn} class="sitemap-close-btn" onclick={close} aria-label={$t('nav.closeSiteMap')} data-testid="sitemap-close-btn"><X size={20} /></button>
				</div>
			</div>
		</header>

		<div class="sitemap-body">
			<div class="sitemap-columns" data-testid="sitemap-columns-list">
				{#each SITE_MAP_COLUMNS as column (column.id)}
					<section class="sitemap-col" data-testid={`sitemap-column-${column.id}-section`}>
						<h3 class="sitemap-col__title">{isEn ? column.titleEn : column.titleUk}</h3>
						<div class="sitemap-col__groups">
							{#each column.groups as group (group.id)}
								{@const matchingItems = group.items.filter((it) => matchesFilter(isEn ? it.labelEn : it.labelUk))}
								{#if matchingItems.length > 0}
									<div class="sitemap-grp">
										{#if isEn ? group.titleEn : group.titleUk}
											<h4 class="sitemap-grp__title">{isEn ? group.titleEn : group.titleUk}</h4>
										{/if}
										<ul class="sitemap-grp__list" class:sitemap-grp__list--compact={group.id === 'stage-speech'}>
											{#each matchingItems as item (item.id)}
												<li class="sitemap-grp__item" class:sitemap-grp__item--sub={item.isSubItem}>
													<a
														href={withLocale(item.href(), lang)}
														class="sitemap-link"
														onclick={close}
														data-testid={`sitemap-link-${item.id}`}
													>
														<SiteMapIcon name={item.icon} size={15} class="sitemap-link__icon" />
														<span class="sitemap-link__label">{isEn ? item.labelEn : item.labelUk}</span>
													</a>
												</li>
											{/each}
										</ul>
									</div>
								{/if}
							{/each}
						</div>
					</section>
				{/each}
			</div>
		</div>

		<SiteMapTeachersBar {lang} onselect={close} />
		<SiteMapGraduatesBar {lang} onselect={close} />

		<footer class="sitemap-footer" data-testid="sitemap-footer">
			<SiteMapNewsCarousel {lang} onselect={close} />
			<div class="sitemap-footer__inner">
				<div class="sitemap-footer__contacts" data-testid="sitemap-contacts-section">
					<div class="sitemap-footer__info">
						<span class="sitemap-footer__text">{$t('footer.address')}</span>
						<span class="sitemap-footer__sep">•</span>
						<a href="tel:+380487236101" class="sitemap-footer__text sitemap-footer__link" data-testid="sitemap-phone-link">{$t('footer.phone')}</a>
						<span class="sitemap-footer__sep">•</span>
						<a href={`mailto:${$t('footer.email')}`} class="sitemap-footer__text sitemap-footer__link" data-testid="sitemap-email-link">{$t('footer.email')}</a>
					</div>
					<div class="sitemap-footer__socials" data-testid="sitemap-socials-list">
						{#each socials as s (s.k)}
							{@const href = $t(`footer.${s.k}`)}
							{#if href}
								<a {href} class="sitemap-social-btn" target="_blank" rel="noopener noreferrer" aria-label={s.label} data-testid={`sitemap-${s.k}-link`}>
									<img src={asset(s.icon)} alt="" width="18" height="18" />
								</a>
							{/if}
						{/each}
					</div>
				</div>
			</div>
		</footer>
	</div>
{/if}

<style>
	@media (max-width: 1023px) { .sitemap-modal { display: none !important; } }
	.sitemap-modal {
		position: fixed; inset: 0; width: 100vw; height: 100dvh;
		background: rgba(10, 14, 23, 0.95); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
		color: var(--text-main, #f9fafb); z-index: 9999; display: flex; flex-direction: column; overflow: hidden;
	}
	.sitemap-header {
		padding: 0.6rem clamp(1rem, 2.5vw, 3rem); border-bottom: 1px solid var(--border-main);
		background: rgba(255, 255, 255, 0.02); flex-shrink: 0;
	}
	.sitemap-header__inner { width: 100%; display: flex; align-items: center; justify-content: space-between; }
	.sitemap-header__title-box { display: flex; align-items: center; gap: 0.65rem; }
	:global(.sitemap-header__icon) { color: var(--accent-text, #38bdf8); }
	.sitemap-header__title { margin: 0; font-size: 1.25rem; font-weight: 700; letter-spacing: -0.02em; }
	.sitemap-search {
		display: flex; align-items: center; gap: 0.5rem; width: clamp(260px, 24vw, 420px); padding: 0.35rem 0.75rem;
		border-radius: 999px; background: rgba(255, 255, 255, 0.06); border: 1px solid var(--border-main);
	}
	.sitemap-search:focus-within { border-color: var(--accent-text, #38bdf8); }
	:global(.sitemap-search__icon) { color: var(--text-muted, #9ca3af); }
	.sitemap-search__input { flex: 1; background: none; border: none; color: #fff; font-size: 0.82rem; outline: none; font-family: inherit; }
	.sitemap-search__clear { background: none; border: none; color: var(--text-muted, #9ca3af); cursor: pointer; padding: 0; display: inline-flex; }
	.sitemap-close-wrap { display: flex; align-items: center; gap: 0.6rem; }
	.sitemap-close-hint { font-size: 0.72rem; color: var(--text-muted, #9ca3af); user-select: none; }
	.sitemap-close-kbd { font-size: 0.68rem; padding: 1px 5px; border-radius: 4px; border: 1px solid var(--border-main); background: rgba(255, 255, 255, 0.06); color: var(--text-main, #f3f4f6); font-family: inherit; }
	.sitemap-close-btn {
		display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%;
		border: 1px solid var(--border-main); background: rgba(255, 255, 255, 0.05); color: var(--text-main, #f3f4f6); cursor: pointer;
	}
	.sitemap-close-btn:hover { background: rgba(255, 255, 255, 0.15); color: #fff; }
	.sitemap-body {
		flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; justify-content: space-evenly;
		padding: clamp(0.4rem, 1.2vh, 1.2rem) clamp(1rem, 2.5vw, 3rem);
	}
	.sitemap-columns {
		width: 100%; display: grid; grid-template-columns: repeat(4, 1fr); gap: clamp(1rem, 1.8vw, 2.8rem);
	}
	.sitemap-col { display: flex; flex-direction: column; justify-content: flex-start; }
	.sitemap-col__title {
		margin: 0 0 clamp(0.35rem, 0.8vh, 0.75rem) 0; font-size: clamp(0.95rem, 0.68rem + 0.4vw, 1.25rem); font-weight: 700;
		color: var(--accent-text, #38bdf8); padding-bottom: 0.35rem; border-bottom: 2px solid rgba(56, 189, 248, 0.25);
	}
	.sitemap-col__groups { display: flex; flex-direction: column; gap: clamp(0.45rem, 1vh, 1.1rem); }
	.sitemap-grp { display: flex; flex-direction: column; }
	.sitemap-grp__title {
		margin: 0 0 clamp(0.2rem, 0.5vh, 0.4rem) 0; font-size: clamp(0.7rem, 0.55rem + 0.2vw, 0.82rem); font-weight: 600;
		color: var(--text-muted, #9ca3af); text-transform: uppercase; letter-spacing: 0.05em;
	}
	.sitemap-grp__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: clamp(0.22rem, 0.5vh, 0.42rem); }
	.sitemap-grp__list--compact { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(0.22rem, 0.5vh, 0.42rem) clamp(0.3rem, 0.5vw, 0.6rem); }
	.sitemap-grp__item--sub { padding-left: 0.25rem; }
	.sitemap-link {
		color: var(--text-main, #e5e7eb); text-decoration: none;
		font-size: clamp(0.78rem, 0.58rem + 0.38vw, 1.02rem); line-height: 1.25;
		padding: clamp(0.28rem, 0.16rem + 0.35vh, 0.55rem) clamp(0.45rem, 0.28rem + 0.35vw, 0.85rem);
		border-radius: 8px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.09);
		display: flex; align-items: center; gap: clamp(0.35rem, 0.25rem + 0.25vw, 0.6rem);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2); transition: all 0.15s ease;
	}
	.sitemap-link:hover {
		color: #fff; background: rgba(56, 189, 248, 0.16); border-color: var(--accent-text, #38bdf8);
		transform: translateY(-1px); box-shadow: 0 4px 12px rgba(56, 189, 248, 0.2);
	}
	:global(.sitemap-link__icon) { flex-shrink: 0; color: var(--accent-text, #38bdf8); opacity: 0.85; transition: transform 0.15s ease; }
	.sitemap-link:hover :global(.sitemap-link__icon) { opacity: 1; transform: scale(1.15); }
	.sitemap-link__label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }
	.sitemap-footer { padding: 0.35rem 0 0.45rem; border-top: 1px solid var(--border-main); background: rgba(0, 0, 0, 0.4); flex-shrink: 0; width: 100%; display: flex; flex-direction: column; gap: 0.35rem; }
	.sitemap-footer__inner { width: 100%; padding: 0 clamp(1rem, 2.5vw, 3rem); display: flex; align-items: center; justify-content: space-between; }
	.sitemap-footer__contacts { display: flex; align-items: center; justify-content: space-between; gap: 1rem; width: 100%; }
	.sitemap-footer__info { display: flex; align-items: center; gap: 0.5rem; font-size: 0.72rem; color: var(--text-muted, #9ca3af); }
	.sitemap-footer__sep { opacity: 0.4; }
	.sitemap-footer__link { color: var(--text-main, #e5e7eb); text-decoration: none; }
	.sitemap-footer__link:hover { color: var(--accent-text, #38bdf8); }
	.sitemap-footer__socials { display: flex; align-items: center; gap: 0.45rem; }
	.sitemap-social-btn {
		display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px;
		border-radius: 50%; border: 1px solid var(--border-main); background: rgba(255, 255, 255, 0.05);
	}
	.sitemap-social-btn:hover { background: rgba(255, 255, 255, 0.15); border-color: rgba(56, 189, 248, 0.4); }
</style>
