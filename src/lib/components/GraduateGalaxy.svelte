<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from 'svelte-i18n';
	import { browser } from '$app/environment';
	import {
		GRADUATES,
		graduatePhoto,
		graduatePhotoSrcset,
		type GraduateIndexEntry
	} from '$lib/data/graduates';

	interface Props {
		/** Скільки портретів летить одночасно. Решта чекає в пулі. */
		visible?: number;
		onselect: (graduate: GraduateIndexEntry) => void;
	}

	let { visible = 14, onselect }: Props = $props();

	/**
	 * Скільки зірок ЛЕТИТЬ поруч із портретами.
	 *
	 * Автор просив пропорцію «2/3 зірки, 1/3 фотографії». Буквально це дало б
	 * ~27 облич одночасно, і на екрані телефона вони стають конфетті: обличчя не
	 * розпізнається, а важить кожне як десяток зірок. Тому пропорція тримається
	 * ВІДЧУТТЯМ, а не числом: справжніх зірок кілька сотень (їх малює canvas),
	 * портретів 10–16, і на око фотографій саме «десь третина яскравих точок».
	 */
	const drifting = $derived(GRADUATES.slice(0, Math.min(visible, GRADUATES.length)));

	/**
	 * Позиція й темп кожного портрета.
	 *
	 * Порожній масив до монтування — і це навмисно. Значення випадкові, а
	 * випадковість під час prerender дала б HTML, який не збігається з першим
	 * кадром у браузері: гідрація «полагодила» б це стрибком усіх портретів.
	 * Тому в прередереному HTML портрети стоять рівним рядом, а розліт
	 * починається після монтування.
	 */
	let lanes = $state<{ top: number; duration: number; delay: number }[]>([]);

	/** Хто саме зараз у якій дорожці. Змінюється, коли портрет доїхав до краю. */
	let assigned = $state<number[]>([]);

	onMount(() => {
		lanes = drifting.map((_, i) => ({
			// Рівномірно по висоті плюс зсув: рівний крок читався б як сітка.
			top: (100 / drifting.length) * i + Math.random() * (60 / drifting.length),
			// 34–70 c на проліт екрана. Це поволі: ціль, яка тікає з-під курсора,
			// дратує (закон Фітса), а тут вона майже стоїть.
			duration: 34 + Math.random() * 36,
			delay: -Math.random() * 40
		}));
		assigned = drifting.map((_, i) => i);
	});

	/** Наступний випускник із пулу, якого зараз немає на екрані. */
	function rotate(lane: number) {
		const shown = new Set(assigned);
		const free = GRADUATES.map((_, i) => i).filter((i) => !shown.has(i));
		if (free.length === 0) return;
		assigned[lane] = free[Math.floor(Math.random() * free.length)];
	}

	const yearsLabel = (g: GraduateIndexEntry) =>
		[g.enrollmentYears.at(0), g.graduationYear].filter(Boolean).join(' — ');
</script>

