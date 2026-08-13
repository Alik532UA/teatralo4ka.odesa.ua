<script lang="ts">
	import { renderContent } from '$lib/utils/renderContent';
	import { t } from 'svelte-i18n';
	import { Eye, EyeOff, Globe, LayoutPanelTop } from 'lucide-svelte';
	import type { ContentFormat } from '$lib/services/articles';

	/**
	 * Попередній перегляд статті.
	 *
	 * Винесено з `ArticleForm` першим саме тому, що тут НЕМАЄ двостороннього
	 * звʼязування: картка лише показує. Усі значення приходять пропами, назад
	 * нічого не повертається, тож і зламати тут нема чого.
	 */
	interface Props {
		title: string;
		content: string;
		contentFormat: ContentFormat;
		externalUrl: string;
		useExternalUrl: boolean;
		isPublished: boolean;
		/** Мова, яку зараз редагують — показується поруч зі статусом. */
		lang: 'uk' | 'en';
		/** Префікс data-testid форми. */
		testPrefix: string;
	}

	let {
		title,
		content,
		contentFormat,
		externalUrl,
		useExternalUrl,
		isPublished,
		lang,
		testPrefix
	}: Props = $props();
</script>

<div
	class="admin-card"
	style="padding: 2.5rem; border-radius: 32px; background: var(--bg-card); box-shadow: 0 10px 40px rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.05);"
	data-testid="{testPrefix}-preview-card"
>
	<div
		style="display: flex; align-items: center; gap: 0.75rem; color: var(--text-title); margin-bottom: 2rem; border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 1rem;"
	>
		<LayoutPanelTop size={22} />
		<h2 style="margin: 0; font-size: 1.5rem;">{$t('admin.editor.preview')}</h2>
		<div
			style="margin-left: auto; display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; font-weight: 700; color: {isPublished
				? '#22c55e'
				: '#94a3b8'}"
		>
			{#if isPublished}
				<Eye size={18} /> {$t('admin.editor.published')} ({lang})
			{:else}
				<EyeOff size={18} /> {$t('admin.editor.draft')} ({lang})
			{/if}
		</div>
	</div>
	<div
		class="preview-container"
		style="background: var(--bg-surface); padding: 3rem; border-radius: 24px; border: 1px solid rgba(0,0,0,0.05);"
	>
		<article class="prose" style="max-width: 1000px; margin: 0 auto;">
			<h1 style="font-size: 3rem; margin-top: 0;">{title || $t('admin.editor.titlePlaceholder')}</h1>
			{#if useExternalUrl}
				<p style="display: flex; align-items: center; gap: 0.5rem; color: var(--accent-primary); font-weight: 600;">
					<Globe size={18} />
					{$t('admin.editor.externalUrlPreview')}:
					<!-- Зовнішня адреса, яку ввів редактор. -->
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
					<a href={externalUrl} target="_blank" rel="noopener noreferrer" style="word-break: break-all;">{externalUrl}</a>
				</p>
			{:else}
				<!-- Виняток за SECURITY-v8 § 5.3: попередній перегляд того, що редактор
				     щойно набрав. Санітизація через renderContent тут потрібна не менше,
				     ніж на публічній сторінці — інакше попередній перегляд виконував би
				     скрипт у сесії адміністратора. -->
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html renderContent(content || $t('admin.editor.previewEmpty'), contentFormat)}
			{/if}
		</article>
	</div>
</div>

<style>
	/* Стилі .prose і .preview-container лишилися глобальними в ArticleForm:
	   вони описують вигляд вмісту, який приходить із renderContent, і
	   переносити їх сюди означало б дублювати правила для тих самих тегів. */
</style>
