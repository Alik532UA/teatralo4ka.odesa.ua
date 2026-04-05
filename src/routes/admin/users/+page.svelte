<script lang="ts">
	import { authService } from '$lib/states/auth.svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
	import { db } from '$lib/firebase/config';
	import { onMount } from 'svelte';
	import { t } from 'svelte-i18n';

	let users = $state<any[]>([]);
	let loading = $state(true);
	let savingId = $state<string | null>(null);

	$effect(() => {
		if (!authService.loading && authService.profile?.role !== 'superadmin') {
			goto(`${base}/admin`);
		}
	});

	async function loadUsers() {
		loading = true;
		try {
			const q = query(collection(db, 'users'), orderBy('email'));
			const snapshot = await getDocs(q);
			users = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	}

	onMount(loadUsers);

	async function updateUser(user: any) {
		savingId = user.id;
		try {
			const userRef = doc(db, 'users', user.id);
			await updateDoc(userRef, {
				role: user.role,
				schoolId: user.schoolId,
				permissions: user.permissions
			});
			alert('Користувача оновлено');
		} catch (e) {
			console.error(e);
			alert('Помилка при оновленні');
		} finally {
			savingId = null;
		}
	}
</script>

<section class="admin-users container" style="padding: 160px 24px;">
	<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
		<h1 style="font-family: var(--font-heading); color: var(--color-deep-ocean);">Керування користувачами</h1>
		<a href="{base}/admin" class="btn btn-outline">Назад</a>
	</div>

	{#if loading}
		<p>Завантаження списку користувачів...</p>
	{:else}
		<div style="display: grid; gap: 1.5rem;">
			{#each users as user}
				<div style="background: var(--theme-dynamic-card-bg); padding: 2rem; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 2rem; align-items: start;">
					<div>
						<h3 style="margin-bottom: 0.5rem;">{user.email}</h3>
						<p style="opacity: 0.6; font-size: 0.8rem;">UID: {user.id}</p>
						
						<div style="margin-top: 1.5rem;">
							<label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Роль</label>
							<select bind:value={user.role} style="padding: 0.5rem; border-radius: 8px; border: 1px solid #ddd; width: 100%;">
								<option value="superadmin">Супер-адмін</option>
								<option value="admin">Адмін школи</option>
								<option value="moderator">Модератор</option>
							</select>
						</div>
					</div>

					<div>
						<label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Школа (ID)</label>
						<input type="text" bind:value={user.schoolId} style="padding: 0.5rem; border-radius: 8px; border: 1px solid #ddd; width: 100%;" />
						
						<div style="margin-top: 1.5rem; display: grid; gap: 0.5rem;">
							<label style="font-weight: 600;">Дозволи</label>
							<label style="display: flex; gap: 0.5rem; align-items: center; cursor: pointer;">
								<input type="checkbox" bind:checked={user.permissions.canCreate} /> Створення
							</label>
							<label style="display: flex; gap: 0.5rem; align-items: center; cursor: pointer;">
								<input type="checkbox" bind:checked={user.permissions.canEdit} /> Редагування
							</label>
							<label style="display: flex; gap: 0.5rem; align-items: center; cursor: pointer;">
								<input type="checkbox" bind:checked={user.permissions.canDelete} /> Видалення
							</label>
						</div>
					</div>

					<div style="display: flex; flex-direction: column; justify-content: flex-end; height: 100%;">
						<button 
							onclick={() => updateUser(user)} 
							disabled={savingId === user.id}
							class="btn btn-primary" 
							style="width: 100%; border: none;"
						>
							{savingId === user.id ? 'Збереження...' : 'Оновити доступ'}
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</section>
