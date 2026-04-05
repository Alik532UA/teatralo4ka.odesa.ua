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
</script>

<section class="admin-dashboard container" style="padding: 160px 24px;" data-testid="admin-dashboard-container">
	{#if authService.loading}
		<p>{$t('admin.dashboard.loading')}</p>
	{:else if authService.isAuthenticated}
		<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3rem;" data-testid="admin-dashboard-header">
			<h1 style="font-family: var(--font-heading); color: var(--color-deep-ocean);" data-testid="admin-dashboard-title">{$t('admin.dashboard.title')}</h1>
			<button onclick={handleLogout} class="btn btn-outline" data-testid="logout-button">{$t('admin.dashboard.logout')}</button>
		</div>

		<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;" data-testid="admin-dashboard-cards">
   <div style="background: var(--theme-dynamic-card-bg); padding: 2rem; border-radius: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.05);" data-testid="news-card">
    <h2 style="margin-bottom: 1rem;" data-testid="news-card-title">{$t('admin.dashboard.newsTitle')}</h2>
    <p style="margin-bottom: 1.5rem; opacity: 0.7;" data-testid="news-card-desc">{$t('admin.dashboard.newsDesc')}</p>
    <div style="display: flex; gap: 1rem;" data-testid="news-card-actions">
     <a href="{base}/admin/articles" class="btn btn-primary" data-testid="news-list-btn">{$t('admin.dashboard.listBtn')}</a>
     <a href="{base}/admin/articles/new" class="btn btn-outline" data-testid="news-add-btn">+ {$t('admin.dashboard.addBtn')}</a>
    </div>
   </div>

   <div style="background: var(--theme-dynamic-card-bg); padding: 2rem; border-radius: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.05);" data-testid="settings-card">
    <h2 style="margin-bottom: 1rem;" data-testid="settings-card-title">{$t('admin.dashboard.settingsTitle')}</h2>
    <p style="margin-bottom: 1.5rem; opacity: 0.7;" data-testid="settings-card-desc">{$t('admin.dashboard.settingsDesc')}</p>
    <a href="{base}/admin/settings" class="btn btn-outline" data-testid="settings-btn">{$t('admin.dashboard.settingsBtn')}</a>
   </div>

    {#if authService.profile?.role === 'superadmin'}
     <div style="background: var(--theme-dynamic-card-bg); padding: 2rem; border-radius: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.05);" data-testid="users-card">
      <h2 style="margin-bottom: 1rem;" data-testid="users-card-title">{$t('admin.dashboard.usersTitle')}</h2>
      <p style="margin-bottom: 1.5rem; opacity: 0.7;" data-testid="users-card-desc">{$t('admin.dashboard.usersDesc')}</p>
      <a href="{base}/admin/users" class="btn btn-outline" data-testid="users-btn">{$t('admin.dashboard.usersBtn')}</a>
     </div>
    {/if}
   </div>
	{/if}
</section>
