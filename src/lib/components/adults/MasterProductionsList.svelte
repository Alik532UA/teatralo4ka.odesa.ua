<script lang="ts">
	import { t } from 'svelte-i18n';
	import { Trophy, Video, Users } from 'lucide-svelte';
	import { playPath, type Play } from '$lib/data/plays';
	import { localizedPath } from '$lib/i18n/routing';
	import { playGroupCaption } from '$lib/data/groups';
	import { PLAY_CAST } from '$lib/data/playCast';
	import GraduateAvatarRow from '$lib/components/GraduateAvatarRow.svelte';

	/**
	 * Список: один рядок — одна вистава.
	 *
	 * ## Що цей режим робить такого, чого не робить плитка
	 *
	 * Плитка показує виставу цілком — склад, нагороди, посилання на запис. Це
	 * добре, поки вистав десяток. У Федора Ткача їх вісімдесят, і щоб знайти
	 * потрібний рік, доводиться гортати екранами. Рядок натомість тримає лише те,
	 * за чим шукають — номер, рік, назву, автора, групу, — і показує решту
	 * значками: нагорода, запис, скільки людей у складі. Тобто це не «та сама
	 * картка, тільки менша», а інша відповідь: перебігти очима замість роздивитися.
	 *
	 * ## Чому склад тут не розкривається посиланнями
	 *
	 * У плитці кожен учасник — посилання на його сторінку, і зіставлення імен із
	 * реєстром коштує розкладки на модуль (див. `MasterProductionCard`). Тут це
	 * було б і зайвим, і шкідливим: рядок має лишатися одним рухом ока, а сотня
	 * посилань у ньому перетворює список назад на плитку. Показане число складу
	 * веде до тієї самої вистави в режимі плитки, де імена натискаються.
	 */
	interface Props {
		productions: Play[];
		isEn?: boolean;
	}

	let { productions, isEn = false }: Props = $props();
</script>

<ol class="prod-rows" data-testid="master-productions-rows-list">
	{#each productions as prod, idx (prod.title + String(prod.year) + (prod.number ?? idx))}
		<!-- Назва курсу видима, номер — тихо. Чому так: `playGroupCaption`. -->
		{@const caption = playGroupCaption(
			prod.id,
			(PLAY_CAST[prod.id] ?? []).map((c) => c.graduateId),
			prod.theatreGroup,
			isEn
		)}
		{@const castIds = (PLAY_CAST[prod.id] ?? []).map((c) => c.graduateId)}
		<li class="prod-row" data-testid="master-productions-row-{prod.id}">
			<span class="prod-row__year">
				{#if prod.number}<span class="prod-row__num">#{prod.number}</span>{/if}
				<span class="prod-row__date">{prod.year}</span>
			</span>

			<span class="prod-row__main">
				<a
					href={localizedPath(playPath(prod.id), isEn ? 'en' : 'uk')}
					class="prod-row__title-link"
					data-testid="master-productions-row-link-{prod.id}"
				>
					<span class="prod-row__title">{prod.title}</span>
				</a>
				{#if prod.author}<span class="prod-row__author">{prod.author}</span>{/if}
			</span>

			<!-- Склад — власна колонка сітки; чому не окремий рядок, див. хронологію. -->
			{#if castIds.length}
				<span class="prod-row__cast">
					<GraduateAvatarRow
						ids={castIds}
						testIdPrefix="master-productions-row-cast-{prod.id}"
						max={6}
					/>
				</span>
			{:else}
				<span></span>
			{/if}

			<span class="prod-row__marks">
				{#each caption.names as name (name)}
					<span class="prod-row__group">{name}</span>
				{/each}
				{#if caption.number ?? caption.note}
					<span class="prod-row__number">{caption.number ?? caption.note}</span>
				{/if}
				{#if prod.participants?.length}
					<span class="prod-row__mark" title={$t('galaxy.participants', { default: 'Склад' })}>
						<Users size={14} aria-hidden="true" />
						<span>{prod.participants.length}</span>
					</span>
				{/if}
				{#if prod.awards?.length}
					<span
						class="prod-row__mark prod-row__mark--award"
						title={prod.awards.join('; ')}
						data-testid="master-productions-row-awards-mark-{prod.id}"
					>
						<Trophy size={14} aria-hidden="true" />
						<span>{prod.awards.length}</span>
					</span>
				{/if}
				{#if prod.videoUrl}
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
					<a class="prod-row__mark prod-row__mark--video" href={prod.videoUrl} target="_blank" rel="external noopener noreferrer" title={$t('galaxy.watchVideo', { default: 'Дивитися відео' })} data-testid="master-productions-row-video-link-{prod.id}">
						<Video size={14} aria-hidden="true" />
					</a>
				{/if}
			</span>

		</li>
	{/each}
</ol>

<style>
	.prod-row__cast {
		display: block;
		min-width: 0;
	}

	.prod-rows {
		container-type: inline-size;
		list-style: none;
		margin: 0;
		padding: 0;
		border: 1px solid var(--border-main);
		border-radius: var(--radius-lg, 16px);
		overflow: hidden;
		background: var(--bg-card);
	}
	.prod-row {
		display: grid;
		grid-template-columns: minmax(5.5rem, auto) 1fr auto auto;
		align-items: center;
		gap: 1rem;
		padding: 0.7rem 1rem;
		border-top: 1px solid var(--border-main);
	}
	.prod-row:first-child {
		border-top: none;
	}
	.prod-row:hover {
		background: var(--bg-surface);
	}
	.prod-row__year {
		display: flex;
		align-items: baseline;
		gap: 0.4rem;
		/* Роки читаються стовпчиком — цифри мусять бути однакової ширини. */
		font-variant-numeric: tabular-nums;
	}
	.prod-row__num {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--text-muted);
	}
	.prod-row__date {
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--text-title);
	}
	.prod-row__main {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		min-width: 0;
	}
	.prod-row__title {
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--text-title);
		transition: color var(--transition-base, 0.2s ease);
	}
	.prod-row__title-link {
		color: inherit;
		text-decoration: none;
		display: inline-block;
	}
	.prod-row__title-link:hover .prod-row__title {
		color: var(--accent-primary);
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.prod-row__author {
		font-size: 0.82rem;
		color: var(--text-muted);
	}
	.prod-row__marks {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		justify-content: flex-end;
	}
	.prod-row__number {
		font-size: 0.72rem;
		font-weight: 500;
		color: var(--text-muted);
		letter-spacing: 0.02em;
	}

	.prod-row__group {
		padding: 0.15rem 0.55rem;
		border-radius: var(--radius-full, 9999px);
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-muted);
	}
	.prod-row__mark {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--text-muted);
		text-decoration: none;
	}
	.prod-row__mark--award {
		color: #b45309;
	}
	.prod-row__mark--video {
		color: #dc2626;
	}
	.prod-row__mark--video:hover {
		color: #991b1b;
	}

	/*
	 * На телефоні три колонки не вміщаються: назва стискалася до двох слів, а
	 * значки з'їжджали під неї нерівним хвостом. Рядок стає у два поверхи —
	 * рік із назвою зверху, позначки знизу.
	 */
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
		.prod-row {
			grid-template-columns: minmax(4.5rem, auto) 1fr;
			row-gap: 0.4rem;
		}
		.prod-row__cast,
		.prod-row__marks {
			grid-column: 1 / -1;
			justify-content: flex-start;
		}
	}
</style>
