<script lang="ts">
	import type { Snippet } from 'svelte';
	import ArticleMedia from '$lib/components/ArticleMedia.svelte';
	import {
		DEFAULT_MEDIA_SHAPE,
		type ArticleMediaItem,
		type MediaLayout,
		type MediaShape
	} from '$lib/utils/articleMedia';
	import { measureHeight } from '$lib/utils/measureHeight';

	/**
	 * Сторінка однієї статті: медіа ліворуч, плашка з датою, назва, текст.
	 *
	 * ## Чому окремий компонент
	 *
	 * Новини живуть у ДВОХ джерелах — Firestore і репозиторій, — а для читача це
	 * просто новини, і виглядати вони мусять однаково. Доти шаблон був лише в
	 * `DetailPage`, тобто в новин із бази; новина з коду малювалася `StaticPage`
	 * — тим самим шаблоном, що «Про школу», без плашки, без дати й з назвою
	 * усередині тексту. Автор побачив рівно це: «власний, дурацький ui ux
	 * шаблон; очікуваний результат — шаблон як у новин з firebase».
	 *
	 * Тому розкладка живе ТУТ, а джерела приносять готові рядки. Різниця між
	 * ними лишається в них і сюди не переїжджає: запит, стани «завантажується /
	 * не знайдено», вибір мови й санітизація тексту.
	 *
	 * ## Що тут, а що в `ArticleMedia`
	 *
	 * Тут — СІТКА: три області («медіа», «текст», «решта») і те, як вони
	 * складаються на вузькому екрані. Там — самі медіа: плитки, лайтбокс, плеєр і
	 * поділ «скільки влізе збоку / що піде під статтею». Через цей поділ
	 * `ArticleMedia` віддає ДВА кореневі вузли, і кожен стає у свою область.
	 *
	 * Висота колонки тексту міряється тут (`bind:clientHeight`) і передається
	 * туди: скільком плиткам стати збоку, вирішує саме вона — так просив автор
	 * («галерея в один стовбець на висоту тексту»).
	 *
	 * ## Чому текст приходить сніпетом, а не рядком HTML
	 *
	 * Джерела мають різний рівень довіри: з бази — те, що написали в адмінці
	 * (`renderContent`), з репозиторію — markdown сторінок (`DOMPurify.sanitize`
	 * із конфігом). Гейт `security` вимагає, щоб санітизація стояла В САМОМУ
	 * виразі `{@html}`, і це правильна вимога: приймати сюди «вже безпечний
	 * HTML» означало б перенести відповідальність у місце, де її не видно.
	 */
	interface Props {
		title: string;
		/** Готовий підпис дати. Порожньо — рядка немає. */
		dateLabel?: string;
		/** Готова назва категорії. Порожньо — плашки немає. */
		categoryLabel?: string;
		/** Медіа статті: адреси вже готові (`asset()` зробило джерело). */
		media?: readonly ArticleMediaItem[];
		/** Пропорція плиток. Немає — вертикальна, як було до переліку медіа. */
		shape?: MediaShape;
		/** Стовпець плиток (типово) або все одне за одним. */
		layout?: MediaLayout;
		/**
		 * Плеєр пари «фото + відео» відкритий. Двостороннє навмисно: приходять і з
		 * кнопки в сповіщенні про гарячу новину (`?video=1`), тобто рішення
		 * «показати одразу» ухвалює сторінка, а перемикає кнопка в медіа.
		 */
		videoOpen?: boolean;
		backHref: string;
		backLabel: string;
		testIdPrefix: string;
		/** Текст статті — разом із власною санітизацією. */
		prose: Snippet;
		/** Що показати ПІД статтею, окрім медіа. */
		below?: Snippet;
	}

	let {
		title,
		dateLabel,
		categoryLabel,
		media = [],
		shape = DEFAULT_MEDIA_SHAPE,
		layout = 'column',
		videoOpen = $bindable(false),
		backHref,
		backLabel,
		testIdPrefix,
		prose,
		below
	}: Props = $props();

	/** Стовпець збоку є лише в розкладці «стовпець» і лише коли медіа є. */
	const збоку = $derived(media.length > 0 && layout === 'column');

	/**
	 * Заміряна висота тексту — від неї залежить, скільком плиткам стати збоку.
	 *
	 * Мірка своя, а не `bind:clientHeight`: прив'язка Svelte давала 1347 при
	 * справжніх 1579 і більше не оновлювалася — ні від довантаженого шрифту, ні
	 * від зміни розміру вікна. Замір і розбір — у `utils/measureHeight`.
	 *
	 * Прикріплення створюється ОДИН раз: новий об'єкт на кожен рендер Svelte
	 * перечіпляв би, а замір змінює стан — тобто це була б петля.
	 */
	let висотаТексту = $state(0);
	const мірка = measureHeight((v) => (висотаТексту = v));
