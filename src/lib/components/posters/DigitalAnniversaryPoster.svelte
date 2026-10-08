<script lang="ts">
	import { asset } from '$app/paths';
	import { Heart } from 'lucide-svelte';

	interface Props {
		isEn?: boolean;
	}

	let { isEn = false }: Props = $props();

	const LEFT_ICONS = [
		{ file: '/miniIcon/svg/t4_logo_IndividualParticles_MiniIcon10_2026.svg', nameUk: 'Режисерська хлопавка', nameEn: 'Clapperboard' },
		{ file: '/miniIcon/svg/t4_logo_IndividualParticles_MiniIcon03_2026.svg', nameUk: 'Книга та перо', nameEn: 'Book & Quill' },
		{ file: '/miniIcon/svg/t4_logo_IndividualParticles_MiniIcon07_2026.svg', nameUk: 'Скрипковий ключ', nameEn: 'Treble Clef' },
		{ file: '/miniIcon/svg/t4_logo_IndividualParticles_MiniIcon11_2026.svg', nameUk: 'Театральні маски', nameEn: 'Theatrical Masks' },
		{ file: '/miniIcon/svg/t4_logo_IndividualParticles_MiniIcon04_2026.svg', nameUk: 'Творчий олівець', nameEn: 'Creative Pencil' },
		{ file: '/miniIcon/svg/t4_logo_IndividualParticles_MiniIcon01_2026.svg', nameUk: 'Зірка слави', nameEn: 'Star of Fame' }
	];

	const RIGHT_ICONS = [
		{ file: '/miniIcon/svg/t4_logo_IndividualParticles_MiniIcon06_2026.svg', nameUk: 'Сценічний мікрофон', nameEn: 'Stage Microphone' },
		{ file: '/miniIcon/svg/t4_logo_IndividualParticles_MiniIcon08_2026.svg', nameUk: 'Храм театру', nameEn: 'Theatre Temple' },
		{ file: '/miniIcon/svg/t4_logo_IndividualParticles_MiniIcon05_2026.svg', nameUk: 'Сценічний софіт', nameEn: 'Stage Spotlight' },
		{ file: '/miniIcon/svg/t4_logo_IndividualParticles_MiniIcon02_2026.svg', nameUk: 'Електрогітара', nameEn: 'Electric Guitar' },
		{ file: '/miniIcon/svg/t4_logo_IndividualParticles_MiniIcon09_2026.svg', nameUk: 'Кінокамера', nameEn: 'Film Camera' },
		{ file: '/miniIcon/svg/t4_logo_IndividualParticles_MiniIcon12_2026.svg', nameUk: 'Палітра художника', nameEn: 'Art Palette' }
	];
</script>

