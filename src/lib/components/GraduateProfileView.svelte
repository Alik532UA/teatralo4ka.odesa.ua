<script lang="ts">
	import { t } from 'svelte-i18n';
	import { safeUrl } from '$lib/utils/safeUrl';
	import DepartmentIcon from '$lib/components/icons/DepartmentIcon.svelte';
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

	const years = $derived(
		[
			(profile?.enrollmentYears ?? graduate.enrollmentYears ?? []).length > 0
				? `${$t('galaxy.enrolled')} ${(profile?.enrollmentYears ?? graduate.enrollmentYears ?? []).join(', ')}`
				: null,
			graduate.graduationYear ? `${$t('galaxy.graduated')} ${graduate.graduationYear}` : null
		].filter(Boolean)
	);

	const group = $derived(profile?.group ?? graduate.group?.name ?? graduate.group?.abbr ?? null);

	const departments = $derived<Department[]>(
		profile?.departments && profile.departments.length > 0
			? profile.departments
			: (graduate.departments ?? [])
	);

	const rawMasters = $derived(profile?.masters ?? graduate.masters ?? []);
	const normalizedMasters = $derived<{ name: string; department: string | null }[]>(
		rawMasters.map((m) =>
			typeof m === 'string'
				? { name: m, department: null }
				: { name: m.name, department: m.department ?? null }
		)
	);

	const socials = $derived(profile?.socials ?? graduate.socials ?? []);
</script>

