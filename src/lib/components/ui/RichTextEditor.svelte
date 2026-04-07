<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Underline from '@tiptap/extension-underline';
	import Link from '@tiptap/extension-link';
	import Placeholder from '@tiptap/extension-placeholder';
	import { Image } from '@tiptap/extension-image';
	import { Table } from '@tiptap/extension-table';
	import { TableRow } from '@tiptap/extension-table-row';
	import { TableHeader } from '@tiptap/extension-table-header';
	import { TableCell } from '@tiptap/extension-table-cell';
	import { TaskList } from '@tiptap/extension-task-list';
	import { TaskItem } from '@tiptap/extension-task-item';
	import { HorizontalRule } from '@tiptap/extension-horizontal-rule';
	import { Markdown } from 'tiptap-markdown';
	import { 
		Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code, 
		Type, List, ListOrdered, CheckSquare, Link as LinkIcon, 
		Image as ImageIcon, Table as TableIcon, Quote, Minus, 
		Undo, Redo, PlusSquare, MinusSquare, Trash2, Combine, Split,
		FileJson, Layout
	} from 'lucide-svelte';

	interface Props {
		value: string;
		placeholder?: string;
		onchange: (val: string) => void;
		"data-testid"?: string;
	}

	let { value = $bindable(), placeholder = 'Почніть писати...', onchange, "data-testid": testId = "rich-editor" }: Props = $props();

	let element: HTMLElement;
	let editor: Editor | null = $state(null);
	let isTableActive = $state(false);
	let isMarkdownMode = $state(false);

	// Modal states
	let showLinkModal = $state(false);
	let showImageModal = $state(false);
	let modalInput = $state('');
	let modalText = $state('');
	let modalType: 'link' | 'image' | null = $state(null);

	onMount(() => {
		editor = new Editor({
			element: element,
			editorProps: {
				attributes: {
					'data-testid': `${testId}-content`
				}
			},
			extensions: [
				StarterKit.configure({
					heading: {
						levels: [1, 2, 3, 4, 5, 6],
					},
					horizontalRule: false,
				}),
				Underline,
				Link.configure({
					openOnClick: false,
					HTMLAttributes: {
						class: 'prose-link',
					},
				}),
				Image.configure({
					HTMLAttributes: {
						class: 'editor-image',
					},
				}),
				Table.configure({
					resizable: true,
				}),
				TableRow,
				TableHeader,
				TableCell,
				TaskList,
				TaskItem.configure({
					nested: true,
				}),
				HorizontalRule,
				Placeholder.configure({
					placeholder: placeholder,
				}),
				Markdown,
			],
			content: value,
			onUpdate: ({ editor }) => {
				const markdown = (editor.storage as any).markdown.getMarkdown();
				value = markdown;
				if (onchange) onchange(markdown);
				isTableActive = editor.isActive('table');
			},
			onSelectionUpdate: ({ editor }) => {
				isTableActive = editor.isActive('table');
			},
			onTransaction: ({ editor }) => {
				isTableActive = editor.isActive('table');
			}
		});
	});

	// Sync value from outside
	$effect(() => {
		if (editor && !isMarkdownMode) {
			const currentMarkdown = (editor.storage as any).markdown.getMarkdown();
			if (value !== currentMarkdown) {
				editor.commands.setContent(value || '', { emitUpdate: false });
			}
		}
	});

	onDestroy(() => {
		if (editor) {
			editor.destroy();
		}
	});

	function toggleMarkdownMode() {
		if (isMarkdownMode) {
			if (editor) {
				editor.commands.setContent(value || '', { emitUpdate: false });
			}
		}
		isMarkdownMode = !isMarkdownMode;
	}

	function handleMarkdownInput(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		value = target.value;
		if (onchange) onchange(value);
	}

	function openModal(type: 'link' | 'image') {
		modalType = type;
		modalInput = '';
		modalText = '';
		
		if (!editor) return;

		if (type === 'link') {
			if (editor.isActive('link')) {
				modalInput = editor.getAttributes('link').href || '';
			}
			
			// Get selected text for the link
			const { from, to } = editor.state.selection;
			modalText = editor.state.doc.textBetween(from, to, ' ') || '';
			
			showLinkModal = true;
		} else {
			showImageModal = true;
		}
	}

	function closeModal() {
		showLinkModal = false;
		showImageModal = false;
		modalType = null;
		modalInput = '';
		modalText = '';
	}

	function handleModalSubmit() {
		if (!editor) return;
		
		if (modalType === 'link') {
			if (modalInput) {
				// If text is provided, replace selection or insert new
				if (modalText) {
					editor.chain().focus().extendMarkRange('link').insertContent({
						type: 'text',
						text: modalText,
						marks: [{ type: 'link', attrs: { href: modalInput } }]
					}).run();
				} else {
					editor.chain().focus().setLink({ href: modalInput }).run();
				}
			} else {
				editor.chain().focus().unsetLink().run();
			}
		} else if (modalType === 'image' && modalInput) {
			editor.chain().focus().setImage({ src: modalInput }).run();
		}
		closeModal();
	}
