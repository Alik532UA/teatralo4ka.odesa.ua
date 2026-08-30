<script lang="ts">
	import { localizedPath, type Locale } from '$lib/i18n/routing';
	import { mastersByMentions } from '$lib/data/masters';

	/**
	 * Карусель викладачів по дузі — ілюстрація до пункту «У викладачів
	 * з'явилися власні сторінки».
	 *
	 * Замість сітки 2×2 з чотирьох імен, вписаних у код руками. Різниця не
	 * косметична: сітка показувала ЧОТИРЬОХ ОБРАНИХ, і вибір цей нічим не був
	 * обґрунтований, а карусель показує сімох, у кого найбільше пов'язаних
	 * випускників, — тобто тих самих, кого читач найімовірніше й шукає. Список
	 * тепер рахується з даних і не старіє разом із кодом.
	 *
	 * Рух по дузі, а не по прямій, з простої причини: пряма смуга аватарів
	 * читається як список, який кудись їде, і хочеться його зупинити. Дуга
	 * читається як обертання — у неї немає початку й кінця, тож і зупиняти
	 * нема чого.
	 */
	interface Props {
		lang: Locale;
		/** Курсор на пункті — карусель прискорюється. */
		active?: boolean;
	}

	let { lang, active = false }: Props = $props();

	/** Семеро — стільки, скільки просив автор, і стільки ж поміщається в оберт. */
	const TEACHERS = mastersByMentions()
		.slice(0, 7)
		.map(({ master, mentions }) => ({
			slug: master.slug,
			name: master.displayName,
			photo: master.photo,
			mentions
		}));

	/** Скільки триває повний оберт. Довго навмисно: це тло, а не карусель новин. */
	const CYCLE_S = 21;
</script>

<!--
	Дуга намальована САМИМИ аватарами, а не фоном: кожен їде згори вниз і
	водночас відхиляється вбік за косинусом, тож траєкторія виходить опуклою.
	Малювати під ними лінію не треба — око добудовує її саме.
-->
<div
	class="arc"
	class:is-active={active}
	style="--cycle: {CYCLE_S}s; --count: {TEACHERS.length}"
	data-testid="galaxy-update-teachers-arc-list"
