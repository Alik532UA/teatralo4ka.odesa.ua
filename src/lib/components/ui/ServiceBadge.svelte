<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { onDestroy } from 'svelte';
	import { Check, Copy } from 'lucide-svelte';
	import { debugMode } from '$lib/services/debugMode.svelte';
	import { errorLogger } from '$lib/services/errorLogger';
	import { buildLogReport } from '$lib/services/errorReport';
	import { showReportFallback } from '$lib/services/perfLog';

	/**
	 * Службове табло: номер версії, лічильник помилок і збір звіту — ОДИН елемент.
	 *
	 * **Чого тут не було доти.** Логер працює й маскує PII, але забрати з нього звіт
	 * не було чим: ні кнопки, ні номера версії на екрані. `getCache()` міг прочитати
	 * лише той, хто відкрив DevTools і знав назву сервісу, — тобто діагностика
	 * існувала для того, хто й без неї бачить консоль.
	 *
	 * **Форма змінюється, місце — ні.** У спокої це капсула з номером версії; коли є
	 * помилки — червоний кружок із їхньою кількістю; після копіювання — галочка.
	 *
	 * **Видимість (DEBUGGING-v8 § 2.1, із відхиленням).** У dev табло видиме ЗАВЖДИ,
	 * а не лише за наявності помилок: воно несе номер версії, а його ховати нема
	 * сенсу. У проді приховане, доки не ввімкнено debug-режим — серією натискань `V`,
	 * параметром `?debug=1` або збереженим прапорцем.
	 *
	 * **Лічильник через підписку, а не через руну.** `errorLogger` — звичайний
	 * TypeScript-модуль, який імпортують `hooks.client` і `firebase/config`; робити
	 * його рунним заради цього числа означало б привʼязати службу логування до
	 * фреймворку. Тут `$state` живе на боці компонента й оновлюється з
	 * `errorLogger.subscribe`.
	 */
	let copied = $state(false);
	let copyTimer: ReturnType<typeof setTimeout> | undefined;

	let errorCount = $state(errorLogger.errorCount);

	$effect(() => errorLogger.subscribe(() => (errorCount = errorLogger.errorCount)));

	/*
	 * `browser &&` обовʼязковий: сторінки пререндеряться, а під час пререндеру
	 * звернення до `page.url.searchParams` кидає й валить збірку цілком.
	 */
	const urlDebug = $derived(browser && page.url.searchParams.get('debug') === '1');
	/*
	 * `?debug=1` діє ПОВЕРХ збереженого стану: посилання з ним мусить показати табло
	 * навіть тому, хто раніше сховав його серією натискань. Інакше єдиний досяжний на
	 * дотику шлях можна було б заблокувати назавжди.
	 */
	const isVisible = $derived(urlDebug || debugMode.enabled);

	onDestroy(() => {
		if (copyTimer) clearTimeout(copyTimer);
	});

	async function copyReport() {
		try {
			await navigator.clipboard.writeText(buildLogReport());
			copied = true;
			copyTimer = setTimeout(() => (copied = false), 1500);
		} catch (error) {
			/*
			 * `logWarning`, а не `logError`: рівень «помилка» крутив би рівно той
			 * лічильник, який малює ця кнопка — невдала спроба скопіювати звіт створювала
			 * б привід показати кнопку копіювання звіту. Та й відмова буфера обміну не
			 * збій застосунку: поза HTTPS і без дозволу вона очікувана.
			 */
			errorLogger.logWarning('не вдалося скопіювати звіт', { component: 'ServiceBadge' }, error);
			/*
			 * Але звіт не має зникати разом із відмовою (DEBUGGING-v8 § 2.3): текст
			 * показується в полі поруч, звідки його можна виділити руками. Доти
			 * лишалося тільке попередження в консолі — тобто саме там, куди людина з
			 * телефоном подивитися не може.
			 */
			showReportFallback(buildLogReport());
		}
	}
