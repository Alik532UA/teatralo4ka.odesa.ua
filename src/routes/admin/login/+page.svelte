<script lang="ts">
	import { signInWithEmailAndPassword } from 'firebase/auth';
	import { auth } from '$lib/firebase/config';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { authService } from '$lib/states/auth.svelte';
	import { t } from 'svelte-i18n';
	import { Mail, Lock } from 'lucide-svelte';

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

<section class="admin-login container" style="padding: 160px 24px; max-width: 400px;" data-testid="admin-login-section-container">
	<div style="background: var(--theme-dynamic-card-bg); padding: 2.5rem; border-radius: 40px; box-shadow: 0 20px 50px rgba(0,95,174,0.1);" data-testid="admin-login-card-container">
		<h1 style="font-family: var(--font-heading); color: var(--color-deep-ocean); margin-bottom: 2rem; text-align: center;" data-testid="admin-login-title-label">{$t('admin.login.title')}</h1>
		
		{#if error}
			<p style="color: red; margin-bottom: 1rem; text-align: center;" data-testid="admin-login-error-label">{error}</p>
		{/if}

		<form onsubmit={handleLogin} style="display: flex; flex-direction: column; gap: 1.5rem;" data-testid="admin-login-form-group">
			<div class="form-group" data-testid="admin-login-email-group">
				<label class="form-label" for="email">{$t('admin.login.email')}</label>
				<div class="input-with-icon">
					<Mail size={18} class="input-icon" />
					<input 
						type="email" 
						id="email" 
						bind:value={email} 
						required 
						class="form-input"
						style="padding-left: 3.5rem;"
						data-testid="admin-login-email-input"
					/>
				</div>
			</div>

			<div class="form-group" data-testid="admin-login-password-group">
				<label class="form-label" for="password">{$t('admin.login.password')}</label>
				<div class="input-with-icon">
					<Lock size={18} class="input-icon" />
					<input 
						type="password" 
						id="password" 
						bind:value={password} 
						required 
						class="form-input"
						style="padding-left: 3.5rem;"
						data-testid="admin-login-password-input"
					/>
				</div>
			</div>

			<button 
				type="submit" 
				disabled={loading}
				class="btn btn-primary"
				style="width: 100%; border: none; cursor: pointer;"
				data-testid="admin-login-submit-button"
			>
				{loading ? $t('admin.login.loading') : $t('admin.login.btn')}
			</button>
		</form>
	</div>
</section>

<style>
	.input-with-icon {
		position: relative;
		display: flex;
		align-items: center;
	}

	:global(.input-icon) {
		position: absolute;
		left: 1.25rem;
		color: var(--color-ocean);
		opacity: 0.5;
		pointer-events: none;
		transition: opacity 0.2s ease;
	}

	.input-with-icon:focus-within :global(.input-icon) {
		opacity: 1;
	}
</style>
