<script lang="ts">
	import { authService } from '$lib/states/auth.svelte';
	import { goto } from '$app/navigation';
	import { signOut } from 'firebase/auth';
	import { auth } from '$lib/firebase/config';

	$effect(() => {
		if (!authService.loading && !authService.isAuthenticated) {
			goto('/admin/login');
		}
	});

	async function handleLogout() {
		await signOut(auth);
		goto('/');
	}
</script>

<section class="admin-dashboard container" style="padding: 160px 24px;">
	{#if authService.loading}
		<p>Завантаження...</p>
	{:else if authService.isAuthenticated}
		<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3rem;">
			<h1 style="font-family: var(--font-heading); color: var(--color-deep-ocean);">Панель адміністратора</h1>
			<button onsubmit={handleLogout} class="btn btn-outline">Вийти</button>
		</div>

		<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
			<div style="background: white; padding: 2rem; border-radius: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
				<h2 style="margin-bottom: 1rem;">Новини та Оголошення</h2>
				<p style="margin-bottom: 1.5rem; opacity: 0.7;">Керуйте публікаціями на сайті.</p>
				<div style="display: flex; gap: 1rem;">
					<a href="/admin/articles" class="btn btn-primary">Список статей</a>
					<a href="/admin/articles/new" class="btn btn-outline">+ Додати</a>
				</div>
			</div>

			<div style="background: white; padding: 2rem; border-radius: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); opacity: 0.5;">
				<h2 style="margin-bottom: 1rem;">Налаштування сайту</h2>
				<p>В розробці...</p>
			</div>
		</div>
	{/if}
</section>
