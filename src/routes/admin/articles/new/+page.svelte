<script lang="ts">
	import { authService } from '$lib/states/auth.svelte';
	import { goto } from '$app/navigation';
	import { addArticle } from '$lib/services/articles';
	import { marked } from 'marked';

	let title = $state('');
	let category = $state<'news' | 'announcements'>('news');
	let lang = $state<'uk' | 'en'>('uk');
	let content = $state('');
	let author = $state('Адміністрація');
	let isPublished = $state(true);
	let loading = $state(false);

	$effect(() => {
		if (!authService.loading && !authService.isAuthenticated) {
			goto('/admin/login');
		}
	});

	async function handleSubmit() {
		loading = true;
		try {
			await addArticle({
				title,
				category,
				lang,
				content,
				author,
				isPublished
			});
			goto('/admin/articles');
		} catch (e) {
			console.error(e);
			alert('Помилка при збереженні');
		} finally {
			loading = false;
		}
	}
</script>

<section class="admin-article-new container" style="padding: 160px 24px;">
	<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
		<h1 style="font-family: var(--font-heading); color: var(--color-deep-ocean);">Нова публікація</h1>
		<a href="/admin/articles" class="btn btn-outline">Назад</a>
	</div>

	<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3rem;">
		<!-- Форма -->
		<form onsubmit={handleSubmit} style="display: flex; flex-direction: column; gap: 1.5rem; background: white; padding: 2rem; border-radius: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
			<div style="display: flex; flex-direction: column; gap: 0.5rem;">
				<label for="title">Заголовок</label>
				<input type="text" id="title" bind:value={title} required style="padding: 0.8rem; border-radius: 12px; border: 1px solid #ddd;" />
			</div>

			<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
				<div style="display: flex; flex-direction: column; gap: 0.5rem;">
					<label for="category">Категорія</label>
					<select id="category" bind:value={category} style="padding: 0.8rem; border-radius: 12px; border: 1px solid #ddd;">
						<option value="news">Новини</option>
						<option value="announcements">Оголошення</option>
					</select>
				</div>
				<div style="display: flex; flex-direction: column; gap: 0.5rem;">
					<label for="lang">Мова</label>
					<select id="lang" bind:value={lang} style="padding: 0.8rem; border-radius: 12px; border: 1px solid #ddd;">
						<option value="uk">Українська</option>
						<option value="en">English</option>
					</select>
				</div>
			</div>

			<div style="display: flex; flex-direction: column; gap: 0.5rem;">
				<label for="content">Текст (Markdown)</label>
				<textarea id="content" bind:value={content} required rows="15" style="padding: 1rem; border-radius: 12px; border: 1px solid #ddd; font-family: monospace;"></textarea>
			</div>

			<div style="display: flex; align-items: center; gap: 1rem;">
				<input type="checkbox" id="isPublished" bind:checked={isPublished} />
				<label for="isPublished">Опублікувати відразу</label>
			</div>

			<button type="submit" disabled={loading} class="btn btn-primary" style="width: 100%; border: none;">
				{loading ? 'Збереження...' : 'Зберегти'}
			</button>
		</form>

		<!-- Попередній перегляд -->
		<div style="background: white; padding: 2rem; border-radius: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); overflow-y: auto; max-height: 800px;">
			<h2 style="margin-bottom: 1rem; opacity: 0.5;">Попередній перегляд</h2>
			<hr style="margin-bottom: 2rem; opacity: 0.1;" />
			<div class="prose">
				<h1>{title || 'Заголовок...'}</h1>
				{@html marked(content || 'Текст з’явиться тут...')}
			</div>
		</div>
	</div>
</section>
