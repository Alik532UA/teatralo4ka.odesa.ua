<script lang="ts">
	import { t } from 'svelte-i18n';
	import { Play, Image as ImageIcon, ExternalLink } from 'lucide-svelte';
	import PhotoLightbox, { type LightboxImage } from '$lib/components/PhotoLightbox.svelte';
	import VideoModal from '$lib/components/VideoModal.svelte';
	import { parseVideoUrl, type VideoInfo } from '$lib/utils/videoEmbed';
	import { activateOnKey } from '$lib/utils/activateOnKey';
	import { measureWidth } from '$lib/utils/measureHeight';
	import {
		DEFAULT_MEDIA_SHAPE,
		fitCount,
		isSwapPair,
		shapeFactor,
		shapeRatio,
		type ArticleMediaItem,
		type MediaLayout,
		type MediaShape
	} from '$lib/utils/articleMedia';

	/**
	 * Медіа статті: стовпець плиток збоку від тексту, решта — під ним.
	 *
	 * ## Що просив автор
	 *
	 * «Там, де обкладинка, — в стовбець вся галерея квадратними зображеннями з
	 * можливістю відкрити на повний екран, галерея в один стовбець на висоту
	 * тексту, а коли текст закінчується, то решта фото вже як зараз на всю
	 * ширину вікна». Плюс: відео — такою самою плиткою з кадром і значком
	 * відтворення, а «коли одна фотографія і одне відео, то як зараз вони
	 * міняються в середині одного контейнера».
	 *
	 * Тобто три різні стани, і кожен названий:
	 *
	 * 1. ПАРА «фото + відео» — один контейнер, кнопка перемикає. Стара поведінка,
	 *    яку автор попросив зберегти.
	 * 2. СТОВПЕЦЬ — плитки збоку від тексту, скільки влізе по його висоті; що не
	 *    влізло, іде під статтею на всю ширину.
	 * 3. ПОСЛІДОВНІСТЬ — «медіа не об'єднані під одним блоком, а йдуть один за
	 *    одним»: стовпця немає, усе під текстом по порядку.
	 *
	 * ## Чому компонент малює ДВА кореневі вузли
	 *
	 * Стовпець стоїть у лівій колонці сітки статті, а решта — під нею на всю
	 * ширину. Це два різні місця однієї сітки, тому компонент віддає два вузли, а
	 * `ArticleView` ставить їх у свої області (`grid-area`). Альтернатива —
	 * тримати медіа двома компонентами — розірвала б спільний стан: лайтбокс,
	 * плеєр і поділ «стовпець / решта» мусять бути одні.
	 *
	 * ## Чому скільки влізе рахується, а не задано числом
	 *
	 * Висота тексту різна в українській та англійській, різна на телефоні й
	 * міняється від масштабу. Тому `ArticleView` міряє свою колонку тексту
	 * (`bind:clientHeight`), а тут рахується `fitCount` — чиста функція з
	 * власним тестом.
	 */

	interface Props {
		/** Медіа в порядку показу. Адреси вже готові — `asset()` зробила сторінка. */
		media: readonly ArticleMediaItem[];
		/** Пропорція плиток. Немає — вертикальна, як було до переліку медіа. */
		shape?: MediaShape;
		/** Стовпець (типово) або все одне за одним. */
		layout?: MediaLayout;
		/** Заміряна висота колонки тексту — від неї залежить, скільком плиткам стати збоку. */
		textHeight?: number;
		/** Назва статті: іде в `alt`, у заголовок плеєра й у підпис плитки. */
		title: string;
		/** Плеєр пари відкритий. Двостороннє: приходять і з `?video=1`. */
		videoOpen?: boolean;
		testIdPrefix: string;
	}

	let {
		media,
		shape = DEFAULT_MEDIA_SHAPE,
		layout = 'column',
		textHeight = 0,
		title,
		videoOpen = $bindable(false),
		testIdPrefix
	}: Props = $props();

	/** Проміжок між плитками — те саме число, що в сітці нижче. */
	const ПРОМІЖОК = 12;

	const пропорція = $derived(shapeRatio(shape));
	const пара = $derived(layout === 'column' && isSwapPair(media));

	/**
	 * Заміряна ширина стовпця: висоту плитки дає пропорція, а не ще один замір.
	 *
	 * Мірка своя, а не `bind:clientWidth`: прив'язка Svelte тут оновлювалася лише
	 * раз і застигала — розбір і замір у `utils/measureHeight`.
	 */
	let ширина = $state(0);
	const мірка = measureWidth((v) => (ширина = v));

	const плиток = $derived(
		layout === 'sequence' || пара
			? 0
			: fitCount(textHeight, ширина * shapeFactor(shape), ПРОМІЖОК)
	);

	const уСтовпці = $derived(layout === 'sequence' ? [] : пара ? media : media.slice(0, плиток));
	const решта = $derived(layout === 'sequence' ? [...media] : пара ? [] : media.slice(плиток));

	/** Знімки — усі й у порядку показу: лайтбокс гортає галерею, а не один кадр. */
	const знімки = $derived(media.filter((m) => m.kind === 'photo'));
	const кадри = $derived<LightboxImage[]>(
		знімки.map((m) => ({ src: m.url, alt: m.alt ?? title, title: m.alt ?? title }))
	);

	let кадр = $state(0);
	let лайтбокс = $state(false);
	let плеєр = $state<VideoInfo | null>(null);

	/** Відео пари — розібране заздалегідь: від нього залежить сама наявність кнопки. */
	const відеоПари = $derived(пара ? parseVideoUrl(media.find((m) => m.kind === 'video')?.url) : null);
	const фотоПари = $derived(пара ? media.find((m) => m.kind === 'photo') : undefined);

	function вибрати(item: ArticleMediaItem) {
		if (item.kind === 'video') {
			плеєр = parseVideoUrl(item.url);
			return;
		}
		кадр = Math.max(0, знімки.indexOf(item));
		лайтбокс = true;
	}
