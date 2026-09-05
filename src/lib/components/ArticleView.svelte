<script lang="ts">
	import type { Snippet } from 'svelte';
	import { t } from 'svelte-i18n';
	import { Play, Image as ImageIcon, ExternalLink } from 'lucide-svelte';
	import type { VideoInfo } from '$lib/utils/videoEmbed';

	/**
	 * Сторінка однієї статті: обкладинка ліворуч, плашка з датою, назва, текст.
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
		/** Обкладинка: готова адреса, `asset()`/`base` вже враховані. */
		coverUrl?: string;
		/**
		 * `object-position` обкладинки — коли центр ріже не те, що треба.
		 *
		 * Рамка обкладинки вертикальна (9/16), а знімок буває широким, і тоді
		 * центр показує смугу посеред кадру. Число приходить із реєстру новини —
		 * там воно й пораховане, разом із заміром.
		 */
		coverPosition?: string;
		/** Розібране посилання на запис (`parseVideoUrl`), або `null`. */
		video?: VideoInfo | null;
		/**
		 * Плеєр відкритий. Двостороннє навмисно: приходять і з кнопки в
		 * сповіщенні про гарячу новину (`?video=1`), тобто рішення «показати
		 * одразу» ухвалює сторінка, а перемикає кнопка тут.
		 */
		videoOpen?: boolean;
		backHref: string;
		backLabel: string;
		testIdPrefix: string;
		/** Текст статті — разом із власною санітизацією. */
		prose: Snippet;
		/** Що показати ПІД статтею: галерея знімків новини з коду. */
		below?: Snippet;
	}

	let {
		title,
		dateLabel,
		categoryLabel,
		coverUrl,
		coverPosition,
		video = null,
		videoOpen = $bindable(false),
		backHref,
		backLabel,
		testIdPrefix,
		prose,
		below
	}: Props = $props();
</script>

<section class="detail-page container" data-testid="{testIdPrefix}-section">
	<div class="back-nav" data-testid="{testIdPrefix}-back-toolbar">
		<!-- Готова адреса від resolve() у виклику компонента. -->
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
		<a href={backHref} class="btn btn-outline" data-testid="{testIdPrefix}-back-link">{backLabel}</a>
	</div>

	<article data-testid="{testIdPrefix}-content-container">
		<div class="article-body" class:has-cover={!!coverUrl || !!video}>
			{#if coverUrl || video}
				<aside class="article-cover" data-testid="{testIdPrefix}-cover-container">
					<!--
						Окрема обгортка для медіа, а не одна коробка на все.
						Обрізання (`overflow: hidden`) і пропорція 9/16 живуть ТУТ:
						коли вони стояли на `<aside>`, кнопка виштовхувалася за межі
						коробки й обрізалася — на сторінці її не було видно взагалі.
					-->
					<div class="article-cover__media">
						{#if videoOpen && video?.embeddable}
							<!-- Плеєр стає на місце зображення, у тій самій рамці. -->
							<iframe
								src="{video.embedUrl}?autoplay=1"
								{title}
								class="article-cover__player"
								allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
								allowfullscreen
								referrerpolicy="strict-origin-when-cross-origin"
								data-testid="{testIdPrefix}-cover-video-container"
							></iframe>
						{:else if coverUrl}
							<img
								src={coverUrl}
								alt={title}
								class="article-cover__img"
								style={coverPosition ? `object-position: ${coverPosition}` : ''}
								loading="eager"
								fetchpriority="high"
								decoding="async"
								data-testid="{testIdPrefix}-cover-img"
							/>
						{/if}
					</div>

					{#if video}
						{#if video.embeddable}
							<button
								type="button"
								class="btn btn-outline article-cover__video-btn"
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
						{:else}
							<!-- Instagram/Facebook: вбудувати не можемо, тож честніше
							     відкрити там, де воно справді працює. -->
							<!-- Правило звітує на рядку з `href`, тому він мусить бути на тому
							     самому рядку, що й `<a` — інакше disable-next-line його не
							     покриває. Той самий прийом, що для `backHref` вище. -->
							<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
							<a href={video.url}
								target="_blank"
								rel="noopener noreferrer"
								class="btn btn-outline article-cover__video-btn"
								data-testid="{testIdPrefix}-cover-video-link"
							>
								<ExternalLink size={16} aria-hidden="true" />
								{$t('common.watchVideo')}
							</a>
						{/if}
					{/if}
				</aside>
			{/if}

			<div class="article-main">
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

<!-- Галерея йде ПОЗА секцією статті: у неї своя ширина й свої відступи, а
     всередині колонки тексту вона стиснулася б до 1fr сітки. -->
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
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.article-body {
		max-width: 800px;
		margin: 0 auto;
		line-height: 1.8;
		font-size: 1.1rem;
		color: var(--color-body-text);
	}

	.article-body.has-cover {
		display: grid;
		grid-template-columns: 280px 1fr;
		gap: 2.5rem;
		max-width: 1000px;
		align-items: start;
	}

	/* Колонка: медіа зверху, кнопка під ним. Нічого не обрізає — інакше кнопка
	   опиняється за межами коробки й зникає з екрана. */
	.article-cover {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		position: sticky;
		top: 120px;
	}

	/* Саме медіа: пропорція, скруглення й обрізання — тут. */
	.article-cover__media {
		border-radius: 20px;
		overflow: hidden;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
		aspect-ratio: 9 / 16;
		width: 100%;
	}

	/* Плеєр займає те саме місце, що й зображення, і в тій самій пропорції —
	   інакше вміст сторінки стрибав би при перемиканні. */
	.article-cover__player {
		width: 100%;
		height: 100%;
		border: 0;
		background: var(--bg-surface);
		display: block;
	}

	.article-cover__video-btn {
		width: 100%;
		justify-content: center;
		flex-shrink: 0;
	}

	.article-cover__img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.prose :global(h2) {
		font-family: var(--font-heading);
		color: var(--text-title);
		margin-top: 3rem;
		margin-bottom: 1.5rem;
		font-size: 2rem;
	}

	.prose :global(p) {
		margin-bottom: 1.5rem;
	}

	.prose :global(img) {
		max-width: 100%;
		border-radius: 20px;
		margin: 2rem 0;
	}

	.prose :global(ul), .prose :global(ol) {
		margin-bottom: 1.5rem;
		padding-left: 1.5rem;
	}

	.prose :global(li) {
		margin-bottom: 0.5rem;
	}

	@media (max-width: 768px) {
		h1 {
			font-size: 2.2rem;
		}

		.back-nav {
			text-align: center;
		}

		.article-body.has-cover {
			grid-template-columns: 1fr;
		}

		.article-cover {
			max-width: 240px;
			margin: 0 auto;
			position: static;
		}
	}
</style>
