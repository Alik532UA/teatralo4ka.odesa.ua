<script lang="ts">
	import { t } from "svelte-i18n";
	import { Flower2, Plus } from "lucide-svelte";
	import GraduatePhotoModal from "$lib/components/GraduatePhotoModal.svelte";
	import GraduatePhotoContextMenu from "$lib/components/GraduatePhotoContextMenu.svelte";
	import {
		graduatePhoto,
		graduatePhotoSrcset,
		allGraduatePhotos,
		type GraduateIndexEntry,
	} from "$lib/data/graduates";

	interface Props {
		graduate: GraduateIndexEntry;
	}

	let { graduate }: Props = $props();

	const photoCount = $derived(graduate.photoCount ?? 1);
	const profilePhotos = $derived(
		photoCount > 1 ? allGraduatePhotos(graduate.slug, photoCount, 480) : [],
	);
	let activePhotoIndex = $state(0);

	$effect(() => {
		if (profilePhotos.length > 0) activePhotoIndex = profilePhotos.length - 1;
		else activePhotoIndex = 0;
	});

	function setPhoto(index: number) { activePhotoIndex = index; }

	let photoModalOpen = $state(false);
	let photoModalAction = $state<'replace' | 'add' | null>(null);
	let contextMenuOpen = $state(false);
	let contextMenuPos = $state({ x: 0, y: 0 });
	let containerEl = $state<HTMLElement | null>(null);

	function openPhotoModal(action: 'replace' | 'add' | null = null) {
		photoModalAction = action;
		photoModalOpen = true;
	}

	function handlePhotoClick() {
		if (photoCount > 1 && profilePhotos.length > 1) {
			activePhotoIndex = (activePhotoIndex + 1) % profilePhotos.length;
		} else {
			activePhotoIndex = activePhotoIndex === 0 ? 1 : 0;
		}
	}

	function handlePlaceholderClick() {
		activePhotoIndex = activePhotoIndex === 1 ? 0 : 1;
	}

	function handleAvatarContextMenu(e: MouseEvent) {
		e.preventDefault();
		if (containerEl) {
			const rect = containerEl.getBoundingClientRect();
			const rawX = e.clientX - rect.left;
			const rawY = e.clientY - rect.top;
			contextMenuPos = {
				x: Math.max(0, Math.min(rawX, rect.width - 195)),
				y: Math.max(0, rawY)
			};
		} else {
			contextMenuPos = { x: 0, y: 0 };
		}
		contextMenuOpen = true;
	}
</script>

