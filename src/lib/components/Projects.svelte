<script lang="ts">
	import { t } from 'svelte-i18n';
	import { base } from '$app/paths';
	import ContentWidget from '$lib/components/ContentWidget.svelte';
	import type { ContentCardItem } from '$lib/components/ContentCard.svelte';
	import type { ContentWidgetConfig } from '$lib/components/ContentWidget.svelte';
	import { projectsToContentConfig, DEFAULT_PROJECTS_WIDGET_HOME, type ProjectsWidgetConfig } from '$lib/services/settings';

	interface Props {
		items?: ContentCardItem[];
		config?: ProjectsWidgetConfig;
		error?: boolean;
	}

	let { items = [], config = DEFAULT_PROJECTS_WIDGET_HOME, error = false }: Props = $props();

	const widgetConfig = $derived<ContentWidgetConfig>(projectsToContentConfig(config));
</script>

{#if !error}
<section class="projects-home" id="projects-section" aria-labelledby="projects-title" data-testid="projects-section-container">
	<div class="container" data-testid="projects-content-container">
		{#if items.length > 0}
			<ContentWidget
				items={items}
				config={widgetConfig}
				showAllLink
				allLinkHref="{base}/projects"
				allLinkLabel={$t('projects.allProjects')}
				allLinkViewKey="projects-view"
				linkPrefix="projects"
				readMoreLabel={$t('projectsList.readMore')}
				testIdPrefix="projects-widget"
				cardTestIdPrefix="project"
				storageKey=""
				title={$t('projects.title')}
				subtitle={$t('projects.subtitle')}
			/>
		{:else}
			<p class="projects-empty" data-testid="projects-empty-label">{$t('projectsList.noProjects')}</p>
		{/if}
	</div>
</section>
{/if}

<style>
	.projects-home {
		padding: var(--space-2xl) 0;
		background: transparent;
		overflow: hidden;
	}

	@media (max-width: 480px) {
		.projects-home {
			padding: var(--space-xl) 0;
		}
	}

	.projects-empty {
		text-align: center;
		color: var(--text-title);
		font-weight: bold;
		font-size: 1.2rem;
	}
</style>
