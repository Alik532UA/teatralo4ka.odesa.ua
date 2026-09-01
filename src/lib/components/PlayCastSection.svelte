<script lang="ts">
	import { t } from 'svelte-i18n';
	import { Users } from 'lucide-svelte';
	import GroupPersonCard from '$lib/components/GroupPersonCard.svelte';
	import { GRADUATES, graduatePhoto } from '$lib/data/graduates';
	import { createNameMatcher } from '$lib/utils/participantMatch';
	import { openGraduateModal } from '$lib/services/graduateModal.svelte';
	import type { CastMember } from '$lib/data/playCast';
	import type { PlayProgrammeItem } from '$lib/data/plays';

	/**
	 * «Хто грав» — і все, що про людей цього показу відомо.
	 *
	 * ## Чому окремий компонент
	 *
	 * Сторінка вистави вже мала стелю 430 SLOC, а сюди прийшли фільтри з власним
	 * станом, два переліки з паперу школи й розкладка по номерах програми. Це
	 * один блок з однією відповідальністю — «люди цього показу», — і він
	 * виноситься цілим.
	 *
	 * ## Чому фільтр, а не заголовки над гуртами
	 *
	 * Спершу склад був розкладений по номерах програми заголовками. Але номер
	 * названо не всім: у вечорі з дев'яти уривків у нас буває один-два з іменами.
	 * Тоді сторінка показувала один підпис і одну картку, а решти складу — з
	 * паперу школи — не показувала взагалі: вона лежала нижче, під нагородами,
	 * дрібним текстом.
	 *
	 * Фільтр вирішує обидві задачі одним прийомом: спершу видно ВЕСЬ склад, і
	 * далі, поки уривки визначаються, кнопки дають звузити до одного. Кнопка
	 * номера, у якому ще нікого не назвали, лишається видимою й неактивною — так
	 * видно і сам уривок, і те, що про нього ще не сказали.
	 *
	 * ## Два переліки з паперу
	 *
	 * `participants` — склад показу з реєстру школи, `extraParticipants` — ті,
	 * кого в джерелі позначено знаком «+», тобто прийшли додатково. Вони тут, а
	 * не під нагородами, бо це ті самі люди показу — просто без анкет, тож
	 * картки на них немає. Пояснення знака «+» — у докблоці
	 * `Play.extraParticipants`.
	 */
	interface Props {
		cast: readonly CastMember[];
		programme?: readonly PlayProgrammeItem[];
		participants?: readonly string[];
		extraParticipants?: readonly string[];
	}

	let { cast, programme, participants, extraParticipants }: Props = $props();

	/** Ключ кнопки «уривок не названо». Номера з таким ключем не буває. */
	const БЕЗ_НОМЕРА = '—';

	/** Обраний номер програми. `null` — показувати весь склад. */
	let обраний = $state<string | null>(null);

	const номери = $derived(
		(programme ?? []).map((item) => ({
			item,
			count: cast.filter((entry) => entry.item === item.id).length
		}))
	);

	/** Чи є сенс у фільтрі: номери мусять бути, і хоч в одного — люди. */
	const єФільтр = $derived(номери.some((н) => н.count > 0));

	/**
	 * Ті, хто назвав вечір, а не уривок, — окремою кнопкою.
	 *
	 * Сюди ж падає той, чий номер із програми зник (перейменували ключ):
	 * загубити людину гірше, ніж показати її без уривка.
	 */
	const безНомера = $derived.by(() => {
		const відомі = new Set((programme ?? []).map((item) => item.id));
		return cast.filter((entry) => !entry.item || !відомі.has(entry.item));
	});

	/**
	 * Паперовий склад — теж КАРТКАМИ, а не текстовим переліком.
	 *
	 * Доти це був дрібний список під нагородами: сім імен, серед них ті, у кого
	 * на сайті є анкета й обличчя. Ім'я звіряється з реєстром тим самим
	 * `createNameMatcher`, що вже зіставляє склад у репертуарі майстра.
	 *
	 * Кого не знайшли — картка без обличчя й без переходу: ім'я в школи є, анкети
	 * немає, і вести нікуди. Саме тому `GroupPersonCard` без `href` і `onclick`
	 * малює не кнопку, а простий блок.
	 */
	const знайти = createNameMatcher(GRADUATES);

	function паперові(імена: readonly string[] | undefined) {
		return (імена ?? []).map((raw) => ({ raw, graduate: знайти(raw) }));
	}

	/** Той самий підпис, що в решти карток сторінки: «випуск 2012». */
	function підписРоку(year: number | null | undefined): string | null {
		return year ? `${$t('galaxy.graduationShort', { default: 'випуск' })} ${year}` : null;
	}

	const склад = $derived(паперові(participants));
	const додатково = $derived(паперові(extraParticipants));

	const видимі = $derived(
		обраний === null
			? [...cast]
			: обраний === БЕЗ_НОМЕРА
				? безНомера
				: cast.filter((entry) => entry.item === обраний)
	);
