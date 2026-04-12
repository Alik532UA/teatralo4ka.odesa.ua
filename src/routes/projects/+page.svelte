<script lang="ts">
	import { t, locale } from "svelte-i18n";
	import { browser } from "$app/environment";
	import { onMount } from "svelte";
	import { seo } from "$lib/services/seo.svelte";
	import { getAllProjects, mapArticleToWidgetItem, type Article } from "$lib/services/articles";
	import { getProjectsPageSettings, getCachedProjectsPageSettings, projectsToContentConfig, DEFAULT_PROJECTS_WIDGET_PAGE, DEFAULT_PROJECTS_WIDGET_PAGE_MOBILE, type ProjectsWidgetConfig } from "$lib/services/settings";
	import ContentWidget from "$lib/components/ContentWidget.svelte";
	import type { ContentWidgetConfig } from "$lib/components/ContentWidget.svelte";
	import { getStaticProjects } from "$lib/config/static-projects";

	// ── SWR: instant from cache, then revalidate ──────────────────────────────
	const cachedProjects = browser ? getCachedProjectsPageSettings() : null;
	const isMobile = browser ? window.matchMedia('(max-width: 1024px)').matches : false;

	function pickConfig(desktop?: ProjectsWidgetConfig, mobile?: ProjectsWidgetConfig): ProjectsWidgetConfig {
		if (isMobile) return mobile ?? { ...DEFAULT_PROJECTS_WIDGET_PAGE_MOBILE };
		return desktop ?? { ...DEFAULT_PROJECTS_WIDGET_PAGE };
	}

	let rawProjectArticles = $state<Article[]>([]);
	let widgetConfig = $state<ProjectsWidgetConfig>(pickConfig(cachedProjects?.projectsWidget, cachedProjects?.mobileProjectsWidget));
	let loading = $state(true);

	const contentConfig = $derived<ContentWidgetConfig>(projectsToContentConfig(widgetConfig));

	// Reactive locale for widget re-mapping
	const activeLang = $derived((($locale as string) || 'uk') as 'uk' | 'en');

	let projectItems = $derived.by(() => {
		const firebaseItems = rawProjectArticles
			.filter(a => a.translations?.[activeLang]?.isPublished)
			.map((item, index) => mapArticleToWidgetItem(item, activeLang, index));
		const firebaseSlugs = new Set(firebaseItems.map(p => p.slug).filter(Boolean));
		return [...firebaseItems, ...getStaticProjects(activeLang, firebaseSlugs)];
	});

	onMount(async () => {
		try {
			const lang = ($locale as 'uk' | 'en') || 'uk';
			const [projectsResult, settingsResult] = await Promise.allSettled([
				getAllProjects(lang),
				getProjectsPageSettings(),
			]);

			if (settingsResult.status === 'fulfilled' && settingsResult.value) {
				widgetConfig = pickConfig(settingsResult.value.projectsWidget, settingsResult.value.mobileProjectsWidget);
			} else if (settingsResult.status === 'rejected') {
				console.error('Failed to load projects settings:', settingsResult.reason);
			}

			rawProjectArticles = projectsResult.status === 'fulfilled' ? projectsResult.value : [];
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	});

	$effect(() => {
		seo.update({
			title: `${$t("nav.projects")} - ${$t("seo.brandTitle")}`,
			description: $t("projectsList.subtitle")
		});
	});
</script>

<svelte:head>
	<title>{$t("nav.projects")} | {$t("seo.brandTitle")}</title>
</svelte:head>

<section class="projects-page" data-testid="projects-page-section">
	<div class="container" data-testid="projects-page-container">
		{#if loading}
			<p style="text-align: center; color: var(--color-deep-ocean); font-weight: bold;" data-testid="projects-page-loading-label">{$t('common.loading')}</p>
		{:else if projectItems.length > 0}
			<ContentWidget
				items={projectItems}
				config={contentConfig}
				linkPrefix="projects"
				readMoreLabel={$t('projectsList.readMore')}
				testIdPrefix="projects-widget"
				cardTestIdPrefix="project"
				storageKey="projects-view"
				title={$t('projects.title')}
				subtitle={$t('projects.subtitle')}
			/>
		{:else}
			<p style="text-align: center; color: var(--color-deep-ocean); font-weight: bold; font-size: 1.2rem;" data-testid="projects-page-empty-label">{$t('projectsList.noProjects')}</p>
		{/if}
	</div>
</section>

<style>
	.projects-page {
		padding: 160px 0 6rem;
		min-height: 80vh;
		overflow: hidden;
	}

	@media (max-width: 1024px) {
		.projects-page {
			padding: 120px 0 4rem;
		}
	}
</style>
