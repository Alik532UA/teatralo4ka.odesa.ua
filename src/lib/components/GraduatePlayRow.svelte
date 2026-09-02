<script lang="ts">
	import { t, locale } from 'svelte-i18n';
	import { Theater } from 'lucide-svelte';
	import RichTextWithFlags from '$lib/components/RichTextWithFlags.svelte';
	import PlayRowExtras from '$lib/components/PlayRowExtras.svelte';
	import { hasLink } from '$lib/utils/formatFlags';
	import { localizedPath } from '$lib/i18n/routing';
	import { getPlayById, playPath } from '$lib/data/plays';
	import type { GraduatePlay } from '$lib/data/graduates';
	import type { PlayRowGroup } from '$lib/data/playRowGroups';

	/**
	 * Один рядок переліку «Вистави та ролі» в анкеті — вистава або цілий вечір.
	 *
	 * ## Чому вечір — один рядок, а не три
	 *
	 * Коли людина грала в кількох уривках одного вечора, в анкеті це кілька
	 * рядків — по одному на уривок, бо роль живе в рядку (докблок
	 * `GraduatePlay.items`). Показані поспіль, вони повторювали рік, назву
	 * вечора й плашку «разом з Freedom» тричі й різнилися лише хвостом. Тому
	 * рядки одного `playId` згортаються (`groupPlayRows`): рік, назва вечора з
	 * реєстру й плашка — раз, а нижче — уривки, кожен зі своєю роллю.
	 *
	 * ## Запис вечора і запис уривка — різні кнопки
	 *
	 * Вечір буває записаний цілком (`Play.videoUrl`), а буває — кожен уривок
	 * окремо (`PlayProgrammeItem.videoUrl`), і трапляється обидва разом. Тому
	 * кнопка запису стоїть на двох рівнях: у шапці вечора — спільний запис, у
	 * рядку уривка — його власний. Одиночний рядок бере запис уривка, якщо він
	 * є, інакше вечора: так нічого не губиться, коли уривок у людини один і
	 * шапки вечора над ним немає.
	 *
	 * ## Чому окремий компонент
	 *
	 * `GraduateProfileView` стояв за одинадцять рядків від своєї стелі SLOC, і
	 * згортання туди не влізло б. Розмітка рядка й так була цілісним шматком —
	 * вона переїхала сюди разом зі стилями: Svelte скоупить їх по компоненту, і
	 * правила, що лишилися б у блоку стилів батька, до цієї розмітки не
	 * застосувалися б (гейт `component-styles`).
	 */
	interface Props {
		group: PlayRowGroup;
		/** Порядковий номер у переліку — основа `data-testid`, як і доти. */
		index: number;
		/** `id` випускника — для плашки «разом з». */
		memberId: string;
		/** Чи малювати колонку року: у переліку без жодного року її немає ні в кого. */
		showYear: boolean;
		/** Щільний режим плашки вистав — див. `denseCols` у `GraduateProfileView`. */
		dense?: boolean;
	}

	let { group, index, memberId, showYear, dense = false }: Props = $props();

	const lang = $derived<'uk' | 'en'>($locale === 'en' ? 'en' : 'uk');
	const playId = $derived(group.kind === 'single' ? group.row.playId : group.playId);
	const play = $derived(playId ? getPlayById(playId) : undefined);
	const year = $derived(group.kind === 'single' ? group.row.year : group.year);

	/**
	 * Назва номера в рядку уривка — з програми вечора, а не з тексту анкети.
	 *
	 * Текст рядка повторює назву вечора («Уривки з класики: Незнайомка; О. Блок»,
	 * Пан у блакитному») — саме те, що згортання й прибирає. Коли номера в
	 * програмі немає (ключ перейменували або рядок без уривків), лишається
	 * текст: загубити рядок гірше, ніж показати його довшим.
	 */
	function partTitle(row: GraduatePlay): string | null {
		const titles = (row.items ?? [])
			.map((id) => play?.programme?.find((item) => item.id === id)?.title)
			.filter((title): title is string => Boolean(title));
		return titles.length > 0 ? titles.join(', ') : null;
	}
</script>

