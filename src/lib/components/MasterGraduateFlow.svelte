<script lang="ts">
	import { onMount } from 'svelte';
	import { Spring } from 'svelte/motion';
	import { MediaQuery } from 'svelte/reactivity';
	import { hideWhenScrolledDeep } from '$lib/utils/hideWhenScrolledDeep.svelte';
	import { goto } from '$app/navigation';
	import { locale, t } from 'svelte-i18n';
	import { page } from '$app/state';
	import { localeFromPath } from '$lib/i18n/routing';
	import type { GraduateIndexEntry } from '$lib/data/graduates';
	import { masterProfilePath, type MasterStudentEntry } from '$lib/data/masters';
	import GraduateStar from '$lib/components/GraduateStar.svelte';
	import GraduateCard from '$lib/components/GraduateCard.svelte';
	import DualRoleChooser from '$lib/components/DualRoleChooser.svelte';
	import {
		closeGraduateModal,
		graduateFromPageState,
		openGraduateModal
	} from '$lib/services/graduateModal.svelte';

	interface Props {
		graduates?: GraduateIndexEntry[];
		students?: MasterStudentEntry[];
		masterName: string;
	}

	let { graduates, students, masterName }: Props = $props();

	/**
	 * Ширина потоку йде за курсором — так само, як смуга авторського скролу.
	 *
	 * Числа й спосіб узяті звідти ж (`PageScrollbar`) свідомо: це той самий
	 * жест на тому самому краю екрана, і два різні закони наближення читалися
	 * б як несправність. Пружина потрібна, бо без неї ширина смикається за
	 * кожним рухом миші.
	 */
	let mouseX = $state(0);
	let windowWidth = $state(0);
	let pointerInside = $state(false);

	const wideLayout = new MediaQuery('(min-width: 860px)');
	const reducedMotion = new MediaQuery('(prefers-reduced-motion: reduce)');

	const proximity = $derived.by(() => {
		if (!wideLayout.current || reducedMotion.current) return 0;
		if (!pointerInside || !windowWidth) return 0;
		const start = 0.32 * windowWidth;
		const end = 0.04 * windowWidth;
		const distance = windowWidth - mouseX;
		if (distance > start) return 0;
		if (distance < end) return 1;
		return (start - distance) / (start - end);
	});

	const spread = new Spring(0, { stiffness: 0.05, damping: 0.4 });

	$effect(() => {
		spread.target = proximity;
	});

	/** Спокійна ширина — та сама, що була статичною до цієї зміни. */
	const restWidth = $derived(Math.min(Math.max(280, windowWidth * 0.22), 400));
	const nearWidth = $derived(Math.min(Math.max(360, windowWidth * 0.42), 620));
	const streamWidth = $derived(restWidth + (nearWidth - restWidth) * spread.current);

	/**
	 * Потік з'їжджає за правий край, коли читач опустився ГЛИБОКО.
	 *
	 * Він `position: fixed` на всю висоту праворуч, тобто висить над змістом.
	 * Угорі сторінки це доречно, нижче — перекриває праву частину рядків груп і
	 * репертуару.
	 *
	 * Раніше рішення ухвалював напрямок руху, і воно смикалося: вісім пікселів
	 * униз угорі сторінки ховали потік, який нікому не заважав, а рух угору біля
	 * підвалу повертав стовпець просто на текст. Тепер вирішує глибина — чому
	 * саме так і звідки число, у докблоці `hideWhenScrolledDeep`.
	 */
	const scroll = hideWhenScrolledDeep();

	let started = $state(false);
	let photoLanes = $state<{ left: number; duration: number; delay: number }[]>([]);
	let plainLanes = $state<{ left: number; duration: number; delay: number }[]>([]);

	/** Випускник, чию картку зараз показуємо поверх сторінки. */
	/* Вибір — у стані сторінки; див. `$lib/services/graduateModal`. */
	const selectedGraduate = $derived(graduateFromPageState());

	const normalizedStudents = $derived<MasterStudentEntry[]>(
		students && students.length > 0
			? students
			: (graduates ?? []).map((g) => ({
					kind: 'graduate' as const,
					relation: 'master' as const,
					graduate: g
				}))
	);

	/**
	 * Один вид для зірки, зведений із двох різних записів.
	 *
	 * Випускник і колега-майстер лежать у різних місцях і мають різні поля: у
	 * випускника є рік випуску й портрет у `static/graduates/`, у колеги — роль у
	 * школі й портрет у `static/masters/`. Зірці ж потрібні ті самі величини, тому
	 * зведення робиться ТУТ, один раз, а не розгалуженням у розмітці.
	 *
	 * `entry` лишається поруч: по кліку треба знати, куди вести — на сторінку
	 * профілю випускника чи на сторінку майстра.
	 */
	interface StarPerson {
		key: string;
		tier: 'colleague' | 'graduate' | 'student';
		hasPhoto: boolean;
		/** Портрет поза текою випускників; `null` — брати звідти, як досі. */
		photo: string | null;
		/** Зірка приймає запис випускника, тож колезі складаємо сумісний. */
		graduate: GraduateIndexEntry;
		entry: MasterStudentEntry;
	}

	const people = $derived<StarPerson[]>(
		normalizedStudents.map((entry) => {
			if (entry.kind === 'master') {
				const m = entry.master;
				/*
				 * Обличчя — з АНКЕТИ ВИПУСКНИКА, якщо вона є.
				 *
				 * Доти зірка брала портрет працівника, і людина в потоці учнів
				 * виглядала дорослою викладачкою — тобто не тією, ким її пам'ятає
				 * майстер, у чиєму потоці вона летить. Портрет працівника лишається
				 * запасним: у трьох колег (`studiedUnder` без анкети) анкети немає.
				 */
				const fromGraduate = entry.graduate?.hasPhoto === true;
				return {
					key: `master:${m.slug}`,
					tier: 'colleague' as const,
					hasPhoto: fromGraduate || Boolean(m.photo),
					/* `null` означає «брати з теки випускників за slug» — саме це й
					   потрібно, коли анкета є. */
					photo: fromGraduate ? null : (m.photo ?? null),
					graduate: {
						/* Колега летить у потоці карткою випускника, тож мусить мати
						   ту саму форму. Ключ береться майстрів — власного в нього
						   немає, і вигадувати другий для тієї самої людини не варто. */
						id: m.id,
						/* Slug випускника, коли беремо його портрет: адреса знімка
						   складається саме з нього (`/graduates/<slug>-96.webp`). */
						slug: fromGraduate && entry.graduate ? entry.graduate.slug : m.slug,
						name: $locale === 'en' ? m.displayNameEn : m.displayName,
						/* Рік бере запис випускника ТІЄЇ САМОЇ людини, якщо він є:
						   у працівника такого поля немає, а ці семеро доти летіли
						   записом випускника й рік показували. Див.
						   `MasterStudentEntry`. */
						graduationYear: entry.graduate?.graduationYear ?? null,
						departments: m.departments,
						...(fromGraduate || m.photo ? { hasPhoto: true as const } : {}),
						...(entry.graduate?.photoCount ? { photoCount: entry.graduate.photoCount } : {})
					},
					entry
				};
			}
			return {
				key: `graduate:${entry.graduate.slug}`,
				tier: entry.relation === 'teacher' ? ('student' as const) : ('graduate' as const),
				hasPhoto: Boolean(entry.graduate.hasPhoto),
				photo: null,
				graduate: entry.graduate,
				entry
			};
		})
	);

	const withPhoto = $derived(people.filter((p) => p.hasPhoto));
	const withoutPhoto = $derived(people.filter((p) => !p.hasPhoto));

	function makeVerticalLanes(count: number, minSeconds: number, random: () => number) {
		if (count <= 0) return [];
		if (count === 1) {
			return [{
				left: 50,
				duration: minSeconds + random() * minSeconds * 0.5,
				delay: -random() * minSeconds * 2
			}];
		}

		const minSafe = 18;
		const maxSafe = 82;
		const span = maxSafe - minSafe;
		const step = span / count;

		return Array.from({ length: count }, (_, index) => {
			const center = minSafe + step * (index + 0.5);
			const jitter = (random() - 0.5) * step * 0.7;
			const left = Math.min(maxSafe, Math.max(minSafe, center + jitter));
			return {
				left,
				duration: minSeconds + random() * minSeconds * 0.5,
				delay: -random() * minSeconds * 2
			};
		});
	}

	onMount(() => {
		photoLanes = makeVerticalLanes(withPhoto.length, 22, Math.random);
		plainLanes = makeVerticalLanes(withoutPhoto.length, 18, Math.random);
		started = true;
	});

	const flying = $derived(
		started
			? [
					...withoutPhoto.map((person, lane) => ({
						kind: 'plain' as const,
						lane,
						person,
						geometry: plainLanes[lane]
					})),
					...withPhoto.map((person, lane) => ({
						kind: 'photo' as const,
						lane,
						person,
						geometry: photoLanes[lane]
					}))
				]
			: []
	);

	/**
	 * Кого спитати, яку сторінку відкрити.
	 *
	 * У людини, що є і випускником, і працівником, справді ДВІ сторінки, і вони
	 * відповідають на різні питання. Вгадувати за читача — помилятися в половині
	 * випадків; подробиці в докблоці `DualRoleChooser`.
	 */
	let chooser = $state<StarPerson | null>(null);

	function handleSelect(person: StarPerson) {
		const locale = localeFromPath(page.url.pathname);

		if (person.entry.kind === 'master') {
			/* Анкети немає — вибору немає: у трьох колег (`studiedUnder` без
			   запису випускника) друга сторінка просто не існує. */
			if (person.entry.graduate) return void (chooser = person);
			goto(masterProfilePath(person.entry.master.slug, locale));
			return;
		}

		/*
		 * Випускник відкривається КАРТКОЮ тут, а не переходом у галактику.
		 *
		 * Доти перехід робився для тих, у кого є анкета, а картка лишалася тільки
		 * для решти — тобто поведінка залежала від повноти даних: та сама зірка
		 * то відкривала вікно, то забирала зі сторінки майстра. Картка дістає
		 * анкету сама, тож різниці між цими двома випадками більше немає.
		 */
		openGraduateModal(person.entry.graduate);
	}
