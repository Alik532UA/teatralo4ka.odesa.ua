<script lang="ts">
	import { t } from 'svelte-i18n';
	import { AlertTriangle, AlertCircle } from 'lucide-svelte';
	import { asset } from '$app/paths';
	import type { VerificationStatusProp } from '$lib/data/groups';

	interface Props {
		status?: VerificationStatusProp | null;
	}

	let { status }: Props = $props();

	const isVisible = $derived(status === 'possible_errors' || status === 'definite_errors');
	const isDefinite = $derived(status === 'definite_errors');

	const contacts = [
		{ name: 'Telegram', url: 'https://t.me/alik532', icon: 'telegram.svg' },
		{ name: 'Viber', url: 'viber://chat?number=%2B380937251208', icon: 'viber.svg' },
		{ name: 'WhatsApp', url: 'https://wa.me/380937251208', icon: 'whatsapp.svg' },
		{ name: 'LinkedIn', url: 'https://linkedin.com/in/alik-qa-engineer', icon: 'linkedin.svg' }
	];
</script>

{#if isVisible}
	<aside
		class="verification-banner"
		class:verification-banner--definite={isDefinite}
		class:verification-banner--possible={!isDefinite}
		aria-label={$t(isDefinite ? 'verification.definiteErrors' : 'verification.possibleErrors')}
		data-testid="verification-notice-banner"
	>
		<div class="verification-banner__content">
			<span class="verification-banner__icon" aria-hidden="true">
				{#if isDefinite}
					<AlertCircle size={20} />
				{:else}
					<AlertTriangle size={20} />
				{/if}
			</span>

			<p class="verification-banner__text">
				<span>
					{$t(isDefinite ? 'verification.definiteErrors' : 'verification.possibleErrors')}
				</span>
				<span class="verification-banner__action">
					<strong class="verification-banner__cta">{$t('verification.writeMe')}</strong>
					<span class="verification-banner__icons">
						{#each contacts as contact (contact.name)}
							<a
								href={contact.url}
								target="_blank"
								rel="external noopener noreferrer"
								class="verification-banner__link"
								aria-label={contact.name}
								title={contact.name}
								data-testid="verification-banner-link-{contact.name.toLowerCase()}"
							>
								<img
									src={asset(`/social_media/${contact.icon}`)}
									alt={contact.name}
									width="20"
									height="20"
									class="verification-banner__social-icon"
								/>
							</a>
						{/each}
					</span>
				</span>
			</p>
		</div>
	</aside>
{/if}

<style>
	.verification-banner {
		position: relative;
		z-index: 2;
		margin: 0.75rem 0 1.25rem;
		border-radius: 1rem;
		padding: 0.85rem 1.15rem;
		backdrop-filter: blur(12px);
		transition: border-color var(--transition-base);
	}

	/*
	 * КОЛЬОРИ ЧЕРЕЗ `light-dark()`, а не через селектор однієї теми.
	 *
	 * ## Що було зламано
	 *
	 * Тем у проєкті шість: `light`, `dark`, `yellow`, `light-yellow`,
	 * `dark-cyan`, `dark-blue`. Банер мав темні значення в основному правилі й
	 * світлі — під `[data-theme='light']`. Дві ЖОВТІ теми світлі, але цим
	 * селектором не накриваються, тож отримували колір тексту для темного тла.
	 *
	 * Заміряно на сторінці вистави (контраст тексту до складеного фону):
	 *
	 *   light 8,28 · dark 10,16 · dark-cyan 11,17 · dark-blue 11,66
	 *   yellow 1,01 ✗ · light-yellow 1,03 ✗
	 *
	 * Одиниця — це «того самого кольору». Автор так і побачив: «світлий текст
	 * на світлому фоні, текст не видно».
	 *
	 * ## Чому саме `light-dark()`, а не ще два селектори
	 *
	 * Перелічити жовті теми поруч зі світлою — та сама пастка, лише відкладена:
	 * наступна тема знову не потрапить у список. `light-dark()` питає не назву
	 * теми, а `color-scheme`, який `global.css` звужує КОЖНІЙ темі (і це
	 * стережеться гейтом `theme-appearance`). Тобто нова тема отримує правильну
	 * половину вже тим, що оголосила свою схему.
	 *
	 * Порядок аргументів — `light-dark(світле, темне)`, як у палітрі
	 * `themes/light.css`.
	 *
	 * Чого axe не бачить: у банера `backdrop-filter`, а крізь нього axe фон не
	 * обчислює й відносить елемент до «не змогла визначити», а не до порушень.
	 * Тому контраст банера стережеться власним заміром у
	 * `e2e/theme-contrast.spec.ts`.
	 */
	.verification-banner--possible {
		background: light-dark(rgb(245 158 11 / 0.12), rgb(245 158 11 / 0.1));
		border: 1px solid light-dark(rgb(217 119 6 / 0.4), rgb(245 158 11 / 0.35));
		color: light-dark(#78350f, #fef3c7);
	}

	.verification-banner--definite {
		background: rgb(239 68 68 / 0.12);
		border: 1px solid light-dark(rgb(220 38 38 / 0.45), rgb(239 68 68 / 0.4));
		color: light-dark(#7f1d1d, #fee2e2);
	}

	.verification-banner__content {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
	}

	.verification-banner__icon {
		display: flex;
		align-items: center;
		flex-shrink: 0;
		margin-top: 0.15rem;
	}

	.verification-banner--possible .verification-banner__icon {
		color: #f59e0b;
	}

	.verification-banner--definite .verification-banner__icon {
		color: #ef4444;
	}

	.verification-banner__text {
		margin: 0;
		font-size: 0.88rem;
		line-height: 1.45;
		display: inline;
	}

	.verification-banner__action {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		margin-left: 0.4rem;
		white-space: nowrap;
		vertical-align: middle;
	}

	.verification-banner__cta {
		font-weight: 700;
		color: inherit;
	}

	.verification-banner__icons {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
	}

	.verification-banner__link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		border-radius: 50%;
		background: light-dark(rgb(0 0 0 / 0.08), rgb(255 255 255 / 0.12));
		transition:
			transform var(--transition-fast),
			background var(--transition-fast);
	}

	.verification-banner__link:hover {
		transform: scale(1.15);
		background: light-dark(rgb(0 0 0 / 0.16), rgb(255 255 255 / 0.25));
	}

	.verification-banner__social-icon {
		width: 18px;
		height: 18px;
		object-fit: contain;
		display: block;
	}

	@media (max-width: 640px) {
		.verification-banner {
			padding: 0.75rem 0.9rem;
			margin: 0.5rem 0 1rem;
		}

		.verification-banner__text {
			font-size: 0.82rem;
		}

		.verification-banner__action {
			display: flex;
			margin-left: 0;
			margin-top: 0.4rem;
		}
	}
</style>
