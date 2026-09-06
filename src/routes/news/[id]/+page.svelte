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
	import type { ArticleMediaItem } from '$lib/utils/articleMedia';
	import ArticleView from '$lib/components/ArticleView.svelte';
	import DetailPage from '$lib/components/DetailPage.svelte';
	import ProseGraduateLinks from '$lib/components/ProseGraduateLinks.svelte';
	import { browser } from '$app/environment';
	import { getCachedNewsOverrides } from '$lib/services/newsOverrides';
	import { replacementFor } from '$lib/utils/newsOverrides';

	let { data } = $props();

	/**
	 * Чи цю новину з коду ЗАМІНИЛИ свіжою версією з адмінки.
	 *
	 * ## Чому лише збережене в браузері, без запиту до бази
	 *
	 * Уся ця робота робиться заради одного: «більшість новин в коді, щоб швидше
	 * вантажився сайт і менше запитів до firebase». Сторінка новини з коду
	 * сьогодні не робить ЖОДНОГО запиту — вміст прийшов зі збірки. Додати сюди
	 * читання документа перевизначень означало б завести перший запит на кожен
	 * перегляд кожної новини в коді заради дії, яка трапляється зрідка. Тобто
	 * зламати рівно те, по що прийшли.
	 *
	 * Тому тут читається лише кеш, який наповнює перелік новин: хто відкрив
	 * новину з головної або зі `/news`, той уже має свіжі перевизначення й
	 * побачить нову версію. Хто прийшов прямим посиланням із месенджера —
	 * побачить старий текст, аж поки не буде наступної збірки.
	 *
	 * Це та сама межа, що описана в `utils/newsOverrides`: механізм перевизначень
	 * не переписує вже зібраний HTML. Автор про неї знає, і адмінка каже це
	 * словами, а не мовчить.
	 */
	const заміна = $derived(
		browser ? replacementFor(getCachedNewsOverrides(), page.params.id ?? '') : undefined
	);

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

	/**
	 * Медіа новини: знімки й записи одним переліком, у порядку з реєстру.
	 *
	 * `asset()` — лише знімкам: їхні шляхи від кореня `static/`, і без нього
	 * адреса ламається на прев'ю з базовим шляхом. Посилання на запис зовнішнє,
	 * і трогати його не можна.
	 */
	const медіа = $derived<ArticleMediaItem[]>(
		(data.media ?? []).map((елемент) =>
			елемент.kind === 'photo'
				? { ...елемент, url: asset(елемент.url as `/${string}`) }
				: { ...елемент }
		)
	);

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
</script>

{#if код && вміст && !заміна}
	<ArticleView
		title={вміст.metadata.title}
		dateLabel={дата}
		categoryLabel={getCategoryLabel(вміст.metadata.category, мова)}
		media={медіа}
		shape={код.mediaShape}
		layout={код.mediaLayout}
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
	</ArticleView>

	<!--
		Імена в тексті ведуть на сторінки випускників, і натискання мусить
		відкривати картку ТУТ — так само, як обличчя в складі вистави чи групи.
		Інакше новина зникає, і після закриття картки читач опиняється в
		галактиці. Розбір — у докблоці `ProseGraduateLinks`.
	-->
	<ProseGraduateLinks />
{:else}
	<!--
		`param` — або адреса з бази, або `id` статті, яка ЗАМІНИЛА новину з коду.
		Друга гілка через це не дублюється: запит, стани «завантажується / не
		знайдено» і шаблон у заміни рівно ті самі, що в звичайної новини з бази.
	-->
	{#key заміна ?? page.params.id}
		<DetailPage
			param={заміна ?? page.params.id}
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
