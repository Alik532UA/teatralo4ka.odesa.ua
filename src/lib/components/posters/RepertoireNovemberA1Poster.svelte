<script lang="ts">
	import { onMount } from 'svelte';
	import RepertoireA1Sheet, {
		type RepertoireBgKey,
		type RepertoireLayoutKey
	} from './repertoire-a1/RepertoireA1Sheet.svelte';
	import { Check, Printer } from 'lucide-svelte';

	interface Props {
		isEn?: boolean;
		themeId?: string;
		onSelectTheme?: (themeId: string) => void;
	}

	let { isEn = false, themeId = 'uart-dark', onSelectTheme }: Props = $props();

	type AccentKey = 'yellow' | 'white' | 'red';
	let activeAccent = $state<AccentKey>('white');

	let activeBg = $state<RepertoireBgKey>('theatre');
	let activeLayout = $state<RepertoireLayoutKey>('merged4');

	onMount(() => {
		const params = new URLSearchParams(window.location.search);
		const variant = params.get('variant') || params.get('layout');
		if (variant === 'timeline' || variant === 'timeline5' || variant === '5') {
			activeLayout = 'timeline5';
		} else if (variant === 'merged' || variant === 'merged4' || variant === '4') {
			activeLayout = 'merged4';
		}
	});

	$effect(() => {
		if (themeId === 'uart-dark') activeBg = 'theatre';
		else if (themeId === 'uart-black') activeBg = 'black';
		else if (themeId === 'yellow-brand') activeBg = 'yellow';
		else if (themeId === 'uart-light') activeBg = 'white';
		else if (themeId === 'sky-light') activeBg = 'blue';
	});

	function handleSelectBg(bg: RepertoireBgKey, mappedThemeId: string) {
		activeBg = bg;
		if (onSelectTheme) {
			onSelectTheme(mappedThemeId);
		}
	}

	function handleSelectLayout(layout: RepertoireLayoutKey) {
		activeLayout = layout;
		if (typeof window !== 'undefined') {
			const nextUrl = new URL(window.location.href);
			if (layout === 'merged4') {
				nextUrl.searchParams.set('variant', 'merged');
			} else {
				nextUrl.searchParams.delete('variant');
				nextUrl.searchParams.delete('layout');
			}
			window.history.replaceState(null, '', nextUrl.toString());
		}
	}

	type SchoolLogoVariant = 'crest' | 'logo2026';
	let schoolLogoVariant = $state<SchoolLogoVariant>('crest');

	function toggleSchoolLogo() {
		schoolLogoVariant = schoolLogoVariant === 'crest' ? 'logo2026' : 'crest';
	}
</script>

