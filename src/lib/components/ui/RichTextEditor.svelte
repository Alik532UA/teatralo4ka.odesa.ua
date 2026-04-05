<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Underline from '@tiptap/extension-underline';
	import Link from '@tiptap/extension-link';
	import Placeholder from '@tiptap/extension-placeholder';
	import { Markdown } from 'tiptap-markdown';

	interface Props {
		value: string;
		placeholder?: string;
		onchange: (val: string) => void;
	}

	let { value = $bindable(), placeholder = 'Почніть писати...', onchange }: Props = $props();

	let element: HTMLElement;
	let editor: Editor | null = $state(null);

	onMount(() => {
		editor = new Editor({
			element: element,
			extensions: [
				StarterKit,
				Underline,
				Link.configure({
					openOnClick: false,
					HTMLAttributes: {
						class: 'prose-link',
					},
				}),
				Placeholder.configure({
					placeholder: placeholder,
				}),
				Markdown, // Дозволяє працювати з Markdown на вхід та вихід
			],
			content: value,
			onUpdate: ({ editor }) => {
				// Отримуємо чистий Markdown при кожній зміні
				const markdown = (editor.storage as any).markdown.getMarkdown();
				value = markdown;
				if (onchange) onchange(markdown);
			},
		});
	});

	// Реактивність: оновлення контенту редактора при зміні value ззовні (наприклад, зміна мови)
	$effect(() => {
		if (editor && value !== (editor.storage as any).markdown.getMarkdown()) {
			editor.commands.setContent(value || '', { emitUpdate: false });
		}
	});

	onDestroy(() => {
		if (editor) {
			editor.destroy();
		}
	});

	function toggleLink() {
		if (!editor) return;
		if (editor.isActive('link')) {
			editor.chain().focus().unsetLink().run();
			return;
		}
		const url = window.prompt('Введіть URL посилання:');
		if (url) {
			editor.chain().focus().setLink({ href: url }).run();
		}
	}
</script>

<div class="rich-editor" data-testid="rich-editor-container">
   {#if editor}
	   <div class="toolbar" data-testid="rich-editor-toolbar">
		   <button 
			   type="button"
			   class="tool-btn" 
			   class:active={editor.isActive('bold')} 
			   onclick={() => editor?.chain().focus().toggleBold().run()}
			   title="Жирний"
			   data-testid="rich-btn-bold"
		   ><b>B</b></button>
           
		   <button 
			   type="button"
			   class="tool-btn" 
			   class:active={editor.isActive('italic')} 
			   onclick={() => editor?.chain().focus().toggleItalic().run()}
			   title="Курсив"
			   data-testid="rich-btn-italic"
		   ><i>I</i></button>
           
		   <button 
			   type="button"
			   class="tool-btn" 
			   class:active={editor.isActive('underline')} 
			   onclick={() => editor?.chain().focus().toggleUnderline().run()}
			   title="Підкреслений"
			   data-testid="rich-btn-underline"
		   ><u>U</u></button>

		   <button 
			   type="button"
			   class="tool-btn" 
			   class:active={editor.isActive('strike')} 
			   onclick={() => editor?.chain().focus().toggleStrike().run()}
			   title="Закреслений"
			   data-testid="rich-btn-strike"
		   ><s>S</s></button>

		   <div class="separator"></div>

		   <button 
			   type="button"
			   class="tool-btn" 
			   class:active={editor.isActive('heading', { level: 1 })} 
			   onclick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
			   data-testid="rich-btn-h1"
		   >H1</button>
           
		   <button 
			   type="button"
			   class="tool-btn" 
			   class:active={editor.isActive('heading', { level: 2 })} 
			   onclick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
			   data-testid="rich-btn-h2"
		   >H2</button>

		   <div class="separator"></div>

		   <button 
			   type="button"
			   class="tool-btn" 
			   class:active={editor.isActive('bulletList')} 
			   onclick={() => editor?.chain().focus().toggleBulletList().run()}
			   title="Список"
			   data-testid="rich-btn-bullet"
		   >• Список</button>
           
		   <button 
			   type="button"
			   class="tool-btn" 
			   class:active={editor.isActive('orderedList')} 
			   onclick={() => editor?.chain().focus().toggleOrderedList().run()}
			   title="Нумерований список"
			   data-testid="rich-btn-ordered"
		   >1. Список</button>

		   <div class="separator"></div>

		   <button 
			   type="button"
			   class="tool-btn" 
			   class:active={editor.isActive('link')} 
			   onclick={toggleLink}
			   title="Посилання"
			   data-testid="rich-btn-link"
		   >🔗</button>
           
		   <button 
			   type="button"
			   class="tool-btn" 
			   onclick={() => editor?.chain().focus().toggleBlockquote().run()}
			   class:active={editor.isActive('blockquote')}
			   title="Цитата"
			   data-testid="rich-btn-quote"
		   >❝</button>

		   <button 
			   type="button"
			   class="tool-btn" 
			   onclick={() => editor?.chain().focus().undo().run()}
			   title="Відмінити"
			   data-testid="rich-btn-undo"
		   >↶</button>
           
		   <button 
			   type="button"
			   class="tool-btn" 
			   onclick={() => editor?.chain().focus().redo().run()}
			   title="Повторити"
			   data-testid="rich-btn-redo"
		   >↷</button>
	   </div>
   {/if}

   <div bind:this={element} class="editor-content" data-testid="rich-editor-content"></div>
</div>

<style>
	.rich-editor {
		border: 1px solid var(--color-border);
		border-radius: 20px;
		background: var(--theme-dynamic-card-bg);
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.toolbar {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		padding: 0.75rem;
		background: var(--theme-dynamic-section-bg);
		border-bottom: 1px solid var(--color-border);
	}

	.tool-btn {
		min-width: 32px;
		height: 32px;
		padding: 0 0.5rem;
		border: 1px solid transparent;
		background: transparent;
		color: var(--color-deep-ocean);
		border-radius: 8px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: inherit;
		font-weight: 600;
		transition: all 0.2s;
	}

	.tool-btn:hover {
		background: var(--color-border);
		opacity: 0.8;
	}

	.tool-btn.active {
		background: var(--color-deep-ocean);
		color: white;
	}

	.separator {
		width: 1px;
		height: 24px;
		background: var(--color-border);
		margin: 4px 0.25rem;
	}

	.editor-content {
		padding: 1.5rem;
		min-height: 300px;
		max-height: 600px;
		overflow-y: auto;
	}

	/* Стилі для самого TipTap контенту */
	:global(.tiptap) {
		outline: none;
		height: 100%;
		font-family: 'Inter', sans-serif;
		color: var(--color-body-text);
		line-height: 1.6;
	}

	:global(.tiptap p.is-editor-empty:first-child::before) {
		content: attr(data-placeholder);
		float: left;
		color: var(--color-muted-text);
		pointer-events: none;
		height: 0;
	}

	:global(.tiptap h1) { font-size: 2rem; color: var(--color-deep-ocean); margin-bottom: 1rem; }
	:global(.tiptap h2) { font-size: 1.5rem; color: var(--color-deep-ocean); margin-top: 1.5rem; margin-bottom: 0.75rem; }
	:global(.tiptap ul), :global(.tiptap ol) { padding-left: 1.5rem; margin-bottom: 1rem; }
	:global(.tiptap blockquote) { 
		border-left: 4px solid var(--color-deep-ocean); 
		padding-left: 1rem; 
		font-style: italic; 
		margin: 1rem 0;
		opacity: 0.8;
	}
</style>
