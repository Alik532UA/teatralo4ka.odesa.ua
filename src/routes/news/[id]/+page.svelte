<script lang="ts">
	import { resolve } from '$app/paths';
	import { asset } from '$app/paths';
	import { page } from '$app/state';
	import { t } from 'svelte-i18n';
	import { getArticleById } from '$lib/services/articles';
	import DetailPage from '$lib/components/DetailPage.svelte';
	import StaticPage from '$lib/components/StaticPage.svelte';
	import PhotoBentoGallery, { type BentoImage } from '$lib/components/PhotoBentoGallery.svelte';
	import PhotoLightbox, { type LightboxImage } from '$lib/components/PhotoLightbox.svelte';
	import ProseGraduateLinks from '$lib/components/ProseGraduateLinks.svelte';

	let { data } = $props();

	/*
	 * Дві гілки на одному маршруті — і це не розгалуження заради зручності.
	 *
	 * Новина з коду вже прийшла в `data` із завантажувача, тобто на збірці, і
	 * малюється тим самим `StaticPage`, що всі сторінки репозиторію. Новина з
	 * бази не існує до запиту, тож її бере `DetailPage` зі своїм станом
	 * «завантажується / не знайдено / помилка». Спроба звести їх до одного
	 * компонента означала б або запит там, де вміст уже є, або порожній HTML там,
	 * де його можна було скласти наперед.
	 */
	const код = $derived(data.code);

	/* Шляхи з реєстру — від кореня `static/`, тож `asset()` тут обов'язковий:
	   без нього адреса ламається на прев'ю з базовим шляхом. */
	const знімки = $derived<BentoImage[]>(
		(data.photos ?? []).map((фото) => ({ ...фото, src: asset(фото.src as `/${string}`) }))
	);

	let активні = $state<LightboxImage[]>([]);
	let активний = $state(0);
	let відкрито = $state(false);

	function відкрити(i: number) {
		активні = знімки.map((з) => ({ src: з.src, alt: з.alt, title: з.title }));
		активний = i;
		відкрито = true;
	}
</script>

{#if код}
	<StaticPage
		data={{ uk: data.uk, en: data.en }}
		testPrefix="article"
		backHref={resolve('/news')}
		backLabel={$t('news.backToNews')}
	/>

	<!--
		Імена в тексті ведуть на сторінки випускників, і натискання мусить
		відкривати картку ТУТ — так само, як обличчя в складі вистави чи групи.
		Інакше новина зникає, і після закриття картки читач опиняється в
		галактиці. Розбір — у докблоці `ProseGraduateLinks`.
	-->
	<ProseGraduateLinks />

	{#if знімки.length > 0}
		<section
			class="news-gallery container"
			aria-labelledby="news-gallery-title"
			data-testid="article-gallery-section"
		>
			<h2 id="news-gallery-title" class="news-gallery__title">{$t('news.galleryTitle')}</h2>
			<PhotoBentoGallery items={знімки} testIdPrefix="article-gallery" onpick={відкрити} />
		</section>

		<PhotoLightbox
			images={активні}
			currentIndex={активний}
			isOpen={відкрито}
			onclose={() => (відкрито = false)}
		/>
	{/if}
{:else}
	{#key page.params.id}
		<DetailPage
			param={page.params.id}
			fetchFn={getArticleById}
			backHref={resolve('/news')}
			backLabelKey="news.backToNews"
			loadingKey="news.loadingArticle"
			notFoundKey="news.notFound"
			errorKey="news.errorLoading"
			testIdPrefix="article"
		/>
	{/key}
{/if}

<style>
	/* Галерея йде ОКРЕМОЮ секцією під текстом, а не всередині `.prose`: у прозі
	   знімок — це ілюстрація в рядок тексту, а тут мозаїка на всю ширину. */
	.news-gallery {
		padding: 0 24px var(--page-pad-bottom);
	}
	.news-gallery__title {
		margin: 0 0 1.25rem;
		font-size: clamp(1.3rem, 2.6vw, 1.75rem);
		font-weight: 800;
		color: var(--text-title);
	}
</style>
