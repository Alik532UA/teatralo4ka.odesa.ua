<script lang="ts">
	import { t } from 'svelte-i18n';
	import PlanetFace from './PlanetFace.svelte';
	import { faceFloor, fitFaceFraction, planetSpots } from '$lib/utils/planetLayout';
	import type { GraduateIndexEntry } from '$lib/data/graduates';

	/**
	 * САМА КУЛЯ з обличчями на кільцях.
	 *
	 * ## Чому окремий компонент, коли розкладка одна
	 *
	 * Куля й те, що навколо неї, — різні задачі: тут розкладка облич і замір
	 * ширини, у `PlanetSplit` — дві колонки, пошук і перелік імен. Разом це
	 * чотириста рядків, тобто вище стелі файлу; окремо кожен читається за раз.
	 *
	 * Спершу компонент виник з іншої причини — кулю показували ДВІ розкладки з
	 * трьох, — і 2026-09-08 автор лишив одну. Межа від цього не погіршала.
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
		/** Стеля ширини кулі в пікселях; вона ж — здогад до першого заміру. */
		maxWidth?: number;
		testIdPrefix?: string;
	}

	let {
		students,
		onopen,
		active = null,
		onactive = () => {},
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

	/**
	 * Ім'я під обличчям — двома рядками, прізвище з нового.
	 *
	 * Пряме прохання автора. Причина видна на кулі: «Анастасія Ніколаєва» в один
	 * рядок ширша за три обличчя, і плашка лізе на сусідів; у два рядки вона
	 * вдвічі вужча. Ділиться за ПЕРШИМ пробілом, бо в реєстрі ім'я записане як
	 * «Ім'я Прізвище» — подвійне прізвище лишається цілим у другому рядку.
	 */
	const розбити = (ім: string) => {
		const пробіл = ім.indexOf(' ');
		return пробіл === -1
			? { імʼя: ім, прізвище: '' }
			: { імʼя: ім.slice(0, пробіл), прізвище: ім.slice(пробіл + 1) };
	};
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
			{@const частини = розбити(учень.name)}
			{@const значок = частка > 0.12 ? 28 : 18}
			<button
				type="button"
				class="pupil"
				class:is-active={active === учень.id}
				style="left: {місце.x}%; top: {місце.y}%; --tip-from: {учень.hasPhoto
					? 'var(--face, 72px)'
					: `${значок}px`};"
				aria-label={учень.name}
				onclick={() => onopen(учень)}
				onpointerenter={() => onactive(учень.id)}
				onpointerleave={() => onactive(null)}
				onfocus={() => onactive(учень.id)}
				onblur={() => onactive(null)}
				data-testid="{testIdPrefix}-{учень.slug}-btn"
			>
				<PlanetFace student={учень} icon={значок} />
				<span class="pupil__tip" data-testid="{testIdPrefix}-{учень.slug}-tooltip">
					<span>{частини.імʼя}</span>
					{#if частини.прізвище}<span>{частини.прізвище}</span>{/if}
				</span>
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
		/*
		 * КУЛЯ ОДНОГО КОЛЬОРУ, а не суміш трьох.
		 *
		 * Доти вона малювалася так: 45 % `--accent-primary` плямою згори, 38 %
		 * `--accent-secondary` плямою знизу, і все це поверх `--bg-surface`. У
		 * синьо-блакитних темах виходило гарно — бо всі три кольори з однієї
		 * родини. У решти — бруд, і автор назвав саме ці дві:
		 *
		 *   жовта: акцент #9ADCFF (блакитний) 45 % поверх жовтого #FFF89A —
		 *     блакитний і жовтий доповняльні, а їхня суміш це болотяний;
		 *   темно-бірюзова: #00ADB5 поверх сірого #393E46 — каламутна бірюза.
		 *
		 * Тобто дефект не в підборі відсотків: змішувати ДОВІЛЬНІ два кольори
		 * теми й сподіватися на чистий результат не можна в принципі.
		 *
		 * Тому тепер тіло кулі — це `--bg-surface` і НІЩО ІНШЕ, а об'єм робить
		 * світло: та сама поверхня, освітлена (домішка білого) і затінена
		 * (домішка чорного). Біле й чорне не мають власного тону, тож
		 * забруднити ними неможливо — вони лише світлішають і темнішають.
		 *
		 * Акцент лишився, але як ВІДБЛИСК: 20 % у точці, звідки падає світло.
		 * Стільки видно як колірний характер теми й замало, щоб перефарбувати
		 * кулю.
		 *
		 * `in oklab`, а не `in srgb`: змішування в sRGB темнішає через сірий
		 * (жовтий + чорний у sRGB дає брудніший тон, ніж має бути), а oklab
		 * міняє яскравість, лишаючи тон на місці. Різниця найпомітніша саме на
		 * жовтому — тобто в тій темі, з якої все й почалося.
		 */
		background:
			radial-gradient(
				circle at 30% 24%,
				color-mix(in oklab, var(--accent-primary) 20%, transparent),
				transparent 52%
			),
			radial-gradient(
				125% 125% at 30% 22%,
				color-mix(in oklab, var(--bg-surface) 76%, #ffffff),
				var(--bg-surface) 48%,
				color-mix(in oklab, var(--bg-surface) 86%, #000000)
			);
		box-shadow:
			/* Нижній край підбирає тінь — тим самим чорним, а не кольором теми:
			   `--text-title` тут додавав би третій тон до вже освітленої кулі. */
			inset 0 -26px 52px rgb(0 0 0 / 0.14),
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
		/*
		 * Відлік від ВИДИМОГО, а не від зайнятого місця.
		 *
		 * `100%` — це нижній край `--face`, тобто прямокутника, який розкладка
		 * тримає під обличчя. У портрета він і є коло, тож усе збігається. А от
		 * у квітки, відколи навколо неї немає кола, всередині цього прямокутника
		 * лишається порожньо: при обличчі 93 px сама квітка 28, і плашка
		 * від’їжджала від неї на три десятки пікселів — саме це й видно на
		 * знімку автора.
		 *
		 * Тому відлік іде від ЦЕНТРУ плюс половина того, що справді намальовано:
		 * `--tip-from` ставить кнопка, і воно дорівнює або `--face`, або розміру
		 * значка.
		 */
		top: calc(50% + var(--tip-from, var(--face, 72px)) / 2 + 0.3rem);
		left: 50%;
		translate: -50% 0;
		display: grid;
		justify-items: center;
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
		line-height: 1.25;
		text-align: center;
		/* Рядок не переноситься САМ: перенос лише там, де його поставили ми. */
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
