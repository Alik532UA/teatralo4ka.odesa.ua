<script lang="ts">
	import StaticPage from '$lib/components/StaticPage.svelte';
	import { resolve } from '$app/paths';
	import { t } from 'svelte-i18n';
	import { onMount } from 'svelte';

	let { data } = $props();

	onMount(() => {
		const handleSummaryClick = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			const summary = target.closest('summary');
			if (!summary) return;
			const details = summary.closest('details');
			if (!details) return;

			// Якщо користувач згортає відкритий контейнер:
			if (details.open) {
				const rect = details.getBoundingClientRect();
				const headerOffset = 90;
				// Якщо верх контейнера піднявся вище зони видимості під шапкою:
				if (rect.top < headerOffset) {
					e.preventDefault();
					details.removeAttribute('open');
					const targetY = window.scrollY + rect.top - headerOffset;
					window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
				}
			}
		};

		window.addEventListener('click', handleSummaryClick);
		return () => window.removeEventListener('click', handleSummaryClick);
	});
</script>

<StaticPage {data} testPrefix="tkach-perekladach" backHref={resolve('/projects')} backLabel={$t('projects.backToProjects')} />
