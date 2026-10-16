<script lang="ts">
	import {
		formatGreeting,
		type InvitationStudent,
		type PosviataSlotTime
	} from '$lib/data/posviataInvitations';
	import PosviataMiniIcons from './PosviataMiniIcons.svelte';

	interface Props {
		mode: 'named' | 'template' | 'cover';
		student?: InvitationStudent;
		time?: PosviataSlotTime;
		coverType?: 'color' | 'bw';
		isEn?: boolean;
		showCutLines?: boolean;
	}

	let {
		mode = 'template',
		student,
		time = '10:00',
		coverType = 'color',
		isEn = false,
		showCutLines = false
	}: Props = $props();
</script>

<article
	class="posviata-card"
	class:posviata-card--cover={mode === 'cover'}
	class:posviata-card--cut-lines={showCutLines}
	data-testid="posviata-invitation-card"
>
	{#if mode === 'cover'}
		<div class="cover-content">
			<img
				src={coverType === 'bw'
					? '/brand/big-emblem/svg/big-emblem-2022-outline-hands.svg'
					: '/brand/big-emblem/svg/big-emblem-2022-color-outline-hands.svg'}
				alt=""
				class="cover-emblem"
				width="400"
				height="184"
				loading="eager"
			/>
			<div class="cover-label">
				{isEn ? 'INVITATION !' : 'ЗАПРОШЕННЯ !'}
			</div>
		</div>
	{:else}
		<PosviataMiniIcons side="left" />

		<div class="card-body">
			<!-- Звернення / Рядок імені (Line 1) -->
			<div
				class="greeting-row"
				class:greeting-row--template={mode === 'template'}
				class:greeting-row--named={mode === 'named'}
			>
				{#if mode === 'template'}
					<span class="greeting-prefix">{isEn ? 'Dear' : 'Дорогий (а)'}</span>
					<span class="template-line" aria-hidden="true"></span>
					<span class="greeting-mark">!</span>
				{:else if student}
					<span class="greeting-name">{formatGreeting(student, isEn)}</span>
				{:else}
					<span class="greeting-prefix">{isEn ? 'Dear' : 'Дорогий (а)'}</span>
					<span class="template-line" aria-hidden="true"></span>
					<span class="greeting-mark">!</span>
				{/if}
			</div>

			<!-- Блок запрошення (Lines 2, 3, 4) -->
			<div class="intro-block">
				<p class="intro-text">
					{isEn ? 'We invite you to the traditional event' : 'Запрошуємо тебе на традиційний захід'}
				</p>
				<p class="intro-subtext">
					{isEn ? 'of Odesa Theatre School –' : 'Одеської театральної школи –'}
				</p>
				<h2 class="title-main">
					{isEn ? '«INITIATION INTO ART»' : '«ПОСВЯТА У МИСТЕЦТВО»'}
				</h2>
			</div>

			<!-- Час, місце та зала (Lines 5, 6, 7) -->
			<div class="event-details">
				<p class="detail-row detail-date">
					{isEn ? 'We look forward to seeing you on ' : 'Чекаємо на тебе '}
					<strong class="highlight-date">{isEn ? 'October 24, 2026' : '24 жовтня 2026 р.'}</strong>
				</p>
				<p class="detail-row detail-time">
					<strong class="highlight-time">{isEn ? `at ${time} ` : `о ${time} `}</strong>
					<span>{isEn ? 'at 24 Sofiivska St' : 'за адресою: вул. Софіївська, 24'}</span>
				</p>
				<p class="hall-row">
					<strong>{isEn ? 'Great Hall' : 'Велика зала'}</strong>
				</p>
			</div>
		</div>

		<PosviataMiniIcons side="right" />
	{/if}
</article>

<style>
	.posviata-card {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		width: 100%;
		height: 100%;
		box-sizing: border-box;
		background: #ffffff;
		color: #000000;
		font-family: 'e-Ukraine', var(--font-body), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		padding: 4.06cqi 0 3.47cqi 0;
		overflow: hidden;
		container-type: inline-size;
		container-name: card;
	}

	.posviata-card--cut-lines { border: 1px dashed #d9d9d9; }
	.posviata-card--cover { border: none !important; padding: 4cqi 8cqi; justify-content: center; }

	.cover-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		text-align: center;
		gap: 2.2cqi;
	}

	.cover-emblem {
		display: block;
		max-width: 68cqi;
		max-height: 28cqi;
		width: auto;
		height: auto;
		object-fit: contain;
	}

	.cover-label {
		font-size: 3.2cqi;
		font-weight: 700;
		letter-spacing: 0.22em;
		color: #000000;
		text-transform: uppercase;
	}

	.card-body {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		text-align: center;
		box-sizing: border-box;
	}

	.greeting-row {
		display: flex;
		align-items: baseline;
		width: 100%;
		max-width: 76cqi;
		font-size: 3.6cqi;
		font-weight: 700;
		line-height: 1.22;
		color: #000000;
		margin-bottom: 2.19cqi;
		box-sizing: border-box;
	}

	.greeting-row--named { justify-content: center; text-align: center; }
	.greeting-row--template { justify-content: space-between; }
	.greeting-prefix { white-space: nowrap; padding-right: 0.4cqi; }
	.template-line {
		flex: 1;
		height: 0;
		border-bottom: 0.30cqi solid #000000;
		margin: 0 0.3cqi;
		transform: translateY(-0.12em);
	}
	.greeting-mark { padding-left: 0.2cqi; }
	.greeting-name { font-weight: 700; font-size: 3.6cqi; letter-spacing: -0.01em; }

	.intro-block {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		margin: 0 0 2.8cqi 0;
	}

	.intro-text,
	.intro-subtext {
		margin: 0;
		font-size: 3.6cqi;
		font-weight: 700;
		line-height: 1.22;
		color: #000000;
	}

	.title-main {
		margin: 0;
		font-size: 4.63cqi;
		font-weight: 700;
		letter-spacing: 0.02em;
		line-height: 1.22;
		color: #000000;
	}

	.event-details {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		margin: 0;
	}

	.detail-row {
		margin: 0;
		font-size: 3.6cqi;
		font-weight: 700;
		line-height: 1.22;
		color: #000000;
	}

	.highlight-date { font-weight: 700; font-size: 3.86cqi; }
	.highlight-time { font-weight: 700; }
	.hall-row { margin: 0.6cqi 0 0 0; font-size: 4.37cqi; font-weight: 700; line-height: 1.22; color: #000000; }

	@media print {
		.posviata-card,
		.posviata-card * {
			font-family: 'e-Ukraine', var(--font-body), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
		}
		.posviata-card {
			width: 100% !important;
			height: 100% !important;
			padding: 5.57mm 0 4.76mm 0 !important;
			-webkit-print-color-adjust: exact !important;
			print-color-adjust: exact !important;
		}
		.cover-content { gap: 4mm !important; }
		.cover-emblem {
			max-width: 95mm !important;
			max-height: 40mm !important;
			-webkit-print-color-adjust: exact !important;
			print-color-adjust: exact !important;
		}
		.cover-label { font-size: 4.5mm !important; }
		.greeting-row {
			font-size: 4.94mm !important;
			margin-bottom: 3.0mm !important;
			max-width: 104mm !important;
		}
		.template-line { border-bottom-width: 0.38mm !important; }
		.intro-block { margin-bottom: 3.85mm !important; }
		.intro-text, .intro-subtext { font-size: 4.94mm !important; }
		.title-main { font-size: 6.35mm !important; }
		.detail-row { font-size: 4.94mm !important; }
		.highlight-date { font-size: 5.29mm !important; }
		.hall-row { font-size: 6.0mm !important; margin-top: 1.2mm !important; }
	}
</style>
