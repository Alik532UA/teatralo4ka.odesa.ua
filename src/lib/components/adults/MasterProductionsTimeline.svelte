<script lang="ts">
	import { t } from 'svelte-i18n';
	import { Trophy, Video } from 'lucide-svelte';
	import { playPath, type Play } from '$lib/data/plays';
	import { localizedPath } from '$lib/i18n/routing';
	import { playGroupCaption } from '$lib/data/groups';
	import { PLAY_CAST } from '$lib/data/playCast';
	import GraduateAvatarRow from '$lib/components/GraduateAvatarRow.svelte';

	/**
	 * Хронологія: вистави згруповані за роками.
	 *
	 * ## На яке питання відповідає саме цей режим
	 *
	 * Плитка й список показують вистави поспіль, і рік у них — лише одна з ознак
	 * рядка. Але підзаголовок розділу обіцяє саме хронологію, а її з рівного
	 * переліку не видно: скільки вистав було в 2014-му, а скільки в 2020-му,
	 * доводиться рахувати очима. Тут рік — сама структура: заголовок, лічильник
	 * і вистави під ним.
	 *
	 * ## Порядок років — від новіших до давніших
	 *
	 * Свіже цікавить частіше, і так само впорядковані сусідні переліки в
	 * проєкті. Всередині року порядок зберігається той, що прийшов, — його вже
	 * визначили фільтр і сортування розділу, і перевпорядковувати тут означало б
	 * мовчки сперечатися з ними.
	 *
	 * ## Чому не `<dl>`
	 *
	 * Спокусливо взяти список означень: рік — термін, вистави — означення. Але
	 * рік тут не означує вистави, він їх ГРУПУЄ, і читалка з `<dl>` прочитала б
	 * зв'язок, якого немає. Заголовок плюс список — те, що є насправді.
	 */
	interface Props {
		productions: Play[];
		isEn?: boolean;
	}

	let { productions, isEn = false }: Props = $props();

	/*
	 * Групування без `Map` — навмисно.
	 *
	 * `svelte/prefer-svelte-reactivity` забороняє змінюваний `Map` у рунному
	 * коді, і слушно: він не реактивний, тож зміна в ньому лишилася б непоміченою.
	 * Але `SvelteMap` тут теж не потрібен — це проміжна величина всередині
	 * `$derived.by`, вона перебудовується цілком і назовні не виходить.
	 *
	 * Пошук роком по вже зібраних групах — це O(років) на виставу, а не O(вистав).
	 * Років кілька десятків: у найбагатшого майстра 80 вистав приблизно на 35
	 * років. Дешевше за будь-яку структуру, яку довелося б заводити заради цього.
	 */
	const byYear = $derived.by(() => {
		const groups: Array<[number, Play[]]> = [];
		for (const prod of productions) {
			const found = groups.find(([year]) => year === prod.year);
			if (found) found[1].push(prod);
			else groups.push([prod.year, [prod]]);
		}
		return groups.sort((a, b) => b[0] - a[0]);
	});
</script>

