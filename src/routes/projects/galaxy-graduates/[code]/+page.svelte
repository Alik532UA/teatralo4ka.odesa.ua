<script lang="ts">
	import { t } from 'svelte-i18n';
	import { page } from '$app/state';
	import { ArrowLeft } from 'lucide-svelte';
	import GraduateProfileView from '$lib/components/GraduateProfileView.svelte';
	import { localeFromPath, withLocale } from '$lib/i18n/routing';

	let { data } = $props();

	const galaxyHref = $derived(
		withLocale('/projects/galaxy-graduates', localeFromPath(page.url.pathname))
	);

</script>

<svelte:head>
	<title>{data.graduate.name} — {$t('galaxy.title')}</title>
</svelte:head>

<!--
	Сторінка звичайна, із шапкою й підвалом, а не на весь екран.

	Галактика — це спосіб РОЗГЛЯДАТИ; сюди ж приходять за конкретною людиною: з
	пошуку, з посилання в месенджері, з давньої закладки на старий сайт. Тут
	потрібні хлібні крихти, а не зорі.
-->
<div class="profile" data-testid="graduate-profile-section">
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

<style>
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

	/* Темна картка на світлій сторінці: це той самий об'єкт, що й у галактиці, і
	   впізнаваність тут важливіша за одноманітність зі рештою сторінок. */
	.profile__card {
		padding: clamp(1rem, 3vh, 1.75rem);
		border-radius: 1.75rem;
		background: var(--galaxy-card-bg);
		color: var(--galaxy-text);
		box-shadow: 0 18px 48px rgb(0 0 0 / 0.28);
	}
</style>
