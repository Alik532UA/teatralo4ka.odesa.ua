<script lang="ts">
	import { graduatePhoto, graduatePhotoSrcset, type GraduateIndexEntry } from '$lib/data/graduates';

	interface Props {
		graduate: GraduateIndexEntry;
		onselect: () => void;
	}

	let { graduate, onselect }: Props = $props();
</script>

<!--
	Один запис переліку. Винесено з `GraduateRoster.svelte` не заради краси: той
	файл при канонічній межі 300 рядків (PROJECT-STRUCTURE-v8 § 7) уже мав 297, а
	стовпчик років і шахова сітка додають більше, ніж лишалося.
-->
<button
	type="button"
	class="row"
	onclick={onselect}
	data-testid="galaxy-roster-{graduate.slug}-btn"
>
	{#if graduate.hasPhoto}
		<img
			class="row__photo"
			src={graduatePhoto(graduate.slug, 96)}
			srcset={graduatePhotoSrcset(graduate.slug)}
			sizes="44px"
			width="44"
			height="44"
			loading="lazy"
			decoding="async"
			alt=""
		/>
	{:else}
		<!-- Та сама зірка без обличчя, що й у галактиці: анкети ще немає. -->
		<span class="row__dot" aria-hidden="true"></span>
	{/if}
	<span class="row__name">{graduate.name}</span>
</button>

<style>
	.row {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		width: 100%;
		min-width: 0;
		/* 44px — власний стандарт цілі дотику; гейт e2e/touch-targets це міряє. */
		min-height: 44px;
		padding: 0.3rem 0.5rem;
		border: 1px solid rgb(255 255 255 / 0.09);
		/* Пігулка, а не трохи скруглений кут: картка стає одним цілим із круглим
		   портретом усередині. */
		border-radius: 999px;
		/* Своє тло, а не прозоре: без нього 482 записи читалися як суцільний
		   список, у якому не видно, де закінчується один випускник. */
		background: rgb(255 255 255 / 0.05);
		color: inherit;
		cursor: pointer;
		text-align: left;
	}

	.row:hover {
		border-color: rgb(140 190 255 / 0.5);
		background: rgb(255 255 255 / 0.11);
	}

	.row__photo {
		flex-shrink: 0;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		object-fit: cover;
	}

	.row__dot {
		flex-shrink: 0;
		/* Займає стільки ж місця, як портрет, щоб рядки не стрибали по ширині. */
		width: 44px;
		height: 44px;
		border-radius: 50%;
		background: radial-gradient(circle, rgb(200 226 255 / 0.85) 0 3px, transparent 4px);
	}

	.row__name {
		min-width: 0;
		overflow-wrap: anywhere;
		font-size: 0.9rem;
	}

</style>
