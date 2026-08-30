<script lang="ts">
	import { locale } from 'svelte-i18n';
	import { asset } from '$app/paths';
	import { localizedPath } from '$lib/i18n/routing';
	import { getGroupBySlug } from '$lib/data/groups';
	import { GRADUATES, graduateProfilePath } from '$lib/data/graduates';

	interface Props {
		/** Адреса групи; немає — рядок не малюється. */
		groupSlug: string;
		/** Чия це картка: сама людина серед однокурсників не показується. */
		excludeId: string;
	}

	let { groupSlug, excludeId }: Props = $props();

	const lang = $derived<'uk' | 'en'>($locale === 'en' ? 'en' : 'uk');

	/*
	 * Однокурсники беруться зі складу групи за `id`, а не за адресою: адресу
	 * законно виправляють, і пошук за нею тихо губив би людину.
	 *
	 * Показуються ВСІ, а не лише ті, хто має портрет: заміряно, фото є у 62 із
	 * 91 членства, тож фільтр за наявністю знімка сховав би майже третину
	 * однокурсників. Замість портрета в такому разі — перша літера імені.
	 */
	const mates = $derived(
		(getGroupBySlug(groupSlug)?.memberIds ?? [])
			.filter((id) => id !== excludeId)
			.map((id) => GRADUATES.find((g) => g.id === id))
			.filter((g) => g !== undefined)
	);
</script>

{#if mates.length}
	<ul class="mates" data-testid="galaxy-card-groupmates-list">
		{#each mates as mate (mate.id)}
			{@const photo = mate.hasPhoto ? asset(`/graduates/${mate.slug}-96.webp`) : null}
			<li>
				<!--
					Посилання — лише туди, де сторінка справді є: анкету заповнили не всі,
					і кнопка в нікуди гірша за спокійний кружечок. Тьмяність тут означає
					рівно те саме, що й у списку учасників вистави.
				-->
				{#if mate.code}
					<a
						class="mates__item"
						href={localizedPath(graduateProfilePath(mate.code), lang)}
						title={mate.name}
						data-testid="galaxy-card-groupmate-link-{mate.id}"
					>
						{#if photo}
							<img src={photo} alt={mate.name} width="26" height="26" loading="lazy" />
						{:else}
							<span class="mates__letter" aria-hidden="true">{mate.name.slice(0, 1)}</span>
							<span class="sr-only">{mate.name}</span>
						{/if}
					</a>
				{:else}
					<span class="mates__item mates__item--plain" title={mate.name}>
						{#if photo}
							<img src={photo} alt={mate.name} width="26" height="26" loading="lazy" />
						{:else}
							<span class="mates__letter" aria-hidden="true">{mate.name.slice(0, 1)}</span>
							<span class="sr-only">{mate.name}</span>
						{/if}
					</span>
				{/if}
			</li>
		{/each}
	</ul>
{/if}

<style>
	.mates {
		list-style: none;
		margin: 0;
		padding: 0 0.5rem 0.4rem;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.3rem;
	}
	.mates__item {
		display: grid;
		place-items: center;
		width: 26px;
		height: 26px;
		border-radius: 50%;
		overflow: hidden;
		background: rgb(140 180 255 / 0.12);
		border: 1px solid rgb(140 180 255 / 0.35);
		text-decoration: none;
		transition:
			transform 0.2s ease,
			border-color 0.2s ease;
	}
	.mates__item:hover {
		transform: translateY(-2px);
		border-color: var(--accent-primary, #8cb4ff);
	}
	.mates__item--plain {
		opacity: 0.7;
	}
	.mates__item img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	.mates__letter {
		font-size: 0.72rem;
		font-weight: 700;
		color: #bfe0ff;
		line-height: 1;
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
		border: 0;
	}
</style>
