<script lang="ts">
	import { toast, type ToastMessage } from '$lib/controllers/toast.svelte';
	import { CheckCircle2, AlertCircle, Info, X } from 'lucide-svelte';
	import { fly, fade } from 'svelte/transition';
	import { MediaQuery } from 'svelte/reactivity';
	import { t } from 'svelte-i18n';

	/**
	 * Два розміщення (NOTIFICATIONS-v8 § 5): глобальний стек у кутку для подій,
	 * не пов'язаних із конкретною кнопкою, і анкорний тост біля тригера.
	 *
	 * Потреба конкретна: підтвердження «адресу скопійовано» в кутку екрана
	 * відірване від місця, куди відвідувач щойно клікнув, — на довгій сторінці
	 * воно взагалі поза полем зору.
	 *
	 * На вузьких екранах анкор ігнорується: там кут передбачуваніший, а місця
	 * поруч із посиланням однаково немає.
	 */
	const isNarrow = new MediaQuery('(max-width: 600px)');

	const globalMsgs = $derived(toast.messages.filter((m) => !m.anchor || isNarrow.current));
	const anchoredMsgs = $derived(toast.messages.filter((m) => m.anchor && !isNarrow.current));

	/**
	 * Ставить тост біля свого посилання.
	 *
	 * Переворот за половиною вьюпорта: тригер у нижній половині — тост зверху,
	 * у верхній — знизу. Далі кламп за ВИМІРЯНИМ розміром тоста, інакше він
	 * вилазить за край, і сенс анкорності зникає.
	 */
	function positionAnchored(node: HTMLElement, anchor: HTMLElement) {
		const place = () => {
			const a = anchor.getBoundingClientRect();
			const w = node.getBoundingClientRect();
			const gap = 10;
			const margin = 8;

			const above = a.top + a.height / 2 > window.innerHeight / 2;
			let top = above ? a.top - gap - w.height : a.bottom + gap;
			top = Math.max(margin, Math.min(top, window.innerHeight - w.height - margin));

			let left = a.left + a.width / 2 - w.width / 2;
			left = Math.max(margin, Math.min(left, window.innerWidth - w.width - margin));

			node.style.top = `${Math.round(top)}px`;
			node.style.left = `${Math.round(left)}px`;
		};
		place();
		return { update: place };
	}

	/**
	 * Позиція рахується один раз, тож при прокрутці тост «відклеївся» б від
	 * посилання. Замість того, щоб їздити за ним, він просто закривається.
	 * Поріг у кілька пікселів — щоб випадковий субпіксельний зсув не гасив
	 * тост одразу після появи.
	 */
	$effect(() => {
		if (anchoredMsgs.length === 0) return;
		const startX = window.scrollX;
		const startY = window.scrollY;
		const closeAnchored = () => {
			for (const m of toast.messages) if (m.anchor) toast.remove(m.id);
		};
		const onScroll = () => {
			if (Math.abs(window.scrollX - startX) < 6 && Math.abs(window.scrollY - startY) < 6) return;
			closeAnchored();
		};
		window.addEventListener('scroll', onScroll, { passive: true, capture: true });
		window.addEventListener('resize', closeAnchored);
		return () => {
			window.removeEventListener('scroll', onScroll, true);
			window.removeEventListener('resize', closeAnchored);
		};
	});
</script>

