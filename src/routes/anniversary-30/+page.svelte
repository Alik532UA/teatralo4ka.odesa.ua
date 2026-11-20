<script lang="ts">
	import { asset, resolve } from '$app/paths';
	import { locale, t } from 'svelte-i18n';
	import { seo } from '$lib/services/seo.svelte';
	import { ANNIVERSARY_30_POSTER } from '$lib/data/anniversary30';
	import Anniversary30CharityCard from '$lib/components/posters/anniversary-30/Anniversary30CharityCard.svelte';
	import {
		Sparkles,
		Calendar,
		Printer,
		ExternalLink,
		Heart,
		Tv,
		Palette,
		Music,
		Video,
		Globe,
		PartyPopper
	} from 'lucide-svelte';

	const isEn = $derived($locale === 'en');
	const poster = ANNIVERSARY_30_POSTER;

	$effect(() => {
		seo.update({
			title: isEn
				? `30 Years of Odesa Theatre School - Anniversary Playbill - ${$t('seo.brandTitle')}`
				: `30 років Одеській театральній школі - Афіша святкових заходів - ${$t('seo.brandTitle')}`,
			description: isEn
				? 'Celebratory playbill for the 30th anniversary of Odesa Theatre School: concert, exhibitions, zoom sessions, and charity fundraiser for the 14th ORB of AFU.'
				: 'Програма святкових заходів до 30-річчя Одеської театральної школи: святковий концерт, виставка, кіно-зум та збір на пікапи для 14 ОРБ ЗСУ.'
		});
	});

	function getEventIcon(id: string) {
		switch (id) {
			case 'video-digest': return Tv;
			case 'art-exhibition': return Palette;
			case 'festive-concert': return Music;
			case 'cinema-zoom': return Video;
			case 'tiktok-video': return Sparkles;
			case 'graduates-interview': return Globe;
			case 'children-holiday': return PartyPopper;
			case 'anniversary-show': return Sparkles;
			case 'admission-conference': return Video;
			default: return Calendar;
		}
	}
</script>

