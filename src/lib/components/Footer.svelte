<script lang="ts">
	import PianoModal from "./ui/PianoModal.svelte";
	import Wave from "./Wave.svelte";
	import LocationIcon from "./icons/LocationIcon.svelte";
	import PhoneIcon from "./icons/PhoneIcon.svelte";
	import EmailIcon from "./icons/EmailIcon.svelte";
	import { base } from "$app/paths";
	import { t } from "svelte-i18n";
	import { Phone, X } from "lucide-svelte";

	let isPianoOpen = $state(false);
	let isPhonesModalOpen = $state(false);
</script>

<footer class="footer" id="main-footer" data-testid="footer-container">
	<div class="container">
		<div class="footer__content">
			<!-- 1. Button "грати" - Piano Keyboard Style -->
			<button
				class="footer__btn-piano"
				onclick={() => (isPianoOpen = true)}
				aria-label={$t("footer.play")}
				data-testid="footer-piano-btn"
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
			<div class="footer__contacts" data-testid="footer-contacts">
				<!-- Address -->
				<div class="footer__info" id="footer-address">
					<div class="footer__info-item">
						<LocationIcon className="footer__icon" size={18} />
						<a
							href="https://maps.app.goo.gl/khSVpMmKieTdW2Ao7"
							target="_blank"
							rel="noopener noreferrer"
							class="footer__link"
							data-testid="footer-address-link"
						>
							{$t("footer.address")}
						</a>
					</div>
				</div>
				<div class="footer__info" id="footer-phones">
					<div class="footer__info-item">
						<PhoneIcon className="footer__icon" size={18} />
						<div>
							<button 
								class="footer__link" 
								style="background: none; border: none; padding: 0; cursor: pointer; font: inherit;"
								onclick={() => (isPhonesModalOpen = true)}
								data-testid="footer-phone-btn"
							>
								{$t("footer.phone")}
							</button>
						</div>
					</div>
				</div>

				<div class="footer__info" id="footer-email">
					<div class="footer__info-item">
						<EmailIcon className="footer__icon" size={18} />
						<div>
							<a
								href="mailto:{$t('footer.email')}"
								class="footer__link"
								data-testid="footer-email-link"
							>{$t("footer.email")}</a
							>
						</div>
					</div>
				</div>
			</div>

			<!-- 3. Social icons -->
			<div class="footer__social" id="footer-social" data-testid="footer-social">
				<a
					href={$t("footer.facebook")}
					class="footer__social-link"
					aria-label="Facebook"
					target="_blank"
					rel="noopener noreferrer"
					data-testid="footer-facebook-link"
				>
					<img src={`${base}/social_media/facebook-se-512-50.png`} alt="Facebook" width="24" height="24" />
				</a>
				<a
					href={$t("footer.instagram")}
					class="footer__social-link"
					aria-label="Instagram"
					target="_blank"
					rel="noopener noreferrer"
					data-testid="footer-instagram-link"
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
						   data-testid="footer-telegram-link"
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
						   data-testid="footer-youtube-link"
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
						   data-testid="footer-tiktok-link"
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
				data-testid="footer-order-btn"
			>
				{$t("footer.order")}
			</a>
		</div>
	</div>
</footer>

<PianoModal isOpen={isPianoOpen} onClose={() => (isPianoOpen = false)} />

