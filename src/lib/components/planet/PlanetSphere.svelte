<script lang="ts">
	import { t } from 'svelte-i18n';
	import PlanetFace from './PlanetFace.svelte';
	import { faceFloor, fitFaceFraction, planetSpots } from '$lib/utils/planetLayout';
	import type { GraduateIndexEntry } from '$lib/data/graduates';

	/**
	 * САМА КУЛЯ з обличчями на кільцях — спільна для двох розкладок із трьох.
	 *
	 * ## Чому окремий компонент
	 *
	 * «Орбіти» і «Планета й перелік» показують ОДНУ Й ТУ САМУ кулю, різниця лише
	 * в тому, що навколо неї. Доти цей десяток рядків стояв у двох файлах, і
	 * перша ж правка (непрозоре тло плашки) мусила б робитися двічі — тобто
	 * одного дня зробилася б один раз.
	 *
	 * ## Що куля вирішує сама
	 *
	 * Розмір обличчя й розкладку. Обидва залежать від ЗАМІРЯНОЇ ширини кулі, а
	 * ширину знає тільки вона сама, тож рахувати це ззовні означало б передавати
	 * замір туди-сюди. Назовні віддається рівно те, що видно очима: підсвічений
	 * зараз учень (`active`/`onactive`) — бо в парі з переліком підсвічує перелік.
	 *
	 * ## Хто не вмістився
	 *
	 * Кілець скінченно, обличчя не меншає за палець, тож на вузькому екрані
	 * частина людей на кулю не стає. Про це сказано рядком під кулею — саме тут,
	 * поруч із нею, а не десь у кінці сторінки: питання «а де решта?» виникає в
	 * людини рівно тоді, коли вона дивиться на кулю.
	 */
	interface Props {
		/* `readonly`: реєстр приходить сталим переліком, і компонент його не міняє. */
		students: readonly GraduateIndexEntry[];
		onopen: (student: GraduateIndexEntry) => void;
		/** Кого підсвічено. Приходить ЗЗОВНІ: у парі з переліком вирішує перелік. */
		active?: string | null;
		onactive?: (id: string | null) => void;
		/** Плашка з іменем біля обличчя — там, де немає переліку з іменами. */
		tip?: boolean;
		/** Стеля ширини кулі в пікселях; вона ж — здогад до першого заміру. */
		maxWidth?: number;
		testIdPrefix?: string;
	}

	let {
		students,
		onopen,
		active = null,
		onactive = () => {},
		tip = false,
		maxWidth = 620,
		testIdPrefix = 'creativity-planet'
	}: Props = $props();

	/*
	 * Ширина ЗАМІРЯНА, а не порахована з `min(78vmin, …)` удруге в JS: дублювати
	 * правило CSS означало б, що одного дня його поміняють в одному місці.
	 * Початкове значення — стеля, тобто те, що видає сервер; після монтування
	 * воно уточнюється, і на телефоні дно 44 px спрацьовує.
	 */
	let заміряна = $state<number | null>(null);
	const ширина = $derived(заміряна ?? maxWidth);

	const частка = $derived(fitFaceFraction(students.length, 0.16, faceFloor(ширина)));
	const місця = $derived(planetSpots(students.length, частка));
	const зайві = $derived(students.length - місця.length);
</script>

