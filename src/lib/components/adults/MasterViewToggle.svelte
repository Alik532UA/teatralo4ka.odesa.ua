<script lang="ts">
	import { t } from 'svelte-i18n';
	import { LayoutGrid, Image as ImageIcon, Grid2X2 } from 'lucide-svelte';

	export type ViewMode = 'cards' | 'gallery' | 'compact';

	/**
	 * Один опис режиму: значення, підпис і значок.
	 *
	 * `typeof LayoutGrid` — це тип будь-якої іконки lucide, вони всі однакові за
	 * формою. Так виходить назвати тип точно, не вводячи ані узагальнень, ані
	 * `any`: у цьому коді немає жодного іншого місця з узагальненнями, і заводити
	 * перше заради перемикача було б зайвим.
	 */
	export interface ViewOption {
		value: string;
		label: string;
		icon: typeof LayoutGrid;
	}

	/**
	 * Той самий перемикач служить двом місцям — переліку викладачів і розділу
	 * вистав у профілі майстра. Це навмисно: людина бачить ОДИН елемент
	 * керування, а не два схожих із різною поведінкою.
	 *
	 * Режими при цьому різні, тож вони приходять списком, а не зашиті всередині.
	 * Значення — рядок, а не звужений тип: інакше довелося б вводити узагальнення
	 * в компонент, який більше нічого від них не отримує. Звужує викликач, у себе,
	 * охоронцем типу — так само, як `adultsViewMode` звужує збережене значення.
	 */
	interface Props {
		viewMode: string;
		onchange: (mode: string) => void;
		options?: ReadonlyArray<ViewOption>;
		testIdPrefix?: string;
	}

	let {
		viewMode,
		onchange,
		options = undefined,
		testIdPrefix = 'residents-adults-view'
	}: Props = $props();

	/* Режими переліку викладачів лишаються типовими — сторінка їх не передає. */
	const MASTER_OPTIONS: ReadonlyArray<ViewOption> = $derived([
		{ value: 'cards', label: $t('galaxy.viewModes.cards', { default: 'Картки' }), icon: LayoutGrid },
		{ value: 'gallery', label: $t('galaxy.viewModes.gallery', { default: 'Галерея' }), icon: ImageIcon },
		{ value: 'compact', label: $t('galaxy.viewModes.compact', { default: 'Компактно' }), icon: Grid2X2 }
	]);

	const shown = $derived(options ?? MASTER_OPTIONS);
</script>

<div class="view-toggle" role="group" aria-label={$t('galaxy.viewModes.viewLabel', { default: 'Режим відображення' })} data-testid="{testIdPrefix}-toggle">
	{#each shown as option (option.value)}
		{@const Icon = option.icon}
		<!--
			Активний режим позначений і `aria-pressed`, а не лише кольором: у групі
			з трьох кнопок читалка інакше називає всі три однаково, і людина не чує,
			який вигляд уже обраний.
		-->
		<button
			type="button"
			class="view-btn"
			class:view-btn--active={viewMode === option.value}
			aria-pressed={viewMode === option.value}
			onclick={() => onchange(option.value)}
			title={option.label}
			data-testid="{testIdPrefix}-btn-{option.value}"
		>
			<Icon size={18} aria-hidden="true" />
			<span>{option.label}</span>
		</button>
	{/each}
</div>

<style>
	.view-toggle {
		display: inline-flex;
		align-items: center;
		padding: 4px;
		background: var(--bg-card);
		border: 1px solid var(--border-main);
		border-radius: var(--radius-full, 9999px);
		box-shadow: var(--shadow-main);
		gap: 4px;
		flex-shrink: 0;
	}

	.view-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.45rem 0.9rem;
		border: none;
		border-radius: var(--radius-full, 9999px);
		background: transparent;
		color: var(--text-muted);
		font-size: 0.88rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.view-btn:hover {
		color: var(--text-title);
		background: var(--bg-surface);
	}

	.view-btn--active {
		background: var(--accent-primary);
		color: var(--text-on-accent);
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.16);
	}

	/*
	 * На телефоні лишаються самі значки.
	 *
	 * З підписами перемикач виходив 392px у контейнері на 343 (заміряно на
	 * 375px) і обрізався з ОБОХ боків: «Картки» починалися за лівим краєм
	 * екрана, «Компактно» — за правим. Зменшити поля не рятувало: бракувало
	 * майже п'ятдесяти пікселів.
	 *
	 * Підпис ховає кліп (ті самі оголошення, що в глобальному `.sr-only`), а не
	 * `display: none`: інакше кнопка втратила б назву — значок `aria-hidden`,
	 * і читалці не лишилося б чого прочитати.
	 */
	@media (max-width: 480px) {
		.view-btn {
			gap: 0;
			padding: 0.45rem 0.7rem;
		}
		.view-btn span {
			position: absolute;
			width: 1px;
			height: 1px;
			padding: 0;
			margin: -1px;
			overflow: hidden;
			clip-path: inset(50%);
			white-space: nowrap;
		}
	}
</style>
