<script lang="ts">
	import { t } from 'svelte-i18n';
	import { fade, fly } from 'svelte/transition';
	import { X, ExternalLink, Loader2 } from 'lucide-svelte';
	import { focusTrap } from '$lib/utils/focusTrap';
	import { browser } from '$app/environment';

	/**
	 * ДВІ РІЗНІ АНКЕТИ, і плутати їх не можна.
	 *
	 * `graduate` — та, що була завжди: її посилання роздане й лишається без
	 * змін (пряма вимога автора).
	 *
	 * `student` — анкета «Планета Творчості!» для тих, хто вчиться зараз. Автор
	 * дав адресу виду `docs.google.com/forms/d/<id>` — це бік РЕДАКТОРА: як
	 * анонімний відвідувач вона віддає перенаправлення з `?edit_requested=true`.
	 * Тому тут стоїть кінцева адреса для відповідача (`/forms/d/e/…/viewform`),
	 * та сама, на яку веде ланцюжок перенаправлень. Заміряно `curl`-ом: статус
	 * 200, заголовок сторінки «Планета Творчості!».
	 *
	 * Це не педантизм: у вікні форма показується в `iframe`, а Google блокує
	 * вбудовування проміжних адрес — вікно відкрилося б порожнім.
	 */
	const FORMS = {
		graduate:
			'https://docs.google.com/forms/d/e/1FAIpQLSfT1mDSKiVjVSisavSUCBSfB43IE_Dj7dzP5EngQOA9O1V3Ng/viewform',
		student:
			'https://docs.google.com/forms/d/e/1FAIpQLSdJJl2M-N0p9lIId8BexVk7zCTXA4xg9inw1uhbTybDzY-LAA/viewform'
	} as const;

	interface Props {
		isOpen: boolean;
		onclose: () => void;
		/** Кого питаємо: випускника (типово) чи учня «Планети творчості». */
		variant?: keyof typeof FORMS;
	}

	// `graduateName?: string` тут був, і його не передавав жоден виклик, а сам
	// компонент ним не користувався: форма Google не приймає початкових значень
	// через URL у цій конфігурації. Прибрано разом із пропом — оголошений і
	// нікуди не підключений параметр читається як зроблена робота
	// (PROJECT-STRUCTURE-v8 § 1).
	let { isOpen, onclose, variant = 'graduate' }: Props = $props();

	/**
	 * Заголовок вікна — теж за видом.
	 *
	 * Автор побачив розходження одразу: у вікні відкривалася анкета «Планета
	 * Творчості!», а підпис над нею казав «Анкета випускника». Ключ у ключа: у
	 * випускника свій, в учня свій.
	 */
	const TITLE_KEYS = { graduate: 'galaxy.formModalTitle', student: 'planet.formModalTitle' } as const;

	const FORM_VIEW_URL = $derived(FORMS[variant]);
	const заголовок = $derived(
		$t(TITLE_KEYS[variant], { default: variant === 'student' ? 'Анкета учня' : 'Анкета випускника' })
	);
	const FORM_EMBED_URL = $derived(`${FORM_VIEW_URL}?embedded=true`);



	let isLoading = $state(true);

	$effect(() => {
		if (isOpen) {
			isLoading = true;
		}
	});

	// Lock body scroll when form modal is open
	$effect(() => {
		if (!browser) return;
		if (isOpen) {
			const originalOverflow = document.body.style.overflow;
			document.body.style.overflow = 'hidden';
			return () => {
				document.body.style.overflow = originalOverflow;
			};
		}
	});

	function handleKeydown(e: KeyboardEvent) {
		if (!isOpen) return;
		if (e.key === 'Escape') {
			e.preventDefault();
			e.stopPropagation();
			onclose();
		}
	}

	function handlePopState() {
		if (isOpen) {
			const hasFormParam = new URL(window.location.href).searchParams.has('form');
			if (!hasFormParam) {
				onclose();
			}
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} onpopstate={handlePopState} />

{#if isOpen}
	<div
		class="form-backdrop"
		transition:fade={{ duration: 200 }}
		onclick={onclose}
		role="presentation"
		data-testid="graduate-form-backdrop"
	></div>

	<div
		class="form-modal"
		role="dialog"
		aria-modal="true"
		aria-labelledby="graduate-form-title"
		transition:fly={{ y: 20, duration: 250 }}
		{@attach focusTrap()}
		data-testid="graduate-form-modal"
	>
		<div class="form-modal__header" data-testid="graduate-form-header">
			<div class="form-modal__title-wrap">
				<h3 class="form-modal__title" id="graduate-form-title" data-testid="graduate-form-title">
					{заголовок}
				</h3>
			</div>

			<div class="form-modal__actions">
				<!-- Адреса зовнішня (Google Forms), тож `resolve()` до неї не застосовний. Тег навмисно одним рядком: `disable-next-line` накриває САМЕ наступний рядок, і розбитий на атрибути тег знову зробив би lint червоним. -->
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a href={FORM_VIEW_URL} target="_blank" rel="noopener noreferrer" class="form-modal__action-btn" title={$t('galaxy.openInNewTab', { default: 'Відкрити в новій вкладці' })} aria-label={$t('galaxy.openInNewTab', { default: 'Відкрити в новій вкладці' })} data-testid="graduate-form-external-link">
					<ExternalLink size={18} aria-hidden="true" />
				</a>

				<button
					type="button"
					class="form-modal__action-btn form-modal__close-btn"
					onclick={onclose}
					aria-label={$t('common.close')}
					data-testid="graduate-form-close-btn"
				>
					<X size={20} aria-hidden="true" />
				</button>
			</div>
		</div>

		<div class="form-modal__body" data-testid="graduate-form-panel">
			{#if isLoading}
				<div class="form-modal__loader" data-testid="graduate-form-spinner">
					<Loader2 size={36} class="spinner" aria-hidden="true" />
					<p>{$t('common.loading')}</p>
				</div>
			{/if}

			<iframe
				src={FORM_EMBED_URL}
				class="form-modal__iframe"
				class:is-loaded={!isLoading}
				title={заголовок}
				onload={() => (isLoading = false)}
				data-testid="graduate-form-frame-container"
			></iframe>
		</div>
	</div>
{/if}

<style>
	.form-backdrop {
		position: fixed;
		inset: 0;
		z-index: 1000;
		background: rgb(3 6 20 / 0.22);
		backdrop-filter: blur(2px);
		-webkit-backdrop-filter: blur(2px);
	}

	.form-modal {
		position: fixed;
		z-index: 1001;
		left: 50%;
		top: 50%;
		translate: -50% -50%;
		width: min(840px, 94vw);
		height: min(90dvh, 880px);
		display: flex;
		flex-direction: column;
		background: var(--galaxy-card-bg, #071324);
		border: 1px solid rgb(140 190 255 / 0.28);
		border-radius: 1.5rem;
		box-shadow: 0 24px 64px rgb(0 0 0 / 0.6), 0 0 0 1px rgb(140 190 255 / 0.1);
		overflow: hidden;
		color: var(--galaxy-text, #e2eeff);
	}

	.form-modal__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.9rem 1.25rem;
		border-bottom: 1px solid rgb(140 190 255 / 0.15);
		background: color-mix(in srgb, var(--galaxy-card-bg, #071324), #fff 3%);
	}

	.form-modal__title-wrap {
		min-width: 0;
		overflow: hidden;
	}

	.form-modal__title {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
		color: #fff;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.form-modal__actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.form-modal__action-btn {
		display: grid;
		place-items: center;
		width: 38px;
		height: 38px;
		border-radius: 50%;
		background: rgb(140 190 255 / 0.12);
		border: 1px solid rgb(140 190 255 / 0.25);
		color: #cfe4ff;
		cursor: pointer;
		text-decoration: none;
	}

	.form-modal__action-btn:hover {
		background: rgb(140 190 255 / 0.25);
		border-color: rgb(140 190 255 / 0.5);
		color: #fff;
	}

	.form-modal__body {
		position: relative;
		flex: 1;
		width: 100%;
		height: 100%;
		min-height: 0;
		background: #fff;
	}

	.form-modal__loader {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		background: var(--galaxy-card-bg, #071324);
		color: rgb(140 190 255 / 0.9);
		font-size: 0.95rem;
		z-index: 2;
	}

	:global(.spinner) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.form-modal__iframe {
		width: 100%;
		height: 100%;
		border: none;
		display: block;
		opacity: 0;
		transition: opacity 0.25s ease;
	}

	.form-modal__iframe.is-loaded {
		opacity: 1;
	}
</style>
