<script lang="ts">
	import { Palette } from 'lucide-svelte';
	import { LAB_PAIRS, themeLab } from '$lib/services/themeLab.svelte';
	import { auditThemes, type ThemeVerdict } from '$lib/utils/themeAudit';

	/**
	 * «А ЩО В ІНШИХ ТЕМАХ» — питання, через яке панель показувала зелене, а CI
	 * червоніло.
	 *
	 * Лабораторія править одну тему, а гейт контрасту міряє всі шість. Дизайнер
	 * переписує три токени з тринадцяти, бачить тут «усе пройшло» — і дізнається
	 * про решту десять, що в сусідній темі зовсім інші, аж із прогону.
	 *
	 * Кнопка відповідає рівно на це: бере ВЛАСНІ значення кожної теми, кладе
	 * зверху правки дизайнера й рахує ті самі вісім пар. Тобто показує те, що
	 * станеться, якщо цей блок вставити в кожен файл теми.
	 *
	 * ## Чому за натиском, а не постійно
	 *
	 * Читання чужих тем вимагає на мить перемкнути тему на `html` і зняти
	 * значення — шість разів по тринадцять. Робити це на кожне натискання
	 * клавіші в полі означало б шість перерахунків макета на символ. За
	 * натиском — один раз тоді, коли відповідь справді потрібна.
	 */
	let вердикти = $state<ThemeVerdict[] | null>(null);

	function перевірити() {
		const темами = themeLab.readThemeTokens();
		вердикти = auditThemes(темами, themeLab.colors, LAB_PAIRS);
	}

	const поганих = $derived(вердикти?.filter((v) => v.failed.length > 0) ?? []);
</script>

<section class="themes" aria-labelledby="lab-themes-title">
	<h3 id="lab-themes-title" class="themes__title">Інші теми</h3>

	<button
		type="button"
		class="themes__run"
		onclick={перевірити}
		data-testid="theme-lab-themes-check-btn"
	>
		<Palette size={14} aria-hidden="true" /> Перевірити всі теми
	</button>

	{#if вердикти}
		{#if поганих.length === 0}
			<p class="themes__ok" data-testid="theme-lab-themes-status-text">
				З цими кольорами проходять усі {вердикти.length} тем.
			</p>
		{:else}
			<ul class="themes__list" data-testid="theme-lab-themes-list">
				{#each поганих as вердикт (вердикт.theme)}
					<li class="themes__item">
						<strong>{вердикт.theme}</strong>
						<ul>
							{#each вердикт.failed as пара (пара.label)}
								<li data-testid="theme-lab-themes-{вердикт.theme}-fail-item">
									{пара.label} — {пара.ratio?.toFixed(2)}
								</li>
							{/each}
						</ul>
					</li>
				{/each}
			</ul>
			<p class="themes__hint">
				Це станеться, якщо той самий блок покласти в кожну тему. Свою — видно вище.
			</p>
		{/if}
	{/if}
</section>

<style>
	.themes {
		border-top: 1px solid var(--border-main);
		padding-top: 0.5rem;
		margin-bottom: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.themes__title {
		margin: 0;
		font-size: 0.8rem;
		color: var(--text-muted);
		font-weight: 700;
	}
	.themes__run {
		align-self: flex-start;
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		border-radius: 6px;
		border: 1px solid var(--border-main);
		background: var(--bg-surface);
		color: var(--text-main);
		font-size: 0.78rem;
		cursor: pointer;
	}
	.themes__run:hover {
		border-color: var(--accent-primary);
	}
	.themes__ok {
		margin: 0;
		font-size: 0.78rem;
		color: var(--text-muted);
	}
	.themes__list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		font-size: 0.76rem;
	}
	.themes__item ul {
		list-style: none;
		margin: 0.1rem 0 0;
		padding: 0 0 0 0.6rem;
		color: var(--text-muted);
	}
	.themes__hint {
		margin: 0;
		font-size: 0.72rem;
		color: var(--text-muted);
	}
</style>