</script>

<div class="rich-editor" data-testid="{testId}-container">
   {#if editor}
	   <div class="toolbar" data-testid="{testId}-toolbar">
		   <div class="tool-group">
			   <button 
				   type="button" 
				   class="tool-btn mode-toggle" 
				   onclick={toggleMarkdownMode}
				   title={isMarkdownMode ? "Режим дизайнера" : "Режим Markdown"}
				   data-testid="{testId}-btn-mode-toggle"
			   >
				   {#if isMarkdownMode}
					   <Layout size={18} />
				   {:else}
					   <FileJson size={18} />
				   {/if}
			   </button>
		   </div>

		   <div class="separator"></div>

		   {#if !isMarkdownMode}
			   <div class="tool-group">
				   <button 
					   type="button"
					   class="tool-btn" 
					   class:active={editor.isActive('bold')} 
					   onclick={() => editor?.chain().focus().toggleBold().run()}
					   title="Жирний"
					   data-testid="{testId}-btn-bold"
				   ><Bold size={18} /></button>
				   
				   <button 
					   type="button"
					   class="tool-btn" 
					   class:active={editor.isActive('italic')} 
					   onclick={() => editor?.chain().focus().toggleItalic().run()}
					   title="Курсив"
					   data-testid="{testId}-btn-italic"
				   ><Italic size={18} /></button>
				   
				   <button 
					   type="button"
					   class="tool-btn" 
					   class:active={editor.isActive('underline')} 
					   onclick={() => editor?.chain().focus().toggleUnderline().run()}
					   title="Підкреслений"
					   data-testid="{testId}-btn-underline"
				   ><UnderlineIcon size={18} /></button>

				   <button 
					   type="button"
					   class="tool-btn" 
					   class:active={editor.isActive('strike')} 
					   onclick={() => editor?.chain().focus().toggleStrike().run()}
					   title="Закреслений"
					   data-testid="{testId}-btn-strike"
				   ><Strikethrough size={18} /></button>

				   <button 
					   type="button"
					   class="tool-btn" 
					   class:active={editor.isActive('code')} 
					   onclick={() => editor?.chain().focus().toggleCode().run()}
					   title="Код"
					   data-testid="{testId}-btn-code"
				   ><Code size={18} /></button>
			   </div>

			   <div class="separator"></div>

			   <div class="tool-group">
				   <button 
					   type="button"
					   class="tool-btn" 
					   class:active={editor.isActive('paragraph')} 
					   onclick={() => editor?.chain().focus().setParagraph().run()}
					   data-testid="{testId}-btn-p"
					   title="Звичайний текст"
				   ><Type size={18} /></button>
				   {#each [1, 2, 3, 4, 5, 6] as level}
					   <button 
						   type="button"
						   class="tool-btn" 
						   class:active={editor.isActive('heading', { level })} 
						   onclick={() => editor?.chain().focus().toggleHeading({ level: level as any }).run()}
						   data-testid="{testId}-btn-h{level}"
						   title="Заголовок {level}"
					   >H{level}</button>
				   {/each}
			   </div>

			   <div class="separator"></div>

			   <div class="tool-group">
				   <button 
					   type="button"
					   class="tool-btn" 
					   class:active={editor.isActive('bulletList')} 
					   onclick={() => editor?.chain().focus().toggleBulletList().run()}
					   title="Маркований список"
					   data-testid="{testId}-btn-bullet"
				   ><List size={18} /></button>
				   
				   <button 
					   type="button"
					   class="tool-btn" 
					   class:active={editor.isActive('orderedList')} 
					   onclick={() => editor?.chain().focus().toggleOrderedList().run()}
					   title="Нумерований список"
					   data-testid="{testId}-btn-ordered"
				   ><ListOrdered size={18} /></button>

				   <button 
					   type="button"
					   class="tool-btn" 
					   class:active={editor.isActive('taskList')} 
					   onclick={() => editor?.chain().focus().toggleTaskList().run()}
					   title="Список завдань"
					   data-testid="{testId}-btn-tasklist"
				   ><CheckSquare size={18} /></button>
			   </div>

			   <div class="separator"></div>

			   <div class="tool-group">
				   <button 
					   type="button"
					   class="tool-btn" 
					   class:active={editor.isActive('link')} 
					   onclick={() => openModal('link')}
					   title="Посилання"
					   data-testid="{testId}-btn-link"
				   ><LinkIcon size={18} /></button>

				   <button 
					   type="button"
					   class="tool-btn" 
					   onclick={() => openModal('image')}
					   title="Зображення по URL"
					   data-testid="{testId}-btn-image"
				   ><ImageIcon size={18} /></button>

				   <button 
					   type="button"
					   class="tool-btn" 
					   onclick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
					   title="Вставити таблицю"
					   data-testid="{testId}-btn-table"
				   ><TableIcon size={18} /></button>
				   
				   <button 
					   type="button"
					   class="tool-btn" 
					   onclick={() => editor?.chain().focus().toggleBlockquote().run()}
					   class:active={editor.isActive('blockquote')}
					   title="Цитата"
					   data-testid="{testId}-btn-quote"
				   ><Quote size={18} /></button>

				   <button 
					   type="button"
					   class="tool-btn" 
					   onclick={() => editor?.chain().focus().setHorizontalRule().run()}
					   title="Горизонтальна лінія"
					   data-testid="{testId}-btn-hr"
				   ><Minus size={18} /></button>
			   </div>

			   <div class="separator"></div>

			   <div class="tool-group">
				   <button 
					   type="button"
					   class="tool-btn" 
					   onclick={() => editor?.chain().focus().undo().run()}
					   title="Відмінити"
					   data-testid="{testId}-btn-undo"
				   ><Undo size={18} /></button>
				   
				   <button 
					   type="button"
					   class="tool-btn" 
					   onclick={() => editor?.chain().focus().redo().run()}
					   title="Повторити"
					   data-testid="{testId}-btn-redo"
				   ><Redo size={18} /></button>
			   </div>

			   {#if isTableActive}
				   <div class="separator"></div>
				   <div class="tool-group table-tools">
					   <button type="button" class="tool-btn" onclick={() => editor?.chain().focus().addColumnBefore().run()} title="Додати стовпець ліворуч" data-testid="{testId}-btn-table-col-before"><PlusSquare size={14} /> Col L</button>
					   <button type="button" class="tool-btn" onclick={() => editor?.chain().focus().addColumnAfter().run()} title="Додати стовпець праворуч" data-testid="{testId}-btn-table-col-after"><PlusSquare size={14} /> Col R</button>
					   <button type="button" class="tool-btn" onclick={() => editor?.chain().focus().deleteColumn().run()} title="Видалити стовпець" data-testid="{testId}-btn-table-col-delete"><MinusSquare size={14} /> Col</button>
					   <button type="button" class="tool-btn" onclick={() => editor?.chain().focus().addRowBefore().run()} title="Додати рядок зверху" data-testid="{testId}-btn-table-row-before"><PlusSquare size={14} /> Row U</button>
					   <button type="button" class="tool-btn" onclick={() => editor?.chain().focus().addRowAfter().run()} title="Додати рядок знизу" data-testid="{testId}-btn-table-row-after"><PlusSquare size={14} /> Row D</button>
					   <button type="button" class="tool-btn" onclick={() => editor?.chain().focus().deleteRow().run()} title="Видалити рядок" data-testid="{testId}-btn-table-row-delete"><MinusSquare size={14} /> Row</button>
					   <button type="button" class="tool-btn" onclick={() => editor?.chain().focus().deleteTable().run()} title="Видалити таблицю" data-testid="{testId}-btn-table-delete"><Trash2 size={16} /></button>
					   <button type="button" class="tool-btn" onclick={() => editor?.chain().focus().mergeCells().run()} title="Об'єднати клітинки" data-testid="{testId}-btn-table-merge"><Combine size={14} /></button>
					   <button type="button" class="tool-btn" onclick={() => editor?.chain().focus().splitCell().run()} title="Розділити клітинку" data-testid="{testId}-btn-table-split"><Split size={14} /></button>
				   </div>
			   {/if}
		   {:else}
			   <div class="tool-group">
				   <span style="font-size: 0.8rem; opacity: 0.5; display: flex; align-items: center; padding: 0 0.5rem;">Markdown Mode (Direct Editing)</span>
			   </div>
		   {/if}
	   </div>
   {/if}

   <div class="editor-viewport">
	   <textarea 
		   class="markdown-editor" 
		   class:hidden={!isMarkdownMode}
		   bind:value={value} 
		   oninput={handleMarkdownInput}
		   placeholder={placeholder}
		   data-testid="{testId}-markdown-textarea"
	   ></textarea>
	   
	   <div 
		   bind:this={element} 
		   class="editor-content" 
		   class:hidden={isMarkdownMode}
		   data-testid="{testId}-content"
	   ></div>

	   {#if showLinkModal || showImageModal}
		   <div class="modal-overlay" onclick={closeModal} role="presentation">
			   <div class="modal-content" onclick={(e) => e.stopPropagation()} role="presentation" data-testid="{testId}-modal">
				   <h3>{modalType === 'link' ? 'Вставити посилання' : 'Вставити зображення'}</h3>
				   
				   <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem;">
					   {#if modalType === 'link'}
						   <div class="form-group">
							   <label class="form-label" for="modal-text">Текст посилання</label>
							   <input 
								   id="modal-text"
								   type="text" 
								   bind:value={modalText} 
								   placeholder="Напр: Тисни тут"
								   class="form-input"
								   data-testid="{testId}-modal-text-input"
							   />
						   </div>
					   {/if}

					   <div class="form-group">
						   <label class="form-label" for="modal-url">{modalType === 'link' ? 'URL адреса' : 'URL зображення'}</label>
						   <input 
							   id="modal-url"
							   type="text" 
							   bind:value={modalInput} 
							   placeholder={modalType === 'link' ? 'https://example.com' : 'https://example.com/image.jpg'}
							   onkeydown={(e) => e.key === 'Enter' && handleModalSubmit()}
							   class="form-input"

							   data-testid="{testId}-modal-input"
						   />
					   </div>
				   </div>

				   <div class="modal-actions">
					   <button type="button" class="btn btn-outline" onclick={closeModal} data-testid="{testId}-modal-cancel">Скасувати</button>
					   <button type="button" class="btn btn-primary" onclick={handleModalSubmit} data-testid="{testId}-modal-save">Зберегти</button>
				   </div>
			   </div>
		   </div>
	   {/if}
   </div>
</div>

<style>
	.rich-editor {
		border: 1px solid var(--color-border);
		border-radius: 20px;
		background: var(--theme-dynamic-card-bg);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		position: relative;
	}

	.toolbar {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		padding: 0.75rem;
		background: var(--theme-dynamic-section-bg);
		border-bottom: 1px solid var(--color-border);
		z-index: 10;
	}

	.tool-group {
		display: flex;
		gap: 0.25rem;
		flex-wrap: wrap;
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
		font-size: 0.9rem;
	}

	.tool-btn:hover {
		background: var(--color-border);
		opacity: 0.8;
	}

	.tool-btn.active {
		background: var(--color-deep-ocean);
		color: white;
	}

	.tool-btn.mode-toggle {
		color: var(--color-ocean);
	}
	
	.tool-btn.mode-toggle:hover {
		background: rgba(0, 119, 190, 0.1);
	}

	.separator {
		width: 1px;
		height: 24px;
		background: var(--color-border);
		margin: 4px 0.25rem;
	}

	.editor-viewport {
		position: relative;
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.editor-content, .markdown-editor {
		padding: 1.5rem;
		min-height: 300px;
		max-height: 600px;
		overflow-y: auto;
		font-family: inherit;
		font-size: 1rem;
		line-height: 1.6;
	}

	.markdown-editor {
		width: 100%;
		border: none;
		outline: none;
		resize: vertical;
		background: var(--theme-dynamic-card-bg);
		color: var(--color-body-text);
		font-family: 'Fira Code', 'Courier New', Courier, monospace;
	}

	.hidden {
		display: none !important;
	}

	.table-tools .tool-btn {
		font-size: 0.75rem;
		font-weight: normal;
		padding: 0 0.25rem;
		gap: 0.25rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.form-label {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--color-deep-ocean);
		opacity: 0.8;
	}

	.form-input {
		width: 100%;
		padding: 0.6rem 1rem;
		border: 1px solid var(--color-border);
		border-radius: 10px;
		background: var(--theme-dynamic-section-bg);
		color: var(--color-body-text);
		outline: none;
		transition: border-color 0.2s;
	}

	.form-input:focus {
		border-color: var(--color-ocean);
	}

	/* Modal Styles */
	.modal-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.3);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		padding: 1rem;
	}

	.modal-content {
		background: var(--theme-dynamic-card-bg);
		padding: 2rem;
		border-radius: 24px;
		box-shadow: 0 15px 50px rgba(0, 0, 0, 0.3);
		width: 100%;
		max-width: 450px;
	}

	.modal-content h3 {
		margin-bottom: 1.5rem;
		color: var(--color-deep-ocean);
		font-family: var(--font-heading);
		font-size: 1.25rem;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
	}

	/* Стилі для самого TipTap контенту */
	:global(.tiptap) {
		outline: none;
		height: 100%;
		font-family: 'Inter', sans-serif;
		color: var(--color-body-text);
		line-height: 1.6;
	}

	/* Відступи між абзацами в редакторі */
	:global(.tiptap p) {
		margin-bottom: 1rem;
	}

	:global(.tiptap p:last-child) {
		margin-bottom: 0;
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
	:global(.tiptap h3) { font-size: 1.25rem; color: var(--color-deep-ocean); margin-top: 1.25rem; margin-bottom: 0.5rem; }
	:global(.tiptap h4) { font-size: 1.1rem; color: var(--color-deep-ocean); margin-top: 1rem; margin-bottom: 0.5rem; }
	:global(.tiptap h5, .tiptap h6) { font-size: 1rem; color: var(--color-deep-ocean); margin-top: 1rem; margin-bottom: 0.5rem; }
	
	:global(.tiptap ul), :global(.tiptap ol) { padding-left: 1.5rem; margin-bottom: 1rem; }
	:global(.tiptap blockquote) { 
		border-left: 4px solid var(--color-deep-ocean); 
		padding-left: 1rem; 
		font-style: italic; 
		margin: 1rem 0;
		opacity: 0.8;
	}

	:global(.tiptap img) {
		max-width: 100%;
		height: auto;
		border-radius: 12px;
		margin: 1.5rem 0;
	}

	:global(.tiptap hr) {
		border: none;
		border-top: 2px solid var(--color-border);
		margin: 2rem 0;
	}

	:global(.tiptap table) {
		border-collapse: collapse;
		table-layout: fixed;
		width: 100%;
		margin: 1rem 0;
		overflow: hidden;
	}

	:global(.tiptap table td, .tiptap table th) {
		border: 1px solid var(--color-border);
		box-sizing: border-box;
		min-width: 1em;
		padding: 0.5rem;
		position: relative;
		vertical-align: top;
	}

	:global(.tiptap table th) {
		background-color: var(--theme-dynamic-section-bg);
		font-weight: bold;
		text-align: left;
	}

	:global(.tiptap .selectedCell:after) {
		background: rgba(200, 200, 255, 0.4);
		content: "";
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		pointer-events: none;
		position: absolute;
		z-index: 2;
	}

	:global(.tiptap ul[data-type="taskList"]) {
		list-style: none;
		padding: 0;
	}

	:global(.tiptap ul[data-type="taskList"] li) {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		margin-bottom: 0.25rem;
	}

	:global(.tiptap ul[data-type="taskList"] input[type="checkbox"]) {
		margin-top: 0.4rem;
		cursor: pointer;
	}

	:global(.tiptap code) {
		background-color: rgba(0, 0, 0, 0.05);
		border-radius: 4px;
		padding: 0.2rem 0.4rem;
		font-family: monospace;
	}
</style>
