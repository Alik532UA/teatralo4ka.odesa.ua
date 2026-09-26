<script lang="ts">
	import { asset } from '$app/paths';
	import { CALENDAR_THEMES } from '$lib/config/calendarThemes';
	import { imageSize } from '$lib/config/localImages';
	import type { Locale } from '$lib/i18n/routing';

	/**
	 * Мініатюри фонів плаката — кнопки-перемикачі з `aria-pressed`.
	 *
	 * Друга редакція оголошувала їх `role="radio"` у `radiogroup`, але без
	 * стрілок і без єдиної зупинки Tab, яких та роль вимагає: читалка обіцяла
	 * поведінку, якої не було. Натиснута кнопка — чесніше.
	 */
	interface Props {
		selected: string;
		locale?: Locale;
		/** Одна колонка — у повному екрані, де панель вузька. */
		columns?: 1 | 2;
		onSelect: (id: string) => void;
	}

	let { selected, locale = 'uk', columns = 2, onSelect }: Props = $props();
	const isEn = $derived(locale === 'en');
</script>

<div
	class="themes-grid"
	class:themes-grid--single={columns === 1}
	role="group"
	aria-label={isEn ? 'Backgrounds' : 'Фони'}
>
	{#each CALENDAR_THEMES as theme (theme.id)}
		{@const isSelected = selected === theme.id}
		{@const size = imageSize(theme.bgUrl)}
		<button
			type="button"
			class="theme-thumb-btn"
			class:active={isSelected}
			aria-pressed={isSelected}
			onclick={() => onSelect(theme.id)}
			title={isEn ? theme.nameEn : theme.nameUk}
			data-testid={`calendar-theme-${theme.id}-btn`}
		>
			<img
				src={asset(theme.bgUrl)}
				alt=""
				class="theme-thumb-img"
				loading="lazy"
				width={size.width}
				height={size.height}
			/>
			<span class="theme-thumb-accent" style:background={theme.weekdayBg}></span>
			<span class="theme-thumb-name">{isEn ? theme.nameEn : theme.nameUk}</span>
		</button>
	{/each}
</div>

<style>
	.themes-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.4rem;
	}

	.themes-grid--single {
		grid-template-columns: 1fr;
	}

	.theme-thumb-btn {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 3px;
		background: var(--bg-surface);
		border: 2px solid transparent;
		border-radius: 9px;
		cursor: pointer;
		overflow: hidden;
		transition:
			transform 0.15s ease,
			border-color 0.15s ease;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.06);
	}

	.theme-thumb-btn:hover {
		transform: translateY(-2px);
		border-color: var(--border-main);
	}

	.theme-thumb-btn.active {
		border-color: var(--accent-primary);
	}

	.theme-thumb-img {
		width: 100%;
		height: 40px;
		object-fit: cover;
		border-radius: 6px;
	}

	.theme-thumb-accent {
		position: absolute;
		top: 5px;
		right: 5px;
		width: 11px;
		height: 11px;
		border-radius: 50%;
		border: 1.5px solid #ffffff;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
	}

	.theme-thumb-name {
		font-size: 0.65rem;
		font-weight: 600;
		color: var(--text-title);
		margin-top: 2px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		width: 100%;
		text-align: center;
	}
</style>
