<script lang="ts">
	import { t } from 'svelte-i18n';
	import { ChevronRight, Camera } from 'lucide-svelte';
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

<a
	{href}
	class="master-card"
	title={name}
	data-testid="residents-adults-master-card-{m.slug}"
>
	<div class="master-card__avatar-wrap">
		{#if m.photo}
			<img
				src={m.photo}
				alt={name}
				class="master-card__avatar"
				class:master-card__avatar--honorary={isHonorary}
				width="80"
				height="80"
				loading="lazy"
			/>
		{:else}
			<div class="master-card__avatar-placeholder" aria-hidden="true">
				<Camera size={32} aria-hidden="true" />
			</div>
		{/if}
	</div>

	<div class="master-card__content">
		<h3 class="master-card__name">{dispName}</h3>

		{#if m.roleTitle}
			<p class="master-card__role-title">{m.roleTitle}</p>
		{/if}

		{#if isHonorary}
			<span class="master-card__honorary-badge">
				<span>{$t('galaxy.honoraryShort', { default: "Світлої пам'яті" })}</span>
			</span>
		{/if}

		{#if m.departments && m.departments.length > 0}
			<div class="master-card__footer">
				<div class="master-card__depts">
					{#each m.departments as dept (dept)}
						<span class="master-card__dept-badge" title={$t(`galaxy.departments.${dept}`, { default: dept })}>
							<DepartmentIcon department={dept} size={15} />
						</span>
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<div class="master-card__arrow" aria-hidden="true">
		<ChevronRight size={20} />
	</div>
</a>

<style>
	.master-card {
		display: flex;
		align-items: flex-start;
		gap: 1.25rem;
		padding: 1.25rem 1.4rem;
		background: var(--bg-card);
		border: 1px solid var(--border-main);
		border-radius: var(--radius-xl, 20px);
		color: var(--text-main);
		text-decoration: none;
		box-shadow: var(--shadow-main);
		transition: transform var(--transition-base, 0.25s ease), border-color var(--transition-base, 0.25s ease), box-shadow var(--transition-base, 0.25s ease);
	}

	.master-card:hover {
		transform: translateY(-4px);
		border-color: var(--accent-primary);
		box-shadow: 0 10px 28px rgba(0, 0, 0, 0.12);
	}

	.master-card__avatar-wrap {
		position: relative;
		width: 72px;
		height: 72px;
		flex-shrink: 0;
	}

	.master-card__avatar {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		object-fit: cover;
		border: 2px solid var(--accent-primary);
	}

	.master-card__avatar--honorary {
		filter: grayscale(100%);
		transition: filter 10s ease;
	}

	.master-card:hover .master-card__avatar--honorary,
	.master-card__avatar--honorary:hover {
		filter: grayscale(0%);
	}

	.master-card__avatar-placeholder {
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

	.master-card__content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.master-card__name {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--text-title);
		line-height: 1.25;
	}

	.master-card__role-title {
		margin: 0.2rem 0 0.25rem;
		font-size: 0.85rem;
		line-height: 1.35;
		color: var(--text-muted);
		font-weight: 500;
	}

	.master-card__honorary-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.15rem 0.55rem;
		border-radius: var(--radius-full, 9999px);
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		color: var(--text-muted);
		font-size: 0.78rem;
		font-weight: 500;
		width: fit-content;
		margin-top: 0.15rem;
	}

	.master-card__footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 0.35rem;
	}

	.master-card__depts {
		display: flex;
		gap: 0.35rem;
	}

	.master-card__dept-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		color: var(--text-title);
	}

	.master-card__arrow {
		color: var(--border-main);
		transition: transform 0.2s ease, color 0.2s ease;
		align-self: center;
	}

	.master-card:hover .master-card__arrow {
		transform: translateX(4px);
		color: var(--accent-primary);
	}
</style>
