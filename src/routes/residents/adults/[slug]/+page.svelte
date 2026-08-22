<script lang="ts">
	import { t, locale } from 'svelte-i18n';
	import { fly } from 'svelte/transition';
	import { ArrowLeft, Plus, Camera, Pencil } from 'lucide-svelte';
	import { asset } from '$app/paths';
	import DepartmentIcon from '$lib/components/icons/DepartmentIcon.svelte';
	import PrayingHands from '$lib/components/icons/PrayingHands.svelte';
	import MasterGraduateFlow from '$lib/components/MasterGraduateFlow.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const isEn = $derived($locale === 'en');
	const masterName = $derived(isEn ? data.master.fullNameEn : data.master.fullName);
	const displayName = $derived(isEn ? data.master.displayNameEn : data.master.displayName);

	let avatarContactOpen = $state(false);
	let cardContactOpen = $state(false);
	let avatarWrapEl = $state<HTMLDivElement | null>(null);
	let cardWrapEl = $state<HTMLDivElement | null>(null);
	let avatarCloseTimeout: ReturnType<typeof setTimeout> | null = null;
	let cardCloseTimeout: ReturnType<typeof setTimeout> | null = null;

	const contacts = [
		{ name: 'Telegram', url: 'https://t.me/alik532', icon: 'telegram.svg' },
		{ name: 'Viber', url: 'viber://chat?number=%2B380937251208', icon: 'viber.svg' },
		{ name: 'WhatsApp', url: 'https://wa.me/380937251208', icon: 'whatsapp.svg' },
		{ name: 'LinkedIn', url: 'https://linkedin.com/in/alik-qa-engineer', icon: 'linkedin.svg' }
	];

	function toggleAvatarContact(e: MouseEvent) {
		e.stopPropagation();
		avatarContactOpen = !avatarContactOpen;
	}

	function handleAvatarMouseEnter() {
		if (avatarCloseTimeout) {
			clearTimeout(avatarCloseTimeout);
			avatarCloseTimeout = null;
		}
	}

	function handleAvatarMouseLeave() {
		avatarCloseTimeout = setTimeout(() => {
			avatarContactOpen = false;
		}, 300);
	}

	function toggleCardContact(e: MouseEvent) {
		e.stopPropagation();
		cardContactOpen = !cardContactOpen;
	}

	function handleCardMouseEnter() {
		if (cardCloseTimeout) {
			clearTimeout(cardCloseTimeout);
			cardCloseTimeout = null;
		}
	}

	function handleCardMouseLeave() {
		cardCloseTimeout = setTimeout(() => {
			cardContactOpen = false;
		}, 300);
	}

	function handleClickOutside(e: MouseEvent) {
		const target = e.target as Node;
		if (avatarWrapEl && !avatarWrapEl.contains(target)) {
			avatarContactOpen = false;
		}
		if (cardWrapEl && !cardWrapEl.contains(target)) {
			cardContactOpen = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<svelte:head>
	<title>{masterName} — {$t('nav.residents', { default: 'Резиденти' })} — Одеська театральна школа</title>
	<meta
		name="description"
		content="{masterName}, майстер курсу Одеської театральної школи."
	/>
</svelte:head>

<div class="master-page" data-testid="master-profile-section">
	<div class="container master-page__container">
		<!-- Хлібні крихти / Навігація назад -->
		<div class="master-page__nav">
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
			<a
				href={isEn ? '/en/residents/adults' : '/residents/adults'}
				class="back-btn"
				data-testid="master-profile-back-link"
			>
				<ArrowLeft size={18} aria-hidden="true" />
				<span>{$t('nav.residentsAdults', { default: 'Дорослі викладачі' })}</span>
			</a>
		</div>

		<div class="master-page__layout">
			<!-- ЛІВА КОЛОНКА: Інформація про майстра курсу -->
			<article class="master-card" data-testid="master-profile-card">
				<div class="master-header">
					<!-- Аватар майстра / заглушка камера з кнопкою + якщо фото немає -->
					<div
						class="avatar-container"
						bind:this={avatarWrapEl}
						onmouseenter={handleAvatarMouseEnter}
						onmouseleave={handleAvatarMouseLeave}
						role="group"
						aria-label={$t('common.contact', { default: 'Контакти' })}
					>
						{#if data.master.photo}
							<img
								src={data.master.photo}
								alt={masterName}
								class="avatar-img"
								width="160"
								height="160"
								data-testid="master-profile-avatar-img"
							/>
						{:else}
							<div
								class="avatar-placeholder"
								aria-label={$t('galaxy.noPhoto', { default: 'Фото очікується' })}
								data-testid="master-profile-avatar-icon"
							>
								<Camera size={48} aria-hidden="true" />
							</div>

							<!-- Кнопка "+" біля фото (тільки коли фото немає) -->
							<button
								type="button"
								class="avatar-add-btn"
								onclick={toggleAvatarContact}
								aria-expanded={avatarContactOpen}
								aria-label={$t('common.contact', { default: "Додати фото або зв'язатися з адміністратором" })}
								title={$t('common.contact', { default: "Додати фото або зв'язатися з адміністратором" })}
								data-testid="master-profile-add-btn"
							>
								<Plus size={18} aria-hidden="true" />
							</button>

							<!-- Спливаюче міні-вікно контактів біля аватара -->
							{#if avatarContactOpen}
								<div
									class="contact-popup"
									transition:fly={{ y: 8, duration: 180 }}
									data-testid="master-profile-contact-menu"
								>
									<img
										src={asset('/graduates/alik-zapolnov-96.webp')}
										alt="Алік Запольнов"
										width="32"
										height="32"
										class="contact-popup__avatar"
										loading="eager"
										data-testid="master-profile-contact-admin-img"
									/>
									<p class="contact-popup__hint" data-testid="master-profile-contact-hint">
										Привіт!) Щоб надати фото чи внести правки — напиши мені
									</p>
									<div class="contact-popup__icons">
										{#each contacts as c (c.name)}
											<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
											<a
												href={c.url}
												target="_blank"
												rel="noopener noreferrer"
												class="contact-popup__link"
												aria-label={c.name}
												title={c.name}
												onclick={(e) => e.stopPropagation()}
												data-testid="master-profile-contact-link-{c.name.toLowerCase()}"
											>
												<img src={asset(`/social_media/${c.icon}`)} alt={c.name} width="28" height="28" loading="eager" />
											</a>
										{/each}
									</div>
								</div>
							{/if}
						{/if}
					</div>

					<div class="master-title-wrap">
						<h1 class="master-name" data-testid="master-profile-title">{displayName}</h1>

						{#if data.master.isHonorary}
							<span class="honorary-badge" data-testid="master-profile-honorary-badge">
								<!-- <PrayingHands size={16} /> -->
								<span>{$t('galaxy.honoraryMaster', { default: "Світлої пам'яті викладача" })}</span>
							</span>
						{/if}

						{#if data.master.departments.length > 0}
							<div class="dept-list" data-testid="master-profile-dept-list">
								{#each data.master.departments as dept (dept)}
									<span class="dept-pill">
										<DepartmentIcon department={dept} size={16} />
										<span>{$t(`galaxy.departments.${dept}`, { default: dept })}</span>
									</span>
								{/each}
							</div>
						{/if}
					</div>
				</div>

				{#if data.master.bio}
					<div class="master-bio" data-testid="master-profile-bio-section">
						<h2 class="master-bio__title">{$t('galaxy.bioTitle', { default: 'Про викладача' })}</h2>
						<p class="master-bio__text">{data.master.bio}</p>
					</div>
				{/if}

				<!-- Кнопка олівець у нижньому правому куті картки -->
				<div
					class="card-edit-wrap"
					bind:this={cardWrapEl}
					onmouseenter={handleCardMouseEnter}
					onmouseleave={handleCardMouseLeave}
					role="group"
					aria-label={$t('common.contact', { default: 'Контакти' })}
				>
					<button
						type="button"
						class="card-edit-btn"
						onclick={toggleCardContact}
						aria-expanded={cardContactOpen}
						aria-label={$t('common.contact', { default: "Внести правки або зв'язатися з адміністратором" })}
						title={$t('common.contact', { default: "Внести правки або зв'язатися з адміністратором" })}
						data-testid="master-profile-edit-btn"
					>
						<Pencil size={17} aria-hidden="true" />
					</button>

					{#if cardContactOpen}
						<div
							class="contact-popup contact-popup--card"
							transition:fly={{ y: -8, duration: 180 }}
							data-testid="master-profile-card-contact-menu"
						>
							<img
								src={asset('/graduates/alik-zapolnov-96.webp')}
								alt="Алік Запольнов"
								width="32"
								height="32"
								class="contact-popup__avatar"
								loading="eager"
								data-testid="master-profile-card-contact-admin-img"
							/>
							<p class="contact-popup__hint" data-testid="master-profile-card-contact-hint">
								{data.master.photo
									? 'Привіт!) Щоб внести правки — напиши мені'
									: 'Привіт!) Щоб надати фото чи внести правки — напиши мені'}
							</p>
							<div class="contact-popup__icons">
								{#each contacts as c (c.name)}
									<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
									<a
										href={c.url}
										target="_blank"
										rel="noopener noreferrer"
										class="contact-popup__link"
										aria-label={c.name}
										title={c.name}
										onclick={(e) => e.stopPropagation()}
										data-testid="master-profile-card-contact-link-{c.name.toLowerCase()}"
									>
										<img src={asset(`/social_media/${c.icon}`)} alt={c.name} width="28" height="28" loading="eager" />
									</a>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</article>

			<!-- ПРАВА КОЛОНКА: Вертикальний потік учнів знизу-вверх -->
			<div class="master-flow-wrapper">
				<MasterGraduateFlow graduates={data.graduates} {masterName} />
			</div>
		</div>
	</div>
</div>

<style>
	.master-page {
		padding: clamp(1.5rem, 3.5vw, 3rem) 0 4rem;
		min-height: 80dvh;
	}

	.master-page__container {
		max-width: var(--max-width, 1200px);
		margin: 0 auto;
		padding: 0 1rem;
	}

	.master-page__nav {
		margin-bottom: 1.5rem;
	}

	.back-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1.1rem;
		border-radius: var(--radius-full, 9999px);
		background: var(--bg-card);
		border: 1px solid var(--border-main);
		color: var(--text-title);
		text-decoration: none;
		font-size: 0.92rem;
		font-weight: 600;
		box-shadow: var(--shadow-main);
		transition: background var(--transition-base, 0.25s ease), transform var(--transition-base, 0.25s ease), border-color var(--transition-base, 0.25s ease);
	}

	.back-btn:hover {
		border-color: var(--accent-primary);
		transform: translateX(-3px);
	}

	.master-page__layout {
		display: grid;
		grid-template-columns: 1fr;
		gap: 2rem;
		align-items: start;
	}

	@media (min-width: 860px) {
		.master-page__layout {
			grid-template-columns: 1.15fr 0.85fr;
			gap: 2.5rem;
		}
	}

	/* Master Card */
	.master-card {
		position: relative;
		background: var(--bg-card);
		border: 1px solid var(--border-main);
		border-radius: var(--radius-xl, 24px);
		padding: clamp(1.5rem, 3vw, 2.5rem);
		padding-bottom: 4.5rem;
		box-shadow: var(--shadow-main);
	}

	.master-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	@media (min-width: 580px) {
		.master-header {
			flex-direction: row;
			align-items: center;
			text-align: left;
		}
	}

	/* Avatar Container & Button */
	.avatar-container {
		position: relative;
		width: 140px;
		height: 140px;
		flex-shrink: 0;
	}

	.avatar-img {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		object-fit: cover;
		border: 3px solid var(--accent-primary);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
	}

	.avatar-placeholder {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-surface);
		border: 2px dashed var(--border-main);
		color: var(--accent-text);
	}

	.avatar-add-btn {
		position: absolute;
		right: 4px;
		bottom: 4px;
		display: grid;
		place-items: center;
		width: 38px;
		height: 38px;
		border-radius: 50%;
		background: var(--accent-primary);
		border: 2px solid var(--bg-card);
		color: var(--text-on-accent);
		cursor: pointer;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
		transition: transform 0.2s ease, filter 0.2s ease;
	}

	.avatar-add-btn:hover,
	.avatar-add-btn[aria-expanded="true"] {
		transform: scale(1.12);
		filter: brightness(1.1);
	}

	/* Card Edit Button in bottom right */
	.card-edit-wrap {
		position: absolute;
		bottom: 1.25rem;
		right: 1.25rem;
		left: auto;
		z-index: 20;
	}

	.card-edit-btn {
		display: grid;
		place-items: center;
		width: 38px;
		height: 38px;
		border-radius: 50%;
		background: var(--accent-primary);
		border: 2px solid var(--bg-card);
		color: var(--text-on-accent);
		cursor: pointer;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
		transition: transform 0.2s ease, filter 0.2s ease;
	}

	.card-edit-btn:hover,
	.card-edit-btn[aria-expanded="true"] {
		transform: scale(1.12);
		filter: brightness(1.1);
	}

	/* Contact popup */
	.contact-popup {
		position: absolute;
		top: calc(100% + 12px);
		left: 0;
		z-index: 50;
		width: 260px;
		padding: 1.1rem;
		background: var(--bg-card);
		border: 1px solid var(--border-main);
		border-radius: var(--radius-lg, 16px);
		box-shadow: 0 16px 36px rgba(0, 0, 0, 0.18);
		text-align: center;
	}

	.contact-popup--card {
		top: auto;
		bottom: calc(100% + 12px);
		right: 0;
		left: auto;
	}

	.contact-popup__avatar {
		border-radius: 50%;
		margin: 0 auto 0.5rem;
		display: block;
		border: 2px solid var(--accent-primary);
	}

	.contact-popup__hint {
		margin: 0 0 0.75rem;
		font-size: 0.85rem;
		line-height: 1.4;
		color: var(--text-main);
	}

	.contact-popup__icons {
		display: flex;
		justify-content: center;
		gap: 0.6rem;
	}

	.contact-popup__link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.2s ease;
	}

	.contact-popup__link:hover {
		transform: scale(1.18);
	}

	/* Titles */
	.master-title-wrap {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.master-name {
		margin: 0;
		font-size: clamp(1.5rem, 3vw, 2.2rem);
		font-weight: 700;
		color: var(--text-title);
		line-height: 1.25;
	}

	.honorary-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		margin-top: 0.2rem;
		padding: 0.25rem 0.75rem;
		border-radius: var(--radius-full, 9999px);
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		color: var(--text-muted);
		font-size: 0.85rem;
		font-weight: 500;
		width: fit-content;
	}

	.dept-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.4rem;
	}

	.dept-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.3rem 0.75rem;
		border-radius: var(--radius-full, 9999px);
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		color: var(--text-title);
		font-size: 0.88rem;
		font-weight: 500;
	}

	.master-bio {
		border-top: 1px solid var(--border-main);
		padding-top: 1.5rem;
	}

	.master-bio__title {
		margin: 0 0 0.75rem;
		font-size: 1.15rem;
		font-weight: 700;
		color: var(--text-title);
	}

	.master-bio__text {
		margin: 0;
		font-size: 1rem;
		line-height: 1.65;
		color: var(--text-main);
	}

	.master-flow-wrapper {
		display: flex;
		justify-content: center;
	}
</style>