>
	{#each TEACHERS as person, index (person.slug)}
		<a
			class="arc__face"
			style="--order: {index}"
			href={localizedPath(`/residents/adults/${person.slug}`, lang)}
			target="_blank"
			rel="noopener"
			title="{person.name} — {person.mentions}"
			data-testid="galaxy-update-teacher-arc-link-{person.slug}"
		>
			{#if person.photo}
				<img src={person.photo} width="56" height="56" alt={person.name} loading="lazy" />
			{:else}
				<span class="arc__letter" aria-hidden="true">{person.name.charAt(0)}</span>
			{/if}
		</a>
	{/each}
</div>

<style>
	/*
	 * Карусель НЕ бере участі в розкладці: вона накладена на пункт цілком.
	 *
	 * Доти вона стояла у потоці й задавала висоту — пункт про викладачів був
	 * заввишки 230 px незалежно від свого тексту, тобто хвіст ілюстрації тягнув
	 * за собою весь блок. Тепер навпаки: висоту задає текст, а карусель
	 * підлаштовується під неї.
	 *
	 * `inset: 0` рахується від ПАДІНГ-БОКСА пункту, тож аватари зникають об
	 * його справжній край, а не об внутрішній відступ — саме цього бракувало:
	 * смуга обрізання проходила на 0.7rem вище, ніж мала.
	 */
	.arc {
		position: absolute;
		inset: 0;
		left: auto;
		width: 100px;
		overflow: hidden;
		border-radius: inherit;
		pointer-events: none;
	}
	.arc__face {
		position: absolute;
		left: 0;
		/* Саме посилання клікабельні, хоч контейнер і прозорий для миші. */
		pointer-events: auto;
		width: 56px;
		height: 56px;
		border-radius: 50%;
		overflow: hidden;
		display: grid;
		place-items: center;
		background: var(--galaxy-card-bg);
		border: 2px solid rgb(140 190 255 / 0.35);
		/*
		 * Затримка ВІД'ЄМНА: без неї всі семеро вийшли б із верхнього краю
		 * разом і поїхали б стосом. Від'ємна затримка означає «анімація вже
		 * триває стільки-то», тобто кожен наступний одразу стоїть на своєму
		 * місці дуги.
		 */
		animation: arc-travel var(--cycle) linear infinite;
		animation-delay: calc(var(--order) * (var(--cycle) / var(--count)) * -1);
		transition: border-color var(--transition-fast);
	}
	.arc.is-active .arc__face {
		border-color: var(--galaxy-accent);
	}
	/*
	 * Під курсором зупиняється ВСЯ карусель, а не сам лише аватар.
	 *
	 * Спершу стояло друге, і виглядало це поламано: один аватар завмирав, решта
	 * їхала далі, і дуга на очах розсипалася. Зупиняється те, що людина
	 * роздивляється, — а роздивляється вона карусель.
	 */
	.arc:hover .arc__face,
	.arc:focus-within .arc__face {
		animation-play-state: paused;
	}
	.arc__face:hover,
	.arc__face:focus-visible {
		border-color: var(--galaxy-accent);
		z-index: 2;
	}
	.arc__face img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	.arc__letter {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--galaxy-accent);
	}

	/*
	 * Дуга: `top` веде згори вниз рівномірно, `translateX` відводить аватар
	 * убік. Три числа тут головні, і кожне заміряне на екрані.
	 *
	 * ДУГ ЗА ОБЕРТ — дві. Обидві крайності вже стояли тут: сім давали повний
	 * розмах убік на 97 px спуску, тобто злам замість дуги; одна виносила згин
	 * за межі вікна, і аватари йшли рівною діагоналлю.
	 *
	 * РОЗМАХ — 34 px на хвилю завдовжки 175 % висоти, тобто нахил приблизно
	 * один до п'яти. Було 62 — при тій самій хвилі дуга виходила крутою.
	 *
	 * ШЛЯХ — 350 % висоти пункту, поділений на сімох: крок виходить 50 %
	 * висоти, при типових 97 px це 48 px при діаметрі 56 — сусіди трохи
	 * налазять один на одного.
	 *
	 * Вертикаль у ВІДСОТКАХ висоти пункту: інакше карусель або не доїжджала б
	 * до низу, або вилітала за нього. `top` оголошено лише на кінцях, а між
	 * ними CSS веде його сам, рівномірно.
	 */
	@keyframes arc-travel {
		0% {
			top: -60%;
			transform: translateX(34px) scale(0.92);
		}
		3.5714% {
			transform: translateX(32px) scale(0.925);
		}
		7.1429% {
			transform: translateX(28px) scale(0.934);
		}
		10.7143% {
			transform: translateX(21px) scale(0.951);
		}
		14.2857% {
			transform: translateX(13px) scale(0.969);
		}
		17.8571% {
			transform: translateX(6px) scale(0.986);
		}
		21.4286% {
			transform: translateX(2px) scale(0.995);
		}
		25% {
			transform: translateX(0px) scale(1.0);
		}
		28.5714% {
			transform: translateX(2px) scale(0.995);
		}
		32.1429% {
			transform: translateX(6px) scale(0.986);
		}
		35.7143% {
			transform: translateX(13px) scale(0.969);
		}
		39.2857% {
			transform: translateX(21px) scale(0.951);
		}
		42.8571% {
			transform: translateX(28px) scale(0.934);
		}
		46.4286% {
			transform: translateX(32px) scale(0.925);
		}
		50% {
			transform: translateX(34px) scale(0.92);
		}
		53.5714% {
			transform: translateX(32px) scale(0.925);
		}
		57.1429% {
			transform: translateX(28px) scale(0.934);
		}
		60.7143% {
			transform: translateX(21px) scale(0.951);
		}
		64.2857% {
			transform: translateX(13px) scale(0.969);
		}
		67.8571% {
			transform: translateX(6px) scale(0.986);
		}
		71.4286% {
			transform: translateX(2px) scale(0.995);
		}
		75% {
			transform: translateX(0px) scale(1.0);
		}
		78.5714% {
			transform: translateX(2px) scale(0.995);
		}
		82.1429% {
			transform: translateX(6px) scale(0.986);
		}
		85.7143% {
			transform: translateX(13px) scale(0.969);
		}
		89.2857% {
			transform: translateX(21px) scale(0.951);
		}
		92.8571% {
			transform: translateX(28px) scale(0.934);
		}
		96.4286% {
			transform: translateX(32px) scale(0.925);
		}
		100% {
			top: 290%;
			transform: translateX(34px) scale(0.92);
		}
	}

	/*
	 * Прохання про менший рух вимикає обертання ЦІЛКОМ, а не сповільнює його:
	 * тут рухається все, що є, і повільний рух лишався б тим самим рухом.
	 * Замість каруселі — просто стовпчик перших трьох.
	 */
	@media (prefers-reduced-motion: reduce) {
		.arc {
			position: static;
			width: 100px;
			display: flex;
			flex-wrap: wrap;
			gap: 0.4rem;
			pointer-events: auto;
		}
		.arc__face {
			position: static;
			animation: none;
			opacity: 1;
		}
	}
</style>
