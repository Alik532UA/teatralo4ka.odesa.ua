<script lang="ts">
	import { resolve } from '$app/paths';
	import { asset } from '$app/paths';
	import { page } from '$app/state';
	import { locale, t } from 'svelte-i18n';
	import DOMPurify from 'isomorphic-dompurify';
	import { getArticleById } from '$lib/services/articles';
	import { seo } from '$lib/services/seo.svelte';
	import { getCategoryLabel } from '$lib/config/categories';
	import { DOMPURIFY_HTML_CONFIG } from '$lib/utils/markedConfig';
	import { parseVideoUrl } from '$lib/utils/videoEmbed';
	import ArticleView from '$lib/components/ArticleView.svelte';
	import DetailPage from '$lib/components/DetailPage.svelte';
	import PhotoBentoGallery, { type BentoImage } from '$lib/components/PhotoBentoGallery.svelte';
	import PhotoLightbox, { type LightboxImage } from '$lib/components/PhotoLightbox.svelte';
	import ProseGraduateLinks from '$lib/components/ProseGraduateLinks.svelte';

	let { data } = $props();

	/*
	 * Дві гілки на одному маршруті — і це не розгалуження заради зручності.
	 *
	 * Новина з коду вже прийшла в `data` із завантажувача, тобто на збірці, і
	 * малюється тут же, синхронно. Новина з бази не існує до запиту, тож її бере
	 * `DetailPage` зі своїм станом «завантажується / не знайдено / помилка».
	 *
	 * ШАБЛОН при цьому в них ОДИН — `ArticleView`. Доти новина з коду малювалася
	 * `StaticPage`, тобто виглядала як «Про школу»: без плашки категорії, без
	 * дати, з назвою всередині тексту. Автор сказав про це прямо: «шаблон як у
	 * новин з firebase». Спільним лишилося оформлення, різним — те, чим джерела
	 * справді різняться: запит і санітизація.
	 */
	const код = $derived(data.code);

	/** Сторінка новини мовою адреси: те саме правило, що в `StaticPage`. */
	const вміст = $derived($locale === 'en' ? (data.en ?? data.uk) : data.uk);
	const мова = $derived(($locale === 'en' ? 'en' : 'uk') as 'uk' | 'en');

	/* Шляхи з реєстру — від кореня `static/`, тож `asset()` тут обов'язковий:
	   без нього адреса ламається на прев'ю з базовим шляхом. */
	const знімки = $derived<BentoImage[]>(
		(data.photos ?? []).map((фото) => ({ ...фото, src: asset(фото.src as `/${string}`) }))
	);

	/**
	 * Обкладинка — ПЕРШИЙ знімок новини.
	 *
	 * Своє поле обкладинки тут не потрібне: у новини з коду знімки вже впорядковані
	 * автором, і перший із них уже й так стоїть обкладинкою картки в переліку
	 * (`codeNewsCards`). Друге джерело правди означало б, що картка й сторінка
	 * показують різні знімки тієї самої новини.
	 */
	const обкладинка = $derived(знімки[0]?.src ?? '');

	/**
	 * Запис із події — тим самим плеєром, що в новин із бази.
	 *
	 * `parseVideoUrl` тут не для краси: він і вирішує, чи кнопка взагалі буде.
	 * Нерозпізнане посилання не має обіцяти запис — те саме правило, що в
	 * `ContentCard` і `GraduateVideoButton`.
	 */
	const відео = $derived(parseVideoUrl(код?.videoUrl));
	let відеоВідкрито = $state(false);

	/**
	 * Дата — із frontmatter, а не з файлової системи.
	 *
	 * Та сама причина, що записана в `codeNewsCards`: `date` це заявлена дата
	 * ПОДІЇ, а час зміни файлу означав би «коли я цей текст правив».
	 */
	const дата = $derived(
		вміст
			? new Date(вміст.metadata.date).toLocaleDateString(мова === 'uk' ? 'uk-UA' : 'en-US', {
					day: 'numeric',
					month: 'long',
					year: 'numeric'
				})
			: ''
	);

	/**
	 * Галерея показується лише тоді, коли знімків БІЛЬШЕ ОДНОГО.
	 *
	 * Єдиний знімок уже стоїть обкладинкою, і мозаїка з однієї плитки повторила
	 * б його вдруге на тій самій сторінці.
	 */
	const галерея = $derived(знімки.length > 1);

	/* SEO новини з коду — звідти ж, звідки в решти сторінок репозиторію: із
	   frontmatter. Мета-опис малює layout із `seoDescription` завантажувача, а
	   цей виклик задає назву вкладки й `og:image`. */
	$effect(() => {
		if (вміст?.metadata?.seo) {
			seo.update({
				title: вміст.metadata.seo.title,
				description: вміст.metadata.seo.description,
				ogImage: вміст.metadata.seo.ogImage
			});
		}
	});

	let активні = $state<LightboxImage[]>([]);
	let активний = $state(0);
	let відкрито = $state(false);

	function відкрити(i: number) {
		активні = знімки.map((з) => ({ src: з.src, alt: з.alt, title: з.title }));
		активний = i;
		відкрито = true;
	}
</script>

{#if код && вміст}
	<ArticleView
		title={вміст.metadata.title}
		dateLabel={дата}
		categoryLabel={getCategoryLabel(вміст.metadata.category, мова)}
		coverUrl={обкладинка}
		coverPosition={код?.coverPosition}
		video={відео}
		bind:videoOpen={відеоВідкрито}
		backHref={resolve('/news')}
		backLabel={$t('news.backToNews')}
		testIdPrefix="article"
	>
		{#snippet prose()}
			<!-- Виняток за SECURITY-v8 § 5.3: markdown зі сторінок репозиторію,
			     пропущений через DOMPurify безпосередньо перед вставкою. -->
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html DOMPurify.sanitize(вміст.html, DOMPURIFY_HTML_CONFIG)}
		{/snippet}

		{#snippet below()}
			{#if галерея}
				<section
					class="news-gallery container"
					aria-labelledby="news-gallery-title"
					data-testid="article-gallery-section"
				>
					<h2 id="news-gallery-title" class="news-gallery__title">{$t('news.galleryTitle')}</h2>
					<PhotoBentoGallery items={знімки} testIdPrefix="article-gallery" onpick={відкрити} />
				</section>
			{/if}
		{/snippet}
	</ArticleView>

	<!--
		Імена в тексті ведуть на сторінки випускників, і натискання мусить
		відкривати картку ТУТ — так само, як обличчя в складі вистави чи групи.
		Інакше новина зникає, і після закриття картки читач опиняється в
		галактиці. Розбір — у докблоці `ProseGraduateLinks`.
	-->
	<ProseGraduateLinks />

	{#if галерея}
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
	/* Галерея йде ОКРЕМОЮ секцією під статтею, а не всередині `.prose`: у прозі
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