{#if isPhonesModalOpen}
	<div class="modal-overlay" onclick={() => (isPhonesModalOpen = false)} role="button" tabindex="0" onkeydown={(e) => e.key === 'Escape' && (isPhonesModalOpen = false)}>
		<div class="phones-modal" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="phones-modal-title">
			<div class="modal-header">
				<h2 id="phones-modal-title" style="margin: 0; font-size: 1.5rem; color: var(--color-deep-ocean); font-family: var(--font-heading);">
					Контакти
				</h2>
				<button class="btn-close" aria-label="Закрити" onclick={() => (isPhonesModalOpen = false)}>
					<X size={24} />
				</button>
			</div>
			
			<div class="phones-list">
				<a href="tel:+380487236304" class="phone-item">
					<div class="phone-icon-wrap"><Phone size={20} /></div>
					<div class="phone-text">
						<strong><span class="phone-desktop">+38 048 723 63 04</span><span class="phone-mobile">+380487236304</span></strong>
						<span>директор</span>
					</div>
				</a>
				<a href="tel:+380487236101" class="phone-item">
					<div class="phone-icon-wrap"><Phone size={20} /></div>
					<div class="phone-text">
						<strong><span class="phone-desktop">+38 048 723 61 01</span><span class="phone-mobile">+380487236101</span></strong>
						<span>секретар</span>
					</div>
				</a>
				<a href="tel:+380487233259" class="phone-item">
					<div class="phone-icon-wrap"><Phone size={20} /></div>
					<div class="phone-text">
						<strong><span class="phone-desktop">+38 048 723 32 59</span><span class="phone-mobile">+380487233259</span></strong>
						<span>завуч</span>
					</div>
				</a>
				<a href="tel:+380487234203" class="phone-item">
					<div class="phone-icon-wrap"><Phone size={20} /></div>
					<div class="phone-text">
						<strong><span class="phone-desktop">+38 048 723 42 03</span><span class="phone-mobile">+380487234203</span></strong>
						<span>вахта</span>
					</div>
				</a>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Phones Modal */
	.modal-overlay {
		position: fixed; top: 0; left: 0; width: 100%; height: 100%;
		background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
		display: flex; align-items: center; justify-content: center;
		z-index: 1000; padding: 20px;
	}
	.phones-modal {
		background: var(--theme-dynamic-card-bg, #ffffff);
		border-radius: 24px; padding: 2.5rem;
		max-width: 400px; width: 100%; box-shadow: 0 30px 60px rgba(0,0,0,0.2);
		display: flex; flex-direction: column; gap: 1.5rem;
		color: var(--color-body-text);
		border: 1px solid rgba(0,0,0,0.05);
	}
	:global(.dark-theme) .phones-modal {
		background: var(--theme-dynamic-card-bg, #1a2a3a);
		border-color: rgba(255,255,255,0.1);
	}
	.modal-header {
		display: flex; justify-content: space-between; align-items: center;
		margin-bottom: 0.5rem;
	}
	:global(.dark-theme) .modal-header h2 {
		color: var(--color-dark-text) !important;
	}
	.btn-close {
		background: none; border: none; color: inherit; cursor: pointer;
		padding: 0.5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center;
		transition: background 0.2s; opacity: 0.6;
	}
	.btn-close:hover { background: rgba(0,0,0,0.05); opacity: 1; }
	:global(.dark-theme) .btn-close:hover { background: rgba(255,255,255,0.1); }
	
	.phones-list {
		display: flex; flex-direction: column; gap: 1rem;
	}
	.phone-item {
		display: flex; align-items: center; gap: 1.2rem;
		padding: 1rem; border-radius: 16px; background: rgba(0,0,0,0.02);
		text-decoration: none; color: inherit; transition: all 0.2s;
		border: 1px solid transparent;
	}
	:global(.dark-theme) .phone-item {
		background: rgba(255,255,255,0.03);
	}
	.phone-item:hover {
		background: var(--color-white);
		box-shadow: 0 5px 15px rgba(0,0,0,0.05);
		border-color: rgba(0,0,0,0.05);
		transform: translateY(-2px);
	}
	:global(.dark-theme) .phone-item:hover {
		background: rgba(255,255,255,0.05);
		box-shadow: 0 5px 15px rgba(0,0,0,0.2);
		border-color: rgba(255,255,255,0.1);
	}
	.phone-icon-wrap {
		width: 44px; height: 44px; border-radius: 12px;
		background: var(--color-light-blue); color: var(--color-deep-ocean);
		display: flex; align-items: center; justify-content: center;
	}
	:global(.dark-theme) .phone-icon-wrap {
		background: rgba(255,255,255,0.1); color: var(--color-dark-text);
	}
	.phone-text {
		display: flex; flex-direction: column; gap: 0.2rem;
	}
	.phone-text strong {
		font-size: 1.1rem; color: var(--color-deep-ocean);
	}
	:global(.dark-theme) .phone-text strong {
		color: var(--color-dark-text);
	}
	.phone-text span {
		font-size: 0.85rem; opacity: 0.7; text-transform: uppercase; font-weight: 600;
	}

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

	.phone-mobile { display: none; }
	@media (max-width: 460px) {
		.phone-desktop { display: none; }
		.phone-mobile { display: inline; }
	}
</style>
