<script lang="ts">
	import { t } from 'svelte-i18n';
	import { onMount } from 'svelte';
	import { List } from 'lucide-svelte';
	import GraduateGalaxy from '$lib/components/GraduateGalaxy.svelte';
	import GraduateCard from '$lib/components/GraduateCard.svelte';
	import GraduateRoster from '$lib/components/GraduateRoster.svelte';
	import type { GraduateIndexEntry } from '$lib/data/graduates';

	let { data } = $props();

	let selected = $state<GraduateIndexEntry | null>(null);
	let rosterOpen = $state(false);

	/**
	 * Клас на `<body>`, а не правки в layout.
	 *
	 * Галактика займає весь екран, тож шапка й підвал тут зайві — але прибирати їх
	 * із `+layout.svelte` умовою означало б зачепити всі 40 сторінок заради однієї.
	 * Клас на `body` робить те саме локально, а `display: none` прибирає елементи й
	 * із дерева доступності, не лише з очей.
	 *
	 * Знімається при виході зі сторінки: без цього шапка зникла б і на наступній.
	 */
	onMount(() => {
		document.body.classList.add('page-galaxy');
		return () => document.body.classList.remove('page-galaxy');
	});
</script>

<svelte:head>
	<title>{$t('galaxy.title')} — {$t('seo.brandTitle')}</title>
	<meta name="description" content={$t('galaxy.description')} />
</svelte:head>

<!--
	Заголовок і опис лишаються в розмітці, але не на екрані.

	Прибрати їх зовсім означало б віддати сторінку пошуку без жодного тексту: у
	галактиці немає нічого, крім імен, а `<h1>` потрібен і читалці, і індексу.
	`.sr-only` — той самий клас, що вже вживається в проєкті.

	Число в описі виправлене: 482, а не 80. Вісімдесят — це ті, хто заповнив
	анкету, і називати їх «усіма випускниками» було просто неправдою.
-->
<h1 class="sr-only" data-testid="galaxy-page-title">{$t('galaxy.title')}</h1>
<p class="sr-only" data-testid="galaxy-page-text">{$t('galaxy.description')}</p>

<div class="stage">
	<GraduateGalaxy onselect={(graduate) => (selected = graduate)} />

	<button
		type="button"
		class="stage__roster-btn"
		onclick={() => (rosterOpen = true)}
		data-testid="galaxy-open-roster-btn"
	>
		<List size={18} aria-hidden="true" />
		<span>{$t('galaxy.all')}</span>
		<span class="stage__total" data-testid="galaxy-roster-total-count">{data.graduates.length}</span>
	</button>
</div>

<GraduateRoster
	graduates={data.graduates}
	open={rosterOpen}
	onclose={() => (rosterOpen = false)}
	onselect={(graduate) => {
		selected = graduate;
		rosterOpen = false;
	}}
/>

<GraduateCard graduate={selected} onclose={() => (selected = null)} />

<style>
	.stage {
		position: fixed;
		/* Рівно весь екран. Логотип лежить ПОВЕРХ галактики прозорою шапкою, тому
		   відступати під нього не треба — і зірки літають до самого верху. */
		inset: 0;
		background: var(--galaxy-bg);
	}

	.stage__roster-btn {
		position: absolute;
		z-index: 3;
		right: clamp(0.75rem, 2vw, 1.5rem);
		bottom: clamp(0.75rem, 2vh, 1.5rem);
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		/* 44px — власний стандарт цілі дотику; гейт e2e/touch-targets це міряє. */
		min-height: 44px;
		padding: 0 1rem;
		border: 1px solid rgb(255 255 255 / 0.22);
		border-radius: 999px;
		background: rgb(5 10 31 / 0.72);
		color: var(--galaxy-text);
		font: inherit;
		font-size: 0.9rem;
		cursor: pointer;
		backdrop-filter: blur(4px);
	}

	.stage__roster-btn:hover {
		background: rgb(12 22 56 / 0.85);
		border-color: rgb(140 190 255 / 0.6);
	}

	.stage__total {
		opacity: 0.65;
		font-variant-numeric: tabular-nums;
	}
</style>
