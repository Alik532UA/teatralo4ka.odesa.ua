<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import 'easymde/dist/easymde.min.css';

	interface Props {
		value: string;
		placeholder?: string;
		onchange: (val: string) => void;
	}

	let { value = $bindable(), placeholder = 'Введіть текст...', onchange }: Props = $props();

	let textarea: HTMLTextAreaElement;
	let easyMDE: any;

	onMount(async () => {
		if (browser) {
			const EasyMDE = (await import('easymde')).default;
			
			easyMDE = new EasyMDE({
				element: textarea,
				initialValue: value,
				placeholder: placeholder,
				spellChecker: false,
				autosave: {
					enabled: false,
					uniqueId: 'mde-editor'
				},
				status: ['chars', 'lines'],
				toolbar: [
					'bold', 'italic', 'strikethrough', 'heading', '|',
					'quote', 'unordered-list', 'ordered-list', '|',
					'link', 'image', 'table', '|',
					'preview', 'side-by-side', 'fullscreen', '|',
					'guide'
				],
				minHeight: '300px',
				maxHeight: '500px',
				renderingConfig: {
					singleLineBreaks: false,
				},
			});

			easyMDE.codemirror.on('change', () => {
				const newValue = easyMDE.value();
				value = newValue;
				if (onchange) onchange(newValue);
			});
		}
	});

	// Слідкуємо за зміною value ззовні (наприклад, при перемиканні мови)
	$effect(() => {
		if (easyMDE && easyMDE.value() !== value) {
			easyMDE.value(value || '');
		}
	});

	onDestroy(() => {
		if (easyMDE) {
			easyMDE.toTextArea();
			easyMDE = null;
		}
	});
</script>

<div class="mde-container" data-testid="markdown-editor-container">
	<textarea bind:this={textarea} data-testid="markdown-editor-textarea"></textarea>
</div>

<style>
	.mde-container :global(.editor-toolbar) {
		border-top-left-radius: 12px;
		border-top-right-radius: 12px;
		background: var(--theme-dynamic-section-bg);
		border-color: var(--color-border);
		opacity: 1;
	}
	.mde-container :global(.editor-toolbar button) {
		color: var(--color-deep-ocean) !important;
	}
	.mde-container :global(.editor-toolbar button.active),
	.mde-container :global(.editor-toolbar button:hover) {
		background: var(--color-border) !important;
		border-color: var(--color-border) !important;
	}
	.mde-container :global(.CodeMirror) {
		border-bottom-left-radius: 12px;
		border-bottom-right-radius: 12px;
		background: var(--theme-dynamic-card-bg);
		color: var(--color-body-text);
		border-color: var(--color-border);
		font-family: 'Inter', sans-serif;
		font-size: 1rem;
	}
	.mde-container :global(.CodeMirror-cursor) {
		border-left: 2px solid var(--color-deep-ocean);
	}
	.mde-container :global(.editor-preview) {
		background: var(--color-surface);
		color: var(--color-text-body);
	}
	/* Fix for dark theme preview */
	.mde-container :global(.editor-preview h1),
	.mde-container :global(.editor-preview h2),
	.mde-container :global(.editor-preview h3) {
		color: var(--color-deep-ocean);
	}
</style>
