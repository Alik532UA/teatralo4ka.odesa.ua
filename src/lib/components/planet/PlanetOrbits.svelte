<script lang="ts">
	import PlanetSphere from './PlanetSphere.svelte';
	import type { GraduateIndexEntry } from '$lib/data/graduates';

	/**
	 * ОРБІТИ — планета лишається, імена приходять на вимогу.
	 *
	 * ## Що вирішує
	 *
	 * Обличчя стоять кільцями, ємність кожного порахована наперед
	 * (`utils/planetLayout`), тож перекриття не буває НІКОЛИ. Розмір обличчя
	 * підбирається під кількість: дванадцятеро стоять великими, шістдесят —
	 * дрібними.
	 *
	 * ## Чому підпис не під кожним обличчям
	 *
	 * Саме він і був причиною каші: ім'я завширшки як три обличчя, і сусідні
	 * підписи накладалися задовго до того, як зіткнулися б самі кола. Тому ім'я
	 * показується для того, на кого дивляться — під планетою великим рядком і
	 * плашкою біля самого обличчя. Для читалки екрана ім'я є завжди: воно в
	 * `aria-label` кнопки, тобто доступність від цього не залежить.
	 *
	 * Рядок під планетою тримає МІСЦЕ навіть порожній (`min-height`): інакше
	 * сторінка підстрибувала б на кожне наведення.
	 */
	interface Props {
		/* `readonly`: реєстр приходить сталим переліком, і компонент його не міняє. */
		students: readonly GraduateIndexEntry[];
		onopen: (student: GraduateIndexEntry) => void;
		testIdPrefix?: string;
	}

	let { students, onopen, testIdPrefix = 'creativity-planet' }: Props = $props();

	let активний = $state<string | null>(null);
	const підпис = $derived(students.find((с) => с.id === активний)?.name ?? '');
</script>

<div class="orbits">
	<PlanetSphere
		{students}
		{onopen}
		{testIdPrefix}
		tip
		active={активний}
		onactive={(id) => (активний = id)}
	/>

	<p class="caption" aria-hidden="true" data-testid="{testIdPrefix}-caption-text">{підпис}</p>
</div>

<style>
	.orbits {
		display: grid;
		justify-items: center;
	}

	/* Рядок тримає висоту порожнім — інакше сторінка підстрибує на наведення. */
	.caption {
		min-height: 2rem;
		margin: 0.85rem 0 0;
		font-size: 1.05rem;
		font-weight: 700;
		color: var(--text-title);
		text-align: center;
	}
</style>