{#if graduate.hasPhoto}
	<div class="photo-container">
		<img
			class="photo"
			src={graduatePhoto(graduate.slug, 480)}
			srcset={graduatePhotoSrcset(graduate.slug)}
			sizes="(max-width: 520px) 40vw, 180px"
			width="180"
			height="180"
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
	<p class="pending" data-testid="galaxy-card-pending-message">{$t('galaxy.noProfile')}</p>
{/if}

<svelte:element this={heading} class="name" id={headingId} data-testid="galaxy-card-title">
	{graduate.name}
</svelte:element>

{#if years.length > 0}
	<p class="years" data-testid="galaxy-card-years-text">{years.join(' · ')}</p>
{/if}

{#if group}
	<p class="row" data-testid="galaxy-card-group-text">
		{$t('galaxy.group')}: <strong>{group}</strong>
	</p>
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
					<span class="master-name">{master.name}</span>
				</li>
			{/each}
		</ul>
	</div>
{/if}

{#if socials.length > 0}
	<ul class="socials" data-testid="galaxy-card-socials-list">
		{#each socials as social (social.network)}
			<li>
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a
					href={safeUrl(social.url)}
					class="social"
					target="_blank"
					rel="noopener noreferrer"
					data-testid="galaxy-card-social-link-{social.network}"
				>
					{social.network}
				</a>
			</li>
		{/each}
	</ul>
{/if}

{#if profile}
	{#if profile.plays.length > 0}
		<section class="block" data-testid="galaxy-card-plays-section">
			<h3 class="block__title">{$t('galaxy.playsTitle')}</h3>
			<ul class="plays">
				{#each profile.plays as play, index (index)}
					<li class="play" data-testid="galaxy-card-play-item-{index}">
						{#if play.year}<span class="play__year">{play.year}</span>{/if}
						<span class="play__text">{play.text}</span>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if profile.duringStudies}
		<section class="block">
			<h3 class="block__title">{$t('galaxy.duringStudies')}</h3>
			<p class="para">{profile.duringStudies}</p>
		</section>
	{/if}

	{#if profile.afterGraduation}
		<section class="block">
			<h3 class="block__title">{$t('galaxy.afterGraduation')}</h3>
			<p class="para">{profile.afterGraduation}</p>
		</section>
	{/if}

	{#if profile.bio.length > 0}
		<section class="block" data-testid="galaxy-card-bio-section">
			<h3 class="block__title">{$t('galaxy.about')}</h3>
			{#each profile.bio as paragraph, index (index)}
				<p class="para" data-testid="galaxy-card-bio-item-{index}">{paragraph}</p>
			{/each}
		</section>
	{/if}

	{#if profile.festivals.length > 0}
		<section class="block" data-testid="galaxy-card-festivals-section">
			<h3 class="block__title">{$t('galaxy.festivals')}</h3>
			<ul class="plays">
				{#each profile.festivals as festival, index (index)}
					<li class="play"><span class="play__text">{festival}</span></li>
				{/each}
			</ul>
		</section>
	{/if}
{:else if graduate.hasPhoto}
	<p class="row" data-testid="galaxy-card-loading-status">{$t('common.loading')}</p>
{/if}

<style>
	.photo-container { display: flex; flex-direction: column; align-items: center; margin: 0 auto 0.75rem; }
	.photo { display: block; width: clamp(96px, 40vw, 180px); height: auto; aspect-ratio: 1; margin: 0 0 0.5rem; border-radius: 50%; object-fit: cover; border: 2px solid rgb(140 190 255 / 0.55); }
	.dept-badges { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.4rem; margin-top: 0.1rem; }
	.dept-badge { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; background: rgb(140 190 255 / 0.12); border: 1px solid rgb(140 190 255 / 0.35); color: #bfe0ff; transition: transform 0.2s ease, background 0.2s ease; }
	.dept-badge:hover { transform: scale(1.1); background: rgb(140 190 255 / 0.25); border-color: rgb(140 190 255 / 0.6); color: #fff; }
	.star { width: 96px; height: 96px; margin: 0 auto 0.5rem; border-radius: 50%; background: radial-gradient(circle, rgb(234 242 255 / 0.95) 0 6px, rgb(180 214 255 / 0.35) 12px, transparent 70%); }
	.pending { margin: 0 0 0.75rem; color: var(--galaxy-muted); font-size: 0.9rem; text-align: center; }
	.name { margin: 0 0 0.25rem; font-size: clamp(1.2rem, 3.4dvh, 1.6rem); text-align: center; color: var(--galaxy-accent); }
	.years { margin: 0 0 0.75rem; color: var(--galaxy-muted); font-variant-numeric: tabular-nums; text-align: center; }
	.row { margin: 0 0 0.4rem; color: var(--galaxy-text); text-align: center; }
	.masters-container { margin: 0 0 0.6rem; color: var(--galaxy-text); text-align: center; }
	.masters-title { display: block; font-size: 0.92rem; color: var(--galaxy-muted); margin-bottom: 0.3rem; }
	.masters-list { display: flex; flex-direction: column; align-items: center; gap: 0.35rem; margin: 0; padding: 0; list-style: none; }
	.master-item { display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.2rem 0.65rem; background: rgb(255 255 255 / 0.06); border-radius: 6px; border: 1px solid rgb(255 255 255 / 0.1); }
	.master-badge { display: inline-flex; align-items: center; justify-content: center; color: #8cb4ff; }
	.master-name { font-size: 0.95rem; font-weight: 500; }
	.socials { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.5rem; margin: 0.75rem 0 0; padding: 0; list-style: none; }
	.social { display: inline-flex; align-items: center; min-height: 44px; padding: 0 1rem; border: 1px solid rgb(255 255 255 / 0.22); border-radius: 999px; color: inherit; text-decoration: none; text-transform: capitalize; }
	.social:hover { border-color: rgb(140 190 255 / 0.7); background: rgb(140 190 255 / 0.14); }
	.block { margin-top: 1.1rem; text-align: left; }
	.block__title { margin: 0 0 0.5rem; font-size: 1rem; color: var(--galaxy-accent); }
	.plays { margin: 0; padding: 0; list-style: none; }
	.play { display: flex; gap: 0.6rem; padding: 0.35rem 0; border-top: 1px solid rgb(255 255 255 / 0.08); }
	.play__year { flex-shrink: 0; min-width: 3.2rem; color: var(--galaxy-muted); font-variant-numeric: tabular-nums; }
	.play__text { min-width: 0; color: var(--galaxy-text); overflow-wrap: anywhere; }
	.para { margin: 0 0 0.6rem; line-height: 1.55; color: var(--galaxy-text); overflow-wrap: anywhere; }
</style>
