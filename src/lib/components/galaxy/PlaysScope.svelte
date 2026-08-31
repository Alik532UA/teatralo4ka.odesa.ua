<script lang="ts">
	import { t } from 'svelte-i18n';
	import { Users } from 'lucide-svelte';

	/**
	 * Скільком виставам ми знаємо склад — і одне натискання, щоб побачити решту.
	 *
	 * ## Що саме фільтрує і чому названо ТАК
	 *
	 * Задача звучала як «показувати лише вистави груп, що випустились», а ознакою
	 * пропонувалося: у «Хто грав» є хоч одна людина. Висновок в один бік
	 * правильний — є учасник, отже є випускник, отже група випустилася. Але
	 * фільтру потрібен зворотний бік, а він хибний: порожньо означає не «не
	 * випустились», а «ніхто ще не заповнив анкету про цю виставу».
	 *
	 * Заміряно на реєстрі: склад відомий у 255 вистав із 733. І покриття йде за
	 * анкетами, а не за випуском — у 2015-му 13 вистав із 41, хоч та група
	 * випустилася одинадцять років тому; у 2011-му 18 із 21; до 2006-го 100%.
	 * Даних про «ще не випустились» у реєстрі немає взагалі: усі 24 групи
	 * `groups.data.json` мають рік випуску в минулому.
	 *
	 * Тому підпис каже те, що обчислюється: «Тільки з відомим складом». Назва
	 * «вистави випускників» була б неправдою про 478 вистав, у яких випускники
	 * теж грали — просто ще не написали про це.
	 *
	 * ## Чому лічильник ВИДИМИЙ, а не тихий
	 *
	 * Фільтр типово ввімкнений, тобто сторінка з 733 виставами показує 255. Без
	 * рядка «Показано 255 з 733» вона суперечила б власному заголовку, де стоїть
	 * повне число, і читач вважав би, що це весь репертуар школи.
	 */
	interface Props {
		/** Скільком виставам є що показати ЗАРАЗ. */
		shown: number;
		/** Скільки їх у реєстрі всього. */
		total: number;
		onlyWithCast: boolean;
		onchange: (value: boolean) => void;
	}

	let { shown, total, onlyWithCast, onchange }: Props = $props();
</script>

<div class="scope" data-testid="galaxy-plays-scope-toolbar">
	<span class="scope__count" data-testid="galaxy-plays-scope-count">
		{onlyWithCast
			? $t('galaxy.playsScopeShown', { values: { shown, total } })
			: $t('galaxy.playsScopeAll', { values: { total } })}
	</span>

	<!--
		Підпис кнопки — це ДІЯ, а не стан, тож `aria-pressed` тут не годиться:
		текст щоразу називає, що станеться після натискання. Пояснення, що
		вважається відомим складом, живе в `title` — воно довге, і в рядку
		керування стояло б замість самого керування.
	-->
	<button
		type="button"
		class="scope__btn"
		title={$t('galaxy.playsScopeHint')}
		onclick={() => onchange(!onlyWithCast)}
		data-testid="galaxy-plays-scope-btn"
	>
		{#if onlyWithCast}
			{$t('galaxy.playsScopeShowAll')}
		{:else}
			<Users size={14} aria-hidden="true" />
			{$t('galaxy.playsScopeOnlyCast')}
		{/if}
	</button>
</div>

<style>
	.scope {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.scope__count {
		font-size: 0.85rem;
		color: var(--text-muted);
	}

	.scope__btn {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.2rem 0.7rem;
		border-radius: var(--radius-full, 9999px);
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		color: var(--text-title);
		font-size: 0.82rem;
		font-weight: 600;
		cursor: pointer;
		transition: border-color var(--transition-base);
	}
	.scope__btn:hover {
		border-color: var(--accent-primary);
	}
</style>
