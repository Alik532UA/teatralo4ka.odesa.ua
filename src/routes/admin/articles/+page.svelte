<script lang="ts">
	import { authService } from '$lib/states/auth.svelte';
	import { goto } from '$app/navigation';
	import { getArticles, deleteArticle, type Article } from '$lib/services/articles';
	import { locale } from 'svelte-i18n';

	let articles = $state<Article[]>([]);
	let loading = $state(true);

	async function loadAll() {
		loading = true;
		const uk = await getArticles(undefined, 'uk');
		const en = await getArticles(undefined, 'en');
		articles = [...uk, ...en].sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
		loading = false;
	}

	$effect(() => {
		if (!authService.loading && !authService.isAuthenticated) {
			goto('/admin/login');
		} else {
			loadAll();
		}
	});

	async function handleDelete(id: string | undefined) {
		if (!id || !confirm('Ви впевнені, що хочете видалити цю статтю?')) return;
		try {
			await deleteArticle(id);
			articles = articles.filter(a => a.id !== id);
		} catch (e) {
			console.error(e);
			alert('Помилка при видаленні');
		}
	}

	function formatDate(timestamp: any) {
		if (!timestamp) return '-';
		return timestamp.toDate().toLocaleDateString('uk-UA');
	}
</script>

<section class="admin-articles container" style="padding: 160px 24px;">
	<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
		<h1 style="font-family: var(--font-heading); color: var(--color-deep-ocean);">Управління контентом</h1>
		<div style="display: flex; gap: 1rem;">
			<a href="/admin" class="btn btn-outline">Панель</a>
			<a href="/admin/articles/new" class="btn btn-primary">+ Створити</a>
		</div>
	</div>

	<div style="background: white; border-radius: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); overflow: hidden;">
		{#if loading}
			<p style="padding: 3rem; text-align: center;">Завантаження...</p>
		{:else if articles.length === 0}
			<p style="padding: 3rem; text-align: center; opacity: 0.5;">Статей поки немає.</p>
		{:else}
			<table style="width: 100%; border-collapse: collapse; text-align: left;">
				<thead>
					<tr style="background: #f8f9fa; border-bottom: 1px solid #eee;">
						<th style="padding: 1.5rem;">Заголовок</th>
						<th style="padding: 1.5rem;">Мова</th>
						<th style="padding: 1.5rem;">Категорія</th>
						<th style="padding: 1.5rem;">Дата</th>
						<th style="padding: 1.5rem;">Статус</th>
						<th style="padding: 1.5rem; text-align: right;">Дії</th>
					</tr>
				</thead>
				<tbody>
					{#each articles as article}
						<tr style="border-bottom: 1px solid #f5f5f5;">
							<td style="padding: 1.5rem; font-weight: 600;">{article.title}</td>
							<td style="padding: 1.5rem;"><span style="text-transform: uppercase; font-size: 0.8rem; background: #eee; padding: 0.2rem 0.5rem; border-radius: 4px;">{article.lang}</span></td>
							<td style="padding: 1.5rem;">{article.category === 'news' ? 'Новина' : 'Оголошення'}</td>
							<td style="padding: 1.5rem;">{formatDate(article.createdAt)}</td>
							<td style="padding: 1.5rem;">
								{#if article.isPublished}
									<span style="color: green;">● Опубліковано</span>
								{:else}
									<span style="color: orange;">● Чернетка</span>
								{/if}
							</td>
							<td style="padding: 1.5rem; text-align: right;">
								<div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
									<a href="/admin/articles/{article.id}" class="btn btn-outline" style="padding: 0.4rem 0.8rem; font-size: 0.9rem;">Редагувати</a>
									<button onclick={() => handleDelete(article.id)} class="btn" style="padding: 0.4rem 0.8rem; font-size: 0.9rem; color: red; border: 1px solid red; background: none; border-radius: 12px; cursor: pointer;">Видалити</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</section>
