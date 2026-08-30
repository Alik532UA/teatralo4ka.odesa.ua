<script lang="ts">
	import type { Locale } from '$lib/i18n/routing';
	import { floatBottom } from '$lib/utils/floatBottom';
	import GalaxyUpdateIllustration from './GalaxyUpdateIllustration.svelte';
	import GalaxyUpdateStars from './GalaxyUpdateStars.svelte';
	import GalaxyUpdateTeacherRow from './GalaxyUpdateTeacherRow.svelte';
	import GalaxyUpdateTeacherArc from './GalaxyUpdateTeacherArc.svelte';

	/**
	 * Перелік того, що вміє нова версія, — пункти вітального вікна.
	 *
	 * Окремим файлом, бо вікно разом із ним переростало типову стелю в 300
	 * рядків. Шов природний: вікно — це рама, заголовок, зона прокрутки й
	 * кнопки; тут же самі пункти, їхні ілюстрації та правило, з якого боку ті
	 * ілюстрації ставити.
	 */
	interface Props {
		features: { id: string; title: string; text: string }[];
		lang: Locale;
		/**
		 * Наведений пункт — потрібен НАЗОВНІ: коли курсор на «живій галактиці»,
		 * вікно розступається, прибираючи затемнення з тла, щоб її було видно.
		 */
		hovered?: string | null;
	}

	let { features, lang, hovered = $bindable(null) }: Props = $props();
</script>

<ul class="features" data-testid="galaxy-update-list">
	{#each features as feature (feature.id)}
		<li
			class="feature"
			class:feature--galaxy={feature.id === 'galaxy'}
			class:feature--arc={feature.id === 'teachers'}
			onmouseenter={() => (hovered = feature.id)}
			onmouseleave={() => (hovered = null)}
			data-testid="galaxy-update-item-{feature.id}"
		>
			{#if feature.id === 'galaxy'}
				<GalaxyUpdateStars />
			{/if}
			<!--
				Карусель викладачів стоїть ПОРЯД із текстом, а не всередині нього:
				вона накладка на весь пункт, тож ставити її у потік означало б
				знову дати їй задавати висоту. Місце під неї відводить
				`padding-right` у `.feature--arc`.
			-->
			{#if feature.id === 'teachers'}
				<GalaxyUpdateTeacherArc {lang} active={hovered === feature.id} />
			{/if}
			<!--
				Ілюстрація стоїть ПЕРЕД текстом і в тому самому блоці: плаваючий
				елемент обтікається лише тим, що йде за ним у потоці.

				Порожня розпірка перед нею — не зайвий вузол: саме її висотою
				`floatBottom` опускає ілюстрацію в нижній правий кут, і саме
				тому, що вона нульової ширини, текст над картинкою лишається на
				всю ширину. Пояснення — у докблоці утиліти; там же й рішення,
				коли колонки поруч не лишається й обтікати нема чим.
			-->
			<div class="feature__body">
				<span class="feature__pusher" aria-hidden="true"></span>
				<div class="feature__figure" {@attach floatBottom()}>
					<GalaxyUpdateIllustration
						id={feature.id}
						{lang}
						active={hovered === feature.id}
					/>
				</div>
				<strong class="feature__title">{feature.title}</strong>
				<span class="feature__text">{feature.text}</span>
				<!--
					Пункт про порядок викладачів показує сам порядок: інакше він
					розповідає про правило, якого ніде не видно.
				-->
				{#if feature.id === 'order'}
					<GalaxyUpdateTeacherRow />
				{/if}
			</div>
		</li>
	{/each}
</ul>

<style>
	.features {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.6rem;
	}
	.feature {
		/*
		 * Без цього рядка пункт РОЗПИРАЄТЬСЯ вмістом: типове `min-width: auto`
		 * у грид-елемента означає «не вужче за мінімальний вміст», а рядок
		 * значків викладачів не переноситься й тому має мінімальну ширину в усі
		 * свої значки. Заміряно: при вікні 600 сітка була 530 px, а пункт у ній
		 * — 943, тобто вилазив на 413 px, і рядок значків так і лишався
		 * завширшки як на десктопі — тому й не перераховувався на звуженні.
		 */
		min-width: 0;
		transition:
			border-color var(--transition-base),
			background var(--transition-base),
			transform var(--transition-base);
		padding: 0.7rem 0.9rem;
		border-radius: 0.9rem;
		background: rgb(255 255 255 / 0.05);
		border: 1px solid rgb(140 190 255 / 0.14);
	}
	/* Пункт про галактику — коробка для зоряного шару під ним. */
	/*
	 * Пункт із каруселлю: місце під неї відводиться відступом, а не потоком.
	 *
	 * `position: relative` робить цей пункт точкою відліку для накладки, а
	 * `padding-right` лишає їй смугу праворуч, щоб текст під неї не заходив.
	 * Висота ж лишається текстовою — саме цього бракувало: карусель у потоці
	 * тягнула пункт до своїх 230 px незалежно від того, скільки в ньому слів.
	 */
	/*
	 * ПІСЛЯ `.feature`, а не перед ним, і це не косметика: специфічність у них
	 * однакова, а `.feature` задає `padding` скороченим записом. Стоячи вище,
	 * це правило програвало — відступ праворуч скидався, і текст заходив під
	 * карусель.
	 */
	.feature--arc {
		position: relative;
		padding-right: calc(0.9rem + 106px);
	}

	.feature--galaxy {
		position: relative;
		overflow: hidden;
		isolation: isolate;
	}
	.feature:hover {
		border-color: rgb(140 190 255 / 0.5);
		background: rgb(140 190 255 / 0.09);
		transform: translateY(-2px);
	}
	/*
	 * `flow-root` — щоб плаваюча ілюстрація лишалася ВСЕРЕДИНІ пункту.
	 * Без власного контексту форматування вона вилазила б за рамку картки,
	 * коли вища за свій текст. `overflow: hidden` дав би те саме, але обрізав
	 * би хвилю пульсації, яка виходить за межі кнопок.
	 */
	.feature__body {
		display: flow-root;
		min-width: 0;
	}
	/*
	 * Плаває сама обгортка, а не те, що в ній.
	 *
	 * Ілюстрації різні — стопка фото, ряд аватарок, чипси груп, — і жодній із
	 * них не треба знати, як її розміщують серед тексту. Тут же єдине місце,
	 * де це знання живе: обгортка плаває, а `floatBottom` вирішує, наскільки її
	 * опустити.
	 */
	.feature__figure {
		float: right;
		/* Стає одразу під розпіркою — саме це й опускає її вниз. */
		clear: right;
		margin-left: 0.9rem;
	}
	/*
	 * Нульова ширина тут — суть, а не дрібниця: розпірка задає лише ВИСОТУ, на
	 * яку опускається ілюстрація, і жодного рядка не звужує.
	 */
	.feature__pusher {
		float: right;
		width: 0;
	}
	.feature__title {
		display: block;
		margin-bottom: 0.15rem;
		color: #fff;
	}
	.feature__text {
		display: block;
		font-size: 0.92rem;
		line-height: 1.5;
		color: var(--galaxy-muted);
	}
</style>
