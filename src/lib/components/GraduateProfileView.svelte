<script lang="ts">
	import { onMount } from 'svelte';
	import { t, locale } from 'svelte-i18n';
	import { FileText } from 'lucide-svelte';
	import { browser } from '$app/environment';
	import { asset } from '$app/paths';
	import { safeUrl } from '$lib/utils/safeUrl';
	import DepartmentIcon from '$lib/components/icons/DepartmentIcon.svelte';
	import RichTextWithFlags from '$lib/components/RichTextWithFlags.svelte';
	import GraduateFormModal from '$lib/components/GraduateFormModal.svelte';
	import { getMasterById, masterProfilePath } from '$lib/data/masters';
	import {
		graduatePhoto,
		graduatePhotoSrcset,
		type Department,
		type GraduateIndexEntry,
		type GraduateProfile
	} from '$lib/data/graduates';

	interface Props {
		/** Запис з індексу — є завжди, навіть коли подробиць немає. */
		graduate: GraduateIndexEntry;
		/** Подробиці зі `static/graduates/profiles`. `null` — ще не прийшли або їх немає. */
		profile: GraduateProfile | null;
		/** Id заголовка: модалка підв'язує до нього `aria-labelledby`. */
		headingId?: string;
		/** `h2` у модалці, `h1` на власній сторінці. */
		heading?: 'h1' | 'h2';
	}

	let { graduate, profile, headingId, heading = 'h2' }: Props = $props();

	let formModalOpen = $state(false);

	function syncFormUrl(open: boolean) {
		if (!browser) return;
		const url = new URL(window.location.href);
		if (open) {
			url.searchParams.set('form', 'open');
		} else {
			url.searchParams.delete('form');
		}
		window.history.replaceState(window.history.state, '', url.href);
	}

	onMount(() => {
		if (browser) {
			const param = new URL(window.location.href).searchParams.get('form');
			if (param === 'open' || param === 'true') {
				formModalOpen = true;
			}
		}
	});

	function openForm() {
		formModalOpen = true;
		syncFormUrl(true);
	}

	function closeForm() {
		formModalOpen = false;
		syncFormUrl(false);
	}

	const enrollmentYears = $derived(profile?.enrollmentYears ?? graduate.enrollmentYears ?? []);
	const enrollmentText = $derived(
		enrollmentYears.length > 0 ? `${$t('galaxy.enrolled')} ${enrollmentYears.join(', ')}` : null
	);
	const graduationText = $derived(
		graduate.graduationYear ? `${$t('galaxy.graduated')} ${graduate.graduationYear}` : null
	);

	const group = $derived(profile?.group ?? graduate.group?.name ?? graduate.group?.abbr ?? null);
	const departments = $derived<Department[]>(
		profile?.departments && profile.departments.length > 0
			? profile.departments
			: (graduate.departments ?? [])
	);

	const rawMasters = $derived(profile?.masters ?? graduate.masters ?? []);
	const normalizedMasters = $derived(
		rawMasters.map((m) => {
			const id = typeof m === 'object' && m.id ? m.id : (typeof m === 'string' ? m : undefined);
			const masterInfo = id ? getMasterById(id) : undefined;
			const isEn = $locale === 'en';
			const displayName = masterInfo
				? (isEn ? masterInfo.displayNameEn : masterInfo.displayName)
				: (typeof m === 'string' ? m : m.name);
			const fullName = masterInfo
				? (isEn ? masterInfo.fullNameEn : masterInfo.fullName)
				: (typeof m === 'string' ? m : m.name);
			const dept = typeof m === 'object' && m.department ? m.department : (masterInfo?.departments[0] ?? null);
			const slug = masterInfo?.slug ?? id;
			const href = slug ? masterProfilePath(slug, isEn ? 'en' : 'uk') : null;
			return { id, slug, displayName, fullName, department: dept, href };
		})
	);

	const socials = $derived(profile?.socials ?? graduate.socials ?? []);
	const hasPlays = $derived(Boolean(profile && profile.plays.length > 0));
	const hasAnyPlayYear = $derived(Boolean(profile?.plays.some((p) => Boolean(p.year))));
	const hasBio = $derived(
		Boolean(profile && (profile.duringStudies || profile.afterGraduation || profile.bio.length > 0 || profile.festivals.length > 0))
	);

	function getSocialIcon(network: string): string | null {
		const lower = network.toLowerCase();
		if (lower.includes('facebook') || lower === 'fb') return asset('/social_media/facebook-se-512-50.png');
		if (lower.includes('instagram') || lower === 'ig') return asset('/social_media/instagram-se-512-50.png');
		if (lower.includes('telegram') || lower === 'tg') return asset('/social_media/Telegram-se-320px-50q.png');
		if (lower.includes('youtube') || lower === 'yt') return asset('/social_media/YouTube-se-512px-50q.png');
		if (lower.includes('tiktok') || lower === 'tt') return asset('/social_media/TikTok-se-512-50.png');
		return null;
	}
