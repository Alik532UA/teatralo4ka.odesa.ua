<script lang="ts">
	import { authService } from '$lib/states/auth.svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { collection, getDocs, doc, updateDoc, query, orderBy, setDoc, deleteDoc } from 'firebase/firestore';
	import { db } from '$lib/firebase/config';
	import { onMount } from 'svelte';
	import { t } from 'svelte-i18n';
	import { Shield, School, CheckSquare, Save, ChevronLeft, User as UserIcon, AlertCircle, Users, GraduationCap, UserCog, UserCheck, UserPlus, X, Trash2 } from 'lucide-svelte';

	// Отримуємо ID школи з оточення
	const DEFAULT_SCHOOL_ID = import.meta.env.VITE_SCHOOL_ID || 'as5';

	// Ієрархія ролей
	const ROLE_HIERARCHY = [
		{ id: 'superadmin', label: 'Супер-адмін', icon: Shield, color: '#ef4444' },
		{ id: 'admin', label: 'Адмін школи', icon: School, color: '#3b82f6' },
		{ id: 'moderator', label: 'Модератор', icon: UserCog, color: '#10b981' },
		{ id: 'assistant', label: 'Помічник', icon: GraduationCap, color: '#f59e0b' }
	];

	let users = $state<any[]>([]);
	let loading = $state(true);
	let savingId = $state<string | null>(null);

	// Стан для форми додавання
	let showAddForm = $state(false);
	let newUser = $state({
		email: '',
		role: 'assistant',
		schoolId: DEFAULT_SCHOOL_ID,
		permissions: {
			canCreate: true,
			canEdit: true,
			canDelete: false
		}
	});

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

	async function addUser() {
		const email = newUser.email.toLowerCase().trim();
		if (!email.includes('@')) {
			alert('Введіть коректний Email');
			return;
		}

		// Перевірка на дублікат за Email
		const exists = users.find(u => u.email.toLowerCase() === email);
		if (exists) {
			alert('Користувач із таким Email уже існує в системі');
			return;
		}

		savingId = 'new';
		try {
			// ВИКОРИСТОВУЄМО EMAIL ЯК ID ДОКУМЕНТА (це критично для безпеки та пошуку без query)
			const newDocRef = doc(db, 'users', email);
			await setDoc(newDocRef, {
				email: email,
				role: newUser.role,
				schoolId: newUser.schoolId,
				permissions: newUser.permissions,
				createdAt: new Date().toISOString()
			});
			
			alert('Користувача успішно додано до системи. Тепер він може входити.');
			showAddForm = false;
			newUser.email = '';
			await loadUsers();
		} catch (e) {
			console.error(e);
			alert('Помилка при додаванні: ' + (e as Error).message);
		} finally {
			savingId = null;
		}
	}

	async function updateUser(user: any) {
		if (authService.user?.uid === user.id) {
			alert('Ви не можете змінити власні права доступу з міркувань безпеки.');
			return;
		}

		savingId = user.id;
		try {
			const userRef = doc(db, 'users', user.id);
			await updateDoc(userRef, {
				role: user.role,
				schoolId: user.schoolId,
				permissions: user.permissions
			});
			alert('Дані користувача оновлено успішно');
		} catch (e) {
			console.error(e);
			alert('Помилка при оновленні: ' + (e as Error).message);
		} finally {
			savingId = null;
		}
	}

	async function deleteUser(user: any) {
		if (isSelf(user.id)) return;
		if (!confirm(`Ви впевнені, що хочете видалити доступ для ${user.email}?`)) return;

		savingId = user.id;
		try {
			await deleteDoc(doc(db, 'users', user.id));
			await loadUsers();
		} catch (e) {
			console.error(e);
			alert('Помилка при видаленні');
		} finally {
			savingId = null;
		}
	}

	// Групування користувачів за ролями для відображення ієрархії
	const groupedUsers = $derived(() => {
		const groups: Record<string, any[]> = {};
		ROLE_HIERARCHY.forEach(role => groups[role.id] = []);
		
		users.forEach(u => {
			if (groups[u.role]) groups[u.role].push(u);
			else {
				if (!groups['assistant']) groups['assistant'] = [];
				groups['assistant'].push(u);
			}
		});
		return groups;
	});

	function isSelf(userId: string) {
		return userId === authService.user?.uid;
	}
</script>

