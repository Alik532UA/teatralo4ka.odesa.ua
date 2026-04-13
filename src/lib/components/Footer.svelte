<script lang="ts">
	import PianoModal from "./ui/PianoModal.svelte";
	import Wave from "./Wave.svelte";
	import LocationIcon from "./icons/LocationIcon.svelte";
	import PhoneIcon from "./icons/PhoneIcon.svelte";
	import EmailIcon from "./icons/EmailIcon.svelte";
	import { base } from "$app/paths";
	import { t } from "svelte-i18n";
	import { Phone, X } from "lucide-svelte";
	import { ui } from "$lib/states/ui.svelte";
	import { toast } from "$lib/states/toast.svelte";

	let isPianoOpen = $state(false);

	function handleEmailClick(e: MouseEvent) {
		e.preventDefault();
		const email = $t("footer.email");
		navigator.clipboard.writeText(email).then(
			() => {
				toast.success(
					$t("footer.emailCopied"),
					6000,
					{
						label: $t("footer.openMailClient"),
						onAction: () => {
							window.location.href = `mailto:${email}`;
						}
					}
				);
			},
			() => {
				window.location.href = `mailto:${email}`;
			}
		);
	}
</script>

<div class="footer-spacer" aria-hidden="true"></div>
<footer class="footer" id="main-footer" data-testid="footer-container">
	<div class="container">
		<div class="footer__content">
			<!-- 1. Button "грати" - Piano Keyboard Style -->
			<button
				class="footer__btn-piano"
				onclick={() => (isPianoOpen = true)}
				aria-label={$t("footer.play")}
				data-testid="footer-piano-button"
			>
				<div class="footer__piano-visual">
					<span class="footer__piano-white"></span>
					<span class="footer__piano-white"></span>
					<span class="footer__piano-white"></span>
					<span class="footer__piano-white"></span>
					<span class="footer__piano-white"></span>
					<span class="footer__piano-black" style="left: 20%"></span>
					<span class="footer__piano-black" style="left: 60%"></span>
					<span class="footer__piano-black" style="left: 80%"></span>
				</div>
				<span class="footer__btn-piano-text">{$t("footer.play")}</span>
			</button>

			<!-- 2. Contacts Group -->
			<div class="footer__contacts" data-testid="footer-contacts-container">
				<!-- Address -->
				<div class="footer__info" id="footer-address" data-testid="footer-address-group">
					<div class="footer__info-item">
						<LocationIcon className="footer__icon" size={18} />
						<a
							href="https://maps.app.goo.gl/ya4gki6tuZv36Tjz8"
							target="_blank"
							rel="noopener noreferrer"
							class="footer__link"
							data-testid="footer-address-link"
						>
							{$t("footer.address")}
						</a>
					</div>
				</div>
				<div class="footer__info" id="footer-phones" data-testid="footer-phones-group">
					<div class="footer__info-item">
						<PhoneIcon className="footer__icon" size={18} />
						<div>
							<button 
								class="footer__link" 
								style="background: none; border: none; padding: 0; cursor: pointer; font: inherit; color: inherit;"
								onclick={() => (ui.isPhonesModalOpen = true)}
								data-testid="footer-phone-button"
							>
								{$t("footer.phone")}
							</button>
						</div>
					</div>
				</div>

				<div class="footer__info" id="footer-email" data-testid="footer-email-group">
					<div class="footer__info-item">
						<EmailIcon className="footer__icon" size={18} />
						<div>
							<a
								href="mailto:{$t('footer.email')}"
								class="footer__link"
								onclick={handleEmailClick}
								data-testid="footer-email-link"
							>{$t("footer.email")}</a
							>
						</div>
					</div>
				</div>
			</div>

			<!-- 3. Social icons -->
			<div class="footer__social" id="footer-social" data-testid="footer-social-menu">
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
				data-testid="footer-order-button"
			>
				{$t("footer.order")}
			</a>
		</div>
	</div>