</script>

<div class="profile-layout" class:has-plays={hasPlays} class:has-bio={hasBio}>
	<!-- ЛІВА КОЛОНКА: Вистави та ролі -->
	{#if hasPlays}
		<div class="col col--left">
			<section class="block" data-testid="galaxy-card-plays-section">
				<h3 class="block__title">{$t('galaxy.playsTitle')}</h3>
				<ul class="plays">
					{#each profile!.plays as play, index (index)}
						<li class="play" data-testid="galaxy-card-play-item-{index}">
							{#if hasAnyPlayYear}
								<span class="play__year">{play.year ?? ''}</span>
							{/if}
							<span class="play__text"><RichTextWithFlags text={play.text} /></span>
						</li>
					{/each}
				</ul>
			</section>
		</div>
	{/if}

	<!-- ЦЕНТРАЛЬНА КОЛОНКА: Фото, ім'я, роки, група, майстри, соцмережі -->
	<div class="col col--center">
		{#if graduate.hasPhoto}
			<div class="photo-container">
				<img
					class="photo"
					src={graduatePhoto(graduate.slug, 480)}
					srcset={graduatePhotoSrcset(graduate.slug)}
					sizes="(max-width: 520px) 40vw, 175px"
					width="175"
					height="175"
					alt={graduate.name}
					data-testid="galaxy-card-img"
				/>
				{#if departments.length > 0}
					<div class="dept-badges" data-testid="galaxy-card-dept-badges">
						{#each departments as dept (dept)}
							<span
								class="dept-badge"
								role="img"
								title={$t(`galaxy.departments.${dept}`, { default: dept })}
								aria-label={$t(`galaxy.departments.${dept}`, { default: dept })}
							>
								<DepartmentIcon department={dept} size={18} />
							</span>
						{/each}
					</div>
				{/if}
			</div>
		{:else}
			<div class="star" aria-hidden="true"></div>
		{/if}

		<svelte:element this={heading} class="name" id={headingId} data-testid="galaxy-card-title">
			{graduate.name}
		</svelte:element>

		{#if enrollmentText || graduationText}
			<div class="years" data-testid="galaxy-card-years-text">
				{#if enrollmentText}<span class="years__item">{enrollmentText}</span>{/if}
				{#if enrollmentText && graduationText}<span class="years__sep" aria-hidden="true">·</span>{/if}
				{#if graduationText}<span class="years__item">{graduationText}</span>{/if}
			</div>
		{/if}

		{#if !graduate.hasPhoto}
			<div class="fill-profile-wrap">
				<button
					type="button"
					class="fill-profile-btn"
					onclick={openForm}
					data-testid="galaxy-card-fill-form-btn"
				>
					<FileText size={16} aria-hidden="true" />
					<span>{$t('galaxy.fillProfile', { default: 'Заповнити анкету' })}</span>
				</button>
			</div>
		{/if}

		{#if group}
			<div class="group" data-testid="galaxy-card-group-text">
				<span class="group__label">{$t('galaxy.group')}:</span>
				<strong class="group__name">{group}</strong>
			</div>
		{/if}

		{#if normalizedMasters.length > 0}
			<div class="masters-container" data-testid="galaxy-card-masters-text">
				<span class="masters-title">{$t('galaxy.masters')}:</span>
				<ul class="masters-list">
					{#each normalizedMasters as master, index (index)}
						<li class="master-item">
							<span
								class="master-badge"
								role="img"
								title={master.department ? $t(`galaxy.departments.${master.department}`, { default: master.department }) : undefined}
								aria-label={master.department ? $t(`galaxy.departments.${master.department}`, { default: master.department }) : undefined}
							>
								<DepartmentIcon department={master.department} size={16} />
							</span>
							{#if master.href}
								<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
								<a
									href={master.href}
									class="master-name master-link"
									title={master.fullName}
									data-testid="galaxy-card-master-link-{master.slug || index}"
								>
									{master.displayName}
								</a>
							{:else}
								<span class="master-name" title={master.fullName}>{master.displayName}</span>
							{/if}
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		{#if socials.length > 0}
			<ul class="socials" data-testid="galaxy-card-socials-list">
				{#each socials as social (social.network + social.url)}
					{@const icon = getSocialIcon(social.network)}
					<li>
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
						<a
							href={safeUrl(social.url)}
							class="social"
							target="_blank"
							rel="noopener noreferrer"
							title={social.network}
							aria-label={social.network}
							data-testid="galaxy-card-social-link-{social.network}"
						>
							{#if icon}
								<img src={icon} alt={social.network} width="34" height="34" class="social__img" />
							{:else}
								<span class="social__text">{social.network}</span>
							{/if}
						</a>
					</li>
				{/each}
			</ul>
		{/if}

		{#if !profile && graduate.hasPhoto}
			<p class="row" data-testid="galaxy-card-loading-status">{$t('common.loading')}</p>
		{/if}
	</div>

	<!-- ПРАВА КОЛОНКА: Про себе, під час навчання, після випуску, фестивалі -->
	{#if hasBio}
		<div class="col col--right">
			{#if profile!.duringStudies}
				<section class="block">
					<h3 class="block__title">{$t('galaxy.duringStudies')}</h3>
					<p class="para"><RichTextWithFlags text={profile!.duringStudies} /></p>
				</section>
			{/if}

			{#if profile!.afterGraduation}
				<section class="block">
					<h3 class="block__title">{$t('galaxy.afterGraduation')}</h3>
					<p class="para"><RichTextWithFlags text={profile!.afterGraduation} /></p>
				</section>
			{/if}

			{#if profile!.bio.length > 0}
				<section class="block" data-testid="galaxy-card-bio-section">
					<h3 class="block__title">{$t('galaxy.about')}</h3>
					{#each profile!.bio as paragraph, index (index)}
						<p class="para" data-testid="galaxy-card-bio-item-{index}">
							<RichTextWithFlags text={paragraph} />
						</p>
					{/each}
				</section>
			{/if}

			{#if profile!.festivals.length > 0}
				<section class="block" data-testid="galaxy-card-festivals-section">
					<h3 class="block__title">{$t('galaxy.festivals')}</h3>
					<ul class="plays">
						{#each profile!.festivals as festival, index (index)}
							<li class="play"><span class="play__text"><RichTextWithFlags text={festival} /></span></li>
						{/each}
					</ul>
				</section>
			{/if}
		</div>
	{/if}
</div>

<GraduateFormModal
	isOpen={formModalOpen}
	onclose={closeForm}
/>

<style>
	.profile-layout { display: flex; flex-direction: column; gap: 1.25rem; width: 100%; background: var(--galaxy-card-bg); border: 1px solid rgb(140 190 255 / 0.18); border-radius: 1.75rem; box-shadow: 0 18px 48px rgb(0 0 0 / 0.28); padding: clamp(1.25rem, 3vh, 1.75rem); }
	.col { min-width: 0; }
	.col--center { order: 1; }
	.col--left { order: 2; }
	.col--right { order: 3; }

	@media (min-width: 769px) {
		.profile-layout { display: grid; grid-template-columns: minmax(280px, 420px); justify-content: center; align-items: start; gap: clamp(1rem, 2vw, 1.75rem); text-align: left; min-height: 0; width: fit-content; max-width: 100%; margin: 0 auto; background: transparent; border: none; box-shadow: none; padding: 0; }
		.profile-layout.has-plays.has-bio { grid-template-columns: minmax(340px, max-content) minmax(260px, 300px) minmax(280px, max-content); }
		.profile-layout.has-plays:not(.has-bio) { grid-template-columns: minmax(340px, max-content) minmax(260px, 300px); }
		.profile-layout.has-bio:not(.has-plays) { grid-template-columns: minmax(260px, 300px) minmax(280px, max-content); }

		.col { max-height: min(88dvh, 820px); min-height: 0; overflow-y: auto; background: var(--galaxy-card-bg); border: 1px solid rgb(140 190 255 / 0.2); border-radius: 1.5rem; box-shadow: 0 16px 48px rgb(0 0 0 / 0.4); padding: clamp(1.1rem, 2.2vh, 1.6rem); scrollbar-width: thin; scrollbar-color: rgb(140 190 255 / 0.35) transparent; }
		.col::-webkit-scrollbar { width: 6px; }
		.col::-webkit-scrollbar-track { background: transparent; }
		.col::-webkit-scrollbar-thumb { background: rgb(140 190 255 / 0.3); border-radius: 999px; }
		.col::-webkit-scrollbar-thumb:hover { background: rgb(140 190 255 / 0.55); }

		.col--left { order: 1; max-width: min(920px, 60vw); }
		.col--center { order: 2; text-align: center; }
		.col--right { order: 3; max-width: min(580px, 42vw); }
		.col--left .block, .col--right .block { margin-top: 0; margin-bottom: 1.25rem; }
	}

	.photo-container { display: flex; flex-direction: column; align-items: center; margin: 0 auto 1.1rem; }
	.photo { display: block; width: clamp(100px, 40vw, 175px); height: auto; aspect-ratio: 1; margin: 0 0 0.65rem; border-radius: 50%; object-fit: cover; border: 2px solid rgb(140 190 255 / 0.55); }
	.dept-badges { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.4rem; }
	.dept-badge { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; background: rgb(140 190 255 / 0.12); border: 1px solid rgb(140 190 255 / 0.35); color: #bfe0ff; transition: transform 0.2s ease, background 0.2s ease; }
	.dept-badge:hover { transform: scale(1.1); background: rgb(140 190 255 / 0.25); border-color: rgb(140 190 255 / 0.6); color: #fff; }
	.star { width: 96px; height: 96px; margin: 0 auto 0.5rem; border-radius: 50%; background: radial-gradient(circle, rgb(234 242 255 / 0.95) 0 6px, rgb(180 214 255 / 0.35) 12px, transparent 70%); }
	.name { margin: 0 0 0.5rem; font-size: clamp(1.3rem, 3.5dvh, 1.7rem); text-align: center; color: var(--galaxy-accent); }
	.years { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 0.2rem 0.45rem; margin: 0 0 0.9rem; color: var(--galaxy-muted); font-variant-numeric: tabular-nums; text-align: center; font-size: 0.95rem; line-height: 1.35; }
	.years__item { white-space: nowrap; }
	.years__sep { opacity: 0.5; }
	.fill-profile-wrap { display: flex; justify-content: center; margin: 0.2rem 0 1rem; }
	.fill-profile-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.6rem 1.25rem;
		border-radius: 999px;
		background: linear-gradient(135deg, rgb(140 190 255 / 0.22) 0%, rgb(0 150 255 / 0.38) 100%);
		border: 1px solid rgb(140 190 255 / 0.55);
		color: #ffffff;
		font-size: 0.92rem;
		font-weight: 600;
		cursor: pointer;
		box-shadow: 0 4px 16px rgb(0 120 255 / 0.25);
		transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
	}
	.fill-profile-btn:hover {
		transform: translateY(-2px);
		background: linear-gradient(135deg, rgb(140 190 255 / 0.38) 0%, rgb(0 150 255 / 0.6) 100%);
		border-color: rgb(140 190 255 / 0.85);
		box-shadow: 0 6px 20px rgb(0 150 255 / 0.45);
		color: #ffffff;
	}
	.group { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 0.25rem 0.45rem; margin: 0 0 1rem; color: var(--galaxy-text); text-align: center; font-size: 0.95rem; line-height: 1.35; }
	.group__label { color: var(--galaxy-muted); white-space: nowrap; }
	.group__name { color: var(--galaxy-text); }
	.row { margin: 0 0 0.5rem; color: var(--galaxy-text); text-align: center; }
	.masters-container { margin: 0 0 1.1rem; color: var(--galaxy-text); text-align: center; }
	.masters-title { display: block; font-size: 0.92rem; color: var(--galaxy-muted); margin-bottom: 0.4rem; }
	.masters-list { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; margin: 0; padding: 0; list-style: none; }
	.master-item { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0.75rem; background: rgb(255 255 255 / 0.06); border-radius: 6px; border: 1px solid rgb(255 255 255 / 0.1); }
	.master-badge { display: inline-flex; align-items: center; justify-content: center; color: #8cb4ff; }
	.master-name { font-size: 0.95rem; font-weight: 500; }
	.master-link {
		color: #bfe0ff;
		text-decoration: underline;
		text-underline-offset: 3px;
		text-decoration-color: rgb(140 190 255 / 0.45);
		transition: color 0.2s ease, text-decoration-color 0.2s ease;
	}
	.master-link:hover {
		color: #ffffff;
		text-decoration-color: #ffffff;
	}
	.socials { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.5rem; margin: 1.1rem 0 0; padding: 0; list-style: none; }
	.social { display: inline-flex; align-items: center; justify-content: center; min-width: 44px; min-height: 44px; padding: 0; border: none; background: transparent; color: inherit; text-decoration: none; transition: transform 0.2s ease, filter 0.2s ease; }
	.social:hover { transform: scale(1.18); filter: drop-shadow(0 0 10px rgb(140 190 255 / 0.6)); }
	.social__img { display: block; width: 34px; height: 34px; object-fit: contain; }
	.block { margin-top: 1.1rem; text-align: left; }
	.block__title { margin: 0 0 0.5rem; font-size: 1rem; color: var(--galaxy-accent); border-bottom: 1px solid rgb(140 190 255 / 0.2); padding-bottom: 0.3rem; }
	.plays { margin: 0; padding: 0; list-style: none; }
	.play { display: flex; gap: 0.6rem; padding: 0.35rem 0; border-top: 1px solid rgb(255 255 255 / 0.08); }
	.play:first-child { border-top: none; }
	.play__year { flex-shrink: 0; min-width: 3.2rem; color: var(--galaxy-muted); font-variant-numeric: tabular-nums; }
	.play__text { min-width: 0; color: var(--galaxy-text); overflow-wrap: anywhere; }
	.para { margin: 0 0 0.6rem; line-height: 1.55; color: var(--galaxy-text); overflow-wrap: anywhere; }
</style>