<div class="poster-frame" data-testid="anniversary-poster-container">
	<article class="anniversary-poster" data-testid="anniversary-poster-card">
		<!-- Бічні іконки айдентики ліворуч -->
		<aside class="side-icons side-icons--left" aria-hidden="true">
			{#each LEFT_ICONS as icon, i (i)}
				<img
					src={asset(icon.file)}
					alt={isEn ? icon.nameEn : icon.nameUk}
					width="48"
					height="48"
					class="side-icon"
					loading="eager"
					decoding="async"
				/>
			{/each}
		</aside>

		<!-- Бічні іконки айдентики праворуч -->
		<aside class="side-icons side-icons--right" aria-hidden="true">
			{#each RIGHT_ICONS as icon, i (i)}
				<img
					src={asset(icon.file)}
					alt={isEn ? icon.nameEn : icon.nameUk}
					width="48"
					height="48"
					class="side-icon"
					loading="eager"
					decoding="async"
				/>
			{/each}
		</aside>

		<!-- Центральний вміст цифрової афіші -->
		<div class="poster-content">
			<!-- Шапка: герб та заголовок 28-річчя -->
			<header class="poster-header">
				<div class="emblem-wrap">
					<img
						src={asset('/logo/svg/t4_logo_IndividualParticles_MasksTwo_2026.svg')}
						alt={isEn ? 'Theatre School Crest' : 'Герб Одеської дитячої театральної школи'}
						width="160"
						height="97"
						class="emblem-img"
						loading="eager"
						decoding="async"
					/>
				</div>

				<p class="anniversary-subtitle">
					{isEn ? 'Festive Events Playbill for' : 'Афіша святкових заходів до'}
				</p>

				<h1 class="anniversary-title">
					<span class="title-years">28-річчя</span>
					<span class="title-name">«Театрало4ки»</span>
				</h1>
			</header>

			<!-- Блоки програми заходів -->
			<div class="events-body">
				<!-- Блок 1: 29 листопада, п'ятниця -->
				<section class="day-block">
					<h2 class="day-title">
						{isEn ? 'November 29, Friday' : '29 листопада, п’ятниця'}
					</h2>

					<div class="event-item">
						<span class="event-time">10:30 - 11 ауд.</span>
						<p class="event-name event-name--blue">
							{isEn ? 'Presentation of children’s magazine “Barabulka”' : 'Презентація дитячого журналу «Барабулька»'}
						</p>
					</div>

					<div class="event-item event-item--right">
						<span class="event-time">14:30 та 16:00 - 11 ауд.</span>
						<p class="event-name event-name--blue">
							{isEn ? '“Clown Show” for juniors' : '«Клоун-шоу» для молодших'}
						</p>
					</div>

					<div class="event-item">
						<span class="event-time">17:30 - 7 ауд.</span>
						<p class="event-name event-name--blue">
							{isEn ? 'Interactive game “CHAT MTSH” (Students VS Teachers)' : 'Інтерактивна гра «ЧАТ МТШ» (команда учнів VS команда викладачів)'}
						</p>
					</div>
				</section>

				<!-- Блок 2: 30 листопада, субота -->
				<section class="day-block">
					<h2 class="day-title">
						{isEn ? 'November 30, Saturday' : '30 листопада, субота'}
					</h2>

					<div class="event-item event-item--right">
						<span class="event-time">11:00 та 13:00 - 11 ауд.</span>
						<p class="event-name event-name--blue">
							{isEn ? '“Clown Show” for juniors' : '«Клоун-шоу» для молодших'}
						</p>
					</div>

					<div class="event-item">
						<span class="event-time">14:00 - 7 ауд.</span>
						<p class="event-name event-name--blue">
							{isEn ? 'Interactive game “CHAT MTSH” (Students VS Teachers)' : 'Інтерактивна гра «ЧАТ МТШ» (команда учнів VS команда викладачів)'}
						</p>
					</div>
				</section>

				<!-- Блок благодійності на честь свята -->
				<div class="charity-card">
					<div class="charity-badge">
						<Heart size={20} class="charity-heart" aria-hidden="true" />
					</div>
					<div class="charity-text">
						<strong>{isEn ? 'Celebrate with Teatralo4ka:' : 'Поздоровити «Театрало4ку»-іменинницю'}</strong>
						<span>{isEn ? 'Charity support for Ukrainian Armed Forces' : 'можна донатом на ЗСУ (збір коштів на ремонт автівок підрозділу випускника школи)'}</span>
					</div>
				</div>
			</div>

			<!-- Нижній колонтитул -->
			<footer class="poster-footer">
				<p class="poster-quote">
					{isEn ? 'Intelligence is artificial, but Art is eternal! Confucius 😜' : 'Інтелект - штучний, а Мистецтво - вічне! Конфуцій 😜'}
				</p>
				<p class="poster-season">
					{isEn ? 'November-December 2024 · Odesa Children’s Theatre School' : 'листопад-грудень 2024 р · Одеська дитяча театральна школа'}
				</p>
			</footer>
		</div>
	</article>
</div>

<style>
	.poster-frame {
		container-type: inline-size;
		width: 100%;
		max-width: 900px;
		margin: 0 auto;
		display: flex;
		justify-content: center;
	}

	.anniversary-poster {
		position: relative;
		width: 100%;
		aspect-ratio: 210 / 297;
		background-color: #ffed00;
		background-image:
			radial-gradient(circle at 10% 20%, rgba(255, 255, 255, 0.4) 0%, transparent 40%),
			radial-gradient(circle at 90% 80%, rgba(254, 218, 0, 0.6) 0%, transparent 45%);
		border-radius: clamp(14px, 2.2cqi, 28px);
		box-shadow:
			0 20px 45px -10px rgba(0, 0, 0, 0.22),
			0 0 0 1px rgba(0, 0, 0, 0.08);
		color: #111827;
		overflow: hidden;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: clamp(14px, 2.8cqi, 32px) clamp(16px, 3.2cqi, 36px);
		user-select: text;
	}

	.side-icons {
		position: absolute;
		top: 0;
		bottom: 0;
		display: flex;
		flex-direction: column;
		justify-content: space-around;
		align-items: center;
		padding: clamp(24px, 4.5cqi, 48px) 0;
		z-index: 1;
		pointer-events: none;
	}

	.side-icons--left {
		left: clamp(8px, 1.8cqi, 22px);
	}

	.side-icons--right {
		right: clamp(8px, 1.8cqi, 22px);
	}

	.side-icon {
		width: clamp(26px, 3.8cqi, 44px);
		height: clamp(26px, 3.8cqi, 44px);
		object-fit: contain;
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.12));
		opacity: 0.92;
	}

	.poster-content {
		position: relative;
		z-index: 2;
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		max-width: 82%;
		margin: 0 auto;
		text-align: center;
	}

	.poster-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: clamp(4px, 0.8cqi, 8px);
	}

	.emblem-wrap {
		display: flex;
		justify-content: center;
	}

	.emblem-img {
		width: clamp(100px, 16cqi, 160px);
		height: auto;
		filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.15));
	}

	.anniversary-subtitle {
		margin: 0;
		font-size: clamp(14px, 2.2cqi, 24px);
		font-weight: 700;
		color: #0077c8;
	}

	.anniversary-title {
		margin: 0;
		font-size: clamp(24px, 4.4cqi, 48px);
		font-weight: 900;
		line-height: 1.1;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 8px;
	}

	.title-years {
		color: #e20413;
	}

	.title-name {
		color: #e20413;
	}

	.events-body {
		display: flex;
		flex-direction: column;
		gap: clamp(8px, 1.6cqi, 16px);
		margin: clamp(6px, 1.2cqi, 14px) 0;
	}

	.day-block {
		background: rgba(240, 244, 252, 0.95);
		border-radius: clamp(16px, 2.6cqi, 28px);
		padding: clamp(10px, 1.8cqi, 18px) clamp(14px, 2.4cqi, 24px);
		box-shadow: 0 8px 20px -4px rgba(0, 0, 0, 0.1);
		display: flex;
		flex-direction: column;
		gap: clamp(6px, 1cqi, 10px);
	}

	.day-title {
		margin: 0;
		font-size: clamp(15px, 2.4cqi, 24px);
		font-weight: 900;
		color: #111827;
		text-align: center;
	}

	.event-item {
		text-align: left;
	}

	.event-item--right {
		text-align: right;
	}

	.event-time {
		display: block;
		font-size: clamp(12px, 1.6cqi, 17px);
		font-weight: 800;
		color: #0f172a;
	}

	.event-name {
		margin: 2px 0 0;
		font-size: clamp(12px, 1.8cqi, 18px);
		font-weight: 800;
		color: #0284c7;
		line-height: 1.25;
	}

	.charity-card {
		background: rgba(255, 255, 255, 0.92);
		border-radius: clamp(14px, 2cqi, 20px);
		padding: clamp(8px, 1.4cqi, 14px) clamp(12px, 2cqi, 20px);
		display: flex;
		align-items: center;
		gap: 12px;
		text-align: left;
	}

	.charity-badge {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: #fee2e2;
		color: #b91c1c;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.charity-text {
		display: flex;
		flex-direction: column;
		gap: 2px;
		font-size: clamp(10px, 1.4cqi, 14px);
		color: #334155;
	}

	.charity-text strong {
		color: #0f172a;
	}

	.poster-footer {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 3px;
		margin-top: auto;
	}

	.poster-quote {
		margin: 0;
		font-size: clamp(10px, 1.4cqi, 15px);
		font-weight: 700;
		color: #1e293b;
	}

	.poster-season {
		margin: 0;
		font-size: clamp(9px, 1.2cqi, 13px);
		font-weight: 600;
		color: #475569;
	}

	@container (max-width: 580px) {
		.anniversary-poster {
			aspect-ratio: auto;
			padding: 20px 12px;
		}

		.side-icons {
			display: none;
		}

		.poster-content {
			max-width: 100%;
		}

		.event-item,
		.event-item--right {
			text-align: center;
		}
	}

	@media print {
		.poster-frame {
			width: 100% !important;
			max-width: none !important;
			margin: 0 !important;
		}

		.anniversary-poster {
			width: 210mm !important;
			height: 297mm !important;
			aspect-ratio: 210 / 297 !important;
			border-radius: 0 !important;
			box-shadow: none !important;
			padding: 18mm 16mm !important;
			-webkit-print-color-adjust: exact !important;
			print-color-adjust: exact !important;
			page-break-inside: avoid !important;
			break-inside: avoid !important;
		}
	}
</style>
