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
				const headerOffset = 72;
				// Якщо верх контейнера піднявся вище зони видимості під шапкою:
				if (rect.top < headerOffset) {
					e.preventDefault();
					details.removeAttribute('open');
					details.classList.remove('is-stuck');
					summary.classList.remove('is-stuck');
					const targetY = window.scrollY + rect.top - headerOffset;
					window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
				}
			}
		};

		const checkStuck = () => {
			const headerThreshold = 73;
			const allDetails = document.querySelectorAll<HTMLDetailsElement>('.prose details');
			allDetails.forEach((details) => {
				const summary = details.querySelector('summary');
				if (!summary) return;
				if (!details.open) {
					details.classList.remove('is-stuck');
					summary.classList.remove('is-stuck');
					return;
				}
				const summaryRect = summary.getBoundingClientRect();
				const detailsRect = details.getBoundingClientRect();
				const isStuck =
					summaryRect.top <= headerThreshold &&
					detailsRect.bottom > headerThreshold + summaryRect.height;
				details.classList.toggle('is-stuck', isStuck);
				summary.classList.toggle('is-stuck', isStuck);
			});
		};

		window.addEventListener('click', handleSummaryClick);
		window.addEventListener('scroll', checkStuck, { passive: true });
		window.addEventListener('click', () => {
			requestAnimationFrame(checkStuck);
		});

		checkStuck();

		return () => {
			window.removeEventListener('click', handleSummaryClick);
			window.removeEventListener('scroll', checkStuck);
		};
	});
</script>

<StaticPage {data} testPrefix="tkach-perekladach" backHref={resolve('/projects')} backLabel={$t('projects.backToProjects')} />