<div class="sphere">
	<div
		class="planet"
		bind:clientWidth={заміряна}
		style="--face: {(частка * 100).toFixed(2)}cqw; --planet-max: {maxWidth}px"
		data-testid="{testIdPrefix}-list"
	>
		{#each місця as місце (students[місце.index].id)}
			{@const учень = students[місце.index]}
			<button
				type="button"
				class="pupil"
				class:is-active={active === учень.id}
				style="left: {місце.x}%; top: {місце.y}%;"
				aria-label={учень.name}
				onclick={() => onopen(учень)}
				onpointerenter={() => onactive(учень.id)}
				onpointerleave={() => onactive(null)}
				onfocus={() => onactive(учень.id)}
				onblur={() => onactive(null)}
				data-testid="{testIdPrefix}-{учень.slug}-btn"
			>
				<PlanetFace student={учень} icon={частка > 0.12 ? 28 : 18} />
				{#if tip}
					<span class="pupil__tip">{учень.name}</span>
				{/if}
			</button>
		{/each}

		{#if students.length === 0}
			<p class="planet-empty">{$t('planet.empty')}</p>
		{/if}
	</div>

	{#if зайві > 0}
		<p class="overflow" data-testid="{testIdPrefix}-overflow-count">
			{$t('planet.overflow', { values: { count: зайві }, default: `…і ще ${зайві}` })}
		</p>
	{/if}
</div>

<style>
	.sphere {
		display: grid;
		justify-items: center;
	}

	/*
	 * `container-type: inline-size` — щоб розмір обличчя задавався в `cqw`, тобто
	 * у відсотках САМОЇ кулі. Інакше довелося б рахувати пікселі в JS і
	 * перераховувати їх на кожну зміну ширини вікна.
	 */
	.planet {
		container-type: inline-size;
		position: relative;
		width: min(78vmin, var(--planet-max, 620px));
		aspect-ratio: 1;
		border-radius: 50%;
		border: 1px solid var(--border-main);
		background:
			radial-gradient(
				circle at 32% 28%,
				color-mix(in srgb, var(--accent-primary) 45%, transparent),
				transparent 58%
			),
			radial-gradient(
				circle at 68% 78%,
				color-mix(in srgb, var(--accent-secondary) 38%, transparent),
				transparent 62%
			),
			linear-gradient(
				160deg,
				color-mix(in srgb, var(--accent-primary) 16%, var(--bg-surface)),
				var(--bg-surface)
			);
		box-shadow:
			inset 0 -30px 60px color-mix(in srgb, var(--text-title) 10%, transparent),
			var(--shadow-main);
	}

	.pupil {
		position: absolute;
		translate: -50% -50%;
		display: grid;
		justify-items: center;
		padding: 0;
		background: none;
		border: 0;
		color: inherit;
		font: inherit;
		cursor: pointer;
		transition: transform var(--transition-base);
	}
	.pupil:hover,
	.pupil:focus-visible,
	.pupil.is-active {
		transform: scale(1.12);
		z-index: 3;
	}

	/*
	 * Плашка з іменем БІЛЯ обличчя — лише для активного. Вона `position:
	 * absolute`, тобто не займає місця й не рухає сусідів; `white-space: nowrap`,
	 * бо переносити ім'я в двох рядках над кулею гірше, ніж винести його за край.
	 */
	.pupil__tip {
		position: absolute;
		top: calc(100% + 0.3rem);
		left: 50%;
		translate: -50% 0;
		padding: 0.3rem 0.55rem;
		border-radius: var(--radius-sm, 6px);
		/*
		 * Стиль — той самий, що в підказки однокурсників (`GraduateAvatarRow`):
		 * тло картки, рамка, тінь. Не «щось схоже», а буквально те саме, бо це
		 * той самий жест — навести на кружечок і побачити ім'я.
		 *
		 * Тло НЕПРОЗОРЕ: плашка лягає на сусіднє обличчя, і крізь напівпрозоре
		 * тло проступало коло — напис ставав нечитним саме тоді, коли потрібен.
		 */
		background: var(--bg-card);
		border: 1px solid var(--border-main);
		box-shadow: 0 8px 20px rgb(0 0 0 / 0.24);
		color: var(--text-title);
		font-size: 0.78rem;
		font-weight: 600;
		white-space: nowrap;
		opacity: 0;
		pointer-events: none;
		transition: opacity var(--transition-base);
	}
	.pupil:hover .pupil__tip,
	.pupil:focus-visible .pupil__tip,
	.pupil.is-active .pupil__tip {
		opacity: 1;
	}

	.overflow {
		margin: 0.5rem 0 0;
		color: var(--text-muted);
		font-size: 0.9rem;
		text-align: center;
	}

	.planet-empty {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		margin: 0;
		padding: 2rem;
		text-align: center;
		color: var(--text-muted);
	}
</style>