<div class="anniversary-page" data-testid="anniversary-page-section">
	<div class="container anniversary-container">
		<nav class="anniversary-nav" aria-label={isEn ? 'Page navigation' : 'Навігація'}>
			<div class="nav-actions">
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a href="#charity" class="nav-btn nav-btn--charity" data-testid="nav-charity-link">
					<Heart size={14} aria-hidden="true" />
					<span>{isEn ? 'Fundraiser' : 'Збір для ЗСУ'}</span>
				</a>
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a href={resolve('/posters') + '?poster=anniversary-30'} class="nav-btn" data-testid="nav-poster-link">
					<Printer size={14} aria-hidden="true" />
					<span>{isEn ? 'A4 Poster' : 'Афіша A4'}</span>
				</a>
			</div>
		</nav>

		<header class="anniversary-hero">
			<img
				src={asset('/logo/svg/t4_logo_IndividualParticles_MasksTwo_2026.svg')}
				alt={isEn ? 'Odesa Theatre School Crest' : 'Герб Одеської театральної школи'}
				width="180"
				height="109"
				class="hero-emblem"
				loading="eager"
			/>
			<div class="hero-badge">
				<Sparkles size={14} aria-hidden="true" />
				<span>{isEn ? poster.headerBadgeEn : poster.headerBadgeUk}</span>
			</div>
			<p class="hero-subtitle">{isEn ? poster.subtitleEn : poster.subtitleUk}</p>
			<h1 class="hero-title" data-testid="anniversary-main-title">
				{#if isEn}
					Odesa Theatre School<br /><span class="title-highlight">is 30 Years Old!</span>
				{:else}
					Одеській театральній школі&nbsp;–<br /><span class="title-highlight">30&nbsp;років!!!</span>
				{/if}
			</h1>
			<div class="dates-pill">
				<Calendar size={15} aria-hidden="true" />
				<span>{isEn ? poster.datesRangeEn : poster.datesRangeUk}</span>
			</div>
			<p class="hero-desc">
				{isEn
					? 'We warmly invite students, graduates, teachers, parents, and friends to celebrate our 30th season together!'
					: 'Щиро запрошуємо учнів, випускників, викладачів, батьків та друзів нашої школи відсвяткувати 30-й ювілейний сезон разом!'}
			</p>
		</header>

		<section class="schedule-section" aria-label={isEn ? 'Events Schedule' : 'Програма заходів'}>
			<div class="section-heading">
				<h2 class="section-title">{isEn ? 'Celebratory Events Schedule' : 'Програма святкових заходів'}</h2>
				<p class="section-lead">
					{isEn
						? 'Concerts, exhibitions, cinema meetings, masterclasses, and vibrant celebrations.'
						: 'Святковий концерт, виставки, кіно-зум, конференції та незабутні зустрічі.'}
				</p>
			</div>
			<div class="events-grid">
				{#each poster.events as item (item.id)}
					{@const IconComponent = getEventIcon(item.id)}
					<article
						class="event-card"
						class:event-card--highlight={item.id === 'festive-concert'}
						class:event-card--interactive={Boolean(item.url)}
						data-testid={`event-card-${item.id}`}
					>
						<div class="event-header">
							<span class="event-date">{isEn ? item.dateEn : item.dateUk}</span>
							<span class="event-badge">{isEn ? item.badgeEn : item.badgeUk}</span>
						</div>
						<div class="event-body">
							<div class="event-icon-box" aria-hidden="true">
								<IconComponent size={item.id === 'festive-concert' ? 22 : 18} />
							</div>
							<div class="event-content">
								<h3 class="event-title">{isEn ? item.titleEn : item.titleUk}</h3>
								{#if item.subtitleUk}
									<p class="event-subtitle">{isEn ? item.subtitleEn : item.subtitleUk}</p>
								{/if}
								<div class="event-channel">
									{#if item.id === 'festive-concert'}
										<a
											href="https://concert.ua/uk/event/muzichnii-koncert"
											target="_blank"
											rel="noopener noreferrer"
											class="btn-ticket"
											data-testid="event-concert-link"
										>
											<ExternalLink size={14} aria-hidden="true" />
											<span>{isEn ? 'Tickets on Concert.ua' : 'Квитки на concert.ua'}</span>
										</a>
									{:else if item.id === 'graduates-interview'}
										<a href={resolve('/projects/galaxy-graduates')} class="channel-link" data-testid="event-graduates-link">
											<ExternalLink size={13} aria-hidden="true" />
											<span>{isEn ? item.noteEn : item.noteUk}</span>
										</a>
									{:else if item.id === 'video-digest'}
										<a href="https://www.instagram.com/teatralo4ka_official_/" target="_blank" rel="noopener noreferrer" class="channel-link" data-testid="event-instagram-link">
											<ExternalLink size={13} aria-hidden="true" />
											<span>{isEn ? item.noteEn : item.noteUk}</span>
										</a>
									{:else if item.id === 'cinema-zoom'}
										<a href="https://www.youtube.com/@teatralo4ka_odesa" target="_blank" rel="noopener noreferrer" class="channel-link" data-testid="event-youtube-link">
											<ExternalLink size={13} aria-hidden="true" />
											<span>{isEn ? item.noteEn : item.noteUk}</span>
										</a>
									{:else if item.id === 'tiktok-video'}
										<a href="https://www.tiktok.com/@teatralo4ka_official/" target="_blank" rel="noopener noreferrer" class="channel-link" data-testid="event-tiktok-link">
											<ExternalLink size={13} aria-hidden="true" />
											<span>{isEn ? item.noteEn : item.noteUk}</span>
										</a>
									{:else}
										<span class="channel-chip">{isEn ? item.noteEn : item.noteUk}</span>
									{/if}
								</div>
							</div>
						</div>
					</article>
				{/each}
			</div>
		</section>

		<section id="charity" class="charity-section" aria-label={isEn ? 'Fundraiser for AFU' : 'Збір для ЗСУ'}>
			<div class="section-heading">
				<h2 class="section-title">{isEn ? 'Charity Fundraiser for AFU' : 'Збір для ЗСУ на честь 30-річчя'}</h2>
				<p class="section-lead">
					{isEn
						? 'During all festive days we traditionally raise funds for our defenders. Celebrate with us by donating!'
						: 'Протягом усіх святкових днів ми традиційно оголошуємо збір для ЗСУ. Хочеш привітати іменинницю – донать сюди!'}
				</p>
			</div>
			<div class="charity-wrapper">
				<Anniversary30CharityCard {isEn} />
			</div>
		</section>

		<section class="poster-cta-section">
			<div class="poster-cta-card">
				<div class="cta-icon" aria-hidden="true"><Printer size={28} /></div>
				<div class="cta-text">
					<h2 class="cta-title">{isEn ? 'Official A4 Poster & Printout' : 'Офіційна афіша A4 для друку'}</h2>
					<p class="cta-desc">
						{isEn
							? 'Open our high-resolution vector A4 poster with interactive features or clean paper print mode.'
							: 'Відкрийте наш векторний плакат формату A4 з підтримкою інтерактивного перегляду та чистого друку.'}
					</p>
				</div>
				<div class="cta-buttons">
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
					<a href={resolve('/posters') + '?poster=anniversary-30&mode=digital'} class="btn-cta btn-cta--primary" data-testid="poster-digital-link">
						<Sparkles size={14} aria-hidden="true" />
						<span>{isEn ? 'Interactive A4' : 'Електронна афіша A4'}</span>
					</a>
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
					<a href={resolve('/posters') + '?poster=anniversary-30&mode=paper'} class="btn-cta btn-cta--secondary" data-testid="poster-print-link">
						<Printer size={14} aria-hidden="true" />
						<span>{isEn ? 'For Print' : 'Для друку на папері'}</span>
					</a>
				</div>
			</div>
		</section>

		<div class="anniversary-footer">
			<p class="footer-season">{isEn ? poster.schoolEn : poster.schoolUk}</p>
		</div>
	</div>
</div>

<style>
	.anniversary-page { padding: var(--page-pad-top) 0 var(--page-pad-bottom); min-height: 85dvh; }
	.anniversary-container { max-width: 960px; margin: 0 auto; padding: 0 16px; display: flex; flex-direction: column; gap: clamp(24px, 4vw, 36px); }
	.anniversary-nav { display: flex; justify-content: flex-end; align-items: center; flex-wrap: wrap; gap: 10px; }
	.nav-actions { display: flex; align-items: center; gap: 8px; }
	.nav-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 10px; font-size: 0.82rem; font-weight: 700; text-decoration: none; border: 1px solid var(--color-border); background: var(--bg-card); color: var(--text-main); }
	.nav-btn--charity { color: var(--accent-text, #0369a1); border-color: rgba(3, 105, 161, 0.3); }
	.nav-btn:hover { background: var(--bg-surface); }
	.anniversary-hero { display: flex; flex-direction: column; align-items: center; text-align: center; padding: clamp(24px, 5vw, 40px) clamp(16px, 4vw, 32px); background: linear-gradient(135deg, #ffed00 0%, #ffd000 100%); border-radius: clamp(20px, 3vw, 32px); box-shadow: 0 16px 36px -10px rgba(255, 218, 0, 0.4), 0 0 0 1px rgba(0, 0, 0, 0.08); color: #111827; }
	.hero-emblem { height: auto; width: clamp(120px, 20vw, 160px); margin-bottom: 6px; }
	.hero-badge { display: inline-flex; align-items: center; gap: 6px; background: #0077c8; color: #fff; font-size: 0.78rem; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; padding: 4px 12px; border-radius: 999px; margin-bottom: 8px; }
	.hero-subtitle { margin: 0 0 4px; font-size: clamp(0.85rem, 1.8vw, 1rem); font-weight: 700; color: #0077c8; text-transform: uppercase; }
	.hero-title { margin: 0 0 10px; font-size: clamp(1.8rem, 5vw, 2.8rem); font-weight: 900; line-height: 1.15; color: #00242f; }
	.title-highlight { color: #00242f; white-space: nowrap; }
	.dates-pill { display: inline-flex; align-items: center; gap: 6px; background: #fff; color: #1e293b; padding: 6px 14px; border-radius: 999px; font-size: 0.9rem; font-weight: 800; margin-bottom: 10px; }
	.hero-desc { margin: 0; max-width: 600px; font-size: clamp(0.9rem, 1.8vw, 1rem); font-weight: 500; color: #1e293b; line-height: 1.45; }
	.schedule-section, .charity-section, .poster-cta-section { display: flex; flex-direction: column; gap: 16px; }
	.section-heading { text-align: center; }
	.section-title { margin: 0 0 6px; font-size: clamp(1.35rem, 3.2vw, 1.9rem); font-weight: 900; color: var(--text-title); }
	.section-lead { margin: 0; font-size: clamp(0.88rem, 1.8vw, 1rem); color: var(--text-muted); }
	.events-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(270px, 100%), 1fr)); gap: 14px; }
	@media (min-width: 860px) {
		.events-grid { grid-template-columns: repeat(3, 1fr); }
	}
	.event-card {
		position: relative;
		background: var(--bg-surface);
		border: 1px solid var(--color-border);
		border-radius: 18px;
		padding: 14px 16px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 10px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
		transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
	}
	.event-card:hover { transform: translateY(-2px); }
	.event-card--interactive { cursor: pointer; }
	.event-card--interactive:hover {
		border-color: var(--accent-text, #0369a1);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
	}
	.event-card--interactive:hover .channel-link {
		border-color: var(--accent-text, #0369a1);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
	}
	.event-card--interactive .channel-link::after,
	.event-card--interactive .btn-ticket::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 18px;
		z-index: 1;
	}
	.event-card--highlight {
		background: linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%);
		border: 2px solid #0369a1;
		box-shadow: 0 6px 20px rgba(3, 105, 161, 0.12);
	}
	:global(.dark-theme) .event-card--highlight,
	:global(.dark-cyan-theme) .event-card--highlight,
	:global(.dark-blue-theme) .event-card--highlight,
	:global([data-theme='dark']) .event-card--highlight,
	:global([data-theme='dark-cyan']) .event-card--highlight,
	:global([data-theme='dark-blue']) .event-card--highlight {
		background: linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%);
		border-color: #38bdf8;
		box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
	}
	@media (prefers-color-scheme: dark) {
		:global(html:not(.light-theme):not(.yellow-theme):not(.light-yellow-theme):not([data-theme='light']):not([data-theme='yellow']):not([data-theme='light-yellow'])) .event-card--highlight {
			background: linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%);
			border-color: #38bdf8;
			box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
		}
	}
	.event-header { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
	.event-date { font-size: 0.82rem; font-weight: 800; color: #0369a1; white-space: nowrap; flex-shrink: 0; }
	:global(.dark-theme) .event-date,
	:global(.dark-cyan-theme) .event-date,
	:global(.dark-blue-theme) .event-date,
	:global([data-theme='dark']) .event-date,
	:global([data-theme='dark-cyan']) .event-date,
	:global([data-theme='dark-blue']) .event-date {
		color: #fbbf24;
	}
	.event-card--highlight .event-date { font-size: 0.92rem; font-weight: 900; }
	:global(.dark-theme) .event-card--highlight .event-date,
	:global(.dark-cyan-theme) .event-card--highlight .event-date,
	:global(.dark-blue-theme) .event-card--highlight .event-date,
	:global([data-theme='dark']) .event-card--highlight .event-date,
	:global([data-theme='dark-cyan']) .event-card--highlight .event-date,
	:global([data-theme='dark-blue']) .event-card--highlight .event-date {
		color: #fde047;
	}
	@media (prefers-color-scheme: dark) {
		:global(html:not(.light-theme):not(.yellow-theme):not(.light-yellow-theme):not([data-theme='light']):not([data-theme='yellow']):not([data-theme='light-yellow'])) .event-date {
			color: #fbbf24;
		}
		:global(html:not(.light-theme):not(.yellow-theme):not(.light-yellow-theme):not([data-theme='light']):not([data-theme='yellow']):not([data-theme='light-yellow'])) .event-card--highlight .event-date {
			color: #fde047;
		}
	}
	.event-badge { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; padding: 2px 7px; border-radius: 6px; background: var(--bg-card); color: var(--text-muted); }
	.event-card--highlight .event-badge { background: #0369a1; color: #fff; }
	:global(.dark-theme) .event-card--highlight .event-badge,
	:global(.dark-cyan-theme) .event-card--highlight .event-badge,
	:global(.dark-blue-theme) .event-card--highlight .event-badge,
	:global([data-theme='dark']) .event-card--highlight .event-badge,
	:global([data-theme='dark-cyan']) .event-card--highlight .event-badge,
	:global([data-theme='dark-blue']) .event-card--highlight .event-badge {
		background: #0369a1;
		color: #fff;
	}
	.event-body { display: flex; gap: 12px; align-items: flex-start; flex: 1 1 auto; }
	.event-icon-box { flex: 0 0 auto; color: var(--accent-text, #0369a1); background: var(--bg-card); border-radius: 10px; padding: 7px; display: flex; }
	.event-card--highlight .event-icon-box { background: #0369a1; color: #fff; }
	:global(.dark-theme) .event-card--highlight .event-icon-box,
	:global(.dark-cyan-theme) .event-card--highlight .event-icon-box,
	:global(.dark-blue-theme) .event-card--highlight .event-icon-box,
	:global([data-theme='dark']) .event-card--highlight .event-icon-box,
	:global([data-theme='dark-cyan']) .event-card--highlight .event-icon-box,
	:global([data-theme='dark-blue']) .event-card--highlight .event-icon-box {
		background: #0369a1;
		color: #fff;
	}
	.event-content { flex: 1 1 auto; display: flex; flex-direction: column; justify-content: space-between; gap: 8px; height: 100%; }
	.event-title { margin: 0; font-size: 0.92rem; font-weight: 700; line-height: 1.35; color: var(--text-title); }
	.event-subtitle { margin: 2px 0 0; font-size: 0.8rem; line-height: 1.35; color: var(--text-muted); font-weight: 500; }
	.event-channel { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; width: 100%; margin-top: auto; padding-top: 4px; }
	.btn-ticket {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		box-sizing: border-box;
		gap: 6px;
		background: #0369a1;
		color: #fff;
		padding: 7px 12px;
		border-radius: 8px;
		font-size: 0.85rem;
		font-weight: 700;
		text-decoration: none;
		transition: background 0.15s ease;
	}
	.btn-ticket:hover { background: #075985; color: #fff; }
	:global(.dark-theme) .btn-ticket,
	:global(.dark-cyan-theme) .btn-ticket,
	:global(.dark-blue-theme) .btn-ticket,
	:global([data-theme='dark']) .btn-ticket,
	:global([data-theme='dark-cyan']) .btn-ticket,
	:global([data-theme='dark-blue']) .btn-ticket {
		background: #0369a1;
		color: #fff;
	}
	:global(.dark-theme) .btn-ticket:hover,
	:global(.dark-cyan-theme) .btn-ticket:hover,
	:global(.dark-blue-theme) .btn-ticket:hover,
	:global([data-theme='dark']) .btn-ticket:hover,
	:global([data-theme='dark-cyan']) .btn-ticket:hover,
	:global([data-theme='dark-blue']) .btn-ticket:hover {
		background: #075985;
		color: #fff;
	}
	.channel-link {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-size: 0.78rem;
		font-weight: 700;
		color: var(--accent-text, #0369a1);
		background: var(--bg-card);
		border: 1px solid var(--color-border);
		padding: 3px 10px;
		border-radius: 999px;
		text-decoration: none;
		transition: all 0.15s ease;
	}
	.channel-chip {
		display: inline-flex;
		align-items: center;
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--text-muted);
		background: var(--bg-card);
		padding: 3px 10px;
		border-radius: 999px;
		border: 1px solid var(--color-border);
	}
	.charity-wrapper { container-type: inline-size; width: 100%; }
	.poster-cta-card { background: var(--bg-surface); border: 1px dashed var(--color-border); border-radius: 18px; padding: clamp(16px, 3vw, 24px); display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
	.cta-icon { color: var(--accent-text, #0284c7); flex: 0 0 auto; }
	.cta-text { flex: 1 1 280px; }
	.cta-title { margin: 0 0 4px; font-size: 1.1rem; font-weight: 800; color: var(--text-title); }
	.cta-desc { margin: 0; font-size: 0.85rem; color: var(--text-muted); }
	.cta-buttons { display: flex; gap: 8px; flex-wrap: wrap; }
	.btn-cta { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 10px; font-size: 0.85rem; font-weight: 700; text-decoration: none; }
	.btn-cta--primary { background: #ffed00; color: #111827; border: 1px solid rgba(0, 0, 0, 0.12); }
	.btn-cta--secondary { background: var(--bg-card); color: var(--text-main); border: 1px solid var(--color-border); }
	.anniversary-footer { text-align: center; padding-top: 8px; border-top: 1px solid var(--color-border); }
	.footer-season { margin: 0; font-size: 0.8rem; font-weight: 700; color: var(--text-muted); }
</style>