<div class="a1-poster-container" data-testid="repertoire-nov-a1-poster-container">
	<!-- Панель керування виглядом, темами фону та форматом друку -->
	<div class="a1-toolbar" data-testid="repertoire-nov-a1-toolbar">
		<!-- 1. Варіант афіші: 5 подій (хронологія) або 4 події (об'єднані дати) -->
		<div class="toolbar-cluster">
			<span class="toolbar-cluster-label">{isEn ? 'Variant:' : 'Варіант:'}</span>
			<div class="toggle-btn-group" role="tablist" aria-label={isEn ? 'Poster layout variant' : 'Варіант розмітки'}>
				<button
					type="button"
					role="tab"
					aria-selected={activeLayout === 'timeline5'}
					class="toggle-opt-btn"
					class:toggle-opt-btn--active={activeLayout === 'timeline5'}
					onclick={() => handleSelectLayout('timeline5')}
					title={isEn ? '5 shows in chronological order' : '5 показів за хронологією дат'}
					data-testid="rep-a1-layout-timeline5-btn"
				>
					{isEn ? '5 Shows' : '5 показів'}
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={activeLayout === 'merged4'}
					class="toggle-opt-btn"
					class:toggle-opt-btn--active={activeLayout === 'merged4'}
					onclick={() => handleSelectLayout('merged4')}
					title={isEn ? '4 performances with merged Syrnyk dates' : '4 вистави з обʼєднаними датами Сирника'}
					data-testid="rep-a1-layout-merged4-btn"
				>
					{isEn ? '4 Shows' : '4 вистави'}
				</button>
			</div>
		</div>

		<!-- 2. Фоновий колір: 5 варіантів (театральний темний, чорний, жовтий, білий, блакитний) -->
		<div class="toolbar-cluster">
			<span class="toolbar-cluster-label">{isEn ? 'Background:' : 'Фон:'}</span>
			<div class="swatch-group" role="tablist" aria-label={isEn ? 'Poster background' : 'Фон афіші'}>
				<!-- Театральний темний (#171118) -->
				<button
					type="button"
					role="tab"
					aria-selected={activeBg === 'theatre'}
					class="swatch-btn swatch-btn--dark"
					class:swatch-btn--active={activeBg === 'theatre'}
					style="background-color: #171118;"
					onclick={() => handleSelectBg('theatre', 'uart-dark')}
					title={isEn ? 'Theatrical dark (#171118)' : 'Театральний темний (#171118)'}
					aria-label={isEn ? 'Theatrical dark background' : 'Театральний темний фон'}
					data-testid="rep-a1-bg-theatre-btn"
				>
					{#if activeBg === 'theatre'}
						<Check size={14} color="#ffffff" strokeWidth={3} aria-hidden="true" />
					{/if}
				</button>

				<!-- Глибокий чорний (#000000) -->
				<button
					type="button"
					role="tab"
					aria-selected={activeBg === 'black'}
					class="swatch-btn swatch-btn--dark"
					class:swatch-btn--active={activeBg === 'black'}
					style="background-color: #000000;"
					onclick={() => handleSelectBg('black', 'uart-black')}
					title={isEn ? 'Deep black (#000000)' : 'Глибокий чорний (#000000)'}
					aria-label={isEn ? 'Deep black background' : 'Глибокий чорний фон'}
					data-testid="rep-a1-bg-black-btn"
				>
					{#if activeBg === 'black'}
						<Check size={14} color="#ffffff" strokeWidth={3} aria-hidden="true" />
					{/if}
				</button>

				<!-- Фірмовий жовтий (#ffed00) -->
				<button
					type="button"
					role="tab"
					aria-selected={activeBg === 'yellow'}
					class="swatch-btn"
					class:swatch-btn--active={activeBg === 'yellow'}
					style="background-color: #ffed00;"
					onclick={() => handleSelectBg('yellow', 'yellow-brand')}
					title={isEn ? 'Brand yellow (#ffed00)' : 'Фірмовий жовтий (#ffed00)'}
					aria-label={isEn ? 'Brand yellow background' : 'Фірмовий жовтий фон'}
					data-testid="rep-a1-bg-yellow-btn"
				>
					{#if activeBg === 'yellow'}
						<Check size={14} color="#111827" strokeWidth={3} aria-hidden="true" />
					{/if}
				</button>

				<!-- Білий папір (#ffffff) -->
				<button
					type="button"
					role="tab"
					aria-selected={activeBg === 'white'}
					class="swatch-btn"
					class:swatch-btn--active={activeBg === 'white'}
					style="background-color: #ffffff;"
					onclick={() => handleSelectBg('white', 'uart-light')}
					title={isEn ? 'Paper white (#ffffff)' : 'Білий аркуш (#ffffff)'}
					aria-label={isEn ? 'Paper white background' : 'Білий фон'}
					data-testid="rep-a1-bg-white-btn"
				>
					{#if activeBg === 'white'}
						<Check size={14} color="#111827" strokeWidth={3} aria-hidden="true" />
					{/if}
				</button>

				<!-- Блакитний (#cfe2f3) -->
				<button
					type="button"
					role="tab"
					aria-selected={activeBg === 'blue'}
					class="swatch-btn"
					class:swatch-btn--active={activeBg === 'blue'}
					style="background-color: #cfe2f3;"
					onclick={() => handleSelectBg('blue', 'sky-light')}
					title={isEn ? 'Light blue (#cfe2f3)' : 'Блакитний (#cfe2f3)'}
					aria-label={isEn ? 'Light blue background' : 'Блакитний фон'}
					data-testid="rep-a1-bg-blue-btn"
				>
					{#if activeBg === 'blue'}
						<Check size={14} color="#0f172a" strokeWidth={3} aria-hidden="true" />
					{/if}
				</button>
			</div>
		</div>

		<!-- 3. Колірний акцент: жовтий, білий, червоний -->
		<div class="toolbar-cluster">
			<span class="toolbar-cluster-label">{isEn ? 'Accent:' : 'Акцент:'}</span>
			<div class="swatch-group" role="tablist" aria-label={isEn ? 'Accent color' : 'Колір акценту'}>
				<button
					type="button"
					role="tab"
					aria-selected={activeAccent === 'yellow'}
					class="swatch-btn"
					class:swatch-btn--active={activeAccent === 'yellow'}
					style="background-color: #ffed00;"
					onclick={() => (activeAccent = 'yellow')}
					title={isEn ? 'Yellow accent (#ffed00)' : 'Жовтий акцент (#ffed00)'}
					aria-label={isEn ? 'Yellow accent' : 'Жовтий акцент'}
					data-testid="rep-a1-accent-yellow-btn"
				>
					{#if activeAccent === 'yellow'}
						<Check size={14} color="#111827" strokeWidth={3} aria-hidden="true" />
					{/if}
				</button>

				<button
					type="button"
					role="tab"
					aria-selected={activeAccent === 'white'}
					class="swatch-btn"
					class:swatch-btn--active={activeAccent === 'white'}
					style="background-color: #ffffff;"
					onclick={() => (activeAccent = 'white')}
					title={isEn ? 'White accent (#ffffff)' : 'Білий акцент (#ffffff)'}
					aria-label={isEn ? 'White accent' : 'Білий акцент'}
					data-testid="rep-a1-accent-white-btn"
				>
					{#if activeAccent === 'white'}
						<Check size={14} color="#111827" strokeWidth={3} aria-hidden="true" />
					{/if}
				</button>

				<button
					type="button"
					role="tab"
					aria-selected={activeAccent === 'red'}
					class="swatch-btn"
					class:swatch-btn--active={activeAccent === 'red'}
					style="background-color: #dc2626;"
					onclick={() => (activeAccent = 'red')}
					title={isEn ? 'Red accent (#dc2626)' : 'Червоний акцент (#dc2626)'}
					aria-label={isEn ? 'Red accent' : 'Червоний акцент'}
					data-testid="rep-a1-accent-red-btn"
				>
					{#if activeAccent === 'red'}
						<Check size={14} color="#ffffff" strokeWidth={3} aria-hidden="true" />
					{/if}
				</button>
			</div>
		</div>

		<!-- 4. Логотип школи та формат -->
		<div class="toolbar-side">
			<div class="logo-toggle-wrap">
				<span class="logo-toggle-label">{isEn ? 'Logo:' : 'Логотип:'}</span>
				<div class="logo-btn-group">
					<button
						type="button"
						class="logo-opt-btn"
						class:logo-opt-btn--active={schoolLogoVariant === 'crest'}
						onclick={() => (schoolLogoVariant = 'crest')}
						data-testid="rep-a1-logo-crest-btn"
					>
						{isEn ? 'Crest' : 'Герб'}
					</button>
					<button
						type="button"
						class="logo-opt-btn"
						class:logo-opt-btn--active={schoolLogoVariant === 'logo2026'}
						onclick={() => (schoolLogoVariant = 'logo2026')}
						data-testid="rep-a1-logo-2026-btn"
					>
						{isEn ? '2026' : '2026'}
					</button>
				</div>
			</div>

			<div class="a1-badge-hint">
				<Printer size={13} aria-hidden="true" />
				<span>{isEn ? 'A1 (594 × 841 mm)' : 'A1 (594 × 841 мм)'}</span>
			</div>
		</div>
	</div>

	<!-- Область аркуша A1 -->
	<div class="a1-poster-frame">
		<RepertoireA1Sheet
			{isEn}
			bgVariant={activeBg}
			accentVariant={activeAccent}
			layoutVariant={activeLayout}
			{schoolLogoVariant}
			onToggleLogo={toggleSchoolLogo}
		/>
	</div>
</div>

<style>
	.a1-poster-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		width: 100%;
	}

	.a1-toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		width: 100%;
		max-width: 840px;
		background: var(--bg-card);
		border: 1px solid var(--color-border);
		border-radius: 14px;
		padding: 8px 14px;
		box-sizing: border-box;
	}

	.toolbar-cluster {
		display: inline-flex;
		align-items: center;
		gap: 8px;
	}

	.toolbar-cluster-label {
		font-size: 0.78rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
	}

	.toggle-btn-group,
	.logo-btn-group {
		display: inline-flex;
		border: 1px solid var(--color-border);
		border-radius: 999px;
		overflow: hidden;
		background: var(--bg-card);
	}

	.toggle-opt-btn,
	.logo-opt-btn {
		background: transparent;
		border: none;
		color: var(--text-muted);
		font-size: 0.76rem;
		font-weight: 700;
		padding: 4px 10px;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.toggle-opt-btn:hover,
	.logo-opt-btn:hover {
		color: var(--text-title);
	}

	.toggle-opt-btn--active,
	.logo-opt-btn--active {
		background: var(--accent-primary, #00b5ec);
		color: var(--text-on-accent, #0f172a);
	}

	.swatch-group {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}

	.swatch-btn {
		width: 26px;
		height: 26px;
		border-radius: 50%;
		border: 2px solid var(--color-border);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		transition: transform 0.12s ease, border-color 0.15s ease, box-shadow 0.15s ease;
		box-sizing: border-box;
		position: relative;
	}

	.swatch-btn:hover {
		transform: scale(1.12);
	}

	.swatch-btn--active {
		border-color: #38bdf8;
		box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.5);
		transform: scale(1.08);
	}

	.swatch-btn--dark {
		border-color: rgba(255, 255, 255, 0.4);
	}

	.toolbar-side {
		display: flex;
		align-items: center;
		gap: 14px;
		flex-wrap: wrap;
	}

	.logo-toggle-wrap {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}

	.logo-toggle-label {
		font-size: 0.78rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
	}

	.a1-badge-hint {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 0.76rem;
		font-weight: 700;
		color: var(--text-muted);
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid var(--color-border);
		padding: 4px 10px;
		border-radius: 999px;
	}

	.a1-poster-frame {
		width: 100%;
		max-width: 840px;
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
		border-radius: 8px;
		overflow: hidden;
	}

	@media print {
		.a1-toolbar {
			display: none !important;
		}

		.a1-poster-container {
			gap: 0 !important;
			padding: 0 !important;
			margin: 0 !important;
			width: 100% !important;
		}

		.a1-poster-frame {
			max-width: none !important;
			width: 100% !important;
			box-shadow: none !important;
			border-radius: 0 !important;
		}
	}
</style>
