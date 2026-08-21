<script lang="ts">
	import { t } from 'svelte-i18n';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { ArrowLeft } from 'lucide-svelte';
	import GraduateProfileView from '$lib/components/GraduateProfileView.svelte';
	import { localeFromPath, withLocale } from '$lib/i18n/routing';

	let { data } = $props();

	const galaxyHref = $derived(
		withLocale('/projects/galaxy-graduates', localeFromPath(page.url.pathname))
	);

	let isDesktop = $state(false);

	onMount(() => {
		const mql = window.matchMedia('(min-width: 769px)');
		isDesktop = mql.matches;
		if (isDesktop) document.body.classList.add('page-galaxy');

		const update = (e: MediaQueryListEvent) => {
			isDesktop = e.matches;
			if (isDesktop) document.body.classList.add('page-galaxy');
			else document.body.classList.remove('page-galaxy');
		};
		mql.addEventListener('change', update);

		return () => {
			document.body.classList.remove('page-galaxy');
			mql.removeEventListener('change', update);
		};
	});
</script>

<svelte:head>
	<title>{data.graduate.name} — {$t('galaxy.title')}</title>
</svelte:head>

<div class="profile-stage" data-testid="graduate-profile-section">
	{#if browser && isDesktop}
		<div class="profile-stage__stars" aria-hidden="true">
			{#await import('$lib/components/backgrounds/Starfield.svelte') then { default: Starfield }}
				<Starfield />
			{/await}
		</div>
	{/if}

	<div class="profile">
		<!-- Мовний префікс додається поверх `resolve()`, тож прямого виклику в
		     атрибуті немає — та сама форма, що в галактиці. -->
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
		<a class="profile__back" href={galaxyHref} data-testid="graduate-profile-back-link">
			<ArrowLeft size={18} aria-hidden="true" />
			{$t('galaxy.backToGalaxy')}
		</a>

		<article class="profile__card">
			<GraduateProfileView
				graduate={data.graduate}
				profile={data.profile}
				heading="h1"
				headingId="graduate-name"
			/>
		</article>
	</div>
</div>

<style>
	.profile-stage {
		width: 100%;
	}

	.profile-stage__stars {
		display: none;
	}

	.profile {
		width: min(720px, 100%);
		margin: 0 auto;
		padding: clamp(1rem, 3vh, 2rem) 0;
	}

	.profile__back {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		/* 44px — власний стандарт цілі дотику; гейт e2e/touch-targets це міряє. */
		min-height: 44px;
		margin-bottom: 0.75rem;
		color: var(--text-main);
		text-decoration: none;
	}

	.profile__back:hover {
		text-decoration: underline;
	}

	/* Темна картка: впізнаваність об'єкта галактики */
	.profile__card {
		padding: clamp(1rem, 3vh, 1.75rem);
		border-radius: 1.75rem;
		background: var(--galaxy-card-bg);
		color: var(--galaxy-text);
		box-shadow: 0 18px 48px rgb(0 0 0 / 0.28);
	}

	@media (min-width: 769px) {
		:global(body.page-galaxy) .profile-stage {
			position: fixed;
			inset: 0;
			display: grid;
			place-items: center;
			padding: 1.5rem;
			background: var(--galaxy-bg);
			overflow: hidden;
		}

		:global(body.page-galaxy) .profile-stage__stars {
			display: block;
			position: absolute;
			inset: 0;
			z-index: 0;
		}

		:global(body.page-galaxy) .profile {
			position: relative;
			z-index: 1;
			width: min(560px, calc(100vw - 2rem));
			max-height: min(90dvh, 820px);
			margin: 0;
			padding: 0;
			display: flex;
			flex-direction: column;
		}

		:global(body.page-galaxy) .profile__back {
			color: #cfe4ff;
			margin-bottom: 0.5rem;
			width: fit-content;
		}

		:global(body.page-galaxy) .profile__card {
			overflow-y: auto;
			box-shadow: 0 24px 60px rgb(0 0 0 / 0.5);
		}
	}
</style>