</footer>

<PianoModal isOpen={isPianoOpen} onClose={() => (isPianoOpen = false)} />

{#if ui.isPhonesModalOpen}
	<div 
		class="modal-overlay" 
		onclick={() => (ui.isPhonesModalOpen = false)} 
		onkeydown={(e) => e.key === 'Escape' && (ui.isPhonesModalOpen = false)}
		role="button"
		tabindex="0"
		aria-label={$t('common.closeModal')}
		data-testid="phones-modal-overlay-container"
	>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div class="phones-modal" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="phones-modal-title" tabindex="0" data-testid="phones-modal-container">
			<div class="modal-header">
				<h2 id="phones-modal-title" style="margin: 0; font-size: 1.5rem; color: var(--text-title); font-family: var(--font-heading);">
					{$t("footer.contactsTitle")}
				</h2>
				<button class="btn-close" aria-label={$t('common.close')} onclick={() => (ui.isPhonesModalOpen = false)} data-testid="phones-modal-close-button">
					<X size={24} />
				</button>
			</div>
			
			<div class="phones-list" data-testid="phones-list-group">
				<a href="tel:+380487236304" class="phone-item" data-testid="phone-director-link">
					<div class="phone-icon-wrap"><Phone size={20} /></div>
					<div class="phone-text">
						<strong><span class="phone-desktop">+380 48 723 63 04</span><span class="phone-mobile">+380487236304</span></strong>
						<span>{$t("footer.director")}</span>
					</div>
				</a>
				<a href="tel:+380487236101" class="phone-item" data-testid="phone-secretary-link">
					<div class="phone-icon-wrap"><Phone size={20} /></div>
					<div class="phone-text">
						<strong><span class="phone-desktop">+380 48 723 61 01</span><span class="phone-mobile">+380487236101</span></strong>
						<span>{$t("footer.secretary")}</span>
					</div>
				</a>
				<a href="tel:+380487233259" class="phone-item" data-testid="phone-head-teacher-link">
					<div class="phone-icon-wrap"><Phone size={20} /></div>
					<div class="phone-text">
						<strong><span class="phone-desktop">+380 48 723 32 59</span><span class="phone-mobile">+380487233259</span></strong>
						<span>{$t("footer.headTeacher")}</span>
					</div>
				</a>
				<a href="tel:+380487234203" class="phone-item" data-testid="phone-security-link">
					<div class="phone-icon-wrap"><Phone size={20} /></div>
					<div class="phone-text">
						<strong><span class="phone-desktop">+380 48 723 42 03</span><span class="phone-mobile">+380487234203</span></strong>
						<span>{$t("footer.security")}</span>
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
		z-index: 10000; padding: 20px;
	}
	.phones-modal {
		background: var(--bg-surface);
		border-radius: 24px; padding: 2.5rem;
		max-width: 400px; width: 100%; box-shadow: 0 30px 60px rgba(0,0,0,0.2);
		display: flex; flex-direction: column; gap: 1.5rem;
		color: var(--text-main);
		border: 1px solid var(--border-main);
	}
	.modal-header {
		display: flex; justify-content: space-between; align-items: center;
		margin-bottom: 0.5rem;
	}
	.modal-header h2 {
		color: var(--text-title) !important;
	}
	.btn-close {
		background: none; border: none; color: inherit; cursor: pointer;
		padding: 0.5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center;
		transition: background 0.2s; opacity: 0.6;
	}
	.btn-close:hover { background: rgba(0,0,0,0.05); opacity: 1; }
	
	.phones-list {
		display: flex; flex-direction: column; gap: 1rem;
	}
	.phone-item {
		display: flex; align-items: center; gap: 1.2rem;
		padding: 1rem; border-radius: 16px; background: rgba(0,0,0,0.02);
		text-decoration: none; color: inherit; transition: all 0.2s;
		border: 1px solid transparent;
	}
	.phone-item:hover {
		background: var(--bg-page);
		box-shadow: var(--shadow-main);
		border-color: var(--border-main);
		transform: translateY(-2px);
	}
	.phone-icon-wrap {
		width: 44px; height: 44px; border-radius: 12px;
		background: var(--bg-page); color: var(--accent-primary);
		display: flex; align-items: center; justify-content: center;
	}
	.phone-text {
		display: flex; flex-direction: column; gap: 0.2rem;
	}
	.phone-text strong {
		font-size: 1.1rem; color: var(--text-title);
	}
	.phone-text span {
		font-size: 0.85rem; opacity: 0.7; text-transform: uppercase; font-weight: 600;
	}

	@keyframes fadeInUp {
		from { opacity: 0; transform: translateY(30px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.footer {
		background: var(--bg-footer, var(--bg-surface));
		padding: var(--space-xl) 0;
		position: relative;
		border: none;
		transition: background 800ms ease-in-out;
		z-index: 100;
		animation: fadeInUp 0.8s ease-out both;
	}

	.footer-spacer {
		display: none;
		height: 80px;
	}

	@media (min-width: 1025px) {
		.footer {
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			padding: var(--space-md) 0;
			background: var(--bg-header);
			backdrop-filter: blur(12px);
			box-shadow: 0 -5px 25px rgba(0,0,0,0.05);
			border-top: 1px solid var(--border-main);
		}
		
		.footer-spacer {
			display: block;
		}
	}

	:global(.app.with-dynamic-bg) .footer {
		background: transparent;
	}

	@media (min-width: 1025px) {
		:global(.app.with-dynamic-bg) .footer {
			background: color-mix(in srgb, var(--bg-surface), transparent 60%);
		}
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
		background: var(--palette-black);
		border: 2px solid var(--palette-black);
		border-radius: 4px 4px 6px 6px;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 3px 0 var(--palette-black);
		overflow: hidden;
		padding: 0;
	}

	.footer__piano-visual {
		position: absolute;
		inset: 0;
		display: flex;
		background: var(--palette-black);
	}

	.footer__piano-white {
		flex: 1;
		background: var(--palette-white);
		border-right: 1px solid var(--palette-gray-200);
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
		background: var(--palette-black);
		border-radius: 0 0 2px 2px;
		transform: translateX(-50%);
		z-index: 1;
	}

	.footer__btn-piano:hover {
		transform: translateY(1.5px);
		box-shadow: 0 1.5px 0 var(--palette-black);
	}

	.footer__btn-piano:active {
		transform: translateY(3px);
		box-shadow: 0 0 0 var(--palette-black);
	}

	.footer__btn-piano-text {
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: 0.75rem;
		text-transform: uppercase;
		color: var(--palette-black);
		z-index: 2;
		background: rgba(255, 255, 255, 0.7);
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
		padding: 0 1.5rem;
		height: 36px;
		white-space: nowrap;
		background: transparent;
		color: var(--accent-primary);
		border: 2px solid var(--accent-primary);
		border-radius: var(--radius-full);
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		transition: all var(--transition-base);
	}

	.footer__btn-order:hover {
		background: var(--accent-primary);
		color: var(--text-on-accent);
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
		color: var(--accent-primary);
		white-space: nowrap;
	}

	.footer__link {
		transition: color var(--transition-fast), opacity var(--transition-fast);
		color: inherit;
	}

	.footer__link:hover {
		opacity: 0.8;
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
		background: transparent;
		border: none;
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
			gap: var(--space-md);
		}
		.footer__content {
			flex-direction: row;
			flex-wrap: wrap;
			justify-content: center;
			align-items: center;
			gap: var(--space-xl) var(--space-xl);
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
			gap: var(--space-md);
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
	@media (max-width: 360px) {
		.phone-desktop { display: none; }
		.phone-mobile { display: inline; }
	}
</style>