{#snippet toastCard(msg: ToastMessage)}
	<div
		class="toast-msg toast-{msg.type}"
		in:fly={{ y: 20, duration: 300 }}
		out:fade={{ duration: 200 }}
		role="alert"
		data-testid={`toast-message-${msg.type}`}
		onmouseenter={() => toast.pauseTimer(msg.id)}
		onmouseleave={() => toast.resumeTimer(msg.id)}
		onfocusin={() => toast.pauseTimer(msg.id)}
		onfocusout={() => toast.resumeTimer(msg.id)}
	>
		<div class="toast-icon" data-testid={`toast-icon-${msg.type}`}>
			{#if msg.type === 'success'}
				<CheckCircle2 size={20} />
			{:else if msg.type === 'error'}
				<AlertCircle size={20} />
			{:else}
				<div data-testid="toast-icon-info">
					<Info size={20} />
				</div>
			{/if}
		</div>
		<div class="toast-content" data-testid="toast-panel">
			<div class="toast-message" data-testid="toast-text-label">{msg.message}</div>
			{#if msg.action}
				<button 
					class="toast-action" 
					onclick={() => {
						msg.action?.onAction();
						toast.remove(msg.id);
					}}
					data-testid="toast-action-btn"
				>
					{toast.getActionLabel(msg.action)}
				</button>
			{/if}
		</div>
		<button 
			class="toast-close" 
			onclick={() => toast.remove(msg.id)} 
			aria-label={$t('common.close')}
			data-testid="toast-close-btn"
		>
			<X size={16} />
		</button>
		<div
			class="toast-progress"
			style="animation-duration: {msg.duration}ms"
			data-testid="toast-progress-bar"
			aria-hidden="true"
		></div>
	</div>
{/snippet}

<!-- Глобальний стек у кутку: усе, що не прив'язане до конкретної кнопки. -->
<div class="toast-container" data-testid="toast-notifications-container">
	{#each globalMsgs as msg (msg.id)}
		{@render toastCard(msg)}
	{/each}
</div>

<!-- Анкорні: біля свого посилання, з переворотом угору/вниз (§ 5). -->
{#each anchoredMsgs as msg (msg.id)}
	<div
		class="toast-anchored"
		use:positionAnchored={msg.anchor!}
		data-testid="toast-anchored-container"
	>
		{@render toastCard(msg)}
	</div>
{/each}

<style>
	/* Анкорний тост позиціюється скриптом; ширина обмежена, щоб кламп до
	   країв вьюпорта мав із чим працювати. */
	.toast-anchored {
		position: fixed;
		top: 0;
		left: 0;
		max-width: min(450px, calc(100vw - 16px));
		z-index: 10001;
	}

	.toast-container {
		position: fixed;
		bottom: 2rem;
		right: 2rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		z-index: 10000;
		pointer-events: none;
	}

	.toast-msg {
		pointer-events: auto;
		position: relative;
		overflow: hidden;
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		padding: 1rem 1.25rem 1rem 1.25rem;
		border-radius: 16px;
		background: color-mix(in srgb, var(--bg-card), transparent 15%);
		backdrop-filter: blur(12px);
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
		min-width: 320px;
		max-width: 450px;
		border: 1px solid rgba(0, 0, 0, 0.05);
	}

	.toast-msg:hover .toast-progress,
	.toast-msg:focus-within .toast-progress {
		animation-play-state: paused;
	}

	/* ── Progress bar ── */
	@keyframes toast-shrink {
		from { transform: scaleX(1); }
		to   { transform: scaleX(0); }
	}

	.toast-progress {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 3px;
		transform-origin: left center;
		animation: toast-shrink linear forwards;
		/* animation-duration is set inline per msg */
		border-radius: 0 0 0 16px;
	}

	.toast-success .toast-progress { background: #22c55e; }
	.toast-error   .toast-progress { background: #ef4444; }
	.toast-info    .toast-progress { background: #3b82f6; }

	.toast-icon {
		margin-top: 2px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.toast-success .toast-icon { color: #22c55e; }
	.toast-error .toast-icon { color: #ef4444; }
	.toast-info .toast-icon { color: #3b82f6; }

	.toast-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.toast-message {
		font-size: 0.95rem;
		font-weight: 500;
		color: var(--text-title, #1a2a3a);
		word-break: break-word;
		line-height: 1.4;
	}

	.toast-action {
		background: var(--color-light-blue, #e0f2fe);
		color: var(--text-title, #1a2a3a);
		border: 1px solid rgba(0,0,0,0.05);
		padding: 0.5rem 1rem;
		border-radius: 8px;
		font-size: 0.85rem;
		font-weight: 700;
		cursor: pointer;
		align-self: flex-start;
		transition: all 0.2s;
		font-family: var(--font-heading);
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}

	.toast-action:hover {
		background: var(--color-sky-blue, #bae6fd);
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(0,0,0,0.1);
	}

	.toast-close {
		background: none;
		border: none;
		color: var(--color-muted-text, #94a3b8);
		cursor: pointer;
		padding: 0.25rem;
		margin-top: 2px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		transition: all 0.2s;
		flex-shrink: 0;
	}

	.toast-close:hover {
		background: rgba(0, 0, 0, 0.05);
		color: var(--text-title, #1a2a3a);
	}
	
	@media (max-width: 600px) {
		.toast-container {
			bottom: 1rem;
			left: 1rem;
			right: 1rem;
			align-items: stretch;
		}
		.toast-msg {
			min-width: 0;
			max-width: 100%;
		}
	}
</style>
