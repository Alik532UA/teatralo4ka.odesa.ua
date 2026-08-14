<!--
	PasswordInput — реюзне поле пароля.
	Канон: FORM-INPUTS-v7. Обов'язкові фічі (HIGH): CapsLock, показати/приховати,
	попередження про розкладку під полем; безпекові атрибути; a11y (aria-live).
	Стандарт іконок (§1.1): єдиний колір через --input-icon-color, стан — лише opacity,
	порядок trailing [toggle], розмір 18px, єдині відступи, floating-label.
-->
<script lang="ts">
	import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-svelte';
	import InputTools from './InputTools.svelte';
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
	let inputEl = $state<HTMLInputElement | null>(null);

	$effect(() => {
		if (value === '') nonLatin = false;
	});
</script>

<div class="input-with-icon has-input-tools">
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
		bind:this={inputEl}
		data-testid={`${testId}-input`}
	/>

	<!-- Trailing: лише інтерактивні кнопки, завжди скраю праворуч -->
	<div class="trailing">
		<!--
			Пароль отримує ЛИШЕ «стерти».

			Копіювання — ні за жодних умов: воно кладе пароль у буфер обміну, звідки
			його прочитає будь-яка сторінка з відповідним дозволом, і лежатиме він
			там, доки щось не перезапише.

			Вставки теж немає, хоч сама по собі вона паролям потрібна. Кнопка тут
			викликала б запит браузера на доступ до буфера — просто під час входу,
			поруч із полем пароля. Це виглядає рівно як фішинг, а `Ctrl+V` і довгий
			дотик на телефоні працюють і без кнопки.
		-->
		<InputTools bind:value input={inputEl} tools={['clear']} scope={testId} fieldLabel={label} />

		<button
			type="button"
			class="toggle"
			{disabled}
			onclick={() => (showPassword = !showPassword)}
			aria-pressed={showPassword}
			aria-label={showPassword ? $t('form.password.hide') : $t('form.password.show')}
			data-testid={`${testId}-toggle-btn`}
		>
			{#if showPassword}<EyeOff size={16} />{:else}<Eye size={16} />{/if}
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
		/* Тло floating-label мусить збігатися з тим, що ПІД ним, інакше замість
		   вирізу в рамці виходить кольорова плашка. Під ним не картка, а поле:
		   `rgba(0,0,0,0.2)` поверх картки — саме це й рахує color-mix.
		   Раніше тут стояла неоголошена --theme-dynamic-card-bg, тож завжди
		   спрацьовував запасний #022434 — темно-синя плашка в світлій темі. */
		--input-bg: color-mix(in srgb, var(--bg-card), #000 20%);
		/* Те, що раніше малювало саме поле. Переїхало сюди, щоб маска згасання
		   тексту не зачіпала тло й рамку. */
		background: rgba(0, 0, 0, 0.2);
		border: 2px solid var(--accent-primary);
		border-radius: var(--radius-md, 12px);
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
		padding: 0.9rem 3.5rem 0.9rem 3rem; /* правий відступ перекриває .has-input-tools */
		/* Тло й рамку малює обгортка `.has-input-tools` (global.css): інакше
		   маска згасання зачепила б їх разом із текстом. */
		background: transparent;
		border: 2px solid transparent;
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
		right: var(--input-trailing-inset, 0.6rem);
		display: flex;
		align-items: center;
		/* Ті самі відступ і розмір, що в кнопок інструментів поруч. */
		gap: var(--input-tool-gap, 0.25rem);
		color: var(--input-icon-color);
	}
	.toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--input-tool-size, 34px);
		height: var(--input-tool-size, 34px);
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
