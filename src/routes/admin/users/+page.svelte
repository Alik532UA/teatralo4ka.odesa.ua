<script lang="ts">
	import { authService } from '$lib/states/auth.svelte';
	import { toast } from '$lib/states/toast.svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { collection, getDocs, doc, updateDoc, query, orderBy, setDoc, deleteDoc, where } from 'firebase/firestore';
	import { db } from '$lib/firebase/config';
	import { onMount } from 'svelte';
	import { t } from 'svelte-i18n';
	import { get } from 'svelte/store';
	import { Shield, School, Save, ChevronLeft, User as UserIcon, Users, GraduationCap, UserCog, UserCheck, UserPlus, X, Trash2, FolderKey, FileText, Key } from 'lucide-svelte';

	const DEFAULT_PROJECT_ID = import.meta.env.VITE_PROJECT_ID || 'teatralo4ka';

	const ROLES = [
		{ id: 'admin', label: 'admin.users.projectAdmins', icon: School, color: '#3b82f6' },
		{ id: 'moderator', label: 'admin.users.moderators', icon: UserCog, color: '#10b981' },
		{ id: 'assistant', label: 'admin.users.assistants', icon: GraduationCap, color: '#f59e0b' }
	];

	let users = $state<any[]>([]);
	let loading = $state(true);
	let savingId = $state<string | null>(null);

	let showAddForm = $state(false);
	let newUser = $state({
		email: '',
		role: 'assistant',
		projectId: DEFAULT_PROJECT_ID,
		permissions: {
			canCreate: true,
			canEdit: true,
			canDelete: false,
			canManageUsers: false
		}
	});

	const isSuperAdmin = $derived(authService.profile?.isSuperAdmin === true);
	const adminProjects = $derived(
		isSuperAdmin 
			? Object.keys(authService.profile?.projects || {}) 
			: (authService.profile?.projects?.[DEFAULT_PROJECT_ID]?.permissions?.canManageUsers 
				? [DEFAULT_PROJECT_ID] 
				: [])
	);

	const groupedUsers = $derived.by(() => {
		const groups = {
			superadmin: [] as any[],
			admin: [] as any[],
			moderator: [] as any[],
			assistant: [] as any[]
		};

		for (const user of users) {
			// If superadmin - show all. If not - only users in the current project
			if (isSuperAdmin || (user.projects && user.projects[DEFAULT_PROJECT_ID])) {
				if (user.isSuperAdmin) {
					groups.superadmin.push(user);
				} else {
					let highestRole = 'assistant';
					// For superadmin, use the overall highest role.
					// For project admin, use the role in the current project.
					if (isSuperAdmin) {
						for (const pData of Object.values(user.projects) as any[]) {
							if (pData.role === 'admin') {
								highestRole = 'admin';
								break;
							} else if (pData.role === 'moderator' && highestRole !== 'admin') {
								highestRole = 'moderator';
							}
						}
					} else {
						highestRole = user.projects[DEFAULT_PROJECT_ID]?.role || 'assistant';
					}
					groups[highestRole as keyof typeof groups].push(user);
				}
			}
		}
		return groups;
	});

	$effect(() => {
		if (!authService.loading && !isSuperAdmin && adminProjects.length === 0) {
			goto(`${base}/admin`);
		}
	});

	async function loadUsers() {
		loading = true;
		try {
			let q;
			if (isSuperAdmin) {
				console.log('loadUsers: Loading ALL users (SuperAdmin mode)');
				q = query(collection(db, 'users'), orderBy('email'));
			} else {
				console.log('loadUsers: Loading users for project:', DEFAULT_PROJECT_ID);
				q = query(collection(db, 'users'), where('projectIds', 'array-contains', DEFAULT_PROJECT_ID));
			}
			const snapshot = await getDocs(q);
			console.log('loadUsers: Fetched', snapshot.docs.length, 'users');
			users = snapshot.docs.map(d => {
				const data = d.data();

				// Ensure permissions exist to prevent undefined binding errors
				const safeProjects = { ...data.projects };
				for (const pid in safeProjects) {
					if (!safeProjects[pid].permissions) {
						safeProjects[pid].permissions = {
							canCreate: false,
							canEdit: false,
							canDelete: false,
							canManageUsers: false
						};
					}
				}

				return { 
					id: d.id, 
					email: data.email, 
					isSuperAdmin: data.isSuperAdmin,
					projects: safeProjects,
					projectIds: data.projectIds || Object.keys(safeProjects), // Fallback if missing
					originalProjectsJson: JSON.stringify(safeProjects)
				};
			});
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	}

	onMount(loadUsers);

	function canManageProject(projectId: string, targetRole: string) {
		if (isSuperAdmin) return true;

		// Strict scope: only the current project
		if (projectId !== DEFAULT_PROJECT_ID) return false;

		// Check permissions in the current project
		const myData = authService.profile?.projects?.[DEFAULT_PROJECT_ID];
		if (!myData?.permissions?.canManageUsers) return false;

		const myRole = myData.role;

		// Superadmin cannot be managed by project admins
		if (targetRole === 'superadmin') return false;

		// Admin can manage moderators and assistants
		if (myRole === 'admin' && (targetRole === 'moderator' || targetRole === 'assistant')) return true;

		// Moderator can manage ONLY assistants
		if (myRole === 'moderator' && targetRole === 'assistant') return true;

		// Assistant cannot manage anyone (even if they have canManageUsers=true, it only grants visibility)
		return false;
	}
	async function handleAddSubmit() {
		const email = newUser.email.toLowerCase().trim();
		if (!email.includes('@')) {
			toast.error('Введіть коректний Email');
			return;
		}

		if (!canManageProject(newUser.projectId, newUser.role)) {
			toast.error('У вас немає прав надавати цей рівень доступу у цьому проєкті.');
			return;
		}

		const existingUser = users.find(u => u.email.toLowerCase() === email);
		savingId = 'new';
		
		try {
			if (!existingUser) {
				const newDocRef = doc(db, 'users', email);
				await setDoc(newDocRef, {
					email: email,
					isSuperAdmin: false,
					projects: {
						[newUser.projectId]: {
							role: newUser.role,
							permissions: newUser.permissions
						}
					},
					projectIds: [newUser.projectId],
					lastModifiedProject: newUser.projectId,
					createdAt: new Date().toISOString()
				});
			} else {
				const userRef = doc(db, 'users', existingUser.id);
				const updatedProjects = { ...existingUser.projects, [newUser.projectId]: { role: newUser.role, permissions: newUser.permissions } };
				await updateDoc(userRef, {
					projects: updatedProjects,
					projectIds: Object.keys(updatedProjects),
					lastModifiedProject: newUser.projectId
				});
			}
			
			toast.success(get(t)('admin.dashboard.saveSuccess') || 'Користувача / Доступ успішно додано.');
			showAddForm = false;
			newUser.email = '';
			await loadUsers();
		} catch (e) {
			console.error(e);
			toast.error('Помилка: ' + (e as Error).message);
		} finally {
			savingId = null;
		}
	}

	async function updateProjectAccess(user: any, projectId: string) {
		if (isSelf(user.id)) {
			toast.error('Ви не можете змінити власні права.');
			return;
		}
		const pData = user.projects[projectId];
		if (!canManageProject(projectId, pData.role)) {
			toast.error('У вас немає прав для зміни цього доступу.');
			return;
		}

		savingId = `${user.id}-${projectId}`;
		try {
			const userRef = doc(db, 'users', user.id);
			const updatedProjects = { ...user.projects };
			// Ensure we are assigning the reference directly to avoid dot-notation path parsing by Firestore
			updatedProjects[projectId] = pData;
			
			await updateDoc(userRef, {
				projects: updatedProjects,
				projectIds: Object.keys(updatedProjects),
				lastModifiedProject: projectId
			});
			toast.success(get(t)('admin.dashboard.saveSuccess') || 'Права успішно оновлено');
			user.originalProjectsJson = JSON.stringify(user.projects);
		} catch (e) {
			console.error(e);
			toast.error('Помилка при оновленні: ' + (e as Error).message);
		} finally {
			savingId = null;
		}
	}

	async function removeProjectAccess(user: any, projectId: string) {
		if (isSelf(user.id)) return;
		if (!canManageProject(projectId, user.projects[projectId].role)) {
			toast.error('У вас немає прав для видалення цього доступу.');
			return;
		}
		if (!(await toast.confirm(`Видалити доступ до проєкту ${projectId}?`))) return;

		savingId = `${user.id}-${projectId}`;
		try {
			const userRef = doc(db, 'users', user.id);
			const updatedProjects = { ...user.projects };
			delete updatedProjects[projectId];
			await updateDoc(userRef, { 
				projects: updatedProjects,
				projectIds: Object.keys(updatedProjects)
			});
			toast.success('Доступ видалено');
			await loadUsers();
		} catch (e) {
			console.error(e);
			toast.error('Помилка при видаленні');
		} finally {
			savingId = null;
		}
	}

	// Delete Modal State
	let deleteConfirmModal = $state<{ open: boolean, user: any | null }>({ open: false, user: null });
	let deleteConfirmInput = $state('');

	async function deleteFullUser(user: any) {
		if (isSelf(user.id)) return;

		const canDelete = isSuperAdmin || (user.projects[DEFAULT_PROJECT_ID] && canManageProject(DEFAULT_PROJECT_ID, user.projects[DEFAULT_PROJECT_ID].role));

		if (!canDelete) {
			toast.error('У вас немає прав для видалення цього користувача.');
			return;
		}

		deleteConfirmModal = { open: true, user };
		deleteConfirmInput = '';
	}

	async function handleModalDelete() {
		if (deleteConfirmInput.toLowerCase() !== 'delete' || !deleteConfirmModal.user) return;

		const user = deleteConfirmModal.user;
		savingId = user.id;
		deleteConfirmModal = { open: false, user: null };

		try {
			await deleteDoc(doc(db, 'users', user.id));
			toast.success('Акаунт успішно видалено');
			await loadUsers();
		} catch (e) {
			console.error(e);
			toast.error('Помилка при видаленні');
		} finally {
			savingId = null;
		}
	}

	function isSelf(userId: string) {
		const currentUser = authService.user;
		if (!currentUser) return false;
		return userId === currentUser.uid || userId.toLowerCase() === currentUser.email?.toLowerCase();
	}
</script>

<section class="admin-users container" style="padding: 120px 24px; max-width: 1400px; margin: 0 auto;">
	<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
		<div style="display: flex; align-items: center; gap: 1.5rem;">
			<a href="{base}/admin" class="btn-back" title="Назад">
				<ChevronLeft size={24} />
			</a>
			<div>
				<h1 style="margin: 0; font-size: 2.5rem; font-family: var(--font-heading); color: var(--color-deep-ocean);">{$t('admin.users.title')}</h1>
				<p style="margin: 0.5rem 0 0; opacity: 0.6; font-size: 1.1rem;">{$t('admin.users.subtitle')}</p>
			</div>
		</div>
		
		<div style="display: flex; gap: 1rem;">
			<button class="btn-add" onclick={() => showAddForm = !showAddForm}>
				{#if showAddForm}
					<X size={20} /> {$t('admin.users.cancel')}
				{:else}
					<UserPlus size={20} /> {$t('admin.users.grantAccess')}
				{/if}
			</button>
			<div class="stats-badge">
				<Users size={20} />
				<span>{$t('admin.users.total')}: {users.length}</span>
			</div>
		</div>
	</div>

	{#if loading}
		<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; gap: 1.5rem;">
			<div class="loader"></div>
			<p style="font-size: 1.1rem; opacity: 0.7;">{$t('admin.dashboard.loading')}</p>
		</div>
	{:else}
		<div class="users-hierarchy">
			{#if groupedUsers.superadmin.length > 0}
				<div class="role-section">
					<h2 class="role-title">
						<Shield size={32} color="#ef4444" />
						{$t('admin.users.superadmins')}
					</h2>
					<div class="users-grid">
						{#each groupedUsers.superadmin as user}
							{@render userCard(user)}
						{/each}
					</div>
				</div>
			{/if}

			{#if groupedUsers.admin.length > 0}
				<div class="role-section">
					<h2 class="role-title">
						<School size={32} color="#3b82f6" />
						{$t('admin.users.projectAdmins')}
					</h2>
					<div class="users-grid">
						{#each groupedUsers.admin as user}
							{@render userCard(user)}
						{/each}
					</div>
				</div>
			{/if}

			{#if groupedUsers.moderator.length > 0}
				<div class="role-section">
					<h2 class="role-title">
						<UserCog size={32} color="#10b981" />
						{$t('admin.users.moderators')}
					</h2>
					<div class="users-grid">
						{#each groupedUsers.moderator as user}
							{@render userCard(user)}
						{/each}
					</div>
				</div>
			{/if}

			{#if groupedUsers.assistant.length > 0}
				<div class="role-section">
					<h2 class="role-title">
						<GraduationCap size={32} color="#f59e0b" />
						{$t('admin.users.assistants')}
					</h2>
					<div class="users-grid">
						{#each groupedUsers.assistant as user}
							{@render userCard(user)}
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}

	{#if deleteConfirmModal.open}
		<div class="modal-overlay" onclick={() => deleteConfirmModal = { open: false, user: null }}>
			<div class="delete-modal" onclick={(e) => e.stopPropagation()}>
				<div class="modal-header">
					<Trash2 size={32} />
					<span>{$t('admin.users.confirmDeleteTitle') || 'Підтвердження видалення'}</span>
				</div>
				<p style="font-size: 1.1rem; line-height: 1.6;">
					{$t('admin.users.confirmDeleteText') || 'Ви впевнені, що хочете видалити акаунт'} 
					<strong>{deleteConfirmModal.user?.email}</strong>? 
					{$t('admin.users.confirmDeleteWarning') || 'Ця дія незворотна.'}
				</p>
				<div style="display: flex; flex-direction: column; gap: 0.5rem;">
					<label for="delete-confirm" style="font-size: 0.9rem; opacity: 0.7;">
						{$t('admin.users.typeDelete') || 'Введіть "delete" для підтвердження:'}
					</label>
					<input 
						type="text" 
						id="delete-confirm" 
						class="delete-input" 
						bind:value={deleteConfirmInput} 
						placeholder="delete" 
						autocomplete="off"
					/>
				</div>
				<div class="modal-footer">
					<button class="btn-cancel-modal" onclick={() => deleteConfirmModal = { open: false, user: null }}>
						{$t('admin.users.cancel')}
					</button>
					<button 
						class="btn-confirm-delete {deleteConfirmInput.toLowerCase() === 'delete' ? 'is-ready' : ''}" 
						disabled={deleteConfirmInput.toLowerCase() !== 'delete'}
						onclick={handleModalDelete}
					>
						{$t('admin.users.deleteBtn') || 'Видалити'}
					</button>
				</div>
			</div>
		</div>
	{/if}
</section>

<!-- ===================== User Card (Modern Switches) ===================== -->
{#snippet userCard(user: any)}
	{@const hasChanges = JSON.stringify(user.projects) !== user.originalProjectsJson}
	<div class="user-card v3-modern {isSelf(user.id) ? 'is-self' : ''} {hasChanges ? 'has-changes' : ''}" data-testid="admin-users-row-{user.id}">
		{#if isSelf(user.id)}<div class="self-tag"><UserCheck size={14} /> {$t('admin.users.itsYou')}</div>{/if}
		<div class="v3-header">
			<div class="user-avatar" style={user.isSuperAdmin ? 'background: #ef4444; color: white;' : ''}>
				{#if user.isSuperAdmin}<Shield size={24} />{:else}<UserIcon size={24} />{/if}
			</div>
			<div class="v3-user-info">
				<h3>{user.email}</h3>
				<code>ID: {user.id}</code>
			</div>
			<div style="display: flex; gap: 1rem; align-items: center;">
				{#if hasChanges}
					<span class="unsaved-badge">{$t('admin.users.unsavedChanges')}</span>
				{/if}
				{#if !isSelf(user.id) && user.projects[DEFAULT_PROJECT_ID] && canManageProject(DEFAULT_PROJECT_ID, user.projects[DEFAULT_PROJECT_ID].role)}
					<button 
						onclick={() => updateProjectAccess(user, DEFAULT_PROJECT_ID)} 
						disabled={savingId === `${user.id}-${DEFAULT_PROJECT_ID}` || !hasChanges}
						class="btn-save-small v3-header-save {hasChanges ? 'is-active' : ''}"
					>
						{#if savingId === `${user.id}-${DEFAULT_PROJECT_ID}`}...{:else}<Save size={18} /> {$t('admin.users.save')}{/if}
					</button>
				{/if}
				{#if !isSelf(user.id) && (isSuperAdmin || (user.projects[DEFAULT_PROJECT_ID] && canManageProject(DEFAULT_PROJECT_ID, user.projects[DEFAULT_PROJECT_ID].role)))}
					<button class="btn-delete-full" onclick={() => deleteFullUser(user)} title="Видалити акаунт">
						<Trash2 size={18} />
					</button>
				{/if}
			</div>
		</div>

		<div class="v3-projects">
			{#if Object.keys(user.projects).length === 0}
				<div class="v3-empty">{$t('admin.users.noProjects')}</div>
			{/if}
			{#each Object.entries(user.projects) as [projectId, pDataRaw]}
				{@const pData = pDataRaw as any}
				<div class="v3-project-row">
					<div class="v3-left">
						<div class="v3-project-title">
							<strong>{projectId}</strong>
							{#if !isSelf(user.id) && canManageProject(projectId, pData.role)}
								<button class="btn-icon" onclick={() => removeProjectAccess(user, projectId)}><X size={14} /></button>
							{/if}
						</div>
						<select bind:value={pData.role} disabled={isSelf(user.id) || !canManageProject(projectId, pData.role)} class="form-select v3-select">
							{#each ROLES as r}<option value={r.id} disabled={!isSuperAdmin && r.id === 'admin'}>{$t(r.label)}</option>{/each}
						</select>
					</div>
					<div class="v3-right">
						<div class="v3-switch-group">
							<span class="v3-group-label">{$t('admin.users.permsContent')}</span>
							<label class="switch-label">
								<input type="checkbox" class="switch-input" bind:checked={pData.permissions.canCreate} disabled={isSelf(user.id) || !canManageProject(projectId, pData.role)} />
								<span class="switch-slider"></span>
								<span class="switch-text">{$t('admin.users.create')}</span>
							</label>
							<label class="switch-label">
								<input type="checkbox" class="switch-input" bind:checked={pData.permissions.canEdit} disabled={isSelf(user.id) || !canManageProject(projectId, pData.role)} />
								<span class="switch-slider"></span>
								<span class="switch-text">{$t('admin.users.edit')}</span>
							</label>
							<label class="switch-label">
								<input type="checkbox" class="switch-input" bind:checked={pData.permissions.canDelete} disabled={isSelf(user.id) || !canManageProject(projectId, pData.role)} />
								<span class="switch-slider"></span>
								<span class="switch-text">{$t('admin.users.delete')}</span>
							</label>
						</div>
						<div class="v3-switch-group">
							<span class="v3-group-label">{$t('admin.users.permsAdmin')}</span>
							<label class="switch-label">
								<input type="checkbox" class="switch-input" bind:checked={pData.permissions.canManageUsers} disabled={isSelf(user.id) || !canManageProject(projectId, pData.role)} />
								<span class="switch-slider"></span>
								<span class="switch-text">{$t('admin.users.manageUsers')}</span>
							</label>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
{/snippet}

<style>
	:global(:root) {
		--card-bg: var(--theme-dynamic-card-bg, #ffffff);
		--card-border: rgba(0,0,0,0.05);
		--text-main: var(--color-deep-ocean, #1a2a3a);
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
	.add-user-panel select option { color: black; }

	.perms-split {
		display: flex; gap: 3rem;
	}

	.perms-group {
		display: flex; gap: 1rem; align-items: center;
	}

	.perms-label {
		opacity: 0.6; font-size: 0.8rem; text-transform: uppercase; font-weight: 700;
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
	.btn-confirm-add:disabled { opacity:0.5; }

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
	}

	.users-hierarchy {
		display: flex;
		flex-direction: column;
		gap: 4rem;
	}

	.role-section {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.role-title {
		display: flex;
		align-items: center;
		gap: 1rem;
		font-family: var(--font-heading);
		font-size: 2.2rem;
		color: var(--color-deep-ocean);
		margin: 0;
		padding-bottom: 1rem;
		border-bottom: 2px solid rgba(0,0,0,0.05);
	}

	.users-grid {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.user-card {
		background: var(--card-bg);
		border-radius: 28px;
		padding: 0;
		border: 1px solid var(--card-border);
		box-shadow: 0 10px 40px rgba(0,0,0,0.03);
		display: flex;
		flex-direction: column;
		position: relative;
		overflow: hidden;
		transition: all 0.3s ease;
	}
	.user-card.is-self { background: rgba(0,0,0,0.01); border-style: dashed; }
	.user-card.has-changes { border: 2px solid #f97316 !important; box-shadow: 0 10px 40px rgba(249, 115, 22, 0.15); }
	
	.self-tag {
		position: absolute; top: 1rem; right: 4rem;
		background: var(--text-main); color: white; padding: 0.3rem 0.8rem;
		border-radius: 12px; font-size: 0.7rem; font-weight: 700;
		display: flex; align-items: center; gap: 0.4rem;
		z-index: 10;
	}
	.user-avatar {
		width: 48px; height: 48px; background: rgba(0,0,0,0.05); border-radius: 50%;
		display: flex; align-items: center; justify-content: center; color: var(--text-main);
	}

	/* V3 Modern Switches Layout Styles */
	.v3-header { background: rgba(0,0,0,0.02); padding: 1.5rem 2rem; border-bottom: 1px solid rgba(0,0,0,0.05); display: flex; align-items: center; gap: 1.5rem; }
	.v3-user-info { flex: 1; }
	.v3-user-info h3 { margin: 0; font-size: 1.2rem; word-break: break-all; }
	.v3-user-info code { opacity: 0.5; font-size: 0.85rem; }
	.v3-projects { display: flex; flex-direction: column; }
	.v3-project-row { display: flex; border-bottom: 1px solid rgba(0,0,0,0.03); padding: 1.5rem 2rem; gap: 3rem; }
	.v3-project-row:last-child { border-bottom: none; }
	.v3-empty { padding: 2rem; opacity: 0.5; text-align: center; }
	.v3-left { width: 250px; display: flex; flex-direction: column; gap: 1rem; }
	.v3-project-title { display: flex; justify-content: space-between; align-items: center; font-size: 1.1rem; }
	.v3-select { padding: 0.6rem; border-radius: 10px; border: 1px solid rgba(0,0,0,0.1); outline: none; }
	.v3-save { padding: 0.8rem; border-radius: 12px; }
	.v3-right { flex: 1; display: flex; gap: 3rem; }
	.v3-switch-group { display: flex; flex-direction: column; gap: 1rem; flex: 1; }
	.v3-group-label { font-size: 0.8rem; text-transform: uppercase; opacity: 0.6; font-weight: 700; }
	
	.unsaved-badge {
		color: #f97316;
		font-size: 0.85rem;
		font-weight: 600;
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0% { opacity: 0.6; }
		50% { opacity: 1; }
		100% { opacity: 0.6; }
	}

	/* Common UI Elements */
	.btn-save-small { 
		background: #e2e8f0; 
		color: #94a3b8; 
		border: none; 
		padding: 0.5rem 1rem; 
		border-radius: 8px; 
		cursor: not-allowed; 
		font-weight: 600; 
		font-size: 0.9rem; 
		display: flex; 
		align-items: center; 
		gap: 0.5rem; 
		transition: all 0.2s; 
		opacity: 0.7; 
	}
	.btn-save-small.is-active { 
		background: #10b981 !important; 
		color: white;
		opacity: 1; 
		cursor: pointer; 
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); 
	}
	.btn-save-small.is-active:hover { transform: translateY(-1px); box-shadow: 0 6px 15px rgba(16, 185, 129, 0.3); }

	.btn-icon { background: none; border: none; color: #ef4444; cursor: pointer; padding: 0.2rem; border-radius: 4px; display: flex; align-items: center; justify-content: center; }
	.btn-icon:hover { background: rgba(239,68,68,0.1); }
	.btn-delete-full { background: rgba(239,68,68,0.1); color: #ef4444; border: none; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
	.btn-delete-full:hover { background: #ef4444; color: white; }
	.btn-back { width: 48px; height: 48px; border-radius: 14px; border: 1px solid rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; color: var(--text-main); transition: all 0.2s; }
	.btn-back:hover { background: rgba(0,0,0,0.05); }
	.stats-badge { background: var(--text-main); color: white; padding: 0.6rem 1.2rem; border-radius: 16px; display: flex; align-items: center; gap: 0.8rem; font-weight: 600; }
	.loader { width: 48px; height: 48px; border: 4px solid var(--color-ocean); border-bottom-color: transparent; border-radius: 50%; animation: rotation 1s linear infinite; }
	@keyframes rotation { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

	/* Modal Delete Confirmation */
	.modal-overlay {
		position: fixed; top: 0; left: 0; width: 100%; height: 100%;
		background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
		display: flex; align-items: center; justify-content: center;
		z-index: 1000; padding: 20px;
	}
	.delete-modal {
		background: var(--card-bg); border-radius: 24px; padding: 2.5rem;
		max-width: 500px; width: 100%; box-shadow: 0 30px 60px rgba(0,0,0,0.4);
		display: flex; flex-direction: column; gap: 1.5rem;
		color: var(--text-main);
	}
	.modal-header { display: flex; align-items: center; gap: 1rem; color: #ef4444; font-size: 1.5rem; font-family: var(--font-heading); }
	.delete-input {
		padding: 1rem; border-radius: 12px; border: 2px solid var(--card-border);
		background: transparent; color: var(--text-main);
		outline: none; transition: all 0.2s; font-size: 1.1rem; text-align: center;
	}
	.delete-input:focus { border-color: #ef4444; }
	.modal-footer { display: flex; gap: 1rem; margin-top: 1rem; }
	.btn-cancel-modal { flex: 1; padding: 1rem; border-radius: 14px; border: 1px solid var(--card-border); background: var(--card-bg); color: var(--text-main); cursor: pointer; font-weight: 600; }
	.btn-confirm-delete {
		flex: 1; padding: 1rem; border-radius: 14px; border: none;
		background: rgba(160, 174, 192, 0.2); color: #a0aec0; cursor: not-allowed;
		font-weight: 700; transition: all 0.2s;
	}
	.btn-confirm-delete.is-ready { background: #ef4444; color: white; cursor: pointer; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3); }

	@media (max-width: 900px) {
		.v3-project-row { flex-direction: column; gap: 1.5rem; }
		.v3-left { width: 100%; }
		.v3-right { flex-direction: column; gap: 1.5rem; }
		.perms-split { flex-direction: column; gap: 1.5rem; }
		.add-user-panel { padding: 1.5rem; }
		.add-user-panel > div { grid-template-columns: 1fr !important; }
	}
</style>