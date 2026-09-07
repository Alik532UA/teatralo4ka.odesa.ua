<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { t } from 'svelte-i18n';
	import { stripLocale } from '$lib/i18n/routing';
	import { getArticleById } from '$lib/services/articles';
	import DetailPage from '$lib/components/DetailPage.svelte';

	/**
	 * Новина з адмінки за ПРЯМИМ посиланням — інакше вона недосяжна.
	 *
	 * ## Що заміряно
	 *
	 * Новини, які автор пише в адмінці, живуть у Firestore: у `build/` їх немає й
	 * бути не може. Заміряно 7 вересня 2026 на зібраній статиці:
	 *
	 *   з переліку `/news/` ..... відкривається, заголовок новини на місці
	 *   прямим посиланням ....... 404, «Сторінку не знайдено»
	 *
	 * Тобто посилання на новину, надіслане в месенджері чи вставлене в соцмережу,
	 * показувало одержувачеві 404. Автор цього не бачив: він приходить із
	 * переліку, а це перехід усередині застосунку, без нового завантаження.
	 *
	 * ## Чому саме новини, а не всі динамічні адреси
	 *
	 * Бо решта на тому самому фолбеку працює — заміряно тоді ж, на тій самій
	 * збірці:
	 *
	 *   /projects/nevidomyi-slug/ ... «Проєкт не знайдено» — маршрут увімкнувся
	 *                                  й сходив у базу
	 *   /takoi-storinky-nemaie/ ..... те саме від кореневого `[slug]`
	 *   /about/nemaie-takoi/ ........ чесна 404
	 *
	 * Маршрут новин відрізняється від них двома речами, і обидві з'явилися
	 * 4 вересня 2026, коли новини переїхали в код: власний `+page.ts` із
	 * `prerender = true` і `entries()`. ЯКА саме з них зупиняє роутер, я не
	 * розділяв — на вибір це не впливає, бо пререндер новин із коду потрібен сам
	 * по собі (мета-теги, прев'ю, вміст без JavaScript). Заміряне тут — симптом:
	 * адреса з бази до завантажувача не доходить.
	 *
	 * Тому рятунок обмежений новинами: розширити його на всі роди адрес означало
	 * б ховати справжні помилки. Якщо колись так само зламається інший маршрут,
	 * сюди додається один рядок.
	 *
	 * ## Чому рятунок тут
	 *
	 * Сторінка помилки — єдине місце, куди така адреса доходить. Повторюється не
	 * логіка, а виклик: той самий `DetailPage`, та сама служба й ті самі ключі
	 * підписів, що в `news/[id]/+page.svelte`.
	 *
	 * МЕЖА, якої це не знімає: новина з бази й далі не потрапляє в індекс і не має
	 * власного прев'ю в месенджері — розмітку віддає `404.html`, тобто без назви
	 * й опису. Для цього потрібен пререндер, тобто читання Firestore на збірці.
	 *
	 * Гейт — `e2e/db-page-direct-link.spec.ts`; юніт-перевірка тут неможлива, бо
	 * дефект живе рівно в проміжку «зібрана статика + справжній браузер».
	 */
	const зБази = $derived.by(() => {
		if (page.status !== 404) return null;
		/*
		 * Рівно ДВА сегменти: `/news/` — це перелік, він пререндериться й сюди не
		 * доходить, а глибших адрес під новинами не буває.
		 */
		const частини = stripLocale(page.url.pathname).split('/').filter(Boolean);
		return частини.length === 2 && частини[0] === 'news' ? частини[1] : null;
	});
</script>

{#if зБази}
	{#key зБази}
		<DetailPage
			param={зБази}
			fetchFn={getArticleById}
			backHref={resolve('/news')}
			backLabelKey="news.backToNews"
			loadingKey="news.loadingArticle"
			notFoundKey="news.notFound"
			errorKey="news.errorLoading"
			testIdPrefix="article"
		/>
	{/key}
{:else}
	<section class="error-page container" style="padding: var(--page-pad-top) 24px var(--page-pad-bottom); min-height: 80dvh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;" data-testid="error-page-section">
		<h1 style="font-family: var(--font-heading); font-size: 6rem; color: var(--text-title); margin-bottom: 1rem;" data-testid="error-page-status">{page.status}</h1>
		<p style="font-size: 1.3rem; color: var(--color-muted-text); margin-bottom: 3rem; max-width: 500px;" data-testid="error-page-message">
			{#if page.status === 404}
				{$t('error.notFound')}
			{:else}
				{page.error?.message || $t('error.generic')}
			{/if}
		</p>
		<a href={resolve('/')} class="btn btn-primary" data-testid="error-page-home-link">{$t('error.backHome')}</a>
	</section>
{/if}
