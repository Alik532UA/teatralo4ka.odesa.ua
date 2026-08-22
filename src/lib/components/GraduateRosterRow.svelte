<script lang="ts">
	import { t } from 'svelte-i18n';
	import { graduatePhoto, graduatePhotoSrcset, type GraduateIndexEntry } from '$lib/data/graduates';
	import DepartmentIcon from '$lib/components/icons/DepartmentIcon.svelte';

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
	class:row--photo={graduate.hasPhoto}
	class:row--plain={!graduate.hasPhoto}
	onclick={onselect}
	data-testid="galaxy-roster-{graduate.slug}-btn"
>
	{#if graduate.hasPhoto}
		<img
			class="row__photo"
			src={graduatePhoto(graduate.slug, 96)}
			srcset={graduatePhotoSrcset(graduate.slug)}
			sizes="38px"
			width="38"
			height="38"
			loading="lazy"
			decoding="async"
			alt=""
		/>
	{:else}
		<span class="row__dot" aria-hidden="true"></span>
	{/if}
	<span class="row__name">{graduate.name}</span>
	{#if graduate.departments && graduate.departments.length > 0}
		<span class="row__depts" aria-hidden="true">
			{#each graduate.departments as dept}
				<span class="row__dept" title={$t(`galaxy.departments.${dept}`, { default: dept })}>
					<DepartmentIcon department={dept} size={graduate.hasPhoto ? 15 : 13} />
				</span>
			{/each}
		</span>
	{/if}
</button>

<style>
	.row {
		display: flex;
		align-items: center;
		width: 100%;
		min-width: 0;
		border: 1px solid rgb(255 255 255 / 0.09);
		border-radius: 999px;
		background: rgb(255 255 255 / 0.05);
		color: inherit;
		cursor: pointer;
		text-align: left;
		transition: border-color 0.2s ease, background 0.2s ease;
	}

	.row:hover {
		border-color: rgb(140 190 255 / 0.5);
		background: rgb(255 255 255 / 0.11);
	}

	/* Рядки випускників із заповненими анкетами (з фото) */
	.row--photo {
		min-height: 44px;
		padding: 0.25rem 0.75rem 0.25rem 0.35rem;
		gap: 0.6rem;
	}

	.row--photo .row__name {
		font-size: 0.92rem;
		font-weight: 500;
	}

	.row__photo {
		flex-shrink: 0;
		width: 38px;
		height: 38px;
		border-radius: 50%;
		object-fit: cover;
	}

	/* Компактні рядки випускників без заповненої картки */
	.row--plain {
		min-height: 32px;
		padding: 0.2rem 0.65rem 0.2rem 0.6rem;
		gap: 0.45rem;
		background: rgb(255 255 255 / 0.035);
		border-color: rgb(255 255 255 / 0.07);
	}

	.row--plain .row__name {
		font-size: 0.82rem;
		color: rgb(240 246 255 / 0.88);
	}

	.row__dot {
		flex-shrink: 0;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: rgb(200 226 255 / 0.75);
		box-shadow: 0 0 6px rgb(160 210 255 / 0.6);
		margin: 0 1px;
	}

	.row__name {
		min-width: 0;
		overflow-wrap: anywhere;
	}

	.row__depts {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		margin-left: auto;
		flex-shrink: 0;
		opacity: 0.72;
		transition: opacity 0.2s ease, color 0.2s ease;
	}

	.row:hover .row__depts {
		opacity: 1;
		color: var(--accent-primary, #60a5fa);
	}

	.row__dept {
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}
</style>
