<script lang="ts">
	import { t, locale } from 'svelte-i18n';
	import { Theater } from 'lucide-svelte';
	import RichTextWithFlags from '$lib/components/RichTextWithFlags.svelte';
	import PlayRowVideoButton from '$lib/components/PlayRowVideoButton.svelte';
	import PlayRowGroups from '$lib/components/PlayRowGroups.svelte';
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
	 * шапки вечора над ним немає. Правило вибору — у `PlayRowVideoButton`.
	 *
	 * ## Як зверстано: назва — один шматок, хвіст — інший
	 *
	 * Тіло рядка — флекс із переносом. Перший елемент — назва (зі значком
	 * переходу, коли сама назва посиланням бути не може). Другий — ХВІСТ: плашка
	 * «разом з» і за нею кнопка запису, нерозривно, притиснуті праворуч. Хвіст
	 * стоїть у тому ж рядку, коли вміщається; коли ні — переходить цілим на
	 * наступний рядок, теж праворуч, не тиснучи назву. Порядок у хвості — від
	 * замовника (2026-09-02): «разом з …», потім значок. Чому не завжди в одному
	 * рядку й не завжди в різних — у докблоці `PlayRowGroups`. Уривки вечора —
	 * третім елементом, на всю ширину, сходинкою під назвою.
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
	<div class="play__body">
		{#if group.kind === 'single'}
			{@const row = group.row}
			<div class="play__main">
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
			</div>
			<!-- Хвіст рядка: спершу «разом з», за ним кнопка запису — замовник читає саме так. -->
			<div class="play__tail">
				<PlayRowGroups
					playId={row.playId}
					{memberId}
					hideCoGroups={row.hideCoGroups}
					testidBase="galaxy-card-play-item-{index}"
				/>
				<PlayRowVideoButton
					playId={row.playId}
					items={row.items}
					testidBase="galaxy-card-play-item-{index}"
				/>
			</div>
		{:else}
			<!-- Вечір: назва з реєстру й плашка раз, уривки нижче зі своїми ролями. -->
			<div class="play__main">
				<a
					class="play__text play__link"
					href={localizedPath(playPath(group.playId), lang)}
					data-testid="galaxy-card-play-link-{index}"
				>
					{play?.title ?? group.rows[0].text}
				</a>
			</div>
			<!--
				Плашку «разом з» ховає прохання БУДЬ-ЯКОГО з рядків: показати те, що
				людина просила прибрати, гірше, ніж не показати там, де можна було.
			-->
			<div class="play__tail">
				<PlayRowGroups
					playId={group.playId}
					{memberId}
					hideCoGroups={group.rows.some((row) => row.hideCoGroups)}
					testidBase="galaxy-card-play-item-{index}"
				/>
				<PlayRowVideoButton playId={group.playId} testidBase="galaxy-card-play-item-{index}" />
			</div>
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
						<PlayRowVideoButton
							playId={group.playId}
							items={row.items}
							itemsOnly
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
	 * Флекс із переносом, а не сітка: сітка знає лише «завжди в одному рядку»
	 * або «завжди в різних», а плашці «разом з» треба «в тому ж, якщо
	 * вміщається». Перенос вирішує це сам: коли назва з кнопкою і плашка не
	 * вміщаються разом, плашка йде рядком нижче, а назва лишається цілою.
	 *
	 * `baseline` — щоб напис «разом з» стояв на одній лінії з першим рядком
	 * назви, а не по верхньому краю чипа. `flex: 1` і `min-width: 0` — щоб тіло
	 * займало все, що лишилося після року, і довга назва переносилася, а не
	 * розпирала картку.
	 */
	.play__body {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		flex: 1;
		min-width: 0;
		column-gap: 0.4rem;
		row-gap: 0.15rem;
	}
	/*
	 * Назва РОСТЕ (`flex: 1 1 auto`) і забирає все, що лишилося в рядку: так
	 * хвіст стоїть біля правого краю, а не липне до назви. Значок переходу
	 * всередині — одразу за текстом.
	 */
	.play__main {
		display: flex;
		align-items: start;
		gap: 0.4rem;
		flex: 1 1 auto;
		min-width: 0;
	}
	/*
	 * Хвіст — ОДИН нерозривний шматок: плашка «разом з», за нею кнопка запису.
	 * Саме таким порядком читає замовник: спершу з ким, потім значок. Флекс із
	 * переносом не вміє переставити два сусідні елементи так, щоб переносився
	 * лише один із них — тож вони переносяться разом, і це не втрата: у рядку
	 * нижче хвіст так само притиснутий праворуч.
	 */
	.play__tail {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		flex-shrink: 0;
		margin-left: auto;
	}
	/* В уривку хвоста немає — кнопка запису стоїть біля правого краю сама. */
	.play__part > .play__text {
		flex: 1 1 auto;
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
		flex-shrink: 0;
		color: rgb(140 190 255 / 0.55);
		transition: color var(--transition-fast);
	}
	.play__page-link:hover,
	.play__page-link:focus-visible {
		color: var(--galaxy-accent);
	}
	/*
	 * Уривки вечора — сходинкою під його назвою, з тонкою лінією ліворуч: так
	 * видно, що це частини одного рядка, а не сусідні вистави. На всю ширину
	 * (`flex-basis: 100%`), тобто завжди окремим рядком під назвою й плашкою.
	 */
	.play__parts {
		flex: 1 1 100%;
		margin: 0.15rem 0 0;
		padding: 0 0 0 0.75rem;
		list-style: none;
		border-left: 2px solid rgb(140 190 255 / 0.2);
	}
	/* Уривок — той самий шматок «текст + кнопка запису», що й назва рядка. */
	.play__part {
		display: flex;
		align-items: start;
		gap: 0.4rem;
		padding: 0.15rem 0;
	}
</style>
