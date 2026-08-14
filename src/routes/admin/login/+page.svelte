<script lang="ts">
	import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
	import { auth } from '$lib/firebase/config';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { authService } from '$lib/controllers/auth.svelte';
	import { t } from 'svelte-i18n';
	import { Mail } from 'lucide-svelte';
	import PasswordInput from '$lib/components/ui/PasswordInput.svelte';
	import InputTools from '$lib/components/ui/InputTools.svelte';

	let emailEl = $state<HTMLInputElement | null>(null);

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
			goto(resolve('/admin'));
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
			goto(resolve('/admin'));
		}
	});
</script>

<section class="admin-login container" style="max-width: 440px;" data-testid="admin-login-section-container">
	<div style="background: var(--bg-card); padding: 2.5rem; border-radius: 40px; box-shadow: 0 20px 50px rgba(0,95,174,0.1);" data-testid="admin-login-card-container">
		<h1 style="font-family: var(--font-heading); color: var(--text-title); margin-bottom: 2rem; text-align: center;" data-testid="admin-login-title-label">{$t('admin.login.title')}</h1>

		{#if error}
			<p style="color: red; margin-bottom: 1rem; text-align: center;" data-testid="admin-login-error-label">{error}</p>
		{/if}

		{#if info}
			<p style="color: var(--text-title); margin-bottom: 1rem; text-align: center;" data-testid="admin-login-info-label">{info}</p>
		{/if}

		<form onsubmit={handleLogin} style="display: flex; flex-direction: column; gap: 1.5rem;" data-testid="admin-login-fieldset">
			<div class="input-with-icon has-input-tools" data-testid="admin-login-email-fieldset">
				<Mail size={18} class="input-icon lead" aria-hidden="true" />
				<input
					type="email"
					id="email"
					bind:value={email}
					required
					class="form-input"
					placeholder=" "
					autocomplete="email"
					autocapitalize="off"
					autocorrect="off"
					spellcheck="false"
					bind:this={emailEl}
					data-testid="admin-login-email-input"
				/>
				<!--
					Пошта отримує «вставити» й «стерти», але не «скопіювати»: з форми
					входу вміст не забирають, у неї вводять.
				-->
				<InputTools
					bind:value={email}
					input={emailEl}
					tools={['paste', 'clear']}
					scope="admin-login-email"
					overlay
					fieldLabel={$t('admin.login.email')}
				/>
				<label for="email" class="floating-label">{$t('admin.login.email')}</label>
			</div>

			<PasswordInput
				id="password"
				label={$t('admin.login.password')}
				testId="admin-login-password"
				autocomplete="current-password"
				required
				bind:value={password}
			/>

			<button
				type="button"
				class="reset-password-link"
				disabled={resetLoading}
				onclick={handleResetPassword}
				data-testid="admin-login-reset-password-btn"
			>
				{resetLoading ? $t('admin.login.resetLoading') : $t('admin.login.resetPassword')}
			</button>

			<button
				type="submit"
				disabled={loading}
				class="btn btn-primary"
				style="width: 100%; border: none; cursor: pointer;"
				data-testid="admin-login-submit-btn"
			>
				{loading ? $t('admin.login.loading') : $t('admin.login.btn')}
			</button>
		</form>
	</div>
</section>

<style>
	/* Те, що раніше малювало саме поле: маска згасання тексту не має зачіпати
	   тло й рамку, тож вони переїхали на обгортку. */
	.input-with-icon.has-input-tools {
		background: var(--bg-surface);
		border: 2px solid var(--border-main);
		border-radius: var(--radius-md);
	}

	.input-with-icon.has-input-tools:focus-within {
		border-color: var(--accent-primary);
	}

	/*
	 * Власне тло поля лишалося б поверх тла обгортки, і маска згасання зачепила
	 * б його. Глобальне правило тут програє за вагою: scoping Svelte додає до
	 * селектора клас, тож переважити його може лише правило з цього ж файлу.
	 */
	.input-with-icon.has-input-tools .form-input {
		background: transparent;
		border-color: transparent;
	}

	.admin-login {
		padding: 48px 24px;
	}

	.input-with-icon {
		position: relative;
		display: flex;
		align-items: center;
		--input-icon-color: var(--accent-primary, #6b7280);
		/* Те саме, що в PasswordInput: під міткою поле, а не картка. */
		--input-bg: color-mix(in srgb, var(--bg-card), #000 20%);
	}

	:global(.input-icon.lead) {
		position: absolute;
		left: 1rem;
		color: var(--input-icon-color);
		opacity: 0.65;
		pointer-events: none;
		transition: opacity 0.2s ease;
	}

	.input-with-icon:focus-within :global(.input-icon.lead) {
		opacity: 1;
	}

	.form-input {
		width: 100%;
		box-sizing: border-box;
		padding: 0.9rem 1rem 0.9rem 3rem;
		background: rgba(0, 0, 0, 0.2);
		border: 2px solid var(--accent-primary);
		border-radius: var(--radius-md, 12px);
		color: var(--text-title, #fff);
	}

	.floating-label {
		position: absolute;
		left: 3rem;
		top: 50%;
		transform: translateY(-50%);
		transform-origin: left center;
		color: var(--input-icon-color);
		pointer-events: none;
		background: var(--input-bg);
		padding: 0 0.25rem;
		border-radius: 4px;
		transition: top 0.15s ease, left 0.15s ease, transform 0.15s ease;
	}

	.form-input:focus ~ .floating-label,
	.form-input:not(:placeholder-shown) ~ .floating-label {
		top: 0;
		left: 1rem;
		transform: translateY(-50%) scale(0.82);
	}

	.reset-password-link {
		background: none;
		border: none;
		padding: 0;
		align-self: flex-end;
		margin-top: -0.5rem;
		font-family: inherit;
		font-size: 0.85rem;
		color: var(--accent-primary, #00b4d8);
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
