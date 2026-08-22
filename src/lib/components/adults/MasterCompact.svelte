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

	function parseName(disp: string) {
		const trimmed = (disp || '').trim();
		const parts = trimmed.split(/\s+/);
		if (parts.length <= 1) {
			return { firstName: '', lastName: parts[0] || '' };
		}
		// If format is "Прізвище І." (e.g. trailing initial), treat initial as firstName
		if (parts.length === 2 && parts[1].endsWith('.') && parts[1].length <= 3) {
			return { firstName: parts[1], lastName: parts[0].toUpperCase() };
		}
		const firstName = parts[0];
		const lastName = parts.slice(1).join(' ');
		return { firstName, lastName };
	}

	const parsed = $derived(parseName(dispName));
</script>

<a
	{href}
	class="master-compact"
	aria-label={m.roleTitle ? `${dispName}, ${m.roleTitle}` : dispName}
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
	</div>

	<div class="master-compact__name">
		{#if parsed.firstName}
			<span class="master-compact__first-name">{parsed.firstName}</span>
		{/if}
		<span
			class="master-compact__last-name"
			style="--len: {parsed.lastName.length || 1};"
		>
			{parsed.lastName}
		</span>
	</div>

	<!-- Спливаючий тултіп при наведенні -->
	<div class="master-compact__popover" role="tooltip">
		{#if isHonorary}
			<span class="master-compact__popover-honorary">
				{$t('galaxy.honoraryShort', { default: "Світлої пам'яті" })}
			</span>
		{/if}
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

	.master-compact__name {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
		max-width: 100%;
		line-height: 1.22;
		text-align: center;
		margin-top: 0.15rem;
		overflow: hidden;
	}

	.master-compact__first-name {
		font-size: 0.82rem;
		font-weight: 700;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
		color: var(--text-title);
		line-height: 1.25;
	}

	.master-compact__last-name {
		font-size: clamp(0.55rem, calc(115px / var(--len) * 0.95), 0.86rem);
		font-weight: 700;
		white-space: nowrap;
		letter-spacing: -0.01em;
		color: var(--text-title);
		line-height: 1.25;
		text-transform: uppercase;
		max-width: 100%;
	}

	/* Floating Popover on Hover */
	.master-compact__popover {
		position: absolute;
		bottom: calc(100% + 8px);
		left: 50%;
		transform: translateX(-50%) translateY(6px);
		width: 230px;
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

	.master-compact__popover-honorary {
		display: inline-block;
		font-size: 0.72rem;
		padding: 0.15rem 0.5rem;
		border-radius: var(--radius-full, 9999px);
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		color: var(--text-muted);
		margin-bottom: 0.35rem;
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