<div class="photo-container" bind:this={containerEl}>
	{#if graduate.hasPhoto}
		<span class="photo-stack" data-testid="galaxy-card-photo-stack">
			{#if photoCount > 1}
				<button
					type="button"
					class="photo-open"
					onclick={handlePhotoClick}
					oncontextmenu={handleAvatarContextMenu}
					aria-label={$t('galaxy.switchPhoto', { default: `Змінити фото: ${graduate.name}` })}
					data-testid="galaxy-card-photo-open-btn"
				>
					{#each profilePhotos as photo, i (i)}
						<img
							class="photo photo--stacked"
							class:photo--active={i === activePhotoIndex}
							class:photo--behind={i !== activePhotoIndex}
							style="--stack-offset: {i - activePhotoIndex}; --stack-depth: {Math.abs(i - activePhotoIndex)}"
							src={photo.src}
							srcset={photo.srcset}
							sizes="(max-width: 520px) 40vw, 175px"
							width="175"
							height="175"
							alt={i === activePhotoIndex ? graduate.name : ""}
							loading={i === 0 ? "eager" : "lazy"}
							data-testid="galaxy-card-img-{i}"
						/>
					{/each}
				</button>
			{:else}
				<button
					type="button"
					class="photo photo--stacked photo-open"
					class:photo--active={activePhotoIndex === 0}
					class:photo--behind={activePhotoIndex !== 0}
					style="--stack-offset: {0 - activePhotoIndex}; --stack-depth: {Math.abs(0 - activePhotoIndex)}"
					onclick={handlePhotoClick}
					oncontextmenu={handleAvatarContextMenu}
					aria-label={$t('galaxy.openPhoto', { default: `Фото: ${graduate.name}` })}
					data-testid="galaxy-card-single-photo-open-btn"
				>
					<img
						class="photo-img"
						src={graduatePhoto(graduate.slug, 480)}
						srcset={graduatePhotoSrcset(graduate.slug)}
						sizes="(max-width: 520px) 40vw, 175px"
						width="175"
						height="175"
						alt={graduate.name}
						data-testid="galaxy-card-img"
					/>
				</button>
				<div
					class="photo photo--stacked photo-placeholder"
					class:photo--active={activePhotoIndex === 1}
					class:photo--behind={activePhotoIndex !== 1}
					style="--stack-offset: {1 - activePhotoIndex}; --stack-depth: {Math.abs(1 - activePhotoIndex)}"
					onclick={handlePlaceholderClick}
					oncontextmenu={handleAvatarContextMenu}
					role="presentation"
					data-testid="galaxy-card-photo-placeholder"
				>
					<button
						type="button"
						class="placeholder-add-btn"
						onclick={(e) => {
							e.stopPropagation();
							openPhotoModal('add');
						}}
						aria-label={$t('galaxy.addPhoto', { default: 'Додати фото' })}
						data-testid="galaxy-card-add-photo-btn"
					>
						<Plus size={36} aria-hidden="true" />
					</button>
				</div>
			{/if}
		</span>

		<div class="photo-dots" data-testid="galaxy-card-photo-dots">
			{#if photoCount > 1}
				{#each profilePhotos as _, i (i)}
					<button
						type="button"
						class="photo-dot"
						class:photo-dot--active={i === activePhotoIndex}
						onclick={(e) => {
							e.stopPropagation();
							setPhoto(i);
						}}
						aria-label="Photo {i + 1}"
						data-testid="galaxy-card-photo-btn-{i}"
					></button>
				{/each}
			{:else}
				<button
					type="button"
					class="photo-dot"
					class:photo-dot--active={activePhotoIndex === 0}
					onclick={(e) => {
						e.stopPropagation();
						setPhoto(0);
					}}
					aria-label="Photo 1"
					data-testid="galaxy-card-photo-btn-0"
				></button>
				<button
					type="button"
					class="photo-dot"
					class:photo-dot--active={activePhotoIndex === 1}
					onclick={(e) => {
						e.stopPropagation();
						setPhoto(1);
					}}
					aria-label="Photo 2"
					data-testid="galaxy-card-photo-btn-1"
				></button>
			{/if}
		</div>
	{:else if graduate.kind === 'student'}
		<button
			type="button"
			class="bloom"
			onclick={() => openPhotoModal('add')}
			oncontextmenu={handleAvatarContextMenu}
			aria-label={$t('galaxy.addPhoto', { default: `Додати фото: ${graduate.name}` })}
			data-testid="galaxy-card-bloom"
		>
			<Flower2 size={44} aria-hidden="true" />
		</button>
	{:else}
		<button
			type="button"
			class="star"
			onclick={() => openPhotoModal('add')}
			oncontextmenu={handleAvatarContextMenu}
			aria-label={$t('galaxy.addPhoto', { default: `Додати фото: ${graduate.name}` })}
			data-testid="galaxy-card-star"
		></button>
	{/if}

	<GraduatePhotoContextMenu
		isOpen={contextMenuOpen}
		x={contextMenuPos.x}
		y={contextMenuPos.y}
		hasPhoto={graduate.hasPhoto}
		onclose={() => (contextMenuOpen = false)}
		onreplace={() => openPhotoModal('replace')}
		onadd={() => openPhotoModal('add')}
	/>
</div>

<GraduatePhotoModal
	isOpen={photoModalOpen}
	initialAction={photoModalAction}
	hasPhoto={graduate.hasPhoto}
	onclose={() => (photoModalOpen = false)}
	_graduateName={graduate.name}
/>

<style>
	.photo-container { position: relative; display: flex; flex-direction: column; align-items: center; margin-bottom: 0.65rem; }
	.photo-open { display: block; padding: 0; border: none; background: none; cursor: pointer; border-radius: 50%; }
	.photo-stack { position: relative; width: clamp(100px, 40vw, 175px); height: clamp(100px, 40vw, 175px); margin: 0 0 0.65rem; display: block; }
	.photo { display: block; width: clamp(100px, 40vw, 175px); height: clamp(100px, 40vw, 175px); border-radius: 50%; object-fit: cover; border: 2px solid rgb(140 190 255 / 0.45); box-shadow: 0 4px 16px rgb(0 0 0 / 0.4); box-sizing: border-box; }
	.photo-img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: block; }
	.photo--stacked { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.35s ease, z-index 0s; }
	.photo--active { z-index: 20; opacity: 1; transform: translate(0, 0) rotate(0deg) scale(1); }
	.photo--behind { z-index: calc(10 - var(--stack-depth)); opacity: 0.7; transform: translate(calc(var(--stack-offset) * 18px), calc(var(--stack-offset) * 6px)) rotate(calc(var(--stack-offset) * 4deg)) scale(0.92); filter: brightness(0.8); }
	.photo-stack:hover .photo--behind { opacity: 0.85; transform: translate(calc(var(--stack-offset) * 22px), calc(var(--stack-offset) * 8px)) rotate(calc(var(--stack-offset) * 5deg)) scale(0.94); }
	.photo-placeholder { display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at center, rgb(20 40 75 / 0.8) 0%, rgb(7 19 36 / 0.95) 75%); border: 2px dashed rgb(140 190 255 / 0.45); border-radius: 50%; box-sizing: border-box; cursor: pointer; }
	.placeholder-add-btn { display: flex; align-items: center; justify-content: center; width: 56px; height: 56px; border-radius: 50%; border: 1.5px solid rgb(140 190 255 / 0.5); background: rgb(140 190 255 / 0.15); color: rgb(180 215 255 / 0.95); cursor: pointer; padding: 0; transition: all 0.2s ease; }
	.placeholder-add-btn:hover { background: rgb(140 190 255 / 0.35); color: #fff; border-color: rgb(140 190 255 / 0.9); transform: scale(1.1); box-shadow: 0 0 16px rgb(140 190 255 / 0.45); }
	.photo-dots { display: flex; justify-content: center; gap: 0.4rem; margin: 0 0 0.4rem; }
	.photo-dot { width: 10px; height: 10px; border-radius: 50%; border: 1.5px solid rgb(140 190 255 / 0.5); background: transparent; padding: 0; cursor: pointer; transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease; }
	.photo-dot--active { background: rgb(140 190 255 / 0.85); border-color: rgb(140 190 255 / 0.9); transform: scale(1.2); }
	.photo-dot:hover:not(.photo-dot--active) { background: rgb(140 190 255 / 0.35); border-color: rgb(140 190 255 / 0.7); }
	.bloom, .star { cursor: pointer; padding: 0; }
	.bloom { display: grid; place-items: center; width: 96px; height: 96px; margin: 0 auto 0.5rem; border-radius: 50%; background: var(--bg-surface, rgb(255 255 255 / 0.06)); border: 2px solid color-mix(in srgb, var(--accent-primary, #38bdf8) 55%, transparent); color: var(--accent-text, #7dd3fc); }
	.star { display: block; width: 96px; height: 96px; margin: 0 auto 0.5rem; border-radius: 50%; border: none; background: radial-gradient(circle, rgb(234 242 255 / 0.95) 0 6px, rgb(180 214 255 / 0.35) 12px, transparent 70%); }
</style>
