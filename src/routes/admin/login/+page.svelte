<script lang="ts">
	import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
	import { auth } from '$lib/firebase/config';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { authService } from '$lib/controllers/auth.svelte';
	import { t } from 'svelte-i18n';
	import { Mail, Lock } from 'lucide-svelte';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let info = $state('');
	let loading = $state(false);
	let resetLoading = $state(false);

	async function handleLogin() {
		error = '';
		info = '';
		loading = true;
		try {
			await signInWithEmailAndPassword(auth, email, password);
			goto(`${base}/admin`);
		} catch (e: unknown) {
			error = $t('admin.login.error');
			console.error(e);
		} finally {
			loading = false;
		}
	}

	async function handleResetPassword() {
		error = '';
		info = '';
		const targetEmail = email.trim();
		if (!targetEmail) {
			error = $t('admin.login.resetEmailRequired');
			return;
		}
		resetLoading = true;
		try {
			await sendPasswordResetEmail(auth, targetEmail);
			info = $t('admin.login.resetSuccess', { values: { email: targetEmail } });
		} catch (e: unknown) {
			const code = (e as { code?: string })?.code;
			if (code === 'auth/user-not-found') {
				// same message as success, so the form doesn't reveal which emails have accounts
				info = $t('admin.login.resetSuccess', { values: { email: targetEmail } });
			} else if (code === 'auth/invalid-email' || code === 'auth/missing-email') {
				error = $t('admin.login.resetEmailRequired');
			} else {
				error = $t('admin.login.resetError');
			}
			console.error(e);
		} finally {
			resetLoading = false;
		}
	}

	$effect(() => {
		if (authService.isAuthenticated) {
			goto(`${base}/admin`);
		}
	});
</script>

<section class="admin-login container" style="max-width: 400px;" data-testid="admin-login-section-container">
	<div style="background: var(--theme-dynamic-card-bg); padding: 2.5rem; border-radius: 40px; box-shadow: 0 20px 50px rgba(0,95,174,0.1);" data-testid="admin-login-card-container">
		<h1 style="font-family: var(--font-heading); color: var(--text-title); margin-bottom: 2rem; text-align: center;" data-testid="admin-login-title-label">{$t('admin.login.title')}</h1>
		
		{#if error}
			<p style="color: red; margin-bottom: 1rem; text-align: center;" data-testid="admin-login-error-label">{error}</p>
		{/if}

		{#if info}
			<p style="color: var(--text-title); margin-bottom: 1rem; text-align: center;" data-testid="admin-login-info-label">{info}</p>
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

			<button
				type="button"
				class="reset-password-link"
				disabled={resetLoading}
				onclick={handleResetPassword}
				data-testid="admin-login-reset-password-button"
			>
				{resetLoading ? $t('admin.login.resetLoading') : $t('admin.login.resetPassword')}
			</button>
		</form>
	</div>
</section>

<style>
	.admin-login {
		padding: 48px 24px;
	}

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

	.reset-password-link {
		background: none;
		border: none;
		padding: 0;
		align-self: center;
		font-family: inherit;
		font-size: 0.9rem;
		color: var(--text-title);
		text-decoration: underline;
		cursor: pointer;
		transition: opacity 0.2s ease;
	}

	.reset-password-link:hover {
		opacity: 0.75;
	}

	.reset-password-link:disabled {
		opacity: 0.5;
		cursor: default;
	}
</style>
