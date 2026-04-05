<script lang="ts">
	import { authService } from '$lib/states/auth.svelte';
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { signOut } from 'firebase/auth';
	import { auth } from '$lib/firebase/config';

	let { children } = $props();

	async function handleLogout() {
		await signOut(auth);
		window.location.href = `${base}/admin/login`;
	}

	const isLoginPage = $derived(page.url.pathname.endsWith('/admin/login'));
	
	// Перевірка прав (для всіх сторінок окрім логіну)
	const isAccessDenied = $derived(!isLoginPage && !authService.loading && authService.isAuthenticated && !authService.isAuthorized);
</script>

{#if authService.loading}
	<div class="admin-loading">
		<p>Перевірка доступу...</p>
	</div>
{:else if isAccessDenied}
	<section class="access-denied container">
		<div class="denied-card">
			<div class="denied-icon">🔒</div>
			<h1>Доступ обмежено</h1>
			<p>У вас немає прав для керування цим сайтом. Будь ласка, зверніться до головного адміністратора для отримання доступу.</p>
			
			<div class="denied-actions">
				<a href="https://t.me/alik532" target="_blank" class="btn btn-primary" data-testid="admin-access-denied-contact-btn">Написати адміністратору</a>
				<button onclick={handleLogout} class="btn btn-outline" data-testid="admin-access-denied-logout-btn">Вийти з акаунту</button>
			</div>
		</div>
	</section>
{:else}
	{@render children()}
{/if}

<style>
	.admin-loading {
		height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		color: var(--color-deep-ocean);
	}

	.access-denied {
		height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px;
	}

	.denied-card {
		background: var(--theme-dynamic-card-bg);
		padding: 4rem;
		border-radius: 40px;
		box-shadow: 0 30px 60px rgba(0,0,0,0.1);
		text-align: center;
		max-width: 500px;
		width: 100%;
	}

	.denied-icon {
		font-size: 4rem;
		margin-bottom: 1.5rem;
	}

	h1 {
		font-family: var(--font-heading);
		color: var(--color-deep-ocean);
		margin-bottom: 1rem;
	}

	p {
		color: var(--color-body-text);
		opacity: 0.8;
		line-height: 1.6;
		margin-bottom: 2.5rem;
	}

	.denied-actions {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.denied-actions :global(.btn) {
		width: 100%;
		justify-content: center;
	}
</style>
