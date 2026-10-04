<script lang="ts">
	import { asset } from '$app/paths';
	import { locale } from 'svelte-i18n';

	interface Props {
		testIdPrefix?: string;
	}

	let { testIdPrefix = 'brand-toc' }: Props = $props();

	const isEn = $derived($locale === 'en');

	interface TocSection {
		id: string;
		nameUk: string;
		nameEn: string;
		type: 'img' | 'palette' | 'type';
		src?: string;
	}

	const sections: TocSection[] = [
		{ id: 'crest', nameUk: 'Герб', nameEn: 'Crest', type: 'img', src: '/brand/emblem/preview/emblem-color.webp' },
		{ id: 'crest-in-hands', nameUk: 'Герб у долоньках', nameEn: 'Crest in Hands', type: 'img', src: '/brand/big-emblem/preview/big-emblem-2025-color-color-hands-yellow-bg-text.webp' },
		{ id: 'elements', nameUk: 'Окремі елементи', nameEn: 'Isolated Elements', type: 'img', src: '/brand/elements/preview/element-mask-happy-white.webp' },
		{ id: 'avatars', nameUk: 'Аватарки', nameEn: 'Avatars', type: 'img', src: '/brand/avatar/preview/avatar-round.webp' },
		{ id: 'colors', nameUk: 'Палітра кольорів', nameEn: 'Color Palette', type: 'palette' },
		{ id: 'typography', nameUk: 'Шрифт e-Ukraine', nameEn: 'e-Ukraine Font', type: 'type' },
		{ id: 'particles', nameUk: 'Мікро-частки', nameEn: 'Mini-Icons', type: 'img', src: '/miniIcon/svg/t4_logo_IndividualParticles_MiniIcon08_2026.svg' },
		{ id: 'ai-styles', nameUk: 'AI-стилізації', nameEn: 'AI Stylizations', type: 'img', src: '/brand/ai-remake/romanesque-stone.webp' }
	];

	let activeId = $state<string>('crest');
	let host = $state<HTMLElement | null>(null);

	$effect(() => {
		if (typeof window === 'undefined') return;

		const targets = sections
			.map((s) => document.getElementById(s.id))
			.filter((el): el is HTMLElement => el !== null);

		if (targets.length === 0) return;

		const sync = () => {
			const line = window.innerHeight * 0.35;
			let current = targets[0];
			for (const t of targets) {
				if (t.getBoundingClientRect().top > line) break;
				current = t;
			}
			activeId = current.id;
		};

		let queued = false;
		const onScroll = () => {
			if (queued) return;
			queued = true;
			requestAnimationFrame(() => {
				sync();
				queued = false;
			});
		};

		sync();
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll);
		return () => {
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onScroll);
		};
	});
</script>

<nav
	class="brand-toc"
	bind:this={host}
	aria-label={isEn ? 'Brandbook Contents' : 'Зміст брендбуку'}
	data-testid={`${testIdPrefix}-nav`}
