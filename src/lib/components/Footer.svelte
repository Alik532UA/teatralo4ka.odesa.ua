<script lang="ts">
	import PianoModal from "./ui/PianoModal.svelte";
	import Wave from "./Wave.svelte";
	import LocationIcon from "./icons/LocationIcon.svelte";
	import PhoneIcon from "./icons/PhoneIcon.svelte";
	import EmailIcon from "./icons/EmailIcon.svelte";
	import { base } from "$app/paths";
	import { t } from "svelte-i18n";

	let isPianoOpen = $state(false);
</script>

<footer class="footer" id="main-footer">
	<div class="container">
		<div class="footer__content">
			<!-- 1. Button "грати" - Piano Keyboard Style -->
			<button
				class="footer__btn-piano"
				onclick={() => (isPianoOpen = true)}
				aria-label={$t("footer.play")}
			>
				<div class="footer__piano-visual">
					<span class="footer__piano-white"></span>
					<span class="footer__piano-white"></span>
					<span class="footer__piano-white"></span>
					<span class="footer__piano-white"></span>
					<span class="footer__piano-white"></span>
					<span class="footer__piano-black" style="left: 20%"></span>
					<!-- <span class="footer__piano-black" style="left: 35%"></span> -->
					<span class="footer__piano-black" style="left: 60%"></span>
					<span class="footer__piano-black" style="left: 80%"></span>
				</div>
				<span class="footer__btn-piano-text">{$t("footer.play")}</span>
			</button>

			<!-- 2. Contacts Group -->
			<div class="footer__contacts">
				<!-- Address -->
				<div class="footer__info" id="footer-address">
					<div class="footer__info-item">
						<LocationIcon className="footer__icon" size={18} />
						<a
							href="https://maps.app.goo.gl/khSVpMmKieTdW2Ao7"
							target="_blank"
							rel="noopener noreferrer"
							class="footer__link"
						>
							{$t("footer.address")}
						</a>
					</div>
				</div>
				<div class="footer__info" id="footer-phones">
					<div class="footer__info-item">
						<PhoneIcon className="footer__icon" size={18} />
						<div>
							<a href="tel:+380487236101" class="footer__link"
								>{$t("footer.phone")}</a
							>
						</div>
					</div>
				</div>

				<div class="footer__info" id="footer-email">
					<div class="footer__info-item">
						<EmailIcon className="footer__icon" size={18} />
						<div>
							<a
								href="mailto:{$t('footer.email')}"
								class="footer__link">{$t("footer.email")}</a
							>
						</div>
					</div>
				</div>
			</div>

			<!-- 3. Social icons -->
			<div class="footer__social" id="footer-social">
				<a
					href={$t("footer.facebook")}
					class="footer__social-link"
					aria-label="Facebook"
					target="_blank"
					rel="noopener noreferrer"
				>
					<img src={`${base}/social_media/facebook-se-512-50.png`} alt="Facebook" width="24" height="24" />
				</a>
				<a
					href={$t("footer.instagram")}
					class="footer__social-link"
					aria-label="Instagram"
					target="_blank"
					rel="noopener noreferrer"
				>
					<img src={`${base}/social_media/instagram-se-512-50.png`} alt="Instagram" width="24" height="24" />
				</a>
				{#if $t('footer.telegram')}
					<a
						href={$t("footer.telegram")}
						class="footer__social-link"
						aria-label="Telegram"
						target="_blank"
						rel="noopener noreferrer"
					>
						<img src={`${base}/social_media/Telegram-se-320px-50q.png`} alt="Telegram" width="24" height="24" />
					</a>
				{/if}
				{#if $t('footer.youtube')}
					<a
						href={$t("footer.youtube")}
						class="footer__social-link"
						aria-label="YouTube"
						target="_blank"
						rel="noopener noreferrer"
					>
						<img src={`${base}/social_media/YouTube-se-512px-50q.png`} alt="YouTube" width="24" height="24" />
					</a>
				{/if}
				{#if $t('footer.tiktok')}
					<a
						href={$t("footer.tiktok")}
						class="footer__social-link"
						aria-label="TikTok"
						target="_blank"
						rel="noopener noreferrer"
					>
						<img src={`${base}/social_media/TikTok-se-512-50.png`} alt="TikTok" width="24" height="24" />
					</a>
				{/if}
			</div>

			<!-- 4. Button "замовити сайт" -->
			<a
				href="https://alik532ua.github.io/DigitalWorkshop/?tab=promo&theme=colorful"
				target="_blank"
				class="footer__btn-order"
			>
				{$t("footer.order")}
			</a>
		</div>
	</div>
</footer>

<PianoModal isOpen={isPianoOpen} onClose={() => (isPianoOpen = false)} />

<style>
	.footer {
		background: var(--color-white);
		padding: var(--space-xl) 0;
		position: relative;
		border: none;
		margin-top: 100px; /* Space for the wave */
		transition: background 800ms ease-in-out;
	}

	:global(.app.with-dynamic-bg) .footer {
		background: transparent;
	}

	/* Content layout */
	.footer__content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-md);
	}

	/* Piano Button Style (Keyboard Segment) */
	.footer__btn-piano {
		position: relative;
		display: flex;
		align-items: flex-end;
		justify-content: center;
		width: 120px;
		height: 36px;
		background: var(--theme-footer-piano-base);
		border: 2px solid var(--theme-footer-piano-base);
		border-radius: 4px 4px 6px 6px;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 3px 0 var(--theme-footer-piano-base);
		overflow: hidden;
		padding: 0;
	}

	.footer__piano-visual {
		position: absolute;
		inset: 0;
		display: flex;
		background: var(--theme-footer-piano-base);
	}

	.footer__piano-white {
		flex: 1;
		background: var(--theme-footer-piano-white);
		border-right: 1px solid var(--theme-footer-piano-white-border);
		height: 100%;
	}

	.footer__piano-white:last-child {
		border-right: none;
	}

	.footer__piano-black {
		position: absolute;
		top: 0;
		width: 12%;
		height: 60%;
		background: var(--theme-footer-piano-base);
		border-radius: 0 0 2px 2px;
		transform: translateX(-50%);
		z-index: 1;
	}

	.footer__btn-piano:hover {
		transform: translateY(1.5px);
		box-shadow: 0 1.5px 0 var(--theme-footer-piano-base);
	}

	.footer__btn-piano:active {
		transform: translateY(3px);
		box-shadow: 0 0 0 var(--theme-footer-piano-base);
	}

	.footer__btn-piano-text {
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: 0.75rem;
		text-transform: uppercase;
		color: var(--theme-footer-piano-text);
		z-index: 2;
		background: var(--theme-footer-piano-text-bg);
		padding: 1px 4px;
		border-radius: 3px;
		pointer-events: none;
		margin-bottom: 2px;
	}

	/* Order Button Style */
	.footer__btn-order {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 120px;
		height: 36px;
		background: transparent;
		color: var(--color-deep-ocean);
		border: 2px solid var(--color-deep-ocean);
		border-radius: var(--radius-full);
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		transition: all var(--transition-base);
		text-align: center;
		line-height: 1.1;
	}

	.footer__btn-order:hover {
		background: var(--color-deep-ocean);
		color: var(--theme-footer-order-hover-text);
		transform: scale(1.03);
	}

	.footer__contacts {
		display: flex;
		gap: var(--space-lg);
		align-items: center;
	}

	.footer__info-item {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		font-size: 0.8rem;
		color: var(--color-body-text);
		white-space: nowrap;
	}

	.footer__link {
		transition: color var(--transition-fast);
	}

	.footer__link:hover {
		color: var(--color-deep-ocean);
	}

	/* Social */
	.footer__social {
		display: flex;
		gap: var(--space-sm);
	}

	.footer__social-link {
		width: 36px;
		height: 36px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-white);
		border: 1px solid rgba(0,0,0,0.05);
		transition: all var(--transition-base);
		overflow: hidden;
	}

	.footer__social-link img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.footer__social-link:hover {
		transform: scale(1.03);
		box-shadow: 0 5px 15px rgba(0,0,0,0.1);
	}

	/* Responsive */
	@media (max-width: 1200px) {
		.footer__contacts {
			gap: var(--space-md);
		}
		.footer__info-item {
			font-size: 0.75rem;
		}
	}

	@media (max-width: 1024px) {
		.footer__content {
			flex-wrap: wrap;
			justify-content: center;
			gap: var(--space-lg);
		}
		.footer__contacts {
			order: 1;
			width: 100%;
			justify-content: center;
		}
		.footer__btn-piano {
			order: 2;
		}
		.footer__social {
			order: 3;
		}
		.footer__btn-order {
			order: 4;
		}
	}

	@media (max-width: 768px) {
		.footer__contacts {
			flex-direction: column;
			gap: var(--space-sm);
		}
		.footer__content {
			flex-direction: row;
			flex-wrap: wrap;
			justify-content: center;
			align-items: center;
			gap: var(--space-sm) var(--space-md);
		}
		.footer__contacts {
			order: 1;
			width: 100%;
			justify-content: center;
		}
		.footer__social {
			order: 2;
			width: 100%;
			justify-content: center;
		}
		.footer__btn-piano {
			order: 3;
			flex: 0 0 auto;
		}
		.footer__btn-order {
			order: 4;
			flex: 0 0 auto;
		}
	}
</style>