</script>

{#if isVisible}
	<button
		type="button"
		class="badge"
		class:badge--has-errors={errorCount > 0}
		class:badge--copied={copied}
		onclick={copyReport}
		aria-label={`Копіювати звіт / Copy report — ${errorLogger.appVersion}`}
		data-testid="app-version-value"
	>
		<!-- Номер версії — поза гілками: лічильник ДОДАЄТЬСЯ до нього, а не заміняє
		     його. Інакше на dev, де помилка буває майже завжди, версії не видно. -->
		{#if copied}
			<Check size={14} class="badge__hint" />
		{:else if errorCount > 0}
			<span class="badge__count">{errorCount > 99 ? '99+' : errorCount}</span>
		{:else}
			<Copy size={12} class="badge__hint" />
		{/if}
		<span class="badge__version">{errorLogger.appVersion}</span>
	</button>
{/if}

<style>
	.badge {
		position: fixed;
		bottom: 16px;
		left: 16px;
		z-index: 9999;

		display: flex;
		align-items: center;
		justify-content: center;
		gap: 4px;

		/* Капсула: номер версії в коло 32px не влазить. */
		min-height: 32px;
		padding: 0 8px;
		border-radius: 16px;

		background: var(--color-surface);
		color: var(--color-text-primary);
		border: 2px solid var(--color-border);
		cursor: pointer;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		transition: transform 0.2s ease;
	}

	.badge:hover {
		transform: scale(1.05);
	}

	.badge__version {
		font-size: 10px;
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
		line-height: 1;
		/* Номер читає той, хто дивиться на скріншот, тож він не має «розсипатися». */
		white-space: nowrap;
	}

	/*
	 * Іконка копіювання — підказка, що капсула клікабельна, а не окрема дія. Тому
	 * вона дрібніша за номер і тане: головне тут число версії.
	 */
	.badge :global(.badge__hint) {
		opacity: 0.6;
		flex: none;
	}

	/*
	 * Форма НЕ змінюється між станами: капсула лишається капсулою, бо номер версії
	 * лишається на місці. Доти помилки перетворювали табло на кружок 32px — зникала не
	 * лише версія, а й упізнаваність елемента.
	 */

	/*
	 * Кольори сигналу — літерали, а не токени теми, свідомо: «є помилки» мусить
	 * виглядати однаково в усіх чотирьох темах. Обидва підібрані за WCAG AA під
	 * білий текст: #c92a2a дає 5.46:1, #237a35 — 5.38:1. Звичні #ef4444 і #2f9e44
	 * дають 3.76:1 і 3.45:1, тобто плашку, яку читають саме тоді, коли щось пішло не
	 * так, було б погано видно.
	 */
	.badge--has-errors {
		background: #c92a2a;
		color: #ffffff;
		border-color: #7f1d1d;
	}

	.badge--copied {
		background: #237a35;
		color: #ffffff;
		border-color: #1b5e20;
	}

	/*
	 * Лічильник — плашка ПЕРЕД номером, а не текст замість нього. Темніший червоний за
	 * тло капсули (#7f1d1d на #c92a2a): білий текст дає на ньому 10:1.
	 */
	.badge__count {
		font-weight: 700;
		font-size: 0.75rem;
		line-height: 1;
		padding: 2px 5px;
		border-radius: 8px;
		background: #7f1d1d;
		color: #ffffff;
	}

	/*
	 * Розмір залежить від СПОСОБУ ВВЕДЕННЯ, а не від ширини вікна: на десктопі 700px
	 * кнопка лишалася б маленькою для миші, а на планшеті 1024px — маленькою для
	 * дотику (ACCESSIBILITY-v8 § 8, DEBUGGING-v8 § 2.2).
	 */
	@media (hover: none) {
		.badge {
			min-height: 44px;
			padding: 0 12px;
			border-radius: 22px;
		}

		.badge__version {
			font-size: 12px;
		}
	}
</style>
