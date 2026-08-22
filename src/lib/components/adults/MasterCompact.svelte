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
</script>

<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
<a
	{href}
	class="master-compact"
	title="{dispName} — {m.roleTitle || ''}"
	data-testid="residents-adults-master-card-{m.slug}"
>
	<div class="master-compact__avatar-wrap">
		{#if m.photo}
			<img
				src={m.photo}
				alt={name}
				class="master-compact__avatar"
				class:master-compact__avatar--honorary={isHonorary}
				width="84"
				height="84"
				loading="lazy"
			/>
		{:else}
			<div class="master-compact__avatar-placeholder" aria-hidden="true">
				<Camera size={28} aria-hidden="true" />
			</div>
		{/if}

		{#if isHonorary}
			<span class="master-compact__honorary-dot" title="Світлої пам'яті"></span>
		{/if}
	</div>

	<span class="master-compact__name">{dispName}</span>

	<!-- Спливаючий тултіп при наведенні -->
	<div class="master-compact__popover" role="tooltip">
		<strong class="master-compact__popover-name">{dispName}</strong>
		{#if m.roleTitle}
			<p class="master-compact__popover-role">{m.roleTitle}</p>
		{/if}
		{#if m.departments && m.departments.length > 0}
			<div class="master-compact__popover-depts">
				{#each m.departments as dept (dept)}
					<span class="master-compact__popover-dept">
						<DepartmentIcon department={dept} size={13} />
						<span>{$t(`galaxy.departments.${dept}`, { default: dept })}</span>
					</span>
				{/each}
			</div>
		{/if}
	</div>
</a>

<style>
	.master-compact {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		text-decoration: none;
		color: var(--text-main);
		padding: 0.5rem;
		border-radius: var(--radius-lg, 16px);
		transition: transform 0.2s ease, background 0.2s ease;
	}

	.master-compact:hover {
		transform: translateY(-4px);
		background: var(--bg-surface);
	}

	.master-compact__avatar-wrap {
		position: relative;
		width: 80px;
		height: 80px;
		margin-bottom: 0.6rem;
	}

	.master-compact__avatar {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		object-fit: cover;
		border: 2px solid var(--accent-primary);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.master-compact__avatar--honorary {
		filter: grayscale(100%);
		transition: filter 10s ease;
	}

	.master-compact:hover .master-compact__avatar--honorary,
	.master-compact__avatar--honorary:hover {
		filter: grayscale(0%);
	}

	.master-compact__avatar-placeholder {
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

	.master-compact__honorary-dot {
		position: absolute;
		bottom: 2px;
		right: 2px;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: #64748b;
		border: 2px solid var(--bg-card);
	}

	.master-compact__name {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-title);
		line-height: 1.25;
		max-width: 100%;
		display: -webkit-box;
		line-clamp: 2;
		-webkit-line-clamp: 2;
		/* svelte-ignore css_unknown_property */
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	/* Floating Popover on Hover */
	.master-compact__popover {
		position: absolute;
		bottom: calc(100% + 8px);
		left: 50%;
		transform: translateX(-50%) translateY(6px);
		width: 220px;
		padding: 0.85rem 1rem;
		background: var(--bg-card);
		border: 1px solid var(--border-main);
		border-radius: var(--radius-md, 12px);
		box-shadow: 0 12px 28px rgba(0, 0, 0, 0.22);
		text-align: center;
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.2s ease, transform 0.2s ease;
		z-index: 50;
	}

	.master-compact:hover .master-compact__popover,
	.master-compact:focus-visible .master-compact__popover {
		opacity: 1;
		transform: translateX(-50%) translateY(0);
	}

	.master-compact__popover-name {
		display: block;
		font-size: 0.95rem;
		color: var(--text-title);
		margin-bottom: 0.25rem;
	}

	.master-compact__popover-role {
		margin: 0 0 0.4rem;
		font-size: 0.78rem;
		line-height: 1.35;
		color: var(--text-muted);
	}

	.master-compact__popover-depts {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		align-items: center;
	}

	.master-compact__popover-dept {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.72rem;
		color: var(--text-muted);
	}
</style>
