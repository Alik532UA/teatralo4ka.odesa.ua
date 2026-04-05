<script lang="ts">
	import { signInWithEmailAndPassword } from 'firebase/auth';
	import { auth } from '$lib/firebase/config';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { authService } from '$lib/states/auth.svelte';
	import { t } from 'svelte-i18n';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleLogin() {
		error = '';
		loading = true;
		try {
			await signInWithEmailAndPassword(auth, email, password);
			goto(`${base}/admin`);
		} catch (e: any) {
			error = $t('admin.login.error');
			console.error(e);
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (authService.isAuthenticated) {
			goto(`${base}/admin`);
		}
	});
</script>

<section class="admin-login container" style="padding: 160px 24px; max-width: 400px;">
	<div style="background: var(--theme-dynamic-card-bg); padding: 2.5rem; border-radius: 40px; box-shadow: 0 20px 50px rgba(0,95,174,0.1);">
		<h1 style="font-family: var(--font-heading); color: var(--color-deep-ocean); margin-bottom: 2rem; text-align: center;">{$t('admin.login.title')}</h1>
		
		{#if error}
			<p style="color: red; margin-bottom: 1rem; text-align: center;">{error}</p>
		{/if}

		<form onsubmit={handleLogin} style="display: flex; flex-direction: column; gap: 1.5rem;">
			<div style="display: flex; flex-direction: column; gap: 0.5rem;">
				<label for="email">{$t('admin.login.email')}</label>
				<input 
					type="email" 
					id="email" 
					bind:value={email} 
					required 
					style="padding: 0.8rem; border-radius: 12px; border: 1px solid #ddd;" 
				/>
			</div>

			<div style="display: flex; flex-direction: column; gap: 0.5rem;">
				<label for="password">{$t('admin.login.password')}</label>
				<input 
					type="password" 
					id="password" 
					bind:value={password} 
					required 
					style="padding: 0.8rem; border-radius: 12px; border: 1px solid #ddd;" 
				/>
			</div>

			<button 
				type="submit" 
				disabled={loading}
				class="btn btn-primary"
				style="width: 100%; border: none; cursor: pointer;"
			>
				{loading ? $t('admin.login.loading') : $t('admin.login.btn')}
			</button>
		</form>
	</div>
</section>