>
	<div class="toc-list" data-testid={`${testIdPrefix}-list`}>
		{#each sections as item (item.id)}
			{@const name = isEn ? item.nameEn : item.nameUk}
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
			<a
				href="#{item.id}"
				class="toc-btn"
				class:active={activeId === item.id}
				aria-current={activeId === item.id ? 'true' : undefined}
				aria-label={name}
				data-testid={`${testIdPrefix}-link-${item.id}-btn`}
			>
				<span class="toc-badge">
					{#if item.type === 'img' && item.src}
						<img
							src={asset(item.src)}
							alt=""
							aria-hidden="true"
							width="40"
							height="40"
							class="toc-img"
							class:toc-img--crest={item.id === 'crest' || item.id === 'crest-in-hands'}
							class:toc-img--particle={item.id === 'particles'}
							loading="lazy"
						/>
					{:else if item.type === 'palette'}
						<div class="toc-palette" aria-hidden="true">
							<span class="dot dot--yellow"></span>
							<span class="dot dot--blue"></span>
							<span class="dot dot--red"></span>
						</div>
					{:else if item.type === 'type'}
						<div class="toc-type" aria-hidden="true">
							<span>eU</span>
						</div>
					{/if}
				</span>

				<span class="toc-tooltip" role="tooltip">
					{name}
				</span>
			</a>
		{/each}
	</div>
</nav>

<style>
	.brand-toc {
		position: sticky;
		top: calc(var(--header-height, 72px) + 2rem);
		align-self: start;
		z-index: 25;
	}

	.toc-list {
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
		background: var(--bg-card, rgba(255, 255, 255, 0.9));
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		padding: 0.6rem;
		border-radius: 18px;
		border: 1px solid var(--color-border);
		box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
		width: fit-content;
	}

	.toc-btn {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 52px;
		height: 52px;
		border-radius: 12px;
		background: var(--color-surface, #ffffff);
		border: 2px solid transparent;
		text-decoration: none;
		transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
		cursor: pointer;
	}

	.toc-btn:hover {
		transform: scale(1.06);
		border-color: var(--accent-text, #00b5ec);
	}

	.toc-btn.active {
		border-color: var(--palette-yellow, #ffed00);
		box-shadow: 0 0 0 3px rgba(255, 237, 0, 0.35);
		background: var(--color-surface, #ffffff);
	}

	.toc-badge {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.35rem;
		box-sizing: border-box;
	}

	.toc-img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		display: block;
	}

	.toc-img--crest {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.toc-img--particle {
		width: 100%;
		height: 100%;
		object-fit: contain;
		transition: filter 0.15s ease;
	}

	:global(html[data-theme='dark']) .toc-img--particle, :global(html[data-theme='dark-cyan']) .toc-img--particle,
	:global(html[data-theme='dark-blue']) .toc-img--particle, :global(html.dark-theme) .toc-img--particle,
	:global(html.dark-cyan-theme) .toc-img--particle, :global(html.dark-blue-theme) .toc-img--particle {
		filter: brightness(0) invert(0.92);
	}

	@media (prefers-color-scheme: dark) {
		:global(html:not([data-theme])) .toc-img--particle { filter: brightness(0) invert(0.92); }
	}

	.toc-palette { display: flex; gap: 3px; align-items: center; justify-content: center; }
	.dot { width: 9px; height: 9px; border-radius: 50%; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2); }
	.dot--yellow { background: #ffed00; }
	.dot--blue { background: #00b5ec; }
	.dot--red { background: #e20413; }

	.toc-type {
		font-family: 'e-Ukraine', sans-serif;
		font-weight: 800;
		font-size: 1.1rem;
		color: var(--text-title);
		letter-spacing: -0.04em;
	}

	.toc-tooltip {
		position: absolute;
		left: calc(100% + 12px);
		top: 50%;
		transform: translateY(-50%) translateX(-6px);
		background: var(--palette-black, #1d1d1d);
		color: #ffffff;
		padding: 0.35rem 0.7rem;
		border-radius: 8px;
		font-size: 0.8rem;
		font-weight: 700;
		white-space: nowrap;
		pointer-events: none;
		opacity: 0;
		visibility: hidden;
		transition: opacity 0.15s ease, transform 0.15s ease, visibility 0.15s ease;
		box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
		z-index: 30;
	}

	.toc-tooltip::before {
		content: '';
		position: absolute;
		right: 100%;
		top: 50%;
		transform: translateY(-50%);
		border: 5px solid transparent;
		border-right-color: var(--palette-black, #1d1d1d);
	}

	.toc-btn:hover .toc-tooltip,
	.toc-btn:focus-visible .toc-tooltip {
		opacity: 1;
		visibility: visible;
		transform: translateY(-50%) translateX(0);
	}

	@media (max-width: 900px) {
		.brand-toc {
			position: sticky;
			top: calc(var(--header-height, 72px) + 0.35rem);
			width: 100%;
			max-width: 100%;
			min-width: 0;
			z-index: 35;
		}

		.toc-list {
			flex-direction: row;
			flex-wrap: nowrap;
			justify-content: space-between;
			overflow-x: auto;
			scrollbar-width: none;
			width: 100%;
			max-width: 100%;
			box-sizing: border-box;
			gap: clamp(2px, 1.2vw, 6px);
			padding: 0.3rem 0.4rem;
			border-radius: 12px;
			background: var(--bg-card, rgba(255, 255, 255, 0.92));
			box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
		}

		.toc-list::-webkit-scrollbar {
			display: none;
		}

		.toc-btn {
			width: clamp(33px, 9vw, 42px);
			height: clamp(33px, 9vw, 42px);
			flex-shrink: 1;
			min-width: 0;
			border-radius: 8px;
		}

		.toc-badge {
			padding: 0.18rem;
		}

		.toc-type {
			font-size: 0.82rem;
		}

		.dot {
			width: 6px;
			height: 6px;
		}

		.toc-tooltip {
			display: none;
		}
	}
</style>
