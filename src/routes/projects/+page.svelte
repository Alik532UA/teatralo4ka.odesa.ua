<script lang="ts">
	import { t, locale } from "svelte-i18n";
	import { base } from "$app/paths";
	import { getAllProjects, type Article } from "$lib/services/articles";
	import { onMount } from "svelte";
	import { seo } from "$lib/services/seo.svelte";

	let projects = $state<Article[]>([]);
	let loading = $state(true);

	onMount(async () => {
		try {
			projects = await getAllProjects($locale || 'uk');
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

	function getTitle(item: Article): string {
		const lang = ($locale as 'uk' | 'en') || 'uk';
		return item.translations?.[lang]?.title || item.translations?.uk?.title || '';
	}

	function getExcerpt(item: Article): string {
		const lang = ($locale as 'uk' | 'en') || 'uk';
		const content = item.translations?.[lang]?.content || '';
		const plain = content.replace(/<[^>]*>/g, '').replace(/[#*`_\[\]()]/g, '');
		return plain.length > 200 ? plain.slice(0, 200) + '...' : plain;
	}

	function getCover(item: Article): string {
		return item.translations?.uk?.coverUrl || item.translations?.en?.coverUrl || '';
	}
</script>

<svelte:head>
	<title>{$t("nav.projects")} | {$t("seo.brandTitle")}</title>
</svelte:head>

<section class="projects-page container">
	<div class="projects-header">
		<h1>{$t("nav.projects")}</h1>
		<p class="projects-subtitle">{$t("projectsList.subtitle")}</p>
	</div>

	{#if loading}
		<div class="projects-loading">
			<div class="loader"></div>
			<p>{$t("common.loading")}</p>
		</div>
	{:else if projects.length === 0}
		<div class="projects-empty">
			<p>{$t("projectsList.noProjects")}</p>
			<a href="{base}/" class="btn btn-primary" style="margin-top: var(--space-xl);">
				{$t("nav.home")}
			</a>
		</div>
	{:else}
		<div class="projects-grid">
			{#each projects as project (project.id)}
				<a href="{base}/projects/{project.slug}" class="project-card">
					{#if getCover(project)}
						<div class="project-cover">
							<img src={getCover(project)} alt={getTitle(project)} loading="lazy" />
						</div>
					{/if}
					<div class="project-info">
						<h2 class="project-title">{getTitle(project)}</h2>
						<p class="project-excerpt">{getExcerpt(project)}</p>
						<span class="project-link">{$t("projectsList.readMore")} &rarr;</span>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</section>

<style>
	.projects-page {
		padding: 160px 24px 6rem;
		min-height: 80vh;
	}
	.projects-header {
		text-align: center;
		margin-bottom: var(--space-2xl);
	}
	.projects-header h1 {
		font-family: var(--font-heading);
		color: var(--color-deep-ocean);
		margin-bottom: var(--space-sm);
	}
	.projects-subtitle {
		font-size: 1.2rem;
		color: var(--color-body-text);
		opacity: 0.7;
	}
	.projects-loading, .projects-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 300px;
		text-align: center;
		color: var(--color-body-text);
	}
	.projects-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
		gap: 2rem;
	}
	.project-card {
		display: flex;
		flex-direction: column;
		background: var(--theme-dynamic-card-bg);
		border-radius: 24px;
		overflow: hidden;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
		border: 1px solid rgba(0, 0, 0, 0.05);
		text-decoration: none;
		color: inherit;
		transition: transform 0.2s, box-shadow 0.2s;
	}
	.project-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 16px 48px rgba(0, 0, 0, 0.1);
	}
	.project-cover {
		aspect-ratio: 16/9;
		overflow: hidden;
	}
	.project-cover img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.project-info {
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		flex: 1;
	}
	.project-title {
		font-size: 1.3rem;
		font-weight: 700;
		color: var(--color-deep-ocean);
		margin: 0;
		line-height: 1.3;
	}
	.project-excerpt {
		font-size: 0.95rem;
		color: var(--color-body-text);
		opacity: 0.7;
		margin: 0;
		line-height: 1.5;
		flex: 1;
	}
	.project-link {
		font-weight: 700;
		color: var(--color-sea-blue);
		font-size: 0.9rem;
	}
	.loader {
		width: 48px;
		height: 48px;
		border: 5px solid var(--color-ocean);
		border-bottom-color: transparent;
		border-radius: 50%;
		display: inline-block;
		box-sizing: border-box;
		animation: rotation 1s linear infinite;
	}
	@keyframes rotation {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
	@media (max-width: 600px) {
		.projects-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
