<script lang="ts">
	import { t } from 'svelte-i18n';
	import { Plus } from 'lucide-svelte';
	import EditContactButton from './EditContactButton.svelte';

	/**
	 * Порожня плашка на сторінці випускника: «інформація відсутня» і «+ додати».
	 *
	 * ## Чому не самотній олівець, як доти
	 *
	 * Доти на місці відсутніх даних стояв кружечок з олівцем — і більше нічого.
	 * Читач бачив заголовок «Про себе» й іконку, з якої не випливало ні того, що
	 * інформації немає, ні того, що її можна додати. Порожнє місце без підпису
	 * однаково читається як «тут нічого не буде».
	 *
	 * Тепер словами сказано обидва факти: чого немає й що з цим зробити. Кнопка
	 * лишилася тією самою дією, лише з написом.
	 *
	 * ## Дві дії за однією кнопкою
	 *
	 * Куди веде «додати», залежить від того, кого є про що просити, і правило
	 * тут не своє, а спільне з кнопкою «Заповнити анкету» під іменем:
	 *
	 *   немає знімка або року вступу → анкета: є що спитати в САМОЇ людини;
	 *   і знімок, і рік уже є → вікно до адміністратора: вистави, ролі й
	 *   розповідь про себе вносить школа, і питати про них треба її.
	 *
	 * Обидві гілки стоять тут разом, бо це одне рішення. Розкидані по місцях
	 * виклику, вони розійшлися б: у плашці «Вистави» одне, у «Про себе» інше.
	 *
	 * ## Чому окремим файлом
	 *
	 * `GraduateProfileView` стоїть біля своєї стелі `structure.test.ts` (1695
	 * рядків), а цей рядок потрібен трьом плашкам — «Вистави», «Про себе» й
	 * «Викладачі». Тричі скопійований, він розійшовся б написом або поведінкою
	 * кнопки.
	 */
	interface Props {
		/** Початок `data-testid`: `<base>-empty-hint`, `<base>-add-btn`. */
		base: string;
		/** Чи просити анкету в самої людини — рішення ухвалює сторінка. */
		askForForm: boolean;
		/** Чи є знімок: від цього залежить текст прохання у вікні контактів. */
		hasPhoto: boolean;
		/** Відкрити анкету. Кличеться лише коли `askForForm`. */
		onform: () => void;
	}

	let { base, askForForm, hasPhoto, onform }: Props = $props();
</script>

<div class="empty" data-testid="{base}-empty-row">
	<span class="empty__note" data-testid="{base}-empty-hint">
		{$t('galaxy.blockEmpty', { default: 'інформація відсутня' })}
	</span>

	{#if askForForm}
		<button type="button" class="empty__add" onclick={onform} data-testid="{base}-add-btn">
			<Plus size={14} aria-hidden="true" />
			<span>{$t('galaxy.blockAdd', { default: 'додати' })}</span>
		</button>
	{:else}
		<EditContactButton
			testIdPrefix="{base}-contact"
			buttonTestId="{base}-add-btn"
			openTo="side"
			variant="ghost"
			shape="text"
			{hasPhoto}
		/>
	{/if}
</div>

<style>
	.empty {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.6rem;
		flex-wrap: wrap;
	}

	.empty__note {
		font-size: 0.86rem;
		color: var(--text-muted);
	}

	/*
	 * Кнопка анкети виглядає так само, як кнопка контактів у сусідній гілці
	 * (`.edit-btn--text`): різниця між ними в тому, КУДИ вони ведуть, і робити
	 * її ще й видимою означало б обіцяти читачеві два різні вміння.
	 */
	.empty__add {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.3rem;
		height: 30px;
		padding: 0 0.7rem;
		border-radius: 999px;
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		color: var(--text-title);
		font-size: 0.82rem;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
		transition: border-color var(--transition-base);
	}
	.empty__add:hover {
		border-color: var(--accent-primary);
	}
</style>
