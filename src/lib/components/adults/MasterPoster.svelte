<script lang="ts">
	import { t } from 'svelte-i18n';
	import { Camera } from 'lucide-svelte';
	import DepartmentIcon from '$lib/components/icons/DepartmentIcon.svelte';
	import { masterProfilePath, type Master } from '$lib/data/masters';

	interface Props {
		master: Master;
		isEn: boolean;
	}

	let { master: m, isEn }: Props = $props();

	const href = $derived(masterProfilePath(m.slug, isEn ? 'en' : 'uk'));
	const name = $derived(isEn ? m.fullNameEn : m.fullName);
	const dispName = $derived(isEn ? m.displayNameEn : m.displayName);
	const isHonorary = $derived(m.isHonorary || m.status === 'honorary' || m.category === 'honorary');
	const imgSrc = $derived(m.portrait || m.photo);
</script>

<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
<a
	{href}
	class="master-poster"
	title={name}
	data-testid="residents-adults-master-card-{m.slug}"
>
	<div class="master-poster__media">
		{#if imgSrc}
			<img
				src={imgSrc}
				alt={name}
				class="master-poster__img"
				class:master-poster__img--honorary={isHonorary}
				width="360"
				height="540"
				loading="lazy"
			/>
		{:else}
			<div class="master-poster__placeholder" aria-hidden="true">
				<Camera size={48} aria-hidden="true" />
			</div>
		{/if}
	</div>

	<div class="master-poster__overlay">
		{#if isHonorary}
			<span class="master-poster__honorary-badge">
				<span>{$t('galaxy.honoraryShort', { default: "Світлої пам'яті" })}</span>
			</span>
		{/if}

		<h3 class="master-poster__name">{dispName}</h3>

		{#if m.roleTitle}
			<p class="master-poster__role">{m.roleTitle}</p>
		{/if}

		{#if m.departments && m.departments.length > 0}
			<div class="master-poster__depts">
				{#each m.departments as dept (dept)}
					<span class="master-poster__dept-badge" title={$t(`galaxy.departments.${dept}`, { default: dept })}>
						<DepartmentIcon department={dept} size={14} />
					</span>
				{/each}
			</div>
		{/if}
	</div>
</a>

<style>
	.master-poster {
		position: relative;
		display: flex;
		flex-direction: column;
		aspect-ratio: 2 / 3;
		border-radius: var(--radius-xl, 20px);
		overflow: hidden;
		background: #09131d;
		border: 1px solid var(--border-main);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
		text-decoration: none;
		transition: transform 0.35s cubic-bezier(0.2, 0, 0.2, 1), border-color 0.35s ease, box-shadow 0.35s ease;
	}

	.master-poster:hover {
		transform: translateY(-6px);
		border-color: var(--accent-primary);
		box-shadow: 0 16px 36px rgba(0, 0, 0, 0.35);
	}

	.master-poster__media {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	.master-poster__img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.6s cubic-bezier(0.2, 0, 0.2, 1), filter 10s ease;
	}

	.master-poster:hover .master-poster__img {
		transform: scale(1.05);
	}

	.master-poster__img--honorary {
		filter: grayscale(100%);
		transition: filter 10s ease;
	}

	.master-poster:hover .master-poster__img--honorary,
	.master-poster__img--honorary:hover {
		filter: grayscale(0%);
	}

	.master-poster__placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: radial-gradient(circle at center, #1b2838 0%, #0c141e 100%);
		color: var(--accent-text);
	}

	.master-poster__overlay {
		position: absolute;
		inset: auto 0 0 0;
		padding: 2.5rem 1rem 1rem;
		background: linear-gradient(to top, rgba(7, 16, 26, 0.96) 0%, rgba(7, 16, 26, 0.85) 55%, rgba(7, 16, 26, 0) 100%);
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		text-align: center;
		z-index: 2;
	}

	.master-poster__honorary-badge {
		align-self: center;
		display: inline-flex;
		padding: 0.15rem 0.55rem;
		border-radius: var(--radius-full, 9999px);
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(4px);
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: #e2e8f0;
		font-size: 0.72rem;
		font-weight: 500;
		margin-bottom: 0.15rem;
	}

	.master-poster__name {
		margin: 0;
		font-size: 1.05rem;
		font-weight: 700;
		color: #ffffff;
		line-height: 1.25;
		text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
	}

	.master-poster__role {
		margin: 0;
		font-size: 0.8rem;
		line-height: 1.35;
		color: #cbd5e1;
		font-weight: 400;
		text-shadow: 0 1px 4px rgba(0, 0, 0, 0.7);
	}

	.master-poster__depts {
		display: flex;
		justify-content: center;
		gap: 0.35rem;
		margin-top: 0.3rem;
	}

	.master-poster__dept-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.55);
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: #ffffff;
	}
</style>
