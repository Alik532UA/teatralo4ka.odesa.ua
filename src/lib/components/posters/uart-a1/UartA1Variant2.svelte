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
	class="a1-sheet variant-2"
	class:a1-sheet--light={isLight}
	data-testid="uart-a1-variant2-card"
	aria-label={isEn ? 'A1 Poster Variant 2: Cinematic Panorama' : 'Афіша A1 Варіант 2: Кінематографічна панорама'}
>
	<!-- Фонове зображення на 100% площі всієї афіші A1 -->
	<img
		src={asset(data.a1ArtImage)}
		alt={isEn ? 'Too Many Secrets premiere artwork' : 'Художня афіша «Дуже багато SEкретів»'}
		class="full-bleed-art"
		width="1792"
		height="2400"
		loading="eager"
		decoding="async"
	/>
	<div class="art-scrim" aria-hidden="true"></div>

	<div class="sheet-frame">
		<!-- Верхня акцентна смуга з дуже великою датою та часом -->
		<header class="top-header">
			<div class="event-strip">
				<span class="theatre-tag">{isEn ? data.theatreEn : data.theatreUk}</span>
				<span class="event-divider">✦</span>
				<span class="prem-date-main">
					{isEn ? `PREMIERE · NOVEMBER 7, 2026 · ${data.premiereTime}` : `ПРЕМ’ЄРА · 7 ЛИСТОПАДА 2026 Р. · ${data.premiereTime}`}
				</span>
				<span class="event-divider">✦</span>
				<div class="meta-pills">
					<span class="age-pill">{data.ageBadge}</span>
					<span class="dur-pill">{data.durationUk}</span>
				</div>
			</div>

			<div class="presenters-box">
				<p class="pres-lead">{isEn ? data.presentersEn[0] : data.presentersUk[0]}</p>
				<p class="pres-sub">
					{isEn
						? `${data.presentersEn[1]} · ${data.presentersEn[2]} · ${data.presentersEn[3]}`
						: `${data.presentersUk[1]} · ${data.presentersUk[2]} · ${data.presentersUk[3]}`}
				</p>
			</div>
		</header>

		<!-- Прозоре вікно під назву та обличчя з зображення -->
		<div class="art-hero-spacer" aria-hidden="true"></div>

		<!-- Титр режисера та автора -->
		<section class="credits-strip">
			<h1 class="director-line">{isEn ? data.directorEn : data.directorUk}</h1>
			<p class="author-line">
				{#if isEn}
					Based on the play by Nina Zakhozhenko and co-authors <span class="play-hl">“Sex Education”</span>
				{:else}
					за п’єсою Ніни Захоженко та співавторок <span class="play-hl">«Статеве виховання»</span>
				{/if}
			</p>
		</section>

		<!-- Інформаційний блок: склад та команда на скляній плашці -->
		<main class="programme-container">
			<section class="prog-col cast-col">
				<h2 class="col-title">{isEn ? 'Cast & Performers:' : 'Дійові особи та виконавці:'}</h2>
				<ul class="col-list" role="list">
					{#each data.cast as item, idx (idx)}
						{#if item.characterUk.includes('\n')}
							{@const lines = (isEn ? item.characterEn : item.characterUk).split('\n')}
							<li class="cast-row cast-row--multi">
								<div class="char-l1"><span class="c-role">{lines[0]}</span></div>
								<div class="char-l2">
									<span class="c-role">{lines[1]}</span>
									<span class="c-dots" aria-hidden="true"></span>
									<span class="c-name">{isEn ? item.actorEn : item.actorUk}</span>
								</div>
							</li>
						{:else}
							<li class="cast-row">
								<span class="c-role">{isEn ? item.characterEn : item.characterUk}</span>
								<span class="c-dots" aria-hidden="true"></span>
								<span class="c-name">{isEn ? item.actorEn : item.actorUk}</span>
							</li>
						{/if}
					{/each}
				</ul>
			</section>

			<section class="prog-col team-col">
				<div class="team-group">
					<h2 class="col-title">{isEn ? 'Production Team:' : 'Постановники та команда:'}</h2>
					<ul class="col-list" role="list">
						{#each data.crew as item, idx (idx)}
							{@const names = (isEn ? item.namesEn : item.namesUk).split('\n')}
							<li class="team-row">
								<span class="t-role">{isEn ? item.roleEn : item.roleUk} –</span>
								<span class="t-names">{names.join(', ')}</span>
							</li>
						{/each}
					</ul>
				</div>

				<div class="team-group">
					<h3 class="col-sub-title">{isEn ? 'Pedagogical Faculty:' : 'Педагоги:'}</h3>
					<ul class="col-list" role="list">
						{#each data.teachers as item, idx (idx)}
							<li class="team-row">
								<span class="t-role">{isEn ? item.roleEn : item.roleUk} –</span>
								<span class="t-names">{isEn ? item.namesEn : item.namesUk}</span>
							</li>
						{/each}
					</ul>
				</div>

				<div class="team-group">
					<h3 class="col-sub-title">{isEn ? 'Administration:' : 'Адміністрація:'}</h3>
					<p class="admin-line">
						<span class="t-names">{isEn ? data.administrationNamesEn : data.administrationNamesUk}</span>
					</p>
				</div>
			</section>
		</main>

		<!-- Нижня стрічка: логотипи, виділена дата та художній керівник -->
		<footer class="sheet-bottom">
			<div class="partner-logos">
				<img
					src={asset('/posters/uart-logo-dark.webp')}
					alt={isEn ? 'Educational Theatre UArt' : 'Навчальний театр «UArt»'}
					class="p-logo"
					width="600" height="493" loading="eager" decoding="async"
				/>
				<button
					type="button"
					class="logo-switch-btn"
					onclick={onToggleLogo}
					disabled={!onToggleLogo}
					data-testid="uart-a1-v2-logo-toggle-btn"
					title={onToggleLogo ? (isEn ? 'Switch logo' : 'Змінити логотип') : undefined}
				>
					<img
						src={asset(schoolLogoVariant === 'logo2026' ? '/logo/svg/t4_logo_2026.svg' : '/posters/teatralo4ka-crest-dark.svg')}
						alt={isEn ? 'Odesa Theatre School' : 'Одеська театральна школа'}
						class="p-logo"
						width="450" height="450" loading="eager" decoding="async"
					/>
				</button>
				<img
					src={asset('/posters/pro-teatr-logo-dark.webp')}
					alt={isEn ? 'NGO PRO.THEATRE' : 'ГО «PRO.ТЕАТР»'}
					class="p-logo p-logo--pro"
					width="800" height="89" loading="eager" decoding="async"
				/>
			</div>

			<div class="bottom-date-chip">
				<span class="chip-lbl">{isEn ? 'PREMIERE' : 'ПРЕМ’ЄРА'}</span>
				<span class="chip-val">{isEn ? `7 NOV · ${data.premiereTime}` : `7 ЛИСТОПАДА · ${data.premiereTime}`}</span>
			</div>

			<p class="art-director-line">
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

	.top-header { display: flex; flex-direction: column; gap: 0.5cqi; text-align: center; }
	.event-strip {
		display: flex; align-items: center; justify-content: center; gap: 1.4cqi;
		background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(8px);
		border: 1.5px solid rgba(255, 237, 0, 0.6); padding: 0.6cqi 2cqi; border-radius: 999px;
	}
	.theatre-tag { font-weight: 800; font-size: 1.4cqi; color: #ffed00; letter-spacing: 0.04em; }
	.event-divider { color: #ef4444; font-size: 1.2cqi; }
	.prem-date-main { font-weight: 900; font-size: 2.1cqi; letter-spacing: 0.05em; color: #ffffff; text-shadow: 0 2px 10px rgba(0, 0, 0, 0.9); }
	.meta-pills { display: flex; align-items: center; gap: 0.6cqi; }
	.age-pill { background: #dc2626; color: #fff; font-weight: 900; font-size: 1.3cqi; padding: 0.2cqi 0.9cqi; border-radius: 6px; }
	.dur-pill { font-size: 1.25cqi; font-weight: 700; color: #cbd5e1; }

	.presenters-box { margin-top: 0.2cqi; line-height: 1.3; }
	.pres-lead { margin: 0; font-size: 1.15cqi; color: #e2e8f0; font-weight: 500; text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9); }
	.pres-sub { margin: 0.2cqi 0 0; font-size: 1.1cqi; font-weight: 700; color: #ffed00; text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9); }

	.art-hero-spacer { height: 44cqi; flex-shrink: 0; }

	.credits-strip {
		text-align: center; padding: 0.8cqi 1cqi;
		background: rgba(0, 0, 0, 0.65); backdrop-filter: blur(8px);
		border-radius: 8px; margin-bottom: 0.6cqi;
	}
	.director-line { margin: 0; font-size: 2.3cqi; font-weight: 900; letter-spacing: 0.06em; color: #ffed00; text-transform: uppercase; }
	.author-line { margin: 0.3cqi 0 0; font-size: 1.5cqi; color: #ffffff; font-weight: 500; }
	.play-hl { font-weight: 700; color: #ffed00; }

	.programme-container {
		display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 3.2cqi;
		background: rgba(5, 3, 6, 0.78); backdrop-filter: blur(14px);
		border: 1.5px solid rgba(255, 237, 0, 0.3); border-radius: 14px;
		padding: 1.6cqi 2cqi; margin: 0.4cqi 0; flex: 1 1 auto; align-items: start;
	}

	.prog-col { display: flex; flex-direction: column; gap: 1.1cqi; }
	.col-title {
		margin: 0 0 0.4cqi; font-size: 1.65cqi; font-weight: 800; letter-spacing: 0.04em; color: #ffed00; text-transform: uppercase;
		border-bottom: 2px solid rgba(255, 237, 0, 0.3); padding-bottom: 0.35cqi;
	}
	.col-sub-title {
		margin: 0.7cqi 0 0.3cqi; font-size: 1.45cqi; font-weight: 800; color: #ffed00; text-transform: uppercase;
		border-bottom: 1.5px solid rgba(255, 237, 0, 0.2); padding-bottom: 0.25cqi;
	}

	.col-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.65cqi; }
	.cast-row { display: flex; align-items: baseline; font-size: 1.48cqi; line-height: 1.35; }
	.c-role { font-style: italic; color: #cbd5e1; white-space: nowrap; }
	.c-dots { flex: 1; border-bottom: 1.5px dotted rgba(255, 255, 255, 0.35); margin: 0 0.6cqi; transform: translateY(-0.3em); }
	.c-name { font-weight: 700; color: #ffffff; white-space: nowrap; }
	.cast-row--multi { flex-direction: column; gap: 0.15cqi; }
	.char-l2 { display: flex; align-items: baseline; width: 100%; }

	.team-group { display: flex; flex-direction: column; }
	.team-row { font-size: 1.42cqi; line-height: 1.35; margin-bottom: 0.35cqi; }
	.t-role { font-weight: 700; color: #e2e8f0; }
	.t-names { font-weight: 500; color: #ffffff; }
	.admin-line { margin: 0; font-size: 1.42cqi; }

	.sheet-bottom {
		display: flex; align-items: center; justify-content: space-between;
		background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(10px);
		border-radius: 10px; border: 1.5px solid rgba(255, 237, 0, 0.3);
		padding: 0.7cqi 1.4cqi; margin-top: 0.4cqi;
	}
	.partner-logos { display: flex; align-items: center; gap: 2.8cqi; height: 3.5cqi; }
	.p-logo { height: 100%; width: auto; object-fit: contain; }
	.p-logo--pro { max-width: 17cqi; }
	.logo-switch-btn { background: none; border: none; padding: 0; height: 100%; cursor: pointer; display: flex; align-items: center; }

	.bottom-date-chip {
		display: inline-flex; align-items: center; gap: 0.8cqi; background: #dc2626; color: #ffffff;
		padding: 0.5cqi 1.6cqi; border-radius: 8px; font-weight: 900;
	}
	.chip-lbl { font-size: 1.2cqi; color: #fef08a; letter-spacing: 0.08em; }
	.chip-val { font-size: 1.8cqi; letter-spacing: 0.04em; }

	.art-director-line { margin: 0; font-size: 1.35cqi; font-weight: 700; color: #e2e8f0; }
</style>
