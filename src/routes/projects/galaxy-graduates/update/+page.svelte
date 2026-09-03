<script lang="ts">
	import { t, locale } from 'svelte-i18n';
	import { ArrowRight } from 'lucide-svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { localizedPath } from '$lib/i18n/routing';

	/**
	 * Адреса заради ПРЕВ'Ю: вигляд лишається той самий — вікно над галактикою.
	 *
	 * ## Задача
	 *
	 * Посилання роздають руками, і виглядало воно як
	 * `/projects/galaxy-graduates/?update=open`. Прев'ю в месенджері брало опис
	 * ГАЛАКТИКИ: query-рядок у мета-теги не потрапляє — сторінка пререндериться в
	 * один файл, а краулер не виконує JS. Власна адреса — єдиний спосіб дати
	 * цьому посиланню власний підпис.
	 *
	 * ## Чому сторінка нічого не малює
	 *
	 * Перша редакція малювала: заголовок, вміст, посилання — тобто ЗВИЧАЙНУ
	 * сторінку сайту. Автор відкинув її одним реченням, і воно справедливе:
	 * «виглядає як основний дизайн сайту, а має виглядати як було — на фоні
	 * галактики». Це й було вікном над зорями, і власна адреса не причина це
	 * втратити.
	 *
	 * Тому сторінка лише везе мета-теги й одразу веде в галактику з відкритим
	 * вікном. Вміст не дублюється взагалі: його показує те саме вікно, що й
	 * раніше, — тобто й розходитися нема чому.
	 *
	 * ## Чому не `redirect()` у `load`
	 *
	 * Заміряно на сусідній заглушці (`build/fest-odesa-teatr-pro/index.html`):
	 * 122 байти, `<meta refresh>` і ЖОДНОГО мета-тега — `redirect()` перериває
	 * рендер, тож прев'ю не було б узагалі. Саме тому перехід клієнтський, а
	 * сторінка справжня.
	 *
	 * `replaceState`, щоб «назад» вело туди, звідки людина прийшла, а не по колу
	 * в цю саму адресу.
	 */
	const lang = $derived<'uk' | 'en'>($locale === 'en' ? 'en' : 'uk');
	const target = $derived(
		`${localizedPath('/projects/galaxy-graduates/', lang)}?update=open`
	);

	$effect(() => {
		if (browser) goto(target, { replaceState: true });
	});
</script>

<svelte:head>
	<title>{$t('seo.pages.galaxyUpdate.title')} | {$t('hero.title')}</title>
</svelte:head>

<!--
	Видиме посилання обов'язкове: із вимкненим JS перехід не станеться, і без
	нього сторінка була б порожньою адресою. Воно ж і те, за чим іде краулер.
-->
<main class="hop" data-testid="galaxy-update-page-section">
	<a class="hop__link" href={target} data-testid="galaxy-update-page-galaxy-link">
		<span>{$t('seo.pages.galaxyUpdate.title')}</span>
		<ArrowRight size={18} aria-hidden="true" />
	</a>
</main>

<style>
	.hop {
		display: grid;
		place-items: center;
		min-height: 60dvh;
		padding: 2rem 1rem;
	}

	.hop__link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.7rem 1.2rem;
		border-radius: var(--radius-full, 9999px);
		border: 1px solid var(--border-main);
		background: var(--bg-card);
		color: var(--text-main);
		text-decoration: none;
		font-weight: 600;
	}

	.hop__link:hover {
		border-color: var(--accent-primary);
	}
</style>
