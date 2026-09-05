<script lang="ts">
	import { t } from 'svelte-i18n';
	import { ArrowDown, ArrowUp, Image as ImageIcon, Plus, Trash2, Video } from 'lucide-svelte';
	import {
		DEFAULT_MEDIA_SHAPE,
		MEDIA_LAYOUTS,
		MEDIA_SHAPES,
		type ArticleMediaItem,
		type MediaKind,
		type MediaLayout,
		type MediaShape
	} from '$lib/utils/articleMedia';

	/**
	 * Медіа статті в адмінці: перелік знімків і записів замість двох полів.
	 *
	 * ## Навіщо
	 *
	 * Доти форма мала ОДНУ обкладинку й ОДНЕ відео, тобто друге фото додати було
	 * нікуди — автор попросив рівно це: «можливість додавати багато фотографій та
	 * багато відео». Тут перелік із порядком, який задає автор, і два
	 * налаштування показу: пропорція плиток і те, чи стоять вони стовпцем збоку
	 * від тексту, чи йдуть одне за одним.
	 *
	 * ## Чому окремий компонент
	 *
	 * `ArticleForm` уже стоїть на своїй стелі розміру, і дописати сюди сто рядків
	 * означало б підняти її ще раз. Але причина не лише в числі: перелік медіа —
	 * це власна відповідальність із власним станом (додати, посунути, прибрати), і
	 * форма про неї знати не мусить — вона лише віддає й забирає масив.
	 *
	 * ## Чого тут НЕМАЄ
	 *
	 * Завантаження файлів. У цьому проєкті адмінка приймає ГОТОВІ адреси — так
	 * само, як приймала обкладинку, — і знімки живуть там, куди їх поклав автор.
	 * Міняти це разом із переліком означало б робити дві різні роботи в одному
	 * місці.
	 */
	interface Props {
		/** Перелік медіа. Двостороннє: форма зберігає його як є. */
		items: ArticleMediaItem[];
		shape: MediaShape;
		layout: MediaLayout;
		testIdPrefix: string;
	}

	let {
		items = $bindable(),
		shape = $bindable(DEFAULT_MEDIA_SHAPE),
		layout = $bindable('column'),
		testIdPrefix
	}: Props = $props();

	function додати(kind: MediaKind) {
		items = [...items, { kind, url: '', alt: '' }];
	}

	function прибрати(i: number) {
		items = items.filter((_, j) => j !== i);
	}

	/**
	 * Посунути елемент.
	 *
	 * Порядок тут — не косметика: перше ФОТО стає обкладинкою картки в переліку
	 * новин, а перші плитки — тими, що стоять збоку від тексту.
	 */
	function посунути(i: number, крок: -1 | 1) {
		const j = i + крок;
		if (j < 0 || j >= items.length) return;
		const копія = [...items];
		[копія[i], копія[j]] = [копія[j], копія[i]];
		items = копія;
	}
</script>

<div class="media-editor" data-testid="{testIdPrefix}-media-section">
	<div class="media-editor__settings">
		<label class="form-label" for="{testIdPrefix}-media-shape">{$t('admin.editor.mediaShape')}</label>
		<select
			id="{testIdPrefix}-media-shape"
			class="form-input"
			bind:value={shape}
			data-testid="{testIdPrefix}-media-shape-select"
		>
			{#each MEDIA_SHAPES as значення (значення)}
				<option value={значення}>{$t(`admin.editor.mediaShape_${значення}`)}</option>
			{/each}
		</select>

		<label class="form-label" for="{testIdPrefix}-media-layout">{$t('admin.editor.mediaLayout')}</label>
		<select
			id="{testIdPrefix}-media-layout"
			class="form-input"
			bind:value={layout}
			data-testid="{testIdPrefix}-media-layout-select"
		>
			{#each MEDIA_LAYOUTS as значення (значення)}
				<option value={значення}>{$t(`admin.editor.mediaLayout_${значення}`)}</option>
			{/each}
		</select>
	</div>

	<p class="media-editor__hint">{$t('admin.editor.mediaHint')}</p>

	<ul class="media-editor__list" data-testid="{testIdPrefix}-media-list">
		{#each items as item, i (i)}
			<li class="media-editor__row" data-testid="{testIdPrefix}-media-row-{i}">
				<span class="media-editor__kind" aria-hidden="true">
					{#if item.kind === 'video'}<Video size={16} />{:else}<ImageIcon size={16} />{/if}
				</span>

				<input
					type="url"
					class="form-input"
					bind:value={item.url}
					placeholder={item.kind === 'video'
						? 'https://youtube.com/watch?v=…'
						: 'https://example.com/photo.jpg'}
					aria-label={$t('admin.editor.mediaUrl')}
					data-testid="{testIdPrefix}-media-url-input-{i}"
				/>

				<input
					type="text"
					class="form-input"
					bind:value={item.alt}
					placeholder={$t('admin.editor.mediaAlt')}
					aria-label={$t('admin.editor.mediaAlt')}
					data-testid="{testIdPrefix}-media-alt-input-{i}"
				/>

				<button
					type="button"
					class="btn btn-sm btn-outline"
					onclick={() => посунути(i, -1)}
					disabled={i === 0}
					aria-label={$t('admin.editor.mediaUp')}
					data-testid="{testIdPrefix}-media-up-btn-{i}"
				>
					<ArrowUp size={14} />
				</button>
				<button
					type="button"
					class="btn btn-sm btn-outline"
					onclick={() => посунути(i, 1)}
					disabled={i === items.length - 1}
					aria-label={$t('admin.editor.mediaDown')}
					data-testid="{testIdPrefix}-media-down-btn-{i}"
				>
					<ArrowDown size={14} />
				</button>
				<button
					type="button"
					class="btn btn-sm btn-outline"
					onclick={() => прибрати(i)}
					aria-label={$t('admin.editor.mediaRemove')}
					data-testid="{testIdPrefix}-media-remove-btn-{i}"
				>
					<Trash2 size={14} />
				</button>
			</li>
		{/each}
	</ul>

	<div class="media-editor__add">
		<button
			type="button"
			class="btn btn-sm btn-outline"
			onclick={() => додати('photo')}
			data-testid="{testIdPrefix}-media-add-photo-btn"
		>
			<Plus size={14} />
			{$t('admin.editor.mediaAddPhoto')}
		</button>
		<button
			type="button"
			class="btn btn-sm btn-outline"
			onclick={() => додати('video')}
			data-testid="{testIdPrefix}-media-add-video-btn"
		>
			<Plus size={14} />
			{$t('admin.editor.mediaAddVideo')}
		</button>
	</div>
</div>

<style>
	.media-editor {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.media-editor__settings {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto minmax(0, 1fr);
		gap: 0.5rem 0.75rem;
		align-items: center;
	}

	.media-editor__hint {
		margin: 0;
		font-size: 0.75rem;
		opacity: 0.6;
	}

	.media-editor__list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	/* Рядок: значок, адреса, підпис, три кнопки. Адресі — удвічі більше місця,
	   ніж підпису: помилка в ній видніша й правиться частіше. */
	.media-editor__row {
		display: grid;
		grid-template-columns: auto minmax(0, 2fr) minmax(0, 1fr) auto auto auto;
		gap: 0.5rem;
		align-items: center;
	}

	.media-editor__kind {
		display: inline-flex;
		opacity: 0.6;
	}

	.media-editor__add {
		display: flex;
		gap: 0.5rem;
	}

	@media (max-width: 768px) {
		.media-editor__settings,
		.media-editor__row {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