<li class="play" class:play--dense={dense} data-testid="galaxy-card-play-item-{index}">
	{#if showYear}
		<span class="play__year">{year ?? ''}</span>
	{/if}
	<!--
		Текст і хвіст стоять У КОЛОНЦІ, а не в один рядок: «разом з ЗТК» і кнопка
		запису праворуч від тексту з'їдали під себе місце, і у вузькій картці назва
		з роллю тислася в колонку з двох слів. Заміряно на скріншоті замовника.
	-->
	<div class="play__body">
		{#if group.kind === 'single'}
			{@const row = group.row}
			<!--
				Рядок стає ПОСИЛАННЯМ лише там, де є `playId`. Рядок із власним
				посиланням усередині обгорнути ще одним не можна — `<a>` в `<a>`
				невалідний, і Svelte у dev валить сторінку цілком; тоді до вистави
				веде окремий значок.
			-->
			{#if row.playId && !hasLink(row.text)}
				<a
					class="play__text play__link"
					href={localizedPath(playPath(row.playId), lang)}
					data-testid="galaxy-card-play-link-{index}"
				>
					<RichTextWithFlags text={row.text} />
				</a>
			{:else if row.playId}
				<span class="play__text"><RichTextWithFlags text={row.text} /></span>
				<a
					class="play__page-link"
					href={localizedPath(playPath(row.playId), lang)}
					aria-label="{$t('galaxy.playTitle')}: {row.text}"
					title={$t('galaxy.playTitle')}
					data-testid="galaxy-card-play-link-{index}"
				>
					<Theater size={15} aria-hidden="true" />
				</a>
			{:else}
				<span class="play__text"><RichTextWithFlags text={row.text} /></span>
			{/if}
			<PlayRowExtras
				playId={row.playId}
				items={row.items}
				{memberId}
				hideCoGroups={row.hideCoGroups}
				testidBase="galaxy-card-play-item-{index}"
			/>
		{:else}
			<!-- Вечір: назва з реєстру й плашка раз, уривки нижче зі своїми ролями. -->
			<a
				class="play__text play__link"
				href={localizedPath(playPath(group.playId), lang)}
				data-testid="galaxy-card-play-link-{index}"
			>
				{play?.title ?? group.rows[0].text}
			</a>
			<!--
				Плашку «разом з» ховає прохання БУДЬ-ЯКОГО з рядків: показати те, що
				людина просила прибрати, гірше, ніж не показати там, де можна було.
			-->
			<PlayRowExtras
				playId={group.playId}
				{memberId}
				hideCoGroups={group.rows.some((row) => row.hideCoGroups)}
				testidBase="galaxy-card-play-item-{index}"
			/>
			<ul class="play__parts">
				{#each group.rows as row, j (j)}
					{@const title = partTitle(row)}
					<li class="play__part" data-testid="galaxy-card-play-part-item-{index}-{j}">
						<span class="play__text">
							{#if title}
								{title}{#if row.role}, {row.role}{/if}
							{:else}
								<RichTextWithFlags text={row.text} />
							{/if}
						</span>
						<PlayRowExtras
							playId={group.playId}
							items={row.items}
							itemsOnly
							hideCoGroups
							{memberId}
							testidBase="galaxy-card-play-part-{index}-{j}"
						/>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</li>

<style>
	/*
	 * Стилі рядка — КОПІЯ правил з `GraduateProfileView`, звідки рядок переїхав.
	 * Значення мусять збігатися з переліком фестивалів у тій самій картці, який
	 * і далі верстається класами `.play`/`.play__text` батька: різниця читалася
	 * б як помилка верстки.
	 */
	.play {
		display: flex;
		gap: 0.6rem;
		padding: 0.35rem 0;
		border-top: 1px solid rgb(255 255 255 / 0.08);
	}
	.play:first-child {
		border-top: none;
	}
	/* Щільний режим: числа з заміру в докблоці `.bento-card--plays-dense` батька. */
	.play--dense {
		padding: 0.22rem 0;
	}
	.play--dense .play__body {
		row-gap: 0.05rem;
	}
	.play__year {
		flex-shrink: 0;
		min-width: 3.2rem;
		color: var(--galaxy-muted);
		font-variant-numeric: tabular-nums;
	}
	/*
	 * Сітка, а не колонка: у першому рядку назва й кнопка запису праворуч, у
	 * другому — «разом з ЗТК», притиснуте праворуч. Клітинки другої колонки
	 * розставляє собі сам `PlayRowExtras`.
	 *
	 * `minmax(0, 1fr)` — щоб довга назва з роллю переносилася, а не розпирала
	 * рядок. `flex: 1` — щоб кнопка запису стояла в СВОЇЙ колонці однаково в
	 * кожному рядку, а не липла до назви різної довжини.
	 */
	.play__body {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: start;
		flex: 1;
		min-width: 0;
		column-gap: 0.4rem;
		row-gap: 0.15rem;
	}
	.play__text {
		min-width: 0;
		color: var(--galaxy-text);
		overflow-wrap: anywhere;
	}
	/*
	 * Підкреслення пунктиром, а не суцільне: у рядку вистави підкреслювати
	 * доводиться і назву, і роль разом — суцільна лінія під усім рядком
	 * читалася б як помилка розмітки.
	 */
	.play__link {
		color: inherit;
		text-decoration: underline dotted;
		text-underline-offset: 0.18em;
		text-decoration-color: rgb(140 190 255 / 0.45);
		transition:
			color var(--transition-fast),
			text-decoration-color var(--transition-fast);
	}
	.play__link:hover,
	.play__link:focus-visible {
		color: var(--galaxy-accent);
		text-decoration-style: solid;
	}
	/* Значок веде на сторінку вистави там, де сам рядок посиланням бути не може. */
	.play__page-link {
		display: inline-flex;
		align-items: center;
		margin-left: 0.35rem;
		color: rgb(140 190 255 / 0.55);
		transition: color var(--transition-fast);
	}
	.play__page-link:hover,
	.play__page-link:focus-visible {
		color: var(--galaxy-accent);
	}
	/*
	 * Уривки вечора — сходинкою під його назвою, з тонкою лінією ліворуч: так
	 * видно, що це частини одного рядка, а не сусідні вистави. Кожен уривок —
	 * та сама сітка «текст + кнопка запису», що й у рядка вистави.
	 */
	.play__parts {
		grid-column: 1 / -1;
		margin: 0.15rem 0 0;
		padding: 0 0 0 0.75rem;
		list-style: none;
		border-left: 2px solid rgb(140 190 255 / 0.2);
	}
	.play__part {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: start;
		column-gap: 0.4rem;
		padding: 0.15rem 0;
	}
</style>
