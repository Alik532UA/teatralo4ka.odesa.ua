<script lang="ts">
	import { asset } from '$app/paths';
	import { UART_SECRETS_BOOKLET } from '$lib/data/uartSecretsBooklet';

	interface Props {
		isEn?: boolean;
		isLight?: boolean;
		schoolLogoVariant?: 'crest' | 'logo2026';
		onToggleLogo?: () => void;
	}

	let {
		isEn = false,
		isLight = false,
		schoolLogoVariant = 'crest',
		onToggleLogo
	}: Props = $props();

	const data = UART_SECRETS_BOOKLET;
</script>

<article
	class="a1-sheet variant-3"
	class:a1-sheet--light={isLight}
	data-testid="uart-a1-variant3-card"
	aria-label={isEn ? 'A1 Poster Variant 3: Avant-Garde Construct' : 'Афіша A1 Варіант 3: Авангардний модерн'}
>
	<!-- Зображення на 100% площі всієї афіші A1 -->
	<img
		src={asset(data.a1ArtImage)}
		alt={isEn ? 'Too Many Secrets title artwork' : 'Художня афіша «Дуже багато SEкретів»'}
		class="full-bleed-art"
		width="1792"
		height="2400"
		loading="eager"
		decoding="async"
	/>
	<div class="art-scrim" aria-hidden="true"></div>

	<div class="sheet-frame">
		<!-- Шапка: асиметричний лого-блок та велика плашка дати і часу премʼєри -->
		<header class="avant-top">
			<div class="brand-side">
				<div class="brand-logos">
					<img
						src={asset('/posters/uart-logo-dark.webp')}
						alt={isEn ? 'Educational Theatre UArt' : 'Навчальний театр «UArt»'}
						class="av-logo"
						width="600" height="493" loading="eager" decoding="async"
					/>
					<button
						type="button"
						class="logo-action-btn"
						onclick={onToggleLogo}
						disabled={!onToggleLogo}
						data-testid="uart-a1-v3-logo-toggle-btn"
						title={onToggleLogo ? (isEn ? 'Switch logo' : 'Змінити логотип') : undefined}
					>
						<img
							src={asset(schoolLogoVariant === 'logo2026' ? '/logo/svg/t4_logo_2026.svg' : '/posters/teatralo4ka-crest-dark.svg')}
							alt={isEn ? 'Odesa Theatre School' : 'Одеська театральна школа'}
							class="av-logo"
							width="450" height="450" loading="eager" decoding="async"
						/>
					</button>
					<img
						src={asset('/posters/pro-teatr-logo-dark.webp')}
						alt={isEn ? 'NGO PRO.THEATRE' : 'ГО «PRO.ТЕАТР»'}
						class="av-logo av-logo--pro"
						width="800" height="89" loading="eager" decoding="async"
					/>
				</div>
				<div class="pres-lines">
					<p class="pres-l1">{isEn ? data.presentersEn[0] : data.presentersUk[0]}</p>
					<p class="pres-l2">
						{isEn
							? `${data.presentersEn[1]} · ${data.presentersEn[2]} · ${data.presentersEn[3]}`
							: `${data.presentersUk[1]} · ${data.presentersUk[2]} · ${data.presentersUk[3]}`}
					</p>
				</div>
			</div>

			<div class="avant-date-chip">
				<span class="chip-kicker">{isEn ? 'PREMIERE' : 'ПРЕМ’ЄРА'}</span>
				<span class="chip-main-date">{isEn ? `7 NOV · ${data.premiereTime}` : `7 ЛИСТОПАДА · ${data.premiereTime}`}</span>
				<div class="chip-tags">
					<span class="tag-y">2026</span>
					<span class="tag-a">{data.ageBadge}</span>
					<span class="tag-d">{data.durationUk}</span>
				</div>
			</div>
		</header>

		<!-- Простір для назви та 8 портретів з зображення -->
		<div class="art-hero-spacer" aria-hidden="true"></div>

		<!-- Титр режисера та автора в модерному стилі -->
		<section class="avant-director-strip">
			<div class="dir-accent-box">
				<h1 class="dir-heading">{isEn ? data.directorEn : data.directorUk}</h1>
				<p class="dir-subheading">
					{#if isEn}
						Based on the play by Nina Zakhozhenko and co-authors <span class="txt-hl">“Sex Education”</span>
					{:else}
						за п’єсою Ніни Захоженко та співавторок <span class="txt-hl">«Статеве виховання»</span>
					{/if}
				</p>
			</div>
		</section>

		<!-- Конструктивистська сітка карток -->
		<main class="cards-grid">
			<section class="grid-card cast-panel">
				<h2 class="panel-header">{isEn ? 'Cast & Performers:' : 'Дійові особи та виконавці:'}</h2>
				<ul class="clean-ul" role="list">
					{#each data.cast as item, idx (idx)}
						{#if item.characterUk.includes('\n')}
							{@const lines = (isEn ? item.characterEn : item.characterUk).split('\n')}
							<li class="c-line c-line--two">
								<div class="c-sub1"><span class="role-t">{lines[0]}</span></div>
								<div class="c-sub2">
									<span class="role-t">{lines[1]}</span>
									<span class="dot-spacer" aria-hidden="true"></span>
									<span class="actor-t">{isEn ? item.actorEn : item.actorUk}</span>
								</div>
							</li>
						{:else}
							<li class="c-line">
								<span class="role-t">{isEn ? item.characterEn : item.characterUk}</span>
								<span class="dot-spacer" aria-hidden="true"></span>
								<span class="actor-t">{isEn ? item.actorEn : item.actorUk}</span>
							</li>
						{/if}
					{/each}
				</ul>
			</section>

			<section class="grid-card team-panel">
				<div class="sec-unit">
					<h2 class="panel-header">{isEn ? 'Production Team:' : 'Постановники та команда:'}</h2>
					<ul class="clean-ul" role="list">
						{#each data.crew as item, idx (idx)}
							{@const names = (isEn ? item.namesEn : item.namesUk).split('\n')}
							<li class="team-bullet">
								<span class="role-lead">{isEn ? item.roleEn : item.roleUk} –</span>
								<span class="name-lead">{names.join(', ')}</span>
							</li>
						{/each}
					</ul>
				</div>

				<div class="sec-unit">
					<h3 class="panel-sub-header">{isEn ? 'Pedagogical Faculty:' : 'Педагоги:'}</h3>
					<ul class="clean-ul" role="list">
						{#each data.teachers as item, idx (idx)}
							<li class="team-bullet">
								<span class="role-lead">{isEn ? item.roleEn : item.roleUk} –</span>
								<span class="name-lead">{isEn ? item.namesEn : item.namesUk}</span>
							</li>
						{/each}
					</ul>
				</div>

				<div class="sec-unit">
					<h3 class="panel-sub-header">{isEn ? 'Administration:' : 'Адміністрація:'}</h3>
					<p class="admin-txt">{isEn ? data.administrationNamesEn : data.administrationNamesUk}</p>
				</div>
			</section>
		</main>

		<!-- Підвал з художнім керівником -->
		<footer class="avant-footer">
			<div class="theatre-badge-btm">
				<span class="badge-theatre-name">{isEn ? data.theatreEn : data.theatreUk}</span>
			</div>
			<p class="dir-sign-off">
				{isEn ? data.artisticDirectorEn : data.artisticDirectorUk}
			</p>
		</footer>
	</div>
</article>

<style>
	.a1-sheet {
		box-sizing: border-box;
		position: relative;
		width: 100%;
		height: 100%;
		aspect-ratio: 594 / 841;
		background: #000000;
		color: #ffffff;
		font-family: 'e-Ukraine', var(--font-body), sans-serif;
		container-type: inline-size;
		overflow: hidden;
	}
	.a1-sheet--light { color: #111827; }

	.full-bleed-art {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: top center;
		z-index: 0;
		display: block;
	}

	.art-scrim {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			180deg,
			rgba(0, 0, 0, 0.72) 0%,
			transparent 14%,
			transparent 45%,
			rgba(0, 0, 0, 0.85) 58%,
			rgba(0, 0, 0, 0.98) 100%
		);
		z-index: 1;
		pointer-events: none;
	}

	.sheet-frame {
		position: relative;
		z-index: 2;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		height: 100%;
		box-sizing: border-box;
		padding: 2.2cqi 3cqi 2cqi;
	}

	.avant-top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 2cqi;
		background: rgba(0, 0, 0, 0.8);
		backdrop-filter: blur(8px);
		border: 1.5px solid rgba(255, 237, 0, 0.4);
		border-radius: 12px;
		padding: 0.8cqi 1.6cqi;
	}
	.brand-side { display: flex; flex-direction: column; gap: 0.4cqi; }
	.brand-logos { display: flex; align-items: center; gap: 2.4cqi; height: 3.2cqi; }
	.av-logo { height: 100%; width: auto; object-fit: contain; }
	.av-logo--pro { max-width: 16cqi; }
	.logo-action-btn { background: none; border: none; padding: 0; height: 100%; cursor: pointer; display: flex; align-items: center; }

	.pres-lines { line-height: 1.25; }
	.pres-l1 { margin: 0; font-size: 1.05cqi; color: #cbd5e1; }
	.pres-l2 { margin: 0.15cqi 0 0; font-size: 1.05cqi; font-weight: 700; color: #ffed00; }

	.avant-date-chip {
		display: flex; flex-direction: column; align-items: flex-end; justify-content: center;
		background: #dc2626; color: #ffffff; padding: 0.6cqi 1.4cqi; border-radius: 8px; text-align: right;
	}
	.chip-kicker { font-size: 1.1cqi; font-weight: 800; color: #fef08a; letter-spacing: 0.08em; }
	.chip-main-date { font-size: 1.85cqi; font-weight: 900; letter-spacing: 0.04em; white-space: nowrap; }
	.chip-tags { display: flex; align-items: center; gap: 0.5cqi; margin-top: 0.2cqi; font-size: 1.15cqi; font-weight: 700; }
	.tag-a { background: #000000; color: #ffffff; padding: 0.1cqi 0.5cqi; border-radius: 4px; font-weight: 900; }

	.art-hero-spacer { height: 44cqi; flex-shrink: 0; }

	.avant-director-strip { margin-bottom: 0.6cqi; }
	.dir-accent-box {
		text-align: center; padding: 0.8cqi 1cqi;
		background: rgba(0, 0, 0, 0.72); backdrop-filter: blur(8px);
		border-radius: 8px; border-left: 4px solid #ffed00;
	}
	.dir-heading { margin: 0; font-size: 2.25cqi; font-weight: 900; letter-spacing: 0.06em; color: #ffed00; text-transform: uppercase; }
	.dir-subheading { margin: 0.3cqi 0 0; font-size: 1.5cqi; color: #ffffff; font-weight: 500; }
	.txt-hl { font-weight: 700; color: #ffed00; }

	.cards-grid {
		display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 2.6cqi;
		background: rgba(5, 3, 6, 0.8); backdrop-filter: blur(14px);
		border: 1.5px solid rgba(255, 237, 0, 0.35); border-radius: 12px;
		padding: 1.5cqi 1.8cqi; margin: 0.4cqi 0; flex: 1 1 auto; align-items: start;
	}
	.grid-card { display: flex; flex-direction: column; gap: 1cqi; }
	.panel-header {
		margin: 0 0 0.35cqi; font-size: 1.6cqi; font-weight: 800; letter-spacing: 0.04em; color: #ffed00; text-transform: uppercase;
		border-bottom: 2px solid rgba(255, 237, 0, 0.3); padding-bottom: 0.3cqi;
	}
	.panel-sub-header {
		margin: 0.6cqi 0 0.25cqi; font-size: 1.4cqi; font-weight: 800; color: #ffed00; text-transform: uppercase;
		border-bottom: 1.5px solid rgba(255, 237, 0, 0.2); padding-bottom: 0.2cqi;
	}

	.clean-ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.6cqi; }
	.c-line { display: flex; align-items: baseline; font-size: 1.45cqi; line-height: 1.35; }
	.role-t { font-style: italic; color: #cbd5e1; white-space: nowrap; }
	.dot-spacer { flex: 1; border-bottom: 1.5px dotted rgba(255, 255, 255, 0.35); margin: 0 0.6cqi; transform: translateY(-0.3em); }
	.actor-t { font-weight: 700; color: #ffffff; white-space: nowrap; }
	.c-line--two { flex-direction: column; gap: 0.15cqi; }
	.c-sub2 { display: flex; align-items: baseline; width: 100%; }

	.sec-unit { display: flex; flex-direction: column; }
	.team-bullet { font-size: 1.4cqi; line-height: 1.35; margin-bottom: 0.35cqi; }
	.role-lead { font-weight: 700; color: #e2e8f0; }
	.name-lead { font-weight: 500; color: #ffffff; }
	.admin-txt { margin: 0; font-size: 1.4cqi; }

	.avant-footer {
		display: flex; align-items: center; justify-content: space-between;
		background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(10px);
		border-radius: 10px; border: 1.5px solid rgba(255, 237, 0, 0.3);
		padding: 0.7cqi 1.4cqi; margin-top: 0.4cqi;
	}
	.badge-theatre-name { font-weight: 800; font-size: 1.35cqi; color: #ffed00; letter-spacing: 0.04em; }
	.dir-sign-off { margin: 0; font-size: 1.35cqi; font-weight: 700; color: #e2e8f0; }
</style>
