<script lang="ts">
	import { t } from 'svelte-i18n';
	import type { Attachment } from 'svelte/attachments';
	import { asset } from '$app/paths';
	import { localizedPath, type Locale } from '$lib/i18n/routing';
	import GalaxyUpdateGallery from './GalaxyUpdateGallery.svelte';
	import GalaxyUpdatePhotoStack from './GalaxyUpdatePhotoStack.svelte';
	import type { Pathname } from '$app/types';

	/**
	 * Живі ілюстрації до пунктів вітального вікна.
	 *
	 * Не картинки, а самі речі, про які йдеться: стопку фото можна клацнути,
	 * викладача — відкрити, групу — перейти. Розповідати про кнопку словами й
	 * не давати її натиснути було б дивно там, де кнопка вже написана.
	 *
	 * ВСЕ ВІДКРИВАЄТЬСЯ В НОВІЙ ВКЛАДЦІ — навіть те, що веде на цей самий сайт.
	 * Це вікно не має кнопки виклику: до нього приходять за надісланим
	 * посиланням, і людина, яка пішла подивитися сторінку викладача, назад уже
	 * не повернеться — оголошення просто зникне.
	 */
	interface Props {
		/**
		 * Який пункт ілюструємо. Власну ілюстрацію мають `photos`, `gallery`,
		 * `form` і кожен ключ із `CHIPS`; решта лишається без картинки — це не
		 * помилка, а норма (`galaxy` малює зорі сам пункт, `teachers` —
		 * карусель поверх нього).
		 */
		id: string;
		lang: Locale;
		/** Курсор на цьому пункті — тоді кнопки почергово пульсують. */
		active?: boolean;
	}

	let { id, lang, active = false }: Props = $props();

	/*
	 * ЗАПАСНИЙ перелік до попереднього варіанта — сітки 2×2. Закоментований
	 * разом із її розміткою й стилями; повертати всі три частини треба разом.
	 *
	 * const TEACHERS = [
	 * 	{ slug: 'samuil-imas', name: 'Самуїл ІМАС' },
	 * 	{ slug: 'svitlana-ryskina', name: 'Світлана РИСЬКІНА' },
	 * 	{ slug: 'tetiana-isachkina', name: 'Тетяна ІСАЧКІНА' },
	 * 	{ slug: 'fedir-tkach', name: 'Федір ТКАЧ' }
	 * ];
	 */

	/*
	 * Пункти-переліки: одна конкретна сторінка й вихід до ВСІХ.
	 *
	 * Дві назви поспіль читалися як «ось ті дві, що є», і про решту ніхто не
	 * здогадувався. Перша показує, який вигляд має сторінка, друга веде туди,
	 * де їх усі, — а це і є те, що пункт пропонує зробити.
	 *
	 * П'ять таких пунктів малюються ОДНИМ блоком розмітки, а не п'ятьма
	 * однаковими: різниця між ними — лише адреса та підписи. Доти блоків було
	 * три, слово в слово однакових, і кожен новий перелік коштував ще двадцяти
	 * рядків копії; саме на четвертому й п'ятому це стало видно.
	 *
	 * `one` — однина для `data-testid`: список зветься `…-groups-list`, а
	 * посилання в ньому `…-group-link-…`. Окремим полем, а не відрізанням «s»
	 * від ключа: воно не вивелося б із `theatres` → `theatre` без винятків, а
	 * ламати вже наявні id заради однорідності ні до чого.
	 */
	const CHIPS: Record<
		string,
		{
			one: string;
			path: (key: string) => Pathname;
			items: { key: string; label?: string; labelKey?: string }[];
		}
	> = {
		groups: {
			one: 'group',
			path: (k) =>
				k ? `/projects/galaxy-graduates/groups/${k}` : '/projects/galaxy-graduates/groups/',
			items: [
				{ key: 'zakhysnyky-teatralnykh-kulis', label: 'ЗТК' },
				{ key: '', labelKey: 'galaxy.groupsTitle' }
			]
		},
		plays: {
			one: 'play',
			path: (k) =>
				k ? `/projects/galaxy-graduates/plays/${k}` : '/projects/galaxy-graduates/plays/',
			items: [
				{ key: 'mnymyi-bolnoi-2011', label: '«Уявно хворий»' },
				{ key: '', labelKey: 'galaxy.playsTitle' }
			]
		},
		festivals: {
			one: 'festival',
			path: (k) =>
				k ? `/projects/galaxy-graduates/festivals/${k}` : '/projects/galaxy-graduates/festivals/',
			items: [
				{ key: 'kvitucha-chekhiia', label: '«Квітуча Чехія»' },
				{ key: '', labelKey: 'galaxy.festivalsTitle' }
			]
		},
		/*
		 * Конкретний заклад — КНУТКіТ, і не тому, що він найвідоміший: туди
		 * вступили 42 наші людини, більше ніж будь-куди. Пункт обіцяє «список
		 * тих, хто вступив», тож вести він має на сторінку, де цей список
		 * справді довгий, а не на зразок із одним прізвищем.
		 */
		institutions: {
			one: 'institution',
			path: (k) =>
				k
					? `/projects/galaxy-graduates/institutions/${k}`
					: '/projects/galaxy-graduates/institutions/',
			items: [
				{ key: 'knutkit', label: 'КНУТКіТ' },
				{ key: '', labelKey: 'galaxy.institutionsTitle' }
			]
		},
		theatres: {
			one: 'theatre',
			path: (k) =>
				k ? `/projects/galaxy-graduates/theatres/${k}` : '/projects/galaxy-graduates/theatres/',
			items: [
				{ key: 'odeska-opera', label: 'Одеська опера' },
				{ key: '', labelKey: 'galaxy.theatresTitle' }
			]
		}
	};

	const SOCIAL_DEMOS = [
		{
			id: 'volodymyr-chalchynskyi',
			name: 'Володимир Чалчинський',
			face: '/graduates/volodymyr-chalchynskyi-96.webp',
			url: 'https://www.youtube.com/@DreamSchoolua'
		},
		{
			id: 'reverenciel',
			name: 'Роман Арабаджі',
			face: '/graduates/reverenciel-96.webp',
			url: 'https://www.youtube.com/@romanarabadzhi'
		},
		{
			id: 'odessitkavmonreale',
			name: 'Олена Мачтакова',
			face: '/graduates/olena-machtakova-96.webp',
			url: 'https://www.youtube.com/@odessitkavmonreale2025'
		}
	];

	/**
	 * За замовчуванням при старті — або Чалчинський (0), або reverenciel (1) випадковим чином.
	 * odessitkavmonreale (2) не може бути за замовчуванням — на неї потрапляють лише скролом.
	 */
	let socialIndex = $state(Math.random() < 0.5 ? 0 : 1);
	const currentSocial = $derived(SOCIAL_DEMOS[socialIndex]);

	/**
	 * Гортання соцмережі колесом миші під курсором.
	 * Перемикає між випускниками (всіма трьома) та блокує прокручування модалки.
	 */
	function wheelSocial(): Attachment {
		return (node) => {
			const element = node as HTMLElement;
			let wheelAcc = 0;
			let wheelAt = 0;
			const WHEEL_STEP = 40;
			const WHEEL_GAP = 200;

			function onWheel(e: WheelEvent) {
				e.preventDefault();
				const now = performance.now();
				if (now - wheelAt > WHEEL_GAP) wheelAcc = 0;
				wheelAt = now;
				wheelAcc += Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;

				if (wheelAcc >= WHEEL_STEP) {
					socialIndex = (socialIndex + 1) % SOCIAL_DEMOS.length;
					wheelAcc = 0;
				} else if (wheelAcc <= -WHEEL_STEP) {
					socialIndex = (socialIndex - 1 + SOCIAL_DEMOS.length) % SOCIAL_DEMOS.length;
					wheelAcc = 0;
				}
			}

			element.addEventListener('wheel', onWheel, { passive: false });

			return () => {
				element.removeEventListener('wheel', onWheel);
			};
		};
	}
