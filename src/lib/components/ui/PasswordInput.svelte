<!--
	PasswordInput — реюзне поле пароля.
	Канон: FORM-INPUTS-v7. Обов'язкові фічі (HIGH): CapsLock, показати/приховати,
	попередження про розкладку під полем; безпекові атрибути; a11y (aria-live).
	Стандарт іконок (§1.1): єдиний колір через --input-icon-color, стан — лише opacity,
	порядок trailing [toggle], розмір 18px, єдині відступи, floating-label.
-->
<script lang="ts">
	import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-svelte';
	import { t } from 'svelte-i18n';

	interface Props {
		value: string;
		id: string;
		/** Текст floating-label (підпис поля) */
		label: string;
		/** База для data-testid дочірніх елементів */
		testId: string;
		/** 'current-password' — вхід; 'new-password' — реєстрація/зміна (канон: SECURITY-v7) */
		autocomplete?: 'current-password' | 'new-password';
		name?: string;
		required?: boolean;
		disabled?: boolean;
		showCapsLock?: boolean;
		/** Попередження про розкладку, якщо введено нелатинський символ */
		showLayoutWarning?: boolean;
	}

	let {
		value = $bindable(''),
		id,
		label,
		testId,
		autocomplete = 'current-password',
		name = 'password',
		required = false,
		disabled = false,
		showCapsLock = true,
		showLayoutWarning = true
	}: Props = $props();

	let showPassword = $state(false);
	let isCapsLock = $state(false);
	let nonLatin = $state(false); // Введено нелатинську літеру → ймовірно не та розкладка

	// getModifierState є лише в KeyboardEvent/MouseEvent (не у FocusEvent), тому
	// початковий стан CapsLock до першої взаємодії прочитати не можна — обмеження браузера.
	function readCaps(e: KeyboardEvent | MouseEvent) {
		isCapsLock = e.getModifierState('CapsLock');
	}

	function onKeydown(e: KeyboardEvent) {
		readCaps(e);
		if (e.key.length !== 1) return;
		if (/[a-zA-Z]/.test(e.key)) nonLatin = false;
		else if (/\p{L}/u.test(e.key)) nonLatin = true; // Будь-яка нелатинська літера
	}

	// Скидання попередження про розкладку, коли поле спорожнили
	$effect(() => {
		if (value === '') nonLatin = false;
	});
</script>

<div class="input-with-icon">
	<Lock size={18} class="pw-icon-lead" aria-hidden="true" />

	<input
		{id}
		{name}
		{autocomplete}
		{required}
		{disabled}
		type={showPassword ? 'text' : 'password'}
		bind:value
		class="form-input"
		placeholder=" "
		autocapitalize="off"
		autocorrect="off"
		spellcheck="false"
		onkeydown={onKeydown}
		onkeyup={readCaps}
		onclick={readCaps}
		data-testid={`${testId}-input`}
	/>

	<!-- Trailing: лише інтерактивний toggle-око, завжди скраю праворуч -->
	<div class="trailing">
		<button
			type="button"
			class="toggle"
			{disabled}
			onclick={() => (showPassword = !showPassword)}
			aria-pressed={showPassword}
			aria-label={showPassword ? $t('form.password.hide') : $t('form.password.show')}
			data-testid={`${testId}-toggle-button`}
		>
			{#if showPassword}<EyeOff size={18} />{:else}<Eye size={18} />{/if}
		</button>
	</div>

	<label for={id} class="floating-label">{label}</label>
</div>

<!-- Попередження — окремими рядками ПІД полем; кожне НЕЗАЛЕЖНЕ (обидва можуть бути одночасно).
     role="status" + aria-live озвучує зміни (текст видимий, не sr-only). -->
<div class="field-warnings" role="status" aria-live="polite">
	{#if showCapsLock && isCapsLock}
		<p class="field-warning" data-testid={`${testId}-caps-warning`}>
			<AlertCircle class="warning-icon" aria-hidden="true" />
			<span>{$t('form.password.capsOn')}</span>
		</p>
	{/if}
	{#if showLayoutWarning && nonLatin}
		<p class="field-warning" data-testid={`${testId}-layout-warning`}>
			<AlertCircle class="warning-icon" aria-hidden="true" />
			<span>{$t('form.password.checkLayout')}</span>
		</p>
	{/if}
</div>

<style>
	/* Єдиний колір усіх іконок поля (§1.1). */
	.input-with-icon {
		position: relative;
		display: flex;
		align-items: center;
		--input-icon-color: var(--accent-primary, #6b7280);
		--input-bg: var(--theme-dynamic-card-bg, #022434);
	}

	/* Leading-іконка (тип поля). Акцент :focus-within — лише через opacity. */
	:global(.pw-icon-lead) {
		position: absolute;
		left: 1rem;
		color: var(--input-icon-color);
		opacity: 0.65;
		pointer-events: none;
		transition: opacity 0.2s ease;
	}
	.input-with-icon:focus-within :global(.pw-icon-lead) {
		opacity: 1;
	}

	.form-input {
		width: 100%;
		box-sizing: border-box;
		padding: 0.9rem 3.5rem 0.9rem 3rem;
		background: rgba(0, 0, 0, 0.2);
		border: 2px solid var(--accent-primary);
		border-radius: var(--radius-md, 12px);
		color: var(--text-title, #fff);
	}

	/* Floating-label: порожнє поле — «підпис у полі»; спливає на межу при фокусі/вводі */
	.floating-label {
		position: absolute;
		left: 3rem;
		top: 50%;
		transform: translateY(-50%);
		transform-origin: left center;
		color: var(--input-icon-color);
		pointer-events: none;
		background: var(--input-bg);
		padding: 0 0.25rem;
		border-radius: 4px;
		transition: top 0.15s ease, left 0.15s ease, transform 0.15s ease;
	}
	.form-input:focus ~ .floating-label,
	.form-input:not(:placeholder-shown) ~ .floating-label {
		top: 0;
		left: 1rem;
		transform: translateY(-50%) scale(0.82);
	}

	/* Trailing: лише інтерактивний toggle-око, завжди скраю праворуч */
	.trailing {
		position: absolute;
		right: 0.75rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--input-icon-color);
	}
	.toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px; /* touch target ≥44px — SVELTE-UI § 3.3 */
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		color: inherit;
		opacity: 0.65;
		transition: opacity 0.2s ease;
	}
	.toggle:hover,
	.toggle:focus-visible {
		opacity: 1;
	}
	.toggle:disabled {
		cursor: default;
		opacity: 0.35;
	}

	/* Попередження під полем: кожне окремим рядком; іконка НЕ стискається при переносі тексту */
	.field-warnings {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin-top: 0.35rem;
	}
	.field-warning {
		display: flex;
		align-items: flex-start;
		gap: 0.4rem;
		margin: 0;
		font-size: 0.8rem;
		color: var(--warning-color, #f59e0b);
		white-space: pre-line;
	}
	:global(.warning-icon) {
		flex-shrink: 0; /* КЛЮЧОВЕ: не стискати іконку при переносі тексту на 2 рядки */
		width: 14px;
		height: 14px;
		margin-top: 0.1rem;
	}
</style>
