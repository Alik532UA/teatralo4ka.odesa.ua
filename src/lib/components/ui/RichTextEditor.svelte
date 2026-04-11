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
		FileJson, Layout, AlertTriangle
	} from 'lucide-svelte';
	import { t } from 'svelte-i18n';

	interface Props {
		value: string;
		placeholder?: string;
		initialMode?: EditorMode;
		onchange: (val: string) => void;
		onmodechange?: (mode: EditorMode) => void;
		"data-testid"?: string;
	}

	let { value = $bindable(), placeholder, initialMode = 'visual', onchange, onmodechange, "data-testid": testId = "rich-editor" }: Props = $props();

	let element: HTMLElement;
	let editor: Editor | null = $state(null);
	let isTableActive = $state(false);
	type EditorMode = 'visual' | 'markdown' | 'html';
	// svelte-ignore state_referenced_locally
	let editorMode = $state<EditorMode>(initialMode);
	// svelte-ignore state_referenced_locally
	let htmlContent = $state(initialMode === 'html' ? value : '');

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
					'data-testid': `${testId}-content-area`
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
					placeholder: placeholder || $t('editor.placeholder'),
				}),
				Markdown,
			],
			content: initialMode === 'html' ? '' : value,
			onUpdate: ({ editor }) => {
				if (editorMode === 'html') return;
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

	// Sync value from outside (only in visual mode)
	$effect(() => {
		if (editor && editorMode === 'visual') {
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

	function setEditorMode(mode: EditorMode) {
		if (mode === editorMode) return;
		// Commit current edited content before switching
		if (editorMode === 'markdown' && editor) {
			editor.commands.setContent(value || '', { emitUpdate: false });
		} else if (editorMode === 'html' && editor) {
			editor.commands.setContent(htmlContent, { emitUpdate: false });
			const markdown = (editor.storage as any).markdown.getMarkdown();
			value = markdown;
			if (onchange) onchange(markdown);
		}
		// Prepare entering mode
		if (mode === 'html' && editor) {
			htmlContent = editor.getHTML();
		}
		editorMode = mode;
		if (onmodechange) onmodechange(mode);
	}

	function handleMarkdownInput(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		value = target.value;
		if (onchange) onchange(value);
	}

	function handleHtmlInput(e: Event) {
		htmlContent = (e.target as HTMLTextAreaElement).value;
		value = htmlContent;
		if (onchange) onchange(htmlContent);
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
	   <div class="toolbar" data-testid="{testId}-toolbar-group">
		   <div class="tool-group mode-tabs" data-testid="{testId}-mode-tools">
			   <button
				   type="button"
				   class="tool-btn mode-tab"
				   class:active={editorMode === 'visual'}
				   onclick={() => setEditorMode('visual')}
				   title={$t('editor.visual')}
				   data-testid="{testId}-mode-toggle-button"
			   ><Layout size={15} /> {$t('editor.textTab')}</button>
			   <button
				   type="button"
				   class="tool-btn mode-tab"
				   class:active={editorMode === 'markdown'}
				   onclick={() => setEditorMode('markdown')}
				   title={$t('editor.markdown')}
				   data-testid="{testId}-mode-md-button"
			   ><FileJson size={15} /> {$t('editor.mdTab')}</button>
			   <button
				   type="button"
				   class="tool-btn mode-tab"
				   class:active={editorMode === 'html'}
				   onclick={() => setEditorMode('html')}
				   title={$t('editor.html')}
				   data-testid="{testId}-mode-html-button"
			   ><Code size={15} /> {$t('editor.htmlTab')}</button>
		   </div>

		   <div class="separator"></div>

		   {#if editorMode === 'visual'}
			   <div class="tool-group" data-testid="{testId}-format-tools">
				   <button 
					   type="button"
					   class="tool-btn" 
					   class:active={editor.isActive('bold')} 
					   onclick={() => editor?.chain().focus().toggleBold().run()}
					   title={$t('editor.bold')}
					   data-testid="{testId}-bold-button"
				   ><Bold size={18} /></button>
				   
				   <button 
					   type="button"
					   class="tool-btn" 
					   class:active={editor.isActive('italic')} 
					   onclick={() => editor?.chain().focus().toggleItalic().run()}
					   title={$t('editor.italic')}
					   data-testid="{testId}-italic-button"
				   ><Italic size={18} /></button>
				   
				   <button 
					   type="button"
					   class="tool-btn" 
					   class:active={editor.isActive('underline')} 
					   onclick={() => editor?.chain().focus().toggleUnderline().run()}
					   title={$t('editor.underline')}
					   data-testid="{testId}-underline-button"
				   ><UnderlineIcon size={18} /></button>

				   <button 
					   type="button"
					   class="tool-btn" 
					   class:active={editor.isActive('strike')} 
					   onclick={() => editor?.chain().focus().toggleStrike().run()}
					   title={$t('editor.strike')}
					   data-testid="{testId}-strike-button"
				   ><Strikethrough size={18} /></button>

				   <button 
					   type="button"
					   class="tool-btn" 
					   class:active={editor.isActive('code')} 
					   onclick={() => editor?.chain().focus().toggleCode().run()}
					   title={$t('editor.code')}
					   data-testid="{testId}-code-button"
				   ><Code size={18} /></button>
			   </div>

			   <div class="separator"></div>

			   <div class="tool-group" data-testid="{testId}-heading-tools">
				   <button 
					   type="button"
					   class="tool-btn" 
					   class:active={editor.isActive('paragraph')} 
					   onclick={() => editor?.chain().focus().setParagraph().run()}
					   data-testid="{testId}-paragraph-button"
					   title={$t('editor.paragraph')}
				   ><Type size={18} /></button>
				   {#each [1, 2, 3, 4, 5, 6] as level}
					   <button 
						   type="button"
						   class="tool-btn" 
						   class:active={editor.isActive('heading', { level })} 
						   onclick={() => editor?.chain().focus().toggleHeading({ level: level as any }).run()}
						   data-testid="{testId}-h{level}-button"
						   title={$t('editor.heading', { values: { level } })}
					   >H{level}</button>
				   {/each}
			   </div>

			   <div class="separator"></div>

			   <div class="tool-group" data-testid="{testId}-list-tools">
				   <button 
					   type="button"
					   class="tool-btn" 
					   class:active={editor.isActive('bulletList')} 
					   onclick={() => editor?.chain().focus().toggleBulletList().run()}
					   title={$t('editor.bulletList')}
					   data-testid="{testId}-bullet-list-button"
				   ><List size={18} /></button>
				   
				   <button 
					   type="button"
					   class="tool-btn" 
					   class:active={editor.isActive('orderedList')} 
					   onclick={() => editor?.chain().focus().toggleOrderedList().run()}
					   title={$t('editor.orderedList')}
					   data-testid="{testId}-ordered-list-button"
				   ><ListOrdered size={18} /></button>

				   <button 
					   type="button"
					   class="tool-btn" 
					   class:active={editor.isActive('taskList')} 
					   onclick={() => editor?.chain().focus().toggleTaskList().run()}
					   title={$t('editor.taskList')}
					   data-testid="{testId}-task-list-button"
				   ><CheckSquare size={18} /></button>
			   </div>

			   <div class="separator"></div>

			   <div class="tool-group" data-testid="{testId}-insert-tools">
				   <button 
					   type="button"
					   class="tool-btn" 
					   class:active={editor.isActive('link')} 
					   onclick={() => openModal('link')}
					   title={$t('editor.link')}
					   data-testid="{testId}-link-button"
				   ><LinkIcon size={18} /></button>

				   <button 
					   type="button"
					   class="tool-btn" 
					   onclick={() => openModal('image')}
					   title={$t('editor.image')}
					   data-testid="{testId}-image-button"
				   ><ImageIcon size={18} /></button>

				   <button 
					   type="button"
					   class="tool-btn" 
					   onclick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
					   title={$t('editor.table')}
					   data-testid="{testId}-table-button"
				   ><TableIcon size={18} /></button>
				   
				   <button 
					   type="button"
					   class="tool-btn" 
					   onclick={() => editor?.chain().focus().toggleBlockquote().run()}
					   class:active={editor.isActive('blockquote')}
					   title={$t('editor.blockquote')}
					   data-testid="{testId}-quote-button"
				   ><Quote size={18} /></button>

				   <button 
					   type="button"
					   class="tool-btn" 
					   onclick={() => editor?.chain().focus().setHorizontalRule().run()}
					   title={$t('editor.horizontalRule')}
					   data-testid="{testId}-hr-button"
				   ><Minus size={18} /></button>
			   </div>

			   <div class="separator"></div>

			   <div class="tool-group" data-testid="{testId}-history-tools">
				   <button 
					   type="button"
					   class="tool-btn" 
					   onclick={() => editor?.chain().focus().undo().run()}
					   title={$t('editor.undo')}
					   data-testid="{testId}-undo-button"
				   ><Undo size={18} /></button>
				   
				   <button 
					   type="button"
					   class="tool-btn" 
					   onclick={() => editor?.chain().focus().redo().run()}
					   title={$t('editor.redo')}
					   data-testid="{testId}-redo-button"
				   ><Redo size={18} /></button>
			   </div>

			   {#if isTableActive}
				   <div class="separator"></div>
				   <div class="tool-group table-tools" data-testid="{testId}-table-tools-group">
					   <button type="button" class="tool-btn" onclick={() => editor?.chain().focus().addColumnBefore().run()} title={$t('editor.addColumnBefore')} data-testid="{testId}-table-col-before-button"><PlusSquare size={14} /> Col L</button>
					   <button type="button" class="tool-btn" onclick={() => editor?.chain().focus().addColumnAfter().run()} title={$t('editor.addColumnAfter')} data-testid="{testId}-table-col-after-button"><PlusSquare size={14} /> Col R</button>
					   <button type="button" class="tool-btn" onclick={() => editor?.chain().focus().deleteColumn().run()} title={$t('editor.deleteColumn')} data-testid="{testId}-table-col-delete-button"><MinusSquare size={14} /> Col</button>
					   <button type="button" class="tool-btn" onclick={() => editor?.chain().focus().addRowBefore().run()} title={$t('editor.addRowBefore')} data-testid="{testId}-table-row-before-button"><PlusSquare size={14} /> Row U</button>
					   <button type="button" class="tool-btn" onclick={() => editor?.chain().focus().addRowAfter().run()} title={$t('editor.addRowAfter')} data-testid="{testId}-table-row-after-button"><PlusSquare size={14} /> Row D</button>
					   <button type="button" class="tool-btn" onclick={() => editor?.chain().focus().deleteRow().run()} title={$t('editor.deleteRow')} data-testid="{testId}-table-row-delete-button"><MinusSquare size={14} /> Row</button>
					   <button type="button" class="tool-btn" onclick={() => editor?.chain().focus().deleteTable().run()} title={$t('editor.deleteTable')} data-testid="{testId}-table-delete-button"><Trash2 size={16} /></button>
					   <button type="button" class="tool-btn" onclick={() => editor?.chain().focus().mergeCells().run()} title={$t('editor.mergeCells')} data-testid="{testId}-table-merge-button"><Combine size={14} /></button>
					   <button type="button" class="tool-btn" onclick={() => editor?.chain().focus().splitCell().run()} title={$t('editor.splitCell')} data-testid="{testId}-table-split-button"><Split size={14} /></button>
				   </div>
			   {/if}
		   {:else}
			   <div class="tool-group" data-testid="{testId}-mode-info-group">
				   <span style="font-size: 0.8rem; opacity: 0.5; display: flex; align-items: center; padding: 0 0.5rem;" data-testid="{testId}-markdown-label">{$t('editor.sourceEditing', { values: { mode: editorMode === 'markdown' ? 'Markdown' : 'HTML' } })}</span>
				   {#if editorMode === 'html'}
					   <span style="font-size: 0.75rem; color: #ef4444; margin-left: 1rem; padding: 0.2rem 0.5rem; border-radius: 4px; background: rgba(239, 68, 68, 0.1);">
						   <AlertTriangle size={14} style="margin-right: 4px;" />
						   {$t('editor.htmlWarning')}
					   </span>
				   {/if}
			   </div>
		   {/if}
	   </div>
   {/if}

   <div class="editor-viewport" data-testid="{testId}-viewport-container">
	   <textarea 
		   class="markdown-editor" 
		   class:hidden={editorMode !== 'markdown'}
		   bind:value={value} 
		   oninput={handleMarkdownInput}
		   placeholder={placeholder}
		   data-testid="{testId}-markdown-textarea"
	   ></textarea>

	   <textarea
		   class="html-editor"
		   class:hidden={editorMode !== 'html'}
		   value={htmlContent}
		   oninput={handleHtmlInput}
		   placeholder="&lt;p&gt;HTML...&lt;/p&gt;"
		   data-testid="{testId}-html-textarea"
	   ></textarea>
	   
	   <div 
		   bind:this={element} 
		   class="editor-content" 
		   class:hidden={editorMode !== 'visual'}
		   data-testid="{testId}-editor-content-area"
	   ></div>

	   {#if showLinkModal || showImageModal}
		   <div class="modal-overlay" onclick={closeModal} role="presentation" data-testid="{testId}-modal-overlay-container">
			   <div class="modal-content" onclick={(e) => e.stopPropagation()} role="presentation" data-testid="{testId}-modal-container">
				   <h3 data-testid="{testId}-modal-title-label">{modalType === 'link' ? 'Вставити посилання' : 'Вставити зображення'}</h3>
				   
				   <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem;" data-testid="{testId}-modal-form-group">
					   {#if modalType === 'link'}
						   <div class="form-group" data-testid="{testId}-modal-text-group">
							   <label class="form-label" for="modal-text" data-testid="{testId}-modal-text-label">{$t('editor.linkText')}</label>
							   <input 
								   id="modal-text"
								   type="text" 
								   bind:value={modalText} 
								   placeholder={$t('editor.linkTextPlaceholder')}
								   class="form-input"
								   data-testid="{testId}-modal-text-input"
							   />
						   </div>
					   {/if}

					   <div class="form-group" data-testid="{testId}-modal-url-group">
						   <label class="form-label" for="modal-url" data-testid="{testId}-modal-url-label">{modalType === 'link' ? $t('editor.urlLabel') : $t('editor.imageUrlLabel')}</label>
						   <input 
							   id="modal-url"
							   type="text" 
							   bind:value={modalInput} 
							   placeholder={modalType === 'link' ? 'https://example.com' : 'https://example.com/image.jpg'}
							   onkeydown={(e) => e.key === 'Enter' && handleModalSubmit()}
							   class="form-input"
							   data-testid="{testId}-modal-url-input"
						   />
					   </div>
				   </div>

				   <div class="modal-actions" data-testid="{testId}-modal-actions-group">
					   <button type="button" class="btn btn-outline" onclick={closeModal} data-testid="{testId}-modal-cancel-button">{$t('common.cancel')}</button>
					   <button type="button" class="btn btn-primary" onclick={handleModalSubmit} data-testid="{testId}-modal-save-button">{$t('admin.menuEditor.save')}</button>
				   </div>
			   </div>
		   </div>
	   {/if}
   </div>
</div>

<style>
	/* ── Wrapper ───────────────────────────────────────────────────────────── */
	.rich-editor {
		display: flex;
		flex-direction: column;
		border: 2px solid var(--color-border);
		border-radius: 16px;
		overflow: hidden;
		background: var(--color-surface);
	}

	/* ── Toolbar ───────────────────────────────────────────────────────────── */
	.toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem;
		padding: 0.6rem 0.75rem;
		border-bottom: 2px solid var(--color-border);
		background: color-mix(in srgb, var(--color-surface), transparent 20%);
		backdrop-filter: blur(4px);
	}

	.tool-group {
		display: flex;
		align-items: center;
		gap: 0.15rem;
	}

	.separator {
		width: 1px;
		height: 1.5rem;
		background: var(--color-border);
		margin: 0 0.25rem;
		flex-shrink: 0;
	}

	/* ── Tool buttons ──────────────────────────────────────────────────────── */
	.tool-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.2rem;
		min-width: 2rem;
		height: 2rem;
		padding: 0 0.35rem;
		border: none;
		border-radius: 8px;
		background: none;
		color: var(--color-dark-text);
		cursor: pointer;
		font-size: 0.78rem;
		font-weight: 600;
		transition: background 0.15s, color 0.15s;
		white-space: nowrap;
	}

	.tool-btn:hover {
		background: color-mix(in srgb, var(--color-sea-blue), transparent 88%);
		color: var(--color-sea-blue);
	}

	.tool-btn.active {
		background: var(--color-sea-blue);
		color: #fff;
	}

	/* ── Table tools (smaller) ─────────────────────────────────────────────── */
	.table-tools .tool-btn {
		font-size: 0.72rem;
		padding: 0 0.45rem;
		height: 1.8rem;
	}

	/* ── Editor viewport ───────────────────────────────────────────────────── */
	.editor-viewport {
		position: relative;
		min-height: 320px;
	}

	/* ── TipTap editable area ──────────────────────────────────────────────── */
	.editor-content {
		min-height: 320px;
		padding: 1.5rem;
		color: var(--color-dark-text);
		font-size: 1rem;
		line-height: 1.7;
		outline: none;
	}

	.editor-content.hidden {
		display: none;
	}

	/* Make the actual ProseMirror div fill and focusable */
	:global(.rich-editor .ProseMirror) {
		outline: none;
		min-height: 280px;
	}

	:global(.rich-editor .ProseMirror p.is-editor-empty:first-child::before) {
		content: attr(data-placeholder);
		color: var(--color-muted-text);
		pointer-events: none;
		float: left;
		height: 0;
	}

	/* prose-like styles inside editor */
	:global(.rich-editor .ProseMirror h1) { font-size: 2rem; font-weight: 800; margin: 1.2rem 0 0.6rem; }
	:global(.rich-editor .ProseMirror h2) { font-size: 1.5rem; font-weight: 700; margin: 1rem 0 0.5rem; }
	:global(.rich-editor .ProseMirror h3) { font-size: 1.25rem; font-weight: 700; margin: 0.9rem 0 0.4rem; }
	:global(.rich-editor .ProseMirror h4) { font-size: 1.1rem; font-weight: 700; margin: 0.8rem 0 0.3rem; }
	:global(.rich-editor .ProseMirror p)  { margin: 0.5rem 0; }
	:global(.rich-editor .ProseMirror ul, .rich-editor .ProseMirror ol) { padding-left: 1.5rem; margin: 0.5rem 0; }
	:global(.rich-editor .ProseMirror li)  { margin: 0.25rem 0; }
	:global(.rich-editor .ProseMirror blockquote) {
		border-left: 4px solid var(--color-sea-blue);
		padding-left: 1rem;
		color: var(--color-muted-text);
		margin: 0.75rem 0;
	}
	:global(.rich-editor .ProseMirror code) {
		background: color-mix(in srgb, var(--color-sea-blue), transparent 90%);
		border-radius: 4px;
		padding: 0.1em 0.4em;
		font-size: 0.88em;
	}
	:global(.rich-editor .ProseMirror pre) {
		background: color-mix(in srgb, var(--color-deep-ocean), transparent 92%);
		border-radius: 10px;
		padding: 1rem 1.25rem;
		overflow-x: auto;
		margin: 0.75rem 0;
	}
	:global(.rich-editor .ProseMirror pre code) { background: none; padding: 0; }
	:global(.rich-editor .ProseMirror a.prose-link) {
		color: var(--color-sea-blue);
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	:global(.rich-editor .ProseMirror hr) {
		border: none;
		border-top: 2px solid var(--color-border);
		margin: 1.5rem 0;
	}

	/* Task list */
	:global(.rich-editor .ProseMirror ul[data-type="taskList"]) { list-style: none; padding-left: 0.5rem; }
	:global(.rich-editor .ProseMirror li[data-type="taskItem"]) { display: flex; align-items: flex-start; gap: 0.5rem; }
	:global(.rich-editor .ProseMirror li[data-type="taskItem"] > label) { margin-top: 0.2rem; }

	/* Table */
	:global(.rich-editor .ProseMirror table) {
		border-collapse: collapse;
		width: 100%;
		margin: 0.75rem 0;
		overflow: hidden;
		border-radius: 8px;
	}
	:global(.rich-editor .ProseMirror th, .rich-editor .ProseMirror td) {
		border: 1px solid var(--color-border);
		padding: 0.5rem 0.75rem;
		text-align: left;
		vertical-align: top;
	}
	:global(.rich-editor .ProseMirror th) {
		background: color-mix(in srgb, var(--color-sea-blue), transparent 88%);
		font-weight: 700;
	}
	:global(.rich-editor .ProseMirror .selectedCell::after) {
		background: color-mix(in srgb, var(--color-sea-blue), transparent 80%);
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 2;
	}
	:global(.rich-editor .ProseMirror .column-resize-handle) {
		background-color: var(--color-sea-blue);
		bottom: 0;
		pointer-events: none;
		position: absolute;
		right: -2px;
		top: 0;
		width: 4px;
	}

	/* ── Mode tab buttons ─────────────────────────────────────────────────── */
	.mode-tabs {
		gap: 0.25rem;
	}

	.mode-tab {
		border: 2px solid var(--color-border);
		border-radius: 8px;
		gap: 0.3rem;
		padding: 0 0.65rem;
		height: 1.9rem;
		font-size: 0.78rem;
	}

	.mode-tab:hover {
		border-color: var(--color-sea-blue);
		background: color-mix(in srgb, var(--color-sea-blue), transparent 92%);
		color: var(--color-sea-blue);
	}

	.mode-tab.active {
		background: var(--color-sea-blue);
		border-color: var(--color-sea-blue);
		color: #fff;
	}

	/* ── HTML source textarea ──────────────────────────────────────────────── */
	.html-editor {
		width: 100%;
		min-height: 320px;
		padding: 1.5rem;
		font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
		font-size: 0.85rem;
		line-height: 1.6;
		border: none;
		resize: vertical;
		background: color-mix(in srgb, var(--color-deep-ocean), transparent 94%);
		color: var(--color-dark-text);
		outline: none;
		tab-size: 2;
	}

	.markdown-editor {
		width: 100%;
		min-height: 320px;
		padding: 1.5rem;
		font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
		font-size: 0.9rem;
		line-height: 1.7;
		border: none;
		resize: vertical;
		background: color-mix(in srgb, var(--color-deep-ocean), transparent 96%);
		color: var(--color-dark-text);
		outline: none;
	}

	.markdown-editor.hidden,
	.html-editor.hidden,
	.editor-content.hidden {
		display: none;
	}

	/* ── Modal ─────────────────────────────────────────────────────────────── */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.45);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal-content {
		background: var(--color-surface);
		border-radius: 20px;
		padding: 2rem;
		width: min(480px, 90vw);
		box-shadow: 0 24px 80px rgba(0, 0, 0, 0.18);
	}

	.modal-content h3 {
		font-size: 1.2rem;
		font-weight: 700;
		color: var(--color-deep-ocean);
		margin-bottom: 1.5rem;
	}

	.modal-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
	}
</style>
