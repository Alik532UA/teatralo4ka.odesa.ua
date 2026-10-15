<script lang="ts">
	import { asset } from '$app/paths';
	import { locale } from 'svelte-i18n';
	import { Drama, Heart, Flame, Sparkles } from 'lucide-svelte';

	const isEn = $derived($locale === 'en');
</script>

<section class="uart-manifest" aria-labelledby="uart-manifest-title">
	<div class="uart-manifest__grid">
		<div class="uart-manifest__logo-card">
			<div class="logo-wrapper">
				<img
					src={asset('/png/uart-logo.webp')}
					alt={isEn ? '«UArt» Educational Theatre Logo' : 'Логотип Навчального театру «UArt»'}
					class="uart-logo-img"
					width="400"
					height="711"
					loading="eager"
				/>
			</div>
			<div class="logo-caption">
				<span class="logo-tag">YOU & ART</span>
				<span class="logo-sub">{isEn ? 'REPERTOIRE STAGE' : 'НАВЧАЛЬНИЙ ТЕАТР'}</span>
			</div>
		</div>

		<div class="uart-manifest__content">
			<h2 id="uart-manifest-title" class="section-title">
				<Sparkles size={22} class="section-icon" aria-hidden="true" />
				<span>{isEn ? 'Manifest & Philosophy' : 'Маніфест та філософія'}</span>
			</h2>

			<div class="philosophy-cards">
				<article class="p-card p-card--you">
					<div class="p-card__icon" aria-hidden="true">
						<Heart size={22} />
					</div>
					<div class="p-card__body">
						<h3 class="p-card__title">
							<span class="p-card__prefix">«UArt» — це — </span>
							<span class="p-card__highlight">You&Art</span>
							<span class="p-card__sub">{isEn ? ' (You & Art!)' : ' — Ти і Мистецтво!'}</span>
						</h3>
						<p class="p-card__text">
							{isEn
								? 'A space where each young actor meets true theatrical art, discovering their authentic voice and stage courage.'
								: 'Простір, де особистість юного актора зустрічається зі справжнім сценічним мистецтвом, відкриваючи власний голос і щиру сміливість.'}
						</p>
					</div>
				</article>

				<article class="p-card p-card--ua">
					<div class="p-card__icon" aria-hidden="true">
						<Flame size={22} />
					</div>
					<div class="p-card__body">
						<h3 class="p-card__title">
							<span class="p-card__prefix">«UArt» — це — </span>
							<span class="p-card__highlight">UA</span>
							<span class="p-card__sub">
								{isEn ? ' (Ukraine, our roots!)' : ' — Україна, наше коріння, наш код!'}
							</span>
						</h3>
						<p class="p-card__text">
							{isEn
								? 'Deep roots in Ukrainian culture and contemporary national drama, giving voice to conscious, passionate young artists.'
								: 'Наше коріння, наш генетичний код! Освіта на базі української культури, сучасної вітчизняної драматургії та щирого художнього висловлювання.'}
						</p>
					</div>
				</article>

				<article class="p-card p-card--theatre">
					<div class="p-card__icon" aria-hidden="true">
						<Drama size={22} />
					</div>
					<div class="p-card__body">
						<h3 class="p-card__title">
							<span class="p-card__prefix">«UArt» — це </span>
							<span class="p-card__highlight">
								{isEn ? 'Young Repertoire Theatre' : 'Юний Репертуарний Театр'}
							</span>
						</h3>
						<p class="p-card__text">
							{isEn
								? 'Very young, but already a true repertoire theatre! Not just class exercises, but full-scale public productions with real seasons.'
								: 'Дуже Юний, але вже Репертуарний Театр! Не просто закриті навчальні покази, а повноцінні вистави з регулярним міським прокатом.'}
						</p>
					</div>
				</article>
			</div>
		</div>
	</div>
</section>

<style>
	.uart-manifest {
		margin-bottom: 4.5rem;
	}

	.uart-manifest__grid {
		display: grid;
		grid-template-columns: 320px 1fr;
		gap: 2.5rem;
		align-items: start;
	}

	.uart-manifest__logo-card {
		background: var(--bg-card);
		border: 1px solid var(--border-main);
		border-radius: 20px;
		padding: 1.75rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
	}

	.logo-wrapper {
		width: 100%;
		border-radius: 14px;
		overflow: hidden;
		background: #fff9f2;
		display: flex;
		justify-content: center;
		padding: 1rem;
	}

	.uart-logo-img {
		max-width: 100%;
		height: auto;
		object-fit: contain;
		display: block;
		transition: transform 0.3s ease;
	}

	.uart-logo-img:hover {
		transform: scale(1.02);
	}

	.logo-caption {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-top: 1.25rem;
		text-align: center;
	}

	.logo-tag {
		font-size: 1.1rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		color: #0057b7;
	}

	.logo-sub {
		font-size: 0.8rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		color: var(--text-muted);
		margin-top: 0.2rem;
	}

	.section-title {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		font-size: 1.65rem;
		font-weight: 700;
		color: var(--text-title);
		margin: 0 0 1.5rem;
	}

	:global(.section-icon) {
		color: var(--accent-text);
	}

	.philosophy-cards {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.p-card {
		display: flex;
		gap: 1.25rem;
		background: var(--bg-card);
		border: 1px solid var(--border-main);
		border-radius: 16px;
		padding: 1.4rem;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}

	.p-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
	}

	.p-card__icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		border-radius: 12px;
		background: color-mix(in srgb, var(--accent-primary) 16%, transparent);
		color: var(--accent-text);
		flex-shrink: 0;
	}

	.p-card--ua .p-card__icon {
		background: color-mix(in srgb, #ffd700 22%, transparent);
		color: #e2a000;
	}

	.p-card__title {
		font-size: 1.15rem;
		font-weight: 700;
		margin: 0 0 0.45rem;
		line-height: 1.35;
		color: var(--text-title);
	}

	.p-card__highlight {
		color: var(--accent-text);
	}

	.p-card__sub {
		font-weight: 600;
		color: var(--text-title);
	}

	.p-card__text {
		margin: 0;
		font-size: 0.975rem;
		line-height: 1.55;
		color: var(--text-muted);
	}

	@media (max-width: 900px) {
		.uart-manifest__grid {
			grid-template-columns: 1fr;
		}

		.uart-manifest__logo-card {
			max-width: 380px;
			margin: 0 auto;
		}
	}
</style>