</script>

{#if id === 'photos'}
	<GalaxyUpdatePhotoStack {active} />
{:else if id === 'gallery'}
	<GalaxyUpdateGallery />
{:else if id === 'teachers'}
	<!--
		Тут порожньо навмисно: карусель викладачів малює не ілюстрація, а сам
		пункт — вона накладка на весь його прямокутник, і зсередини ілюстрації
		дотягтися до країв пункту неможливо.
	-->
	<!--
		ЗАПАСНИЙ попередній варіант — сітка 2×2 з чотирьох імен, вписаних руками.
		Лишений за проханням автора, щоб було до чого повернутися.

		Чому його замінили: чотири імені обиралися вручну й нічим не були
		обґрунтовані, а список у коді старів окремо від даних. Карусель показує
		сімох із найбільшою кількістю пов'язаних випускників і рахує їх сама.

		Щоб повернути: розкоментувати розмітку нижче, прибрати рядок із
		`GalaxyUpdateTeacherArc` з `GalaxyUpdateFeatures`, і розкоментувати
		стилі `.grid` та `.face` — вони лежать у такому самому коментарі внизу
		файла.

	<ul class="grid" class:is-pulsing={active} data-testid="galaxy-update-teachers-list">
		{#each TEACHERS as person, i (person.slug)}
			<li>
				<a
					class="face"
					style="--order: {i}"
					href={localizedPath(`/residents/adults/${person.slug}`, lang)}
					target="_blank"
					rel="noopener"
					title={person.name}
					data-testid="galaxy-update-teacher-link-{person.slug}"
				>
					<img
						src={asset(`/masters/${person.slug}.webp`)}
						width="52"
						height="52"
						alt={person.name}
						loading="lazy"
					/>
				</a>
			</li>
		{/each}
	</ul>
	-->
{:else if CHIPS[id]}
	<div class="chips" class:is-pulsing={active} data-testid="galaxy-update-{id}-list">
		{#each CHIPS[id].items as item, i (item.key || 'all')}
			<a
				class="chip"
				style="--order: {i}"
				href={localizedPath(CHIPS[id].path(item.key), lang)}
				target="_blank"
				rel="noopener"
				data-testid="galaxy-update-{CHIPS[id].one}-link-{item.key || 'all'}"
			>
				{item.labelKey ? $t(item.labelKey) : item.label}
			</a>
		{/each}
	</div>
{:else if id === 'form'}
	<!--
		Значок наліплено на аватарку, як у месенджерах: так одразу видно, що
		посилання належить саме цій людині. Слово «YouTube» тут зайве — його
		несе сама іконка, а підпис лише розтягував рядок.
	-->
	<div
		class="social-demo"
		{@attach wheelSocial()}
		data-testid="galaxy-update-social-demo-card"
	>
		<img
			class="social-demo__face"
			src={asset(currentSocial.face)}
			width="48"
			height="48"
			alt={currentSocial.name}
			loading="lazy"
		/>
		<a
			class="social-demo__badge"
			class:is-pulsing={active}
			style="--order: 0"
			href={currentSocial.url}
			target="_blank"
			rel="external noopener noreferrer"
			aria-label="YouTube"
			title="YouTube — {currentSocial.name}"
			data-testid="galaxy-update-youtube-link"
		>
			<img
				src={asset('/social_media/YouTube-se-512px-50q.png')}
				width="28"
				height="28"
				alt=""
				loading="lazy"
			/>
		</a>
	</div>
{/if}

<style>
	/*
	 * Де саме ілюстрація стоїть у пункті — не її справа: обгортку `feature__figure`
	 * розміщує `GalaxyUpdateFeatures` разом із `utils/floatBottom`. Тут лише те,
	 * який вона має вигляд.
	 */
	/*
	 * ЗАПАСНІ стилі до попереднього варіанта — сітки 2×2. Закоментовані разом
	 * із самою розміткою вище: Svelte звітує про кожен селектор, під який на
	 * сторінці немає елемента, і залишені «про всяк випадок» правила давали б
	 * сім попереджень на кожній збірці.
	 *
	.grid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		(*
		 * Квадрат 2×2, однаковий на всіх ширинах.
		 *
		 * Ряд із чотирьох стояв тут доти, доки ілюстрація не вміла ставати
		 * смугою під текстом: він був заввишки в один аватар, тож тиснув текст
		 * лише два рядки замість п'яти. Тепер ширину поруч міряє `floatBottom`
		 * і сам вирішує, обтікати чи ні, — і квадрат нічого не ламає: на 414px
		 * він лишає тексту 180px при потрібних 168 і спокійно обтікається.
		 *)
		grid-template-columns: repeat(2, auto);
		gap: 0.4rem;
	}
	.face {
		display: block;
		width: 52px;
		height: 52px;
		border-radius: 50%;
		overflow: hidden;
		border: 2px solid rgb(140 190 255 / 0.35);
		transition:
			border-color var(--transition-fast),
			scale var(--transition-fast);
	}
	.face:hover {
		border-color: var(--galaxy-accent);
		scale: 1.06;
	}
	.face img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	 */

	.chips {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4rem;
	}
	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		min-height: 36px;
		padding: 0 0.8rem;
		border: var(--hairline-width) solid rgb(140 190 255 / 0.35);
		border-radius: 999px;
		background: rgb(255 255 255 / 0.06);
		color: var(--galaxy-text);
		font-size: 0.86rem;
		font-weight: 600;
		text-decoration: none;
		white-space: nowrap;
		transition:
			background var(--transition-fast),
			border-color var(--transition-fast);
	}
	.chip:hover {
		background: rgb(140 190 255 / 0.2);
		border-color: rgb(140 190 255 / 0.6);
	}


	/*
	 * Аватарка й значок ОДНАКОВІ (48×48) і зсунуті ПО ДІАГОНАЛІ.
	 *
	 * Коробка 76×76 при колах по 48 дає зсув центрів на 28px по обох осях:
	 * відстань між ними виходить ≈39.6 при сумі радіусів 48, тобто вони
	 * заходять одне на одне приблизно на 8px. Достатньо, щоб читалося як пара,
	 * і замало, щоб значок затуляв обличчя. У ряд вони стояли б як «людина та
	 * її позначка», а по діагоналі — як людина та її канал.
	 */
	.social-demo {
		position: relative;
		width: 76px;
		height: 76px;
		flex-shrink: 0;
	}
	.social-demo__face {
		position: absolute;
		top: 0;
		left: 0;
		width: 48px;
		height: 48px;
		border-radius: 50%;
		object-fit: cover;
		border: 2px solid rgb(140 190 255 / 0.35);
	}
	.social-demo__badge {
		position: absolute;
		right: 0;
		bottom: 0;
		display: grid;
		place-items: center;
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: var(--galaxy-card-bg);
		border: 2px solid var(--galaxy-card-bg);
	}
	.social-demo__badge img {
		border-radius: 7px;
	}

	/*
	 * Почергова хвиля: кожна наступна кнопка запізнюється на чверть секунди.
	 * Форма й тривалість — ті самі, що в картках складу групи
	 * (`GroupPersonCard`), щоб однаковий жест не виглядав на сайті двома
	 * різними способами. Тут вона коротша й без пауз: пункт наводять на
	 * секунду-дві, а не роздивляються хвилину.
	 */
	.is-pulsing .chip,
	.social-demo__badge.is-pulsing {
		animation: update-pulse 1.6s ease-in-out infinite;
		animation-delay: calc(var(--order, 0) * 0.22s);
	}
	@keyframes update-pulse {
		0%,
		55%,
		100% {
			transform: scale(1);
			box-shadow: none;
		}
		25% {
			transform: scale(1.09);
			box-shadow: 0 6px 18px rgb(140 190 255 / 0.35);
		}
	}
	/* Наведення на саму кнопку важливіше за хвилю — інакше вона тікає з-під курсора. */
	.chip:hover,
	.social-demo__badge:hover {
		animation: none;
	}
	@media (prefers-reduced-motion: reduce) {
		.is-pulsing .chip,
		.social-demo__badge.is-pulsing {
			animation: none;
		}
	}
</style>