</script>

{#snippet плитка(item: ArticleMediaItem, ключ: string)}
	{@const відео = item.kind === 'video' ? parseVideoUrl(item.url) : null}
	<div
		class="media-tile"
		style="aspect-ratio: {пропорція}"
		role="button"
		tabindex="0"
		aria-label={item.kind === 'video' ? $t('common.watchVideo') : (item.alt ?? title)}
		onclick={() => вибрати(item)}
		onkeydown={activateOnKey(() => вибрати(item))}
		data-testid="{testIdPrefix}-media-{item.kind}-btn-{ключ}"
	>
		{#if item.kind === 'photo'}
			<!-- Місце під знімок відводить `aspect-ratio` плитки — розбір у
			     `src/image-dimensions.test.ts`, RESERVED_BY_CSS. -->
			<img
				src={item.url}
				alt={item.alt ?? title}
				style={item.position ? `object-position: ${item.position}` : ''}
				loading="lazy"
				decoding="async"
			/>
		{:else}
			{#if відео?.posterUrl}
				<img src={відео.posterUrl} alt={item.alt ?? title} loading="lazy" decoding="async" />
			{/if}
			<span class="media-tile__play" aria-hidden="true"><Play size={20} /></span>
		{/if}
	</div>
{/snippet}

{#if уСтовпці.length > 0}
	<aside
		class="article-media"
		{@attach мірка}
		data-testid="{testIdPrefix}-cover-container"
	>
		{#if пара}
			<!--
				ПАРА «фото + відео» — один контейнер, кнопка перемикає. Автор просив
				зберегти саме це: «як зараз вони міняються в середині одного
				контейнера по запиту користувача».
			-->
			<div class="media-frame" style="aspect-ratio: {пропорція}">
				{#if videoOpen && відеоПари?.embeddable}
					<iframe
						src="{відеоПари.embedUrl}?autoplay=1"
						{title}
						class="media-frame__player"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowfullscreen
						referrerpolicy="strict-origin-when-cross-origin"
						data-testid="{testIdPrefix}-cover-video-container"
					></iframe>
				{:else if фотоПари}
					<!--
						Кнопка, а не `<img role="button">`: знімок сам по собі не
						інтерактивний, і роль на ньому — це обіцянка клавіатурі, якої
						тег не виконує (`svelte-check` називає це прямо). Кнопка
						натискається і мишею, і Enter, і пробілом без жодного коду.
					-->
					<button
						type="button"
						class="media-frame__btn"
						onclick={() => фотоПари && вибрати(фотоПари)}
						aria-label={фотоПари.alt ?? title}
						data-testid="{testIdPrefix}-cover-btn"
					>
						<!-- Місце відводить `aspect-ratio` контейнера (RESERVED_BY_CSS). -->
						<img
							src={фотоПари.url}
							alt={фотоПари.alt ?? title}
							class="media-frame__img"
							style={фотоПари.position ? `object-position: ${фотоПари.position}` : ''}
							loading="eager"
							fetchpriority="high"
							decoding="async"
							data-testid="{testIdPrefix}-cover-img"
						/>
					</button>
				{/if}
			</div>

			{#if відеоПари?.embeddable}
				<button
					type="button"
					class="btn btn-outline article-media__btn"
					onclick={() => (videoOpen = !videoOpen)}
					data-testid="{testIdPrefix}-cover-video-btn"
				>
					{#if videoOpen}
						<ImageIcon size={16} aria-hidden="true" />
						{$t('common.showCover')}
					{:else}
						<Play size={16} aria-hidden="true" />
						{$t('common.watchVideo')}
					{/if}
				</button>
			{:else if відеоПари}
				<!-- Instagram/Facebook вбудувати не можемо, тож честніше відкрити там,
				     де воно справді працює. -->
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a href={відеоПари.url}
					target="_blank"
					rel="noopener noreferrer"
					class="btn btn-outline article-media__btn"
					data-testid="{testIdPrefix}-cover-video-link"
				>
					<ExternalLink size={16} aria-hidden="true" />
					{$t('common.watchVideo')}
				</a>
			{/if}
		{:else}
			{#each уСтовпці as item, i (item.url)}
				{@render плитка(item, `col-${i}`)}
			{/each}
		{/if}
	</aside>
{/if}

{#if решта.length > 0}
	<section
		class="article-media-rest"
		class:article-media-rest--sequence={layout === 'sequence'}
		aria-label={$t('news.galleryTitle')}
		data-testid="{testIdPrefix}-media-rest-section"
	>
		{#each решта as item, i (item.url)}
			{@render плитка(item, `rest-${i}`)}
		{/each}
	</section>
{/if}

<PhotoLightbox
	images={кадри}
	currentIndex={кадр}
	isOpen={лайтбокс}
	onclose={() => (лайтбокс = false)}
/>

<VideoModal video={плеєр} {title} onclose={() => (плеєр = null)} />

<style>
	/* Стовпець стоїть у своїй області сітки статті — її задає `ArticleView`. */
	.article-media {
		grid-area: media;
		display: flex;
		flex-direction: column;
		gap: 12px;
		position: sticky;
		top: 120px;
		min-width: 0;
	}

	.article-media__btn {
		width: 100%;
		justify-content: center;
		flex-shrink: 0;
	}

	/* Решта — під статтею, на всю ширину. */
	.article-media-rest {
		grid-area: rest;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(200px, 100%), 1fr));
		gap: 12px;
		margin-top: 2.5rem;
	}

	/*
	 * Послідовністю — один за одним, у колонці тексту.
	 *
	 * Ширина обмежена так само, як у прози: медіа тут ілюструють текст, а не
	 * розсуваються на всю сторінку — інакше вони розривали б читання.
	 */
	.article-media-rest--sequence {
		grid-template-columns: min(800px, 100%);
		justify-content: center;
	}

	.media-tile,
	.media-frame {
		position: relative;
		border-radius: 20px;
		overflow: hidden;
		background: var(--bg-surface);
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
		width: 100%;
	}

	.media-tile {
		cursor: pointer;
		transition: transform 0.25s ease;
	}

	.media-tile:hover,
	.media-tile:focus-visible {
		transform: translateY(-2px);
	}

	.media-tile img,
	.media-frame__img,
	.media-frame__player {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		border: 0;
	}

	/* Кнопка знімка — не кнопка на вигляд: рамку й тло дає сама плитка. */
	.media-frame__btn {
		display: block;
		width: 100%;
		height: 100%;
		padding: 0;
		border: 0;
		background: none;
		cursor: pointer;
	}

	/* Значок відтворення поверх кадру: плитка відео мусить читатися як відео. */
	.media-tile__play {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #fff;
		background: rgba(0, 0, 0, 0.28);
	}

	@media (max-width: 768px) {
		.article-media {
			position: static;
			max-width: 240px;
			margin: 0 auto;
		}

		.article-media-rest {
			grid-template-columns: repeat(auto-fill, minmax(min(140px, 100%), 1fr));
		}
	}
</style>