</script>

<section class="detail-page container" data-testid="{testIdPrefix}-section">
	<div class="back-nav" data-testid="{testIdPrefix}-back-toolbar">
		<!-- Готова адреса від resolve() у виклику компонента. -->
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
		<a href={backHref} class="btn btn-outline" data-testid="{testIdPrefix}-back-link">{backLabel}</a>
	</div>

	<article data-testid="{testIdPrefix}-content-container">
		<div class="article-body" class:has-media={збоку}>
			{#if media.length > 0}
				<ArticleMedia
					{media}
					{shape}
					{layout}
					textHeight={висотаТексту}
					{title}
					bind:videoOpen
					{testIdPrefix}
				/>
			{/if}

			<div class="article-main" {@attach мірка}>
				<div class="article-header" data-testid="{testIdPrefix}-header">
					{#if dateLabel || categoryLabel}
						<div class="article-meta" data-testid="{testIdPrefix}-meta-section">
							{#if categoryLabel}
								<span class="tag" data-testid="{testIdPrefix}-category-badge">{categoryLabel}</span>
							{/if}
							{#if dateLabel}
								<time data-testid="{testIdPrefix}-date-value">{dateLabel}</time>
							{/if}
						</div>
					{/if}
					<h1 data-testid="{testIdPrefix}-title">{title}</h1>
				</div>

				<div class="prose" data-testid="{testIdPrefix}-prose-container">
					{@render prose()}
				</div>
			</div>
		</div>
	</article>
</section>

{@render below?.()}

<style>
	.detail-page {
		padding: var(--page-pad-top) 24px var(--page-pad-bottom);
		min-height: 80dvh;
	}

	.back-nav {
		max-width: 1000px;
		margin: 0 auto 2rem;
	}

	.article-header {
		margin-bottom: 2.5rem;
	}

	.article-meta {
		display: flex;
		gap: 1rem;
		align-items: center;
		margin-bottom: 1.25rem;
	}

	.tag {
		background: var(--accent-primary);
		color: var(--text-on-accent);
		padding: 0.4rem 1rem;
		border-radius: var(--radius-full);
		font-size: 0.8rem;
		font-weight: 700;
		text-transform: uppercase;
	}

	time {
		color: var(--color-muted-text);
		font-weight: 500;
	}

	h1 {
		font-family: var(--font-heading);
		font-size: 3rem;
		font-weight: 900;
		color: var(--text-title);
		line-height: 1.1;
		margin: 0;
	}

	.article-main {
		grid-area: text;
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	/*
	 * ТРИ ОБЛАСТІ, а не «обкладинка й текст».
	 *
	 * `media` — стовпець плиток, `text` — стаття, `rest` — те з медіа, що не
	 * влізло збоку, на всю ширину. Області названі тут, бо сітка належить статті;
	 * самі вузли приносить `ArticleMedia` двома коренями й ставить кожен у свою
	 * область. Без сітки з областями «решту» довелося б малювати другим
	 * компонентом — і поділ «скільки влізе» розійшовся б надвоє.
	 */
	.article-body {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		grid-template-areas:
			'text'
			'rest';
		max-width: 800px;
		margin: 0 auto;
		line-height: 1.8;
		font-size: 1.1rem;
		color: var(--color-body-text);
	}

	.article-body.has-media {
		grid-template-columns: 280px minmax(0, 1fr);
		grid-template-areas:
			'media text'
			'rest rest';
		gap: 0 2.5rem;
		max-width: 1000px;
		align-items: start;
	}

	/* Прозі свої правила НЕ задаються: `.prose` належить `global.css` цілком —
	   розбір у гейті `prose-ownership`. */

	@media (max-width: 768px) {
		h1 {
			font-size: 2.2rem;
		}

		.back-nav {
			text-align: center;
		}

		/*
		 * На вузькому екрані стовпець стає НАД текстом: дві колонки по 280 px тут
		 * не вміщаються, а медіа мусить лишитися перед статтею — так само, як
		 * обкладинка стояла доти.
		 */
		.article-body.has-media {
			grid-template-columns: minmax(0, 1fr);
			grid-template-areas:
				'media'
				'text'
				'rest';
			gap: 1.5rem 0;
		}
	}
</style>
