<script lang="ts">
	import { asset } from '$app/paths';
	import { localizedPath, type Locale } from '$lib/i18n/routing';
	import GalaxyUpdatePhotoStack from './GalaxyUpdatePhotoStack.svelte';

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
		/** Який пункт ілюструємо: `photos`, `teachers`, `groups`, `form`. */
		id: string;
		lang: Locale;
		/** Курсор на цьому пункті — тоді кнопки почергово пульсують. */
		active?: boolean;
	}

	let { id, lang, active = false }: Props = $props();

	const TEACHERS = [
		{ slug: 'samuil-imas', name: 'Самуїл ІМАС' },
		{ slug: 'svitlana-ryskina', name: 'Світлана РИСЬКІНА' },
		{ slug: 'tetiana-isachkina', name: 'Тетяна ІСАЧКІНА' },
		{ slug: 'fedir-tkach', name: 'Федір ТКАЧ' }
	];

	const GROUPS = [
		{ slug: 'zakhysnyky-teatralnykh-kulis', label: 'ЗТК' },
		{ slug: 'skomorokhy', label: 'Скоморохи' }
	];

	/** Володимир Чалчинський — єдина анкета, де YouTube уже стоїть. */
	const YOUTUBE_URL = 'https://www.youtube.com/@DreamSchoolua';
</script>

{#if id === 'photos'}
	<GalaxyUpdatePhotoStack {active} />
{:else if id === 'teachers'}
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
{:else if id === 'groups'}
	<div class="chips" class:is-pulsing={active} data-testid="galaxy-update-groups-list">
		{#each GROUPS as group, i (group.slug)}
			<a
				class="chip"
				style="--order: {i}"
				href={localizedPath(`/projects/galaxy-graduates/groups/${group.slug}`, lang)}
				target="_blank"
				rel="noopener"
				data-testid="galaxy-update-group-link-{group.slug}"
			>
				{group.label}
			</a>
		{/each}
	</div>
{:else if id === 'form'}
	<!--
		Значок наліплено на аватарку, як у месенджерах: так одразу видно, що
		посилання належить саме цій людині. Слово «YouTube» тут зайве — його
		несе сама іконка, а підпис лише розтягував рядок.
	-->
	<div class="social-demo" data-testid="galaxy-update-social-example">
		<img
			class="social-demo__face"
			src={asset('/graduates/volodymyr-chalchynskyi-96.webp')}
			width="48"
			height="48"
			alt="Володимир Чалчинський"
			loading="lazy"
		/>
		<a
			class="social-demo__badge"
			class:is-pulsing={active}
			style="--order: 0"
			href={YOUTUBE_URL}
			target="_blank"
			rel="external noopener noreferrer"
			aria-label="YouTube"
			title="YouTube"
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
	.grid,
	.chips,
	.social-demo {
		margin-left: auto;
	}
	.grid,
	.chips {
		justify-content: flex-end;
	}

	.grid {
		list-style: none;
		margin: 0 0 0 auto;
		padding: 0;
		display: grid;
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
		border: 1px solid rgb(140 190 255 / 0.35);
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
	.is-pulsing .face,
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
	.face:hover,
	.chip:hover,
	.social-demo__badge:hover {
		animation: none;
	}
	@media (prefers-reduced-motion: reduce) {
		.is-pulsing .face,
		.is-pulsing .chip,
		.social-demo__badge.is-pulsing {
			animation: none;
		}
	}
</style>