<section class="admin-users container" style="padding: 120px 24px; max-width: 1400px; margin: 0 auto;">
	<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4rem;">
		<div style="display: flex; align-items: center; gap: 1.5rem;">
			<a href="{base}/admin" class="btn-back" title="Назад">
				<ChevronLeft size={24} />
			</a>
			<div>
				<h1 style="margin: 0; font-size: 2.5rem; font-family: var(--font-heading); color: var(--color-deep-ocean);">Керування ієрархією</h1>
				<p style="margin: 0.5rem 0 0; opacity: 0.6; font-size: 1.1rem;">Налаштування доступів та ролей персоналу</p>
			</div>
		</div>
		
		<div style="display: flex; gap: 1rem;">
			<button class="btn-add" onclick={() => showAddForm = !showAddForm}>
				{#if showAddForm}
					<X size={20} /> Скасувати
				{:else}
					<UserPlus size={20} /> Додати користувача
				{/if}
			</button>
			<div class="stats-badge">
				<Users size={20} />
				<span>Всього: {users.length}</span>
			</div>
		</div>
	</div>

	{#if showAddForm}
		<div class="add-user-panel">
			<h2 style="margin-top: 0; display: flex; align-items: center; gap: 1rem; color: white;">
				<UserPlus /> Новий акаунт у системі
			</h2>
			<p style="opacity: 0.8; margin-bottom: 2.5rem;">Вкажіть email користувача, якого ви вже зареєстрували через Firebase Auth консоль.</p>
			
			<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 2rem; align-items: start;">
				<div class="form-group-white">
					<label for="new-email">Email користувача</label>
					<input type="email" id="new-email" bind:value={newUser.email} placeholder="example@email.com" />
				</div>
				
				<div class="form-group-white">
					<label for="new-role">Призначити ранг</label>
					<select id="new-role" bind:value={newUser.role}>
						{#each ROLE_HIERARCHY as r}
							<option value={r.id}>{r.label}</option>
						{/each}
					</select>
				</div>

				<div class="form-group-white">
					<label for="new-school">ID школи</label>
					<input type="text" id="new-school" bind:value={newUser.schoolId} />
				</div>
			</div>

			<div style="margin-top: 2rem; display: flex; justify-content: space-between; align-items: center;">
				<div class="checkbox-group-white">
					<label><input type="checkbox" bind:checked={newUser.permissions.canCreate} /> Створення</label>
					<label><input type="checkbox" bind:checked={newUser.permissions.canEdit} /> Редагування</label>
					<label><input type="checkbox" bind:checked={newUser.permissions.canDelete} /> Видалення</label>
				</div>
				<button 
					class="btn-confirm-add" 
					onclick={addUser} 
					disabled={savingId === 'new' || !newUser.email}
				>
					{savingId === 'new' ? 'Створення...' : 'Підтвердити додавання'}
				</button>
			</div>
		</div>
	{/if}

	{#if loading}
		<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; gap: 1.5rem;">
			<div class="loader"></div>
			<p style="font-size: 1.1rem; opacity: 0.7;">Завантаження структури організації...</p>
		</div>
	{:else}
		<div class="hierarchy-container">
			{#each ROLE_HIERARCHY as roleInfo, index}
				{@const roleUsers = groupedUsers()[roleInfo.id] || []}
				{#if roleUsers.length > 0 || index > 0} 
					<div class="role-group" style="--role-color: {roleInfo.color}">
						<div class="role-header">
							<div class="role-icon-box">
								<roleInfo.icon size={24} />
							</div>
							<div class="role-title-line">
								<h2>{roleInfo.label}</h2>
								<span class="count-tag">{roleUsers.length}</span>
								<div class="line"></div>
							</div>
						</div>

						{#if roleUsers.length > 0}
							<div class="users-grid">
								{#each roleUsers as user}
									<div class="user-card {isSelf(user.id) ? 'is-self' : ''}" data-testid="admin-users-row-{user.id}">
										{#if isSelf(user.id)}
											<div class="self-tag">
												<UserCheck size={14} /> ЦЕ ВИ (ЛИШЕ ПЕРЕГЛЯД)
											</div>
										{/if}

										<div class="user-main-info">
											<div class="user-avatar">
												<UserIcon size={24} />
											</div>
											<div class="user-text">
												<h3>{user.email}</h3>
												<code>ID: {user.id}</code>
											</div>
										</div>

										<div class="user-settings">
											<div class="setting-item">
												<label for="role-{user.id}">Ранг</label>
												<select 
													id="role-{user.id}" 
													bind:value={user.role} 
													disabled={isSelf(user.id)}
													class="custom-select"
												>
													{#each ROLE_HIERARCHY as r}
														<option value={r.id}>{r.label}</option>
													{/each}
												</select>
											</div>

											<div class="setting-item">
												<label for="school-{user.id}">Прив'язка до школи</label>
												<div class="input-with-icon">
													<School size={16} />
													<input 
														id="school-{user.id}" 
														type="text" 
														bind:value={user.schoolId} 
														disabled={isSelf(user.id)}
														placeholder="Введіть ID школи"
													/>
												</div>
											</div>

											<div class="permissions-block">
												<span class="group-title">Спеціальні дозволи</span>
												<div class="checkbox-group">
													<label class="custom-checkbox">
														<input type="checkbox" bind:checked={user.permissions.canCreate} disabled={isSelf(user.id)} />
														<span>Створення статей</span>
													</label>
													<label class="custom-checkbox">
														<input type="checkbox" bind:checked={user.permissions.canEdit} disabled={isSelf(user.id)} />
														<span>Редагування</span>
													</label>
													<label class="custom-checkbox">
														<input type="checkbox" bind:checked={user.permissions.canDelete} disabled={isSelf(user.id)} />
														<span>Видалення</span>
													</label>
												</div>
											</div>
										</div>

										<div class="card-actions" style="display: flex; gap: 1rem;">
											<button 
												onclick={() => updateUser(user)} 
												disabled={savingId === user.id || isSelf(user.id)}
												class="btn-save {savingId === user.id ? 'loading' : ''}"
												style="flex-grow: 1;"
											>
												{#if savingId === user.id}
													<div class="mini-loader"></div>
													...
												{:else}
													<Save size={18} />
													Оновити
												{/if}
											</button>
											
											{#if !isSelf(user.id)}
												<button 
													onclick={() => deleteUser(user)} 
													disabled={savingId === user.id}
													class="btn-delete"
													title="Видалити доступ"
												>
													<Trash2 size={18} />
												</button>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<div class="empty-role">
								<p>У цій категорії поки немає користувачів</p>
							</div>
						{/if}
					</div>
				{/if}
			{/each}
		</div>
	{/if}
</section>

<style>
	:global(:root) {
		--card-bg: var(--theme-dynamic-card-bg, #ffffff);
		--card-border: rgba(0,0,0,0.05);
		--text-main: var(--color-deep-ocean, #1a2a3a);
	}

	.hierarchy-container {
		display: flex;
		flex-direction: column;
		gap: 4rem;
	}

	.add-user-panel {
		margin-bottom: 4rem;
		background: var(--color-deep-ocean);
		color: white;
		padding: 3rem;
		border-radius: 32px;
		box-shadow: 0 20px 60px rgba(0,0,0,0.15);
	}

	.add-user-panel .form-group-white {
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
	}

	.add-user-panel label {
		font-weight: 600;
		font-size: 0.9rem;
	}

	.add-user-panel input, .add-user-panel select {
		padding: 1rem;
		border-radius: 12px;
		border: 1px solid rgba(255,255,255,0.2);
		background: rgba(255,255,255,0.1);
		color: white;
		outline: none;
	}

	.add-user-panel select option {
		color: black;
	}

	.checkbox-group-white {
		display: flex;
		gap: 2rem;
	}

	.checkbox-group-white label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}

	.btn-confirm-add {
		background: var(--color-accent);
		color: white;
		padding: 1rem 2.5rem;
		border-radius: 16px;
		border: none;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-confirm-add:hover {
		transform: translateY(-2px);
		box-shadow: 0 10px 30px rgba(0,0,0,0.2);
	}

	.btn-add {
		background: var(--color-ocean);
		color: white;
		padding: 0.6rem 1.5rem;
		border-radius: 16px;
		border: none;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 0.7rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-add:hover {
		filter: brightness(1.1);
	}

	.role-group {
		position: relative;
	}

	.role-header {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.role-icon-box {
		width: 56px;
		height: 56px;
		background: var(--role-color);
		color: white;
		border-radius: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8px 20px -5px var(--role-color);
	}

	.role-title-line {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-grow: 1;
	}

	.role-title-line h2 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-main);
	}

	.count-tag {
		background: rgba(0,0,0,0.05);
		padding: 0.2rem 0.8rem;
		border-radius: 20px;
		font-size: 0.9rem;
		font-weight: 600;
		opacity: 0.6;
	}

	.role-title-line .line {
		height: 1px;
		background: linear-gradient(90deg, rgba(0,0,0,0.1) 0%, transparent 100%);
		flex-grow: 1;
	}

	.users-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
		gap: 2rem;
		padding-left: 1.5rem;
		border-left: 2px solid rgba(0,0,0,0.03);
	}

	.user-card {
		background: var(--card-bg);
		border-radius: 28px;
		padding: 2rem;
		border: 1px solid var(--card-border);
		box-shadow: 0 10px 40px rgba(0,0,0,0.03);
		display: flex;
		flex-direction: column;
		gap: 2rem;
		transition: all 0.3s ease;
		position: relative;
	}

	.user-card:hover {
		transform: translateY(-5px);
		box-shadow: 0 20px 50px rgba(0,0,0,0.06);
		border-color: var(--role-color);
	}

	.user-card.is-self {
		background: rgba(0,0,0,0.01);
		border-style: dashed;
		opacity: 0.8;
	}

	.self-tag {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: var(--text-main);
		color: white;
		padding: 0.3rem 0.8rem;
		border-radius: 12px;
		font-size: 0.7rem;
		font-weight: 700;
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.user-main-info {
		display: flex;
		align-items: center;
		gap: 1.25rem;
	}

	.user-avatar {
		width: 48px;
		height: 48px;
		background: rgba(0,0,0,0.05);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-main);
	}

	.user-text h3 {
		margin: 0;
		font-size: 1.15rem;
		word-break: break-all;
	}

	.user-text code {
		font-size: 0.8rem;
		opacity: 0.5;
	}

	.setting-item {
		margin-bottom: 1.5rem;
	}

	.setting-item label {
		display: block;
		font-weight: 600;
		font-size: 0.9rem;
		margin-bottom: 0.6rem;
		opacity: 0.7;
	}

	.custom-select, .input-with-icon input {
		width: 100%;
		padding: 0.8rem 1rem;
		border-radius: 12px;
		border: 1px solid rgba(0,0,0,0.1);
		background: rgba(0,0,0,0.02);
		font-size: 1rem;
		outline: none;
		transition: border-color 0.2s;
	}

	.input-with-icon {
		position: relative;
		display: flex;
		align-items: center;
	}

	.input-with-icon :global(svg) {
		position: absolute;
		left: 1rem;
		opacity: 0.4;
	}

	.input-with-icon input {
		padding-left: 3rem;
	}

	.permissions-block {
		margin-top: 1.5rem;
	}

	.group-title {
		display: block;
		font-weight: 600;
		font-size: 0.9rem;
		margin-bottom: 1rem;
		opacity: 0.7;
		color: var(--text-main);
	}

	.checkbox-group {
		display: grid;
		gap: 0.8rem;
	}

	.custom-checkbox {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		cursor: pointer;
		font-size: 0.95rem;
	}

	.custom-checkbox input {
		width: 18px;
		height: 18px;
		accent-color: var(--role-color);
	}

	.btn-save {
		padding: 1rem;
		border-radius: 16px;
		border: none;
		background: var(--role-color);
		color: white;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.8rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-save:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.btn-save:not(:disabled):hover {
		filter: brightness(1.1);
		transform: translateY(-2px);
		box-shadow: 0 8px 20px -5px var(--role-color);
	}
	
	.btn-delete {
		width: 48px;
		height: 48px;
		border-radius: 16px;
		border: 1px solid rgba(239, 68, 68, 0.2);
		background: rgba(239, 68, 68, 0.05);
		color: #ef4444;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s;
	}
	
	.btn-delete:hover {
		background: #ef4444;
		color: white;
	}

	.btn-back {
		width: 48px;
		height: 48px;
		border-radius: 14px;
		border: 1px solid rgba(0,0,0,0.1);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-main);
		transition: all 0.2s;
	}

	.btn-back:hover {
		background: rgba(0,0,0,0.05);
	}

	.stats-badge {
		background: var(--text-main);
		color: white;
		padding: 0.6rem 1.2rem;
		border-radius: 16px;
		display: flex;
		align-items: center;
		gap: 0.8rem;
		font-weight: 600;
	}

	.empty-role {
		padding: 2rem;
		background: rgba(0,0,0,0.02);
		border-radius: 20px;
		border: 1px dashed rgba(0,0,0,0.1);
		text-align: center;
		color: rgba(0,0,0,0.4);
		margin-left: 1.5rem;
	}

	.loader {
		width: 48px;
		height: 48px;
		border: 4px solid var(--color-ocean);
		border-bottom-color: transparent;
		border-radius: 50%;
		animation: rotation 1s linear infinite;
	}

	.mini-loader {
		width: 18px;
		height: 18px;
		border: 2px solid white;
		border-bottom-color: transparent;
		border-radius: 50%;
		animation: rotation 1s linear infinite;
	}

	@keyframes rotation {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	@media (max-width: 900px) {
		.users-grid {
			grid-template-columns: 1fr;
		}
		
		.user-card {
			grid-template-columns: 1fr;
		}
	}
</style>
