<script lang="ts">
	import { authService } from '$lib/states/auth.svelte';
	import { toast } from '$lib/states/toast.svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { getSettings, updateSettings, type SiteSettings } from '$lib/services/settings';
	import { onMount } from 'svelte';
	import { t } from 'svelte-i18n';

	let siteTitle = $state('Одеська театральна школа');
	let phone = $state('');
	let email = $state('');
	let address = $state('');
	let facebookUrl = $state('');
	let instagramUrl = $state('');
	let telegramUrl = $state('');
	let youtubeUrl = $state('');
	let tiktokUrl = $state('');
	let loading = $state(true);
	let saving = $state(false);

	$effect(() => {
		if (!authService.loading && !authService.isAuthenticated) {
			goto(`${base}/admin/login`);
		}
	});

	onMount(async () => {
		const settings = await getSettings();
		if (settings) {
			siteTitle = settings.siteTitle || siteTitle;
			phone = settings.phone || '';
			email = settings.email || '';
			address = settings.address || '';
			facebookUrl = settings.facebookUrl || '';
			instagramUrl = settings.instagramUrl || '';
			telegramUrl = settings.telegramUrl || '';
			youtubeUrl = settings.youtubeUrl || '';
			tiktokUrl = settings.tiktokUrl || '';
		}
		loading = false;
	});

	async function handleSubmit() {
		saving = true;
		try {
			await updateSettings({
				siteTitle,
				phone,
				email,
				address,
				facebookUrl,
				instagramUrl,
				telegramUrl,
				youtubeUrl,
				tiktokUrl
			});
			toast.success($t('admin.dashboard.saveSuccess') || 'Збережено успішно');
		} catch (e: any) {
			console.error(e);
			toast.error(e.message || $t('admin.editor.errorSave'));
		} finally {
			saving = false;
		}
	}
</script>

<section class="admin-settings container" style="padding: 160px 24px;">
	<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
		<h1 style="font-family: var(--font-heading); color: var(--color-deep-ocean);">{$t('admin.dashboard.settingsTitle')}</h1>
		<a href="{base}/admin" class="btn btn-outline" data-testid="admin-settings-back-btn">{$t('admin.editor.backToList')}</a>
	</div>

	{#if loading}
		<p>{$t('admin.dashboard.loading')}</p>
	{:else}
		<form onsubmit={handleSubmit} style="background: var(--theme-dynamic-card-bg); padding: 3rem; border-radius: 40px; box-shadow: 0 20px 50px rgba(0,0,0,0.05); display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
			<div style="grid-column: span 2; display: flex; flex-direction: column; gap: 0.5rem;">
				<label for="siteTitle">{$t('admin.editor.titleLabel')}</label>
				<input type="text" id="siteTitle" bind:value={siteTitle} required style="padding: 1rem; border-radius: 12px; border: 1px solid #ddd;" data-testid="admin-settings-title-input" />
			</div>

			<div style="display: flex; flex-direction: column; gap: 0.5rem;">
				<h3 style="margin-bottom: 0.5rem; color: var(--color-deep-ocean);">{$t('admin.dashboard.contacts')}</h3>
				<label for="phone">{$t('admin.dashboard.phone')}</label>
				<input type="text" id="phone" bind:value={phone} style="padding: 1rem; border-radius: 12px; border: 1px solid #ddd;" data-testid="admin-settings-phone-input" />
				
				<label for="email" style="margin-top: 1rem;">Email</label>
				<input type="email" id="email" bind:value={email} style="padding: 1rem; border-radius: 12px; border: 1px solid #ddd;" data-testid="admin-settings-email-input" />
				
				<label for="address" style="margin-top: 1rem;">{$t('admin.dashboard.address')}</label>
				<input type="text" id="address" bind:value={address} style="padding: 1rem; border-radius: 12px; border: 1px solid #ddd;" data-testid="admin-settings-address-input" />
			</div>

			<div style="display: flex; flex-direction: column; gap: 0.5rem;">
				<h3 style="margin-bottom: 0.5rem; color: var(--color-deep-ocean);">{$t('admin.dashboard.socials')}</h3>
				<label for="facebook">{$t('admin.dashboard.facebook')}</label>
				<input type="url" id="facebook" bind:value={facebookUrl} style="padding: 1rem; border-radius: 12px; border: 1px solid #ddd;" data-testid="admin-settings-facebook-input" />
				
				<label for="instagram">{$t('admin.dashboard.instagram')}</label>
				<input type="url" id="instagram" bind:value={instagramUrl} style="padding: 1rem; border-radius: 12px; border: 1px solid #ddd;" data-testid="admin-settings-instagram-input" />
				
				<label for="telegram">{$t('admin.dashboard.telegram')}</label>
				<input type="url" id="telegram" bind:value={telegramUrl} style="padding: 1rem; border-radius: 12px; border: 1px solid #ddd;" data-testid="admin-settings-telegram-input" />

				<label for="youtube">{$t('admin.dashboard.youtube')}</label>
				<input type="url" id="youtube" bind:value={youtubeUrl} style="padding: 1rem; border-radius: 12px; border: 1px solid #ddd;" data-testid="admin-settings-youtube-input" />

				<label for="tiktok">{$t('admin.dashboard.tiktok')}</label>
				<input type="url" id="tiktok" bind:value={tiktokUrl} style="padding: 1rem; border-radius: 12px; border: 1px solid #ddd;" data-testid="admin-settings-tiktok-input" />
			</div>

			<div style="grid-column: span 2; margin-top: 2rem;">
				<button type="submit" disabled={saving} class="btn btn-primary" style="width: 100%; border: none; padding: 1.2rem;" data-testid="admin-settings-submit-btn">
					{saving ? $t('admin.editor.saving') : $t('admin.editor.saveBtn')}
				</button>
			</div>
		</form>
	{/if}
</section>