</script>

<!--
	Курсор ловиться на ВІКНІ, а не на самому потоці: сам він
	`pointer-events: none` (крізь нього видно й натискається сторінку), тож
	власних подій миші не отримує зовсім.
-->
<svelte:window
	bind:innerWidth={windowWidth}
	onpointermove={(e) => {
		mouseX = e.clientX;
		pointerInside = true;
	}}
	onpointerleave={() => (pointerInside = false)}
/>

<aside
	class="flow-stream"
	class:flow-stream--hidden={scroll.hidden}
	style={wideLayout.current ? `width: ${streamWidth.toFixed(1)}px` : undefined}
	aria-label={$t('galaxy.graduatesOfMaster', { default: `Випускники майстра: ${masterName}` })}
	data-testid="master-graduate-flow-section"
>
	{#if normalizedStudents.length > 0}
		<ul class="flow-lanes" data-testid="master-graduate-flow-list">
			{#each flying as item (item.kind + item.lane + item.person.key)}
				<li
					class="lane lane--{item.kind}"
					style="--left: {item.geometry?.left ?? 50}; --duration: {item.geometry?.duration ?? 22}s; --delay: {item.geometry?.delay ?? 0}s"
					data-testid="master-graduate-flow-item-{item.person.graduate.slug}"
					data-tier={item.person.tier}
				>
					<GraduateStar
						graduate={item.person.graduate}
						kind={item.kind}
						tier={item.person.tier}
						photo={item.person.photo}
						onselect={() => handleSelect(item.person)}
					/>
				</li>
			{/each}
		</ul>
	{/if}
</aside>

<!-- Та сама картка, що й у галактиці. Анкету вона дістає сама, а кнопку
     «Заповнити анкету» й саму форму тримає всередині. -->
{#if chooser && chooser.entry.kind === 'master' && chooser.entry.graduate}
	<DualRoleChooser
		master={chooser.entry.master}
		graduate={chooser.entry.graduate}
		onclose={() => (chooser = null)}
	/>
{/if}

<GraduateCard
	showGalaxyLink
	graduate={selectedGraduate}
	onclose={closeGraduateModal}
/>

<style>
	.flow-stream {
		position: relative;
		width: 100%;
		height: 100%;
		min-height: 480px;
		pointer-events: none;
		overflow: visible;
	}

	@media (min-width: 860px) {
		.flow-stream {
			position: fixed;
			right: 0;
			top: 0;
			bottom: 0;
			/*
			 * Запасне значення: ширину задає інлайновий стиль, який рахує
			 * наближення курсора. Це — те, що видно до першого руху мишею й
			 * при знятому JavaScript.
			 */
			width: clamp(280px, 22vw, 400px);
			height: auto;
			min-height: 0;
			z-index: 5;
			/*
			 * Перехід ОДИН на обидва боки: і від'їзд, і повернення однаково
			 * плавні й неспішні.
			 *
			 * Спершу тут була несиметрія — зникнення плавне, поява миттєва, — і
			 * поява читалася як стрибок. Тому одне правило на базі, а не два:
			 * браузер бере `transition` зі стану, до якого йде, тож оголошення
			 * тут працює в обох напрямках і розійтися їм нема на чому.
			 *
			 * 700 мс, а не `--transition-base` (250): стовпець їде на 280–400
			 * пікселів, і чверть секунди на такій відстані — ривок. Крива
			 * симетрична (плавний початок і плавний кінець), бо рух теж
			 * симетричний: жоден бік не головніший.
			 *
			 * Власного `prefers-reduced-motion` тут немає навмисно: у
			 * `styles/global.css` уже стоїть правило, яке гасить `transition` усім
			 * через `!important`. Локальна копія була б другим джерелом того самого.
			 */
			transition: translate 700ms cubic-bezier(0.4, 0, 0.2, 1);
		}

		/* Повністю за край, а не прозорість: напівпрозорий стовпець однаково
		   читається як пляма над текстом. */
		.flow-stream--hidden {
			translate: 100% 0;
		}
	}


	.flow-lanes {
		position: absolute;
		inset: 0;
		margin: 0;
		padding: 0;
		list-style: none;
		overflow: visible;
	}

	.lane {
		position: absolute;
		top: 0;
		width: 56px;
		height: 56px;
		left: calc((100% - 56px) * var(--left) / 100);
		pointer-events: auto;
		animation: streamUp var(--duration) linear var(--delay) infinite;
	}

	.lane--photo {
		z-index: 10;
	}

	.lane--plain {
		z-index: 2;
	}

	@keyframes streamUp {
		from {
			translate: 0 105vh;
		}
		to {
			translate: 0 -15vh;
		}
	}

	@media (max-width: 859px) {
		@keyframes streamUp {
			from {
				translate: 0 520px;
			}
			to {
				translate: 0 -70px;
			}
		}
	}

	.lane:has(:global(button:hover)),
	.lane:has(:global(button:focus-visible)) {
		animation-play-state: paused;
		z-index: 100;
	}

	@media (prefers-reduced-motion: reduce) {
		.flow-stream {
			position: static;
			height: auto;
			min-height: 0;
			pointer-events: auto;
		}

		.flow-lanes {
			position: static;
			display: flex;
			flex-wrap: wrap;
			align-content: flex-start;
			gap: 0.5rem;
			padding: 1rem 0;
			mask-image: none;
			-webkit-mask-image: none;
		}

		.lane {
			position: static;
			animation: none;
			translate: none;
			height: auto;
		}
	}
</style>