</script>

<section class="play-section" aria-labelledby="play-cast-title">
	<div class="play-heading">
		<span class="play-heading__icon"><Users size={20} aria-hidden="true" /></span>
		<h2 id="play-cast-title" class="play-heading__title">{$t('galaxy.playCast')}</h2>
		<span class="play-heading__count">{cast.length}</span>
	</div>

	{#if cast.length > 0}
		{#if єФільтр}
			<div class="filters" role="group" aria-label={$t('galaxy.playProgrammeFilter')}>
				<button
					type="button"
					class="filters__btn"
					class:filters__btn--on={обраний === null}
					aria-pressed={обраний === null}
					onclick={() => (обраний = null)}
					data-testid="play-programme-filter-btn-all"
				>
					{$t('galaxy.playProgrammeAll')}
					<span class="filters__count">{cast.length}</span>
				</button>
				{#each номери as { item, count } (item.id)}
					<button
						type="button"
						class="filters__btn"
						class:filters__btn--on={обраний === item.id}
						class:filters__btn--guess={item.fromProfile}
						aria-pressed={обраний === item.id}
						disabled={count === 0}
						onclick={() => (обраний = item.id)}
						data-testid="play-programme-filter-btn-{item.id}"
					>
						{item.title}
						<span class="filters__count">{count}</span>
					</button>
				{/each}
				{#if безНомера.length > 0}
					<button
						type="button"
						class="filters__btn"
						class:filters__btn--on={обраний === БЕЗ_НОМЕРА}
						aria-pressed={обраний === БЕЗ_НОМЕРА}
						onclick={() => (обраний = БЕЗ_НОМЕРА)}
						data-testid="play-programme-filter-btn-other"
					>
						{$t('galaxy.playCastNoItem')}
						<span class="filters__count">{безНомера.length}</span>
					</button>
				{/if}
			</div>
		{/if}

		<ul class="people-grid" data-testid="play-cast-list">
			{#each видимі as entry, index (entry.graduate.id)}
				<li>
					<!--
						Картка відкривається НА ЦІЙ сторінці, а не веде в галактику:
						закривши її, читач лишається на виставі.
					-->
					<GroupPersonCard
						name={entry.graduate.name}
						photo={entry.graduate.hasPhoto ? graduatePhoto(entry.graduate.slug, 192) : null}
						subtitle={entry.role ?? підписРоку(entry.graduate.graduationYear)}
						onclick={() => openGraduateModal(entry.graduate)}
						{index}
						splitName
						testid="play-cast-{entry.graduate.slug}"
					/>
				</li>
			{/each}
		</ul>
		<p class="play-note" data-testid="play-cast-note-text">{$t('galaxy.playCastNote')}</p>
	{:else}
		<p class="play-note" data-testid="play-cast-empty-text">{$t('galaxy.playCastEmpty')}</p>
	{/if}

	{#snippet паперовийПерелік(
		люди: { raw: string; graduate: ReturnType<typeof знайти> }[],
		підпис: string,
		testid: string,
		зсув: number
	)}
		<p class="paper__title">{підпис}</p>
		<ul class="people-grid" data-testid={testid}>
			{#each люди as { raw, graduate }, i (raw)}
				<li>
					<GroupPersonCard
						name={graduate?.name ?? raw}
						photo={graduate?.hasPhoto ? graduatePhoto(graduate.slug, 192) : null}
						subtitle={підписРоку(graduate?.graduationYear)}
						onclick={graduate ? () => openGraduateModal(graduate) : undefined}
						index={зсув + i}
						splitName
						testid="{testid}-{graduate?.slug ?? i}"
					/>
				</li>
			{/each}
		</ul>
	{/snippet}

	{#if склад.length > 0}
		{@render паперовийПерелік(склад, $t('galaxy.playLineup'), 'play-participants-list', cast.length)}
	{/if}

	{#if додатково.length > 0}
		{@render паперовийПерелік(
			додатково,
			$t('galaxy.playParticipants'),
			'play-extra-participants-list',
			cast.length + склад.length
		)}
	{/if}
</section>

<style>
	/*
	 * Стилі секції — КОПІЯ правил зі сторінки вистави, звідки блок переїхав.
	 *
	 * Svelte скоупить стилі по компоненту: правила, що лишилися в `+page.svelte`,
	 * до цієї розмітки не застосуються, і блок мовчки втратив би вигляд — саме
	 * та помилка, яку ловить гейт `component-styles`. Зробити їх глобальними теж
	 * не варіант: `.play-note`, `.people-grid` — імена надто загальні, щоб
	 * пускати їх на весь сайт.
	 *
	 * Тому копія, а не посилання. Значення мусять збігатися з сусідніми
	 * секціями сторінки (майстри, нагороди, репертуар): різниця в заголовку
	 * читалася б як помилка верстки.
	 */
	.play-section {
		margin: 0 0 2.5rem;
	}

	.play-heading {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		margin: 0 0 1.1rem;
	}

	.play-heading__title {
		margin: 0;
		font-size: clamp(1.2rem, 2.4vw, 1.5rem);
		font-weight: 800;
		color: var(--text-title);
	}

	.play-heading__count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.6rem;
		height: 1.6rem;
		padding: 0 0.4rem;
		border-radius: 999px;
		background: var(--bg-surface);
		color: var(--text-muted);
		font-size: 0.82rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}

	.play-heading__icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.2rem;
		height: 2.2rem;
		border-radius: 0.7rem;
		background: rgb(90 140 255 / 0.16);
		color: #7fb0ff;
	}

	.play-note {
		margin: 0.9rem 0 0;
		color: var(--text-muted);
		font-size: 0.9rem;
		line-height: 1.6;
	}

	/*
	 * `min(220px, 100%)`, а не голі 220px: гола довжина в `minmax` — це ПІДЛОГА,
	 * і у вужчому контейнері колонка лишається тієї самої ширини й жене сторінку
	 * боком. Гейт `fluid-sizing` це міряє.
	 */
	.people-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(220px, 100%), 1fr));
		gap: 0.9rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	@media (max-width: 480px) {
		.people-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin: 0 0 1rem;
	}

	.filters__btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		/* 24px — мінімум WCAG 2.2 AA; кнопок буває під десяток у рядок. */
		min-height: 28px;
		padding: 0.2rem 0.7rem;
		border: 1px solid var(--border-main);
		border-radius: 999px;
		background: var(--bg-card);
		color: var(--text-main);
		font: inherit;
		font-size: 0.82rem;
		cursor: pointer;
		transition:
			background var(--transition-fast),
			border-color var(--transition-fast),
			color var(--transition-fast);
	}

	.filters__btn:hover:not(:disabled),
	.filters__btn:focus-visible {
		border-color: var(--accent-primary);
		color: var(--text-title);
	}

	.filters__btn--on {
		background: var(--accent-primary);
		border-color: var(--accent-primary);
		color: var(--text-on-accent);
	}

	/*
	 * Номер, у якому ще нікого не назвали, лишається ВИДИМИМ і неактивним: так
	 * видно і сам уривок, і те, що про нього ще не сказали. Прибрати його —
	 * означало б приховати половину вечора.
	 */
	.filters__btn:disabled {
		opacity: 0.45;
		cursor: default;
	}

	/* Номер, відомий лише зі слів випускника, а не з переліку школи. */
	.filters__btn--guess {
		font-style: italic;
	}

	.filters__count {
		opacity: 0.7;
		font-variant-numeric: tabular-nums;
	}

	.paper__title {
		margin: 1rem 0 0.3rem;
		color: var(--text-muted);
		font-size: 0.85rem;
		font-weight: 500;
	}

</style>