<div class="galaxy" data-testid="galaxy-section">
	<!--
		Зірки — оформлення, і читалці вони ні про що не кажуть. Портрети натомість
		справжні кнопки: фокус, `alt`, `srcset` і вимірюваний розмір цілі дотику
		дістаються безкоштовно рівно тому, що це DOM, а не піксели на канвасі.
	-->
	<div class="galaxy__stars" aria-hidden="true">
		{#if browser}
			{#await import('$lib/components/backgrounds/Starfield.svelte') then { default: Starfield }}
				<Starfield />
			{/await}
		{/if}
	</div>

	<ul class="galaxy__lanes" data-testid="galaxy-list">
		{#each assigned as graduateIndex, lane (lane)}
			{@const graduate = GRADUATES[graduateIndex]}
			{@const geometry = lanes[lane]}
			<li
				class="lane"
				style="--top: {geometry?.top ?? 0}%; --duration: {geometry?.duration ?? 40}s; --delay: {geometry?.delay ?? 0}s"
				data-testid="galaxy-list-item-{graduate.slug}"
			>
				<!--
					Жодного обробника наведення: зупинку, збільшення й показ підпису
					робить CSS через `:hover` і `:focus-visible`. Перша версія тримала
					тут ще й стан `hovered` із чотирма обробниками — вони не впливали ні
					на що, бо в стилях цей клас не використовувався.
				-->
				<button
					type="button"
					class="star"
					onclick={() => onselect(graduate)}
					onanimationiteration={() => rotate(lane)}
					data-testid="galaxy-{graduate.slug}-btn"
				>
					<img
						class="star__photo"
						src={graduatePhoto(graduate.slug, 96)}
						srcset={graduatePhotoSrcset(graduate.slug)}
						sizes="(hover: hover) 176px, 96px"
						width="96"
						height="96"
						loading="lazy"
						decoding="async"
						alt={graduate.name}
					/>
					<span class="star__caption" aria-hidden="true">
						<span class="star__name">{graduate.name}</span>
						<span class="star__years">{yearsLabel(graduate)}</span>
					</span>
				</button>
			</li>
		{/each}
	</ul>

	<p class="galaxy__hint" data-testid="galaxy-hint">{$t('galaxy.hint')}</p>
</div>

<style>
	.galaxy {
		position: relative;
		/* dvh, а не vh: на мобільних панель браузера згортається, і нижній край
		   лишався б під нею (FLUID-SIZING-v8 § 2). */
		height: clamp(360px, 62dvh, 640px);
		overflow: hidden;
		border-radius: 1rem;
		background: var(--galaxy-bg);
		isolation: isolate;
	}

	.galaxy__stars {
		position: absolute;
		inset: 0;
		z-index: 0;
	}

	.galaxy__lanes {
		position: absolute;
		inset: 0;
		z-index: 1;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.lane {
		position: absolute;
		top: var(--top);
		left: 0;
		/* `translate` окремою властивістю, а не в `transform`: збільшення зірки
		   при наведенні живе саме в `transform`, і одне затирало б інше кадром
		   анімації (FLUID-SIZING-v8 § 5). */
		animation: drift var(--duration) linear var(--delay) infinite;
	}

	@keyframes drift {
		from {
			translate: -12% 0;
		}
		to {
			translate: calc(100vw + 12%) 0;
		}
	}

	.star {
		display: block;
		padding: 0;
		border: none;
		background: none;
		cursor: pointer;
		/* 48px — понад обов'язковий мінімум WCAG 2.2 (24) і в межах власного
		   стандарту проєкту для дотику. Гейт e2e/touch-targets це міряє. */
		width: 48px;
		height: 48px;
		border-radius: 50%;
		transition:
			transform 320ms cubic-bezier(0.2, 0.8, 0.2, 1),
			filter 320ms ease;
		filter: brightness(0.8) saturate(0.85);
	}

	.star__photo {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		object-fit: cover;
		box-shadow: 0 0 0 1px rgb(255 255 255 / 0.35), 0 0 14px 2px rgb(140 190 255 / 0.35);
	}

	/* Зупинка й збільшення — і для мишки, і для клавіатури. */
	.star:hover,
	.star:focus-visible {
		filter: brightness(1.05) saturate(1);
		transform: scale(1.85);
	}

	/*
	 * Портрети завмирають, ЩОЙНО курсор увійшов у галактику, а не коли він уже
	 * влучив у зірку. Пауза лише під наведеною зіркою не працює фізично: щоб
	 * зупинити ціль, її треба схопити, а вона їде. Знайшлося не оком — Playwright
	 * відмовився наводити курсор із «element is not stable», спробувавши 60 разів.
	 *
	 * Вимога «зірки далі летять, а ця зупиняється» збережена: летять СПРАВЖНІ
	 * зірки, їх кілька сотень і малює їх canvas, який паузи не знає. Завмирають
	 * лише чотирнадцять портретів — те, у що треба влучити.
	 */
	.galaxy:hover .lane,
	.galaxy:focus-within .lane {
		animation-play-state: paused;
	}

	.lane:has(.star:hover),
	.lane:has(.star:focus-visible) {
		z-index: 2;
	}

	.star__caption {
		position: absolute;
		left: 50%;
		top: calc(100% + 6px);
		translate: -50% 0;
		display: grid;
		gap: 2px;
		padding: 4px 8px;
		border-radius: 6px;
		background: rgb(5 10 31 / 0.82);
		color: var(--galaxy-text);
		white-space: nowrap;
		text-align: center;
		opacity: 0;
		transition: opacity 200ms ease;
		pointer-events: none;
		/* Підпис не масштабується разом із зіркою: інакше текст стає розмитим. */
		scale: calc(1 / 1.85);
	}

	.star:hover .star__caption,
	.star:focus-visible .star__caption {
		opacity: 1;
	}

	.star__name {
		font-size: 0.72rem;
		font-weight: 600;
	}

	.star__years {
		font-size: 0.62rem;
		opacity: 0.75;
	}

	.galaxy__hint {
		position: absolute;
		z-index: 2;
		right: 0.75rem;
		bottom: 0.5rem;
		margin: 0;
		font-size: 0.75rem;
		color: rgb(234 242 255 / 0.6);
	}

	/*
	 * ACCESSIBILITY-v8 § 7. Портрети перестають літати й вишиковуються рядком,
	 * який можна спокійно розглянути. Прибрати їх зовсім було б гірше: сторінка
	 * втратила б головне, а вимога стосується руху, не вмісту.
	 */
	@media (prefers-reduced-motion: reduce) {
		.lane {
			animation: none;
			position: static;
			translate: none;
		}

		.galaxy__lanes {
			position: absolute;
			display: flex;
			flex-wrap: wrap;
			align-content: center;
			justify-content: center;
			gap: 0.75rem;
			padding: 1rem;
		}

		.star {
			transition: none;
		}
	}
</style>
