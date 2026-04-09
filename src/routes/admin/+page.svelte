<script lang="ts">
	import { authService } from '$lib/states/auth.svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { signOut } from 'firebase/auth';
	import { auth } from '$lib/firebase/config';
	import { t } from 'svelte-i18n';

	$effect(() => {
		if (!authService.loading && !authService.isAuthenticated) {
			goto(`${base}/admin/login`);
		}
	});

	async function handleLogout() {
		await signOut(auth);
		goto(`${base}/`);
	}

	const PROJECT_ID = import.meta.env.VITE_PROJECT_ID || 'teatralo4ka';

	const permissions = $derived(authService.profile?.projects?.[PROJECT_ID]?.permissions);
	const isSuperAdmin = $derived(authService.profile?.isSuperAdmin === true);

	const canManageArticles = $derived(isSuperAdmin || permissions?.canCreateArticles || permissions?.canEditArticles || permissions?.canDeleteArticles);
	const canManagePages = $derived(isSuperAdmin || permissions?.canCreatePages || permissions?.canEditPages || permissions?.canDeletePages);
	const canManageContent = $derived(canManageArticles || canManagePages);
	const canManageSettings = $derived(isSuperAdmin || permissions?.canManageSettings);
	const canManageUsers = $derived(isSuperAdmin || permissions?.canManageUsers);
</script>

<section class="admin-dashboard container" style="padding: 160px 24px;" data-testid="admin-dashboard-section-container">
	{#if authService.loading}
		<p data-testid="admin-dashboard-loading-label">{$t('admin.dashboard.loading')}</p>
	{:else if authService.isAuthenticated}
		<div class="dash-header" data-testid="admin-dashboard-header-group">
			<h1 class="dash-title" data-testid="admin-dashboard-title-label">{$t('admin.dashboard.title')}</h1>
			<button onclick={handleLogout} class="btn btn-outline dash-logout" data-testid="admin-logout-button">{$t('admin.dashboard.logout')}</button>
		</div>

		<div class="dash-grid" data-testid="admin-dashboard-cards-grid">
			{#if canManageContent}
				<div style="background: var(--theme-dynamic-card-bg); padding: 2rem; border-radius: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.05);" data-testid="admin-content-card-container">
					<h2 style="margin-bottom: 1rem;" data-testid="admin-content-card-title-label">{$t('admin.dashboard.contentTitle')}</h2>
					<p style="margin-bottom: 1.5rem; opacity: 0.7;" data-testid="admin-content-card-desc-label">{$t('admin.dashboard.contentDesc')}</p>
					<div style="display: flex; gap: 1rem; flex-wrap: wrap;" data-testid="admin-content-card-actions-group">
						<a href="{base}/admin/content" class="btn btn-primary" data-testid="admin-content-list-button">{$t('admin.dashboard.contentListBtn')}</a>
						{#if isSuperAdmin || permissions?.canCreateArticles || permissions?.canCreatePages}
							<a href="{base}/admin/content/new" class="btn btn-outline" data-testid="admin-content-add-button">+ {$t('admin.dashboard.contentAddBtn')}</a>
						{/if}
					</div>
				</div>
			{/if}

			{#if canManageSettings}
				<div style="background: var(--theme-dynamic-card-bg); padding: 2rem; border-radius: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.05);" data-testid="admin-settings-card-container">
					<h2 style="margin-bottom: 1rem;" data-testid="admin-settings-card-title-label">{$t('admin.dashboard.settingsTitle')}</h2>
					<p style="margin-bottom: 1.5rem; opacity: 0.7;" data-testid="admin-settings-card-desc-label">{$t('admin.dashboard.settingsDesc')}</p>
					<a href="{base}/admin/settings" class="btn btn-outline" data-testid="admin-settings-button">{$t('admin.dashboard.settingsBtn')}</a>
				</div>
			{/if}

			{#if canManageUsers}
				<div style="background: var(--theme-dynamic-card-bg); padding: 2rem; border-radius: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.05);" data-testid="admin-users-card-container">
					<h2 style="margin-bottom: 1rem;" data-testid="admin-users-card-title-label">{$t('admin.dashboard.usersTitle')}</h2>
					<p style="margin-bottom: 1.5rem; opacity: 0.7;" data-testid="admin-users-card-desc-label">{$t('admin.dashboard.usersDesc')}</p>
					<a href="{base}/admin/users" class="btn btn-outline" data-testid="admin-users-button">{$t('admin.dashboard.usersBtn')}</a>
				</div>
			{/if}
		</div>
	{/if}
</section>

<style>
	.dash-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 3rem;
		gap: 1rem;
	}
	.dash-title {
		font-family: var(--font-heading);
		color: var(--color-deep-ocean);
		min-width: 0;
		margin: 0;
	}
	.dash-logout {
		white-space: nowrap;
		flex-shrink: 0;
	}
	.dash-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(480px, 100%), 1fr));
		gap: 2rem;
	}
	@media (max-width: 600px) {
		.admin-dashboard { padding-top: 110px !important; }
		.dash-title { font-size: 1.6rem; }
	}
</style>
