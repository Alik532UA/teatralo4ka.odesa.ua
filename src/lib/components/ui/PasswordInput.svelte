<!--
	PasswordInput — реюзне поле пароля.
	Канон: FORM-INPUTS-v8. Обов'язкові фічі (HIGH): CapsLock, показати/приховати,
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
		/** 'current-password' — вхід; 'new-password' — реєстрація/зміна (канон: SECURITY-v8) */
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

<!--
	Обгортка навколо поля Й попереджень — не декор.

	Без неї компонент віддає ДВА елементи верхнього рівня, і батьківська форма з
	`gap` рахує проміжок двічі: між полем і блоком попереджень, і між ним та
	наступним елементом. Порожній блок попереджень має нульову висоту, але два
	проміжки лишаються — звідси й завеликий відступ до «Відновити пароль».

	Блок попереджень при цьому НЕ ховається: це `role="status"`, і диктор
	озвучує появу тексту лише в області, яка вже є в дереві доступності.
-->
<div class="password-field">
<div class="input-with-icon has-input-tools has-input-tools--framed">
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

	<!--
		Trailing: лише інтерактивні кнопки, завжди скраю праворуч.

		Клас `input-tools` тут — це сходинка «курсор над областю кнопок» (90%,
		INPUT-TOOLS-v8 § 4). Область кнопок цього поля — увесь трейлінг, а не лише
		контейнер `InputTools` усередині нього: око лежить ПОРУЧ із ним.

		Без цього класу заміряно на формі входу: курсор на «стерти» — сама кнопка
		1, око 0.6 замість 0.9; курсор на оці — око 1, «стерти» 0.6. У полі пошти
		тієї самої форми, де обидві кнопки лежать в одному `InputTools`, сусід
		правильно отримував 0.9. Тобто два рядки значків в одній формі поводилися
		по-різному — рівно той дефект, від якого клас `input-tools__btn` і з'явився
		на оці.
	-->
	<div class="trailing input-tools">
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
			class="input-tools__btn"
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
		   тексту не зачіпала тло й рамку.

		   Значення — ті самі, що в поля пошти поруч. Раніше тут стояла постійна
		   акцентна рамка, і поле пароля виглядало вічно активним: сусідні поля
		   однієї форми відрізнялися так, ніби одне з них у фокусі. */
		background: var(--bg-surface);
		border: 2px solid var(--border-main);
		border-radius: var(--radius-md, 12px);
	}


	/*
	 * Фокус — акцентна рамка на обгортці.
	 *
	 * Оголошено ТУТ, хоч таке саме правило є в global.css: scoping Svelte додає
	 * до селектора компонента клас, тож власне правило `.input-with-icon` важить
	 * більше за глобальне й лишало б рамку приглушеною навіть у фокусі. Поле
	 * пошти поруч працювало саме тому, що сторінка входу оголошує це правило в
	 * себе — а компонент не оголошував ніде.
	 */
	.input-with-icon.has-input-tools:focus-within {
		border-color: var(--accent-primary);
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
	/*
	 * Кнопка-око носить той самий клас, що й кнопки інструментів поруч.
	 *
	 * Раніше в неї були власні кольори й поведінка: успадкований акцентний
	 * колір проти приглушеного в сусідів, стала прозорість 0.65 проти
	 * наростаючої, і жодного кола на фоні при наведенні. У рядку з трьох
	 * значків це читалося як три різні елементи, хоч поводяться вони однаково.
	 *
	 * Лишилося тут тільки вимкнення — його в кнопок інструментів немає, бо
	 * вимкненими вони не бувають.
	 */
	.input-tools__btn:disabled {
		cursor: default;
		opacity: 0.35;
	}

	/* Попередження під полем: кожне окремим рядком; іконка НЕ стискається при переносі тексту */
	.password-field {
		display: flex;
		flex-direction: column;
	}

	/*
	 * Відступ згори тепер на самому попередженні, а не на контейнері.
	 *
	 * Контейнер лишається в дереві завжди (це `role="status"`), і власний
	 * `margin-top` він додавав навіть порожнім — тобто платив за попередження,
	 * якого немає.
	 */
	.field-warnings {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.field-warning:first-child {
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
