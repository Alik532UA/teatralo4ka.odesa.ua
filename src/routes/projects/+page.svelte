<script lang="ts">
	import { t } from "svelte-i18n";
	import { base } from "$app/paths";
</script>

<svelte:head>
	<title>{$t("nav.projects")} | {$t("seo.brandTitle")}</title>
</svelte:head>

<div class="container" style="padding: var(--space-2xl) 0; min-height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
	<h1 style="font-family: var(--font-heading); color: var(--color-deep-ocean); margin-bottom: var(--space-md);">
		{$t("nav.projects")}
	</h1>
	<p style="font-size: 1.2rem; max-width: 600px; color: var(--color-body-text);">
		Сторінка знаходиться в розробці. Незабаром тут з'явиться інформація про наші фестивалі, конкурси та творчі ініціативи.
	</p>
	<a href="{base}/" class="btn btn-primary" style="margin-top: var(--space-xl);">
		{$t("nav.home")}
	</a>
</div>