<div class="prod-timeline" data-testid="master-productions-timeline-list">
	{#each byYear as [year, plays] (year)}
		<section class="prod-year" data-testid="master-productions-year-section-{year}">
			<div class="prod-year__head">
				<h3 class="prod-year__title">{year}</h3>
				<span class="prod-year__count" data-testid="master-productions-year-count-{year}">
					{$t('galaxy.productionsCount', {
						values: { count: plays.length },
						default: `${plays.length} вистав та показів`
					})}
				</span>
			</div>

			<ul class="prod-year__items">
				{#each plays as prod, idx (prod.title + String(prod.year) + (prod.number ?? idx))}
					<!-- Назва курсу видима, номер — тихо. Чому так: `playGroupCaption`. -->
					{@const caption = playGroupCaption(
						prod.id,
						(PLAY_CAST[prod.id] ?? []).map((c) => c.graduateId),
						prod.theatreGroup,
						isEn
					)}
					{@const castIds = (PLAY_CAST[prod.id] ?? []).map((c) => c.graduateId)}
					<li class="prod-year__item" data-testid="master-productions-year-item-{prod.id}">
						<span class="prod-year__dot" aria-hidden="true"></span>
						<span class="prod-year__body">
							<a
								href={localizedPath(playPath(prod.id), isEn ? 'en' : 'uk')}
								class="prod-year__name-link"
								data-testid="master-productions-timeline-link-{prod.id}"
							>
								<span class="prod-year__name">{prod.title}</span>
							</a>
							{#if prod.author}<span class="prod-year__author">{prod.author}</span>{/if}
						</span>
						<span class="prod-year__marks">
							{#each caption.names as name (name)}
								<span class="prod-year__group">{name}</span>
							{/each}
							{#if caption.number ?? caption.note}
								<span class="prod-year__number">{caption.number ?? caption.note}</span>
							{/if}
							{#if prod.awards?.length}
								<span class="prod-year__mark prod-year__mark--award" title={prod.awards.join('; ')}>
									<Trophy size={13} aria-hidden="true" />
									<span>{prod.awards.length}</span>
								</span>
							{/if}
							{#if prod.videoUrl}
								<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
								<a class="prod-year__mark prod-year__mark--video" href={prod.videoUrl} target="_blank" rel="external noopener noreferrer" title={$t('galaxy.watchVideo', { default: 'Дивитися відео' })} data-testid="master-productions-year-video-link-{prod.id}">
									<Video size={13} aria-hidden="true" />
								</a>
							{/if}
						</span>

						{#if castIds.length}
							<GraduateAvatarRow
								ids={castIds}
								testIdPrefix="master-productions-year-cast-{prod.id}"
							/>
						{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/each}
</div>

<style>
	.prod-timeline {
		container-type: inline-size;
		display: flex;
		flex-direction: column;
		gap: 1.75rem;
	}
	.prod-year__head {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		padding-bottom: 0.5rem;
		border-bottom: 2px solid var(--border-main);
		margin-bottom: 0.75rem;
	}
	.prod-year__title {
		margin: 0;
		font-size: 1.35rem;
		font-weight: 800;
		color: var(--text-title);
		font-variant-numeric: tabular-nums;
	}
	.prod-year__count {
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--text-muted);
	}
	.prod-year__items {
		list-style: none;
		margin: 0;
		/* Місце під смужку й крапки: вони малюються ліворуч від тексту. */
		padding: 0 0 0 1.1rem;
		border-left: 2px solid var(--border-main);
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	.prod-year__item {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 0.7rem;
		position: relative;
	}
	.prod-year__dot {
		width: 9px;
		height: 9px;
		border-radius: 50%;
		background: var(--accent-primary);
		/* Крапка сидить НА смужці, тому виїжджає за свою колонку. */
		margin-left: -1.55rem;
		flex-shrink: 0;
	}
	.prod-year__body {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		min-width: 0;
	}
	.prod-year__name {
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--text-title);
		transition: color var(--transition-base, 0.2s ease);
	}
	.prod-year__name-link {
		color: inherit;
		text-decoration: none;
		display: inline-block;
	}
	.prod-year__name-link:hover .prod-year__name {
		color: var(--accent-primary);
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.prod-year__author {
		font-size: 0.8rem;
		color: var(--text-muted);
	}
	.prod-year__marks {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		flex-wrap: wrap;
		justify-content: flex-end;
	}
	.prod-year__number {
		font-size: 0.72rem;
		font-weight: 500;
		color: var(--text-muted);
		letter-spacing: 0.02em;
	}

	.prod-year__group {
		padding: 0.12rem 0.5rem;
		border-radius: var(--radius-full, 9999px);
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		font-size: 0.72rem;
		font-weight: 600;
		color: var(--text-muted);
	}
	.prod-year__mark {
		display: inline-flex;
		align-items: center;
		gap: 0.22rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-muted);
		text-decoration: none;
	}
	.prod-year__mark--award {
		color: #b45309;
	}
	.prod-year__mark--video {
		color: #dc2626;
	}

	/*
	 * Розмірний запит до МІСЦЯ, а не до вікна (FLUID-SIZING-v8 § 7A).
	 *
	 * Перелік займає ту ширину, яку йому дав розділ, і саме від неї залежить,
	 * чи вміщаються колонки. Вікно тут ні до чого: та сама сторінка на тому
	 * самому екрані дає переліку різну ширину залежно від того, що поруч.
	 *
	 * `container-type: inline-size` стоїть на елементі, який ЗАЙМАЄ всю доступну
	 * ширину. Це не дрібниця: у `fit-content`-батька такий контейнер згортається
	 * до нуля, і запит спрацьовує завжди — цю пастку в проєкті вже ловили двічі.
	 */
	@container (max-width: 640px) {
		.prod-year__item {
			grid-template-columns: auto 1fr;
			row-gap: 0.3rem;
		}
		.prod-year__marks {
			grid-column: 2 / -1;
			justify-content: flex-start;
		}
	}
</style>
