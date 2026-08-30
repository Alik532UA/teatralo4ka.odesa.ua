<script lang="ts">
	import { t } from 'svelte-i18n';
	import { Theater } from 'lucide-svelte';
	import GroupPlaysTimeline from '$lib/components/GroupPlaysTimeline.svelte';
	import type { Play } from '$lib/data/plays';

	interface Props {
		/** Спільні вистави — або весь репертуар, якщо група не з двох частин. */
		plays: Play[];
		/** Частини злитої групи; порожньо — група одна. */
		parts?: { name: string; plays: Play[] }[];
	}

	let { plays, parts = [] }: Props = $props();
</script>

<!--
	Репертуар злитої групи: спершу СПІЛЬНІ вистави, потім частини поруч.

	Порядок і розкладка тут кажуть те, що інакше довелося б писати словами: дві
	групи йшли ПАРАЛЕЛЬНО, а спільні вистави — місце, де їхні історії зійшлися.
	Одним списком двадцять сім вистав «Аншлаг+Дєвішнік» стерли б і те, й те.
-->
{#if plays.length > 0}
	<section class="rep__section" aria-labelledby="section-plays-title">
		<div class="rep__head">
			<span class="rep__icon"><Theater size={20} aria-hidden="true" /></span>
			<h2 id="section-plays-title" class="rep__title">
				{parts.length ? $t('galaxy.groupRepertoireShared') : $t('galaxy.groupRepertoire')}
			</h2>
			<span class="rep__count">{plays.length}</span>
		</div>

		<GroupPlaysTimeline {plays} />
	</section>
{/if}

{#if parts.length > 0}
	<div class="parts-wrap">
		<div class="parts" data-testid="group-parts-list">
			{#each parts as part (part.name)}
				<section class="rep__section" aria-labelledby="section-part-{part.name}">
					<div class="rep__head">
						<span class="rep__icon"><Theater size={20} aria-hidden="true" /></span>
						<h2 id="section-part-{part.name}" class="rep__title">
							{$t('galaxy.groupRepertoire')}: «{part.name}»
						</h2>
						<span class="rep__count">{part.plays.length}</span>
					</div>

					<GroupPlaysTimeline plays={part.plays} />
				</section>
			{/each}
		</div>
	</div>
{/if}

<style>
	.rep__section {
		margin-bottom: 3.5rem;
	}
	.rep__head {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}
	.rep__title {
		margin: 0;
		font-size: clamp(1.2rem, 3vw, 1.6rem);
		font-weight: 700;
		color: var(--text-title);
	}
	.rep__count {
		display: grid;
		place-items: center;
		min-width: 1.8rem;
		height: 1.8rem;
		padding: 0 0.45rem;
		border-radius: var(--radius-full, 9999px);
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		color: var(--text-muted);
		font-size: 0.82rem;
		font-weight: 700;
	}
	.rep__icon {
		display: inline-grid;
		place-items: center;
		width: 2.2rem;
		height: 2.2rem;
		border-radius: var(--radius-md, 12px);
		background: rgba(99, 102, 241, 0.15);
		border: 1px solid rgba(99, 102, 241, 0.3);
		color: #a5b4fc;
	}

	/*
	 * Частини поруч. На вузькому екрані колонка одна — інакше два списки по
	 * пів-екрана перетворюються на дві стрічки завширшки з палець.
	 */
	/* Міряється саме обгортка: запит не може питати про самого себе. */
	.parts-wrap {
		container-type: inline-size;
	}
	.parts {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.5rem;
		align-items: start;
	}
	/*
	 * Контейнерний, а не віконний: два списки поруч мають сенс тоді, коли МІСЦЯ
	 * під них вистачає, а не тоді, коли широке вікно. Сторінка групи має свій
	 * контейнер, і в майбутньому цей компонент може стати у вужчу колонку.
	 */
	@container (min-width: 720px) {
		.parts {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	.parts .rep__section {
		margin-bottom: 0;
	}
</style>
