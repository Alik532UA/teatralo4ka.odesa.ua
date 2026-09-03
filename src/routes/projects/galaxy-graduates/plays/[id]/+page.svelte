<script lang="ts">
	import { t, locale } from 'svelte-i18n';
	import {
		ArrowLeft,
		ArrowRight,
		Globe,
		Theater,
		GraduationCap,
		Trophy
	} from 'lucide-svelte';
	import { localizedPath } from '$lib/i18n/routing';
	import { groupProfilePath } from '$lib/data/groups';
	import { festivalPath } from '$lib/data/festivals';
	import { masterProfilePath } from '$lib/data/masters';
	import GroupPersonCard from '$lib/components/GroupPersonCard.svelte';
	import PlayCastSection from '$lib/components/PlayCastSection.svelte';
	import PlayHeader from '$lib/components/PlayHeader.svelte';
	import GraduateCardOnPage from '$lib/components/GraduateCardOnPage.svelte';
	import VerificationNoticeBanner from '$lib/components/VerificationNoticeBanner.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const isEn = $derived($locale === 'en');
	const currentLang = $derived<'uk' | 'en'>(isEn ? 'en' : 'uk');

	/*
	 * Другий рядок картки — РОЛЬ, а якщо її не записано, рік випуску.
	 *
	 * Не порожньо: картка без другого рядка вища за сусідні на пів рядка, і ряд
	 * розсипається. Рік випуску тут доречний і сам по собі — він каже, чи людина
	 * була на той час першокурсницею, чи вже випускалася.
	 */
</script>

<svelte:head>
	<title>{data.play.title} — {$t('galaxy.title')}</title>
</svelte:head>

<main class="play-page" data-testid="play-page-section">
	<div class="container">
		<nav class="play-page__nav clears-logo" aria-label="Breadcrumb">
			<!--
				Назад — до ПЕРЕЛІКУ ВИСТАВ, а не одразу в галактику: це найближчий
				вищий рівень, і саме туди людина очікує повернутися, роздивившись
				одну виставу. Доти переліку не існувало, і кнопка вела через голову
				на два рівні вгору.
			-->
			<a
				href={localizedPath('/projects/galaxy-graduates/plays/', currentLang)}
				class="play-nav"
				data-testid="play-back-link"
			>
				<ArrowLeft size={18} aria-hidden="true" />
				<span>{$t('galaxy.backToPlays')}</span>
			</a>

			<a
				href={localizedPath('/projects/galaxy-graduates/', currentLang)}
				class="play-nav play-nav--forward"
				data-testid="play-galaxy-link"
			>
				<span>{$t('galaxy.title')}</span>
				<ArrowRight size={18} aria-hidden="true" />
			</a>
		</nav>

		<VerificationNoticeBanner status={data.play.verificationStatus} />

		<!-- Афіша, значки, назва, автори й записи — у PlayHeader зі своїми стилями. -->
		<PlayHeader play={data.play} />

		<!--
			СКЛАД — головне, заради чого ця сторінка існує, і тому він перший.

			Береться виключно з анкет: тут ті, хто сам назвав виставу своєю.
			Добудовувати склад із груп заборонено — людина могла прийти в групу
			вже після цієї вистави, а сама вистава могла зіграти двома групами
			разом. Заміри в докблоці `plays.ts`.
		-->
		<PlayCastSection
			cast={data.cast}
			staff={data.staff}
			programme={data.play.programme}
			participants={data.play.participants}
			extraParticipants={data.play.extraParticipants}
		/>

		{#if data.masters.length > 0}
			<section class="play-section" aria-labelledby="play-masters-title">
				<div class="play-heading">
					<span class="play-heading__icon play-heading__icon--gold">
						<GraduationCap size={20} aria-hidden="true" />
					</span>
					<h2 id="play-masters-title" class="play-heading__title">{$t('galaxy.playMasters')}</h2>
					<span class="play-heading__count">{data.masters.length}</span>
				</div>
				<ul class="people-grid" data-testid="play-masters-list">
					{#each data.masters as master, index (master.id)}
						<li>
							<GroupPersonCard
								name={isEn ? master.displayNameEn : master.displayName}
								photo={master.photo ?? null}
								subtitle={master.subjects?.join(', ') ?? null}
								href={masterProfilePath(master.slug, currentLang)}
								index={data.cast.length + index}
								testid="play-master-{master.slug}"
							/>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		<!--
			Групи й фестивалі — НЕ склад, і показуються окремо саме тому.
			Репертуар групи каже, що вистава належить її історії, а не що в ній
			грали всі її учасники.
		-->
		{#if (data.primaryGroups?.length ?? 0) > 0 || (data.supportingGroups?.length ?? 0) > 0}
			<section class="play-section" aria-labelledby="play-where-title">
				<div class="play-heading">
					<span class="play-heading__icon play-heading__icon--primary"><Theater size={20} aria-hidden="true" /></span>
					<h2 id="play-where-title" class="play-heading__title">
						{(data.primaryGroups?.length ?? 0) === 1 && (data.supportingGroups?.length ?? 0) === 0
							? $t('galaxy.playInRepertoireSingle')
							: $t('galaxy.playInRepertoire')}
					</h2>
				</div>
				<ul class="chips" data-testid="play-where-list">
					{#each data.primaryGroups ?? data.groups as group (group.slug)}
						<li>
							<a
								class="chip"
								href={localizedPath(groupProfilePath(group.slug), currentLang)}
								data-testid="play-group-link-{group.slug}"
							>
								{group.abbr || (isEn && group.nameEn ? group.nameEn : group.name)}
							</a>
						</li>
					{/each}
					{#if (data.supportingGroups?.length ?? 0) > 0}
						<li class="chips__item--label">
							<span class="supporting-label">{$t('galaxy.playWithParticipation')}:</span>
						</li>
						{#each data.supportingGroups as group (group.slug)}
							<li>
								<a
									class="chip chip--supporting"
									href={localizedPath(groupProfilePath(group.slug), currentLang)}
									data-testid="play-group-link-{group.slug}"
								>
									{group.abbr || (isEn && group.nameEn ? group.nameEn : group.name)}
								</a>
							</li>
						{/each}
					{/if}
				</ul>
			</section>
		{/if}

		<!--
			ФЕСТИВАЛІ — окремий розділ, а не плашка серед курсів.
			
			Доти вони стояли в тому самому переліку, під заголовком «У репертуарі
			групи», і «Мрій-Дім» читався як ще один курс школи. Це різні речі:
			курс — хто грав, фестиваль — куди возили.
		-->
		{#if data.festivals.length > 0}
			<section class="play-section" aria-labelledby="play-festivals-title">
				<div class="play-heading">
					<span class="play-heading__icon play-heading__icon--primary">
						<Globe size={20} aria-hidden="true" />
					</span>
					<h2 id="play-festivals-title" class="play-heading__title">
						{$t('galaxy.festivalsTitle')}
					</h2>
					<span class="play-heading__count">{data.festivals.length}</span>
				</div>
				<ul class="chips" data-testid="play-festivals-list">
					{#each data.festivals as festival (festival.slug)}
						<li>
							<a
								class="chip chip--festival"
								href={localizedPath(festivalPath(festival.slug), currentLang)}
								data-testid="play-festival-link-{festival.slug}"
							>
								{isEn && festival.nameEn ? festival.nameEn : festival.name}
							</a>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if data.play.awards?.length || data.play.guests?.length}
			<section class="play-section" aria-labelledby="play-extra-title">
				<div class="play-heading">
					<span class="play-heading__icon play-heading__icon--gold"><Trophy size={20} aria-hidden="true" /></span>
					<h2 id="play-extra-title" class="play-heading__title">{$t('galaxy.playAwards')}</h2>
				</div>
				{#if data.play.awards?.length}
					<ul class="play-list" data-testid="play-awards-list">
						{#each data.play.awards as award (award)}
							<li>{award}</li>
						{/each}
					</ul>
				{/if}
				<!--
					Склад показу й ті, хто прийшов додатково, переїхали в блок «Хто
					грав»: це ті самі люди показу, просто без анкет, і під
					нагородами вони читалися як приписка до диплома.
				-->
				{#if data.play.guests?.length}
					<p class="play-note">{$t('galaxy.playGuests')}</p>
					<ul class="play-list" data-testid="play-guests-list">
						{#each data.play.guests as person (person)}
							<li>{person}</li>
						{/each}
					</ul>
				{/if}
			</section>
		{/if}
	</div>
</main>

<!--
	Картка випускника, що відкривається поверх цієї сторінки. Чому саме так — у
	докблоці `GraduateCardOnPage`.
-->
<GraduateCardOnPage />

<style>
	.play-page {
		padding: var(--page-pad-top) 0 var(--page-pad-bottom);
	}
	/*
	 * Власні класи, а не `.nav-link` зі сторінок фестивалю: стилі Svelte
	 * приватні, тож чужий клас тут не отримав би жодного оформлення. Гейт
	 * `component-styles` саме про це й нагадав.
	 */
	.play-nav {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		color: var(--text-muted);
		text-decoration: none;
		font-weight: 600;
		transition: color var(--transition-fast);
	}
	.play-nav:hover,
	.play-nav:focus-visible {
		color: var(--accent-primary);
	}
	.play-nav--forward {
		margin-left: auto;
	}
	.play-page__nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-md);
		flex-wrap: wrap;
		margin-bottom: var(--space-lg);
	}
	/* Стилі шапки — у `PlayHeader`, разом із її розміткою. */
	/*
	 * Заголовок секції — свої класи, а не `.section-heading` зі сторінок групи
	 * й фестивалю: стилі Svelte приватні, і чужий клас тут лишився б без
	 * оформлення. Вигляд навмисно той самий — читач має бачити ті самі
	 * заголовки на всіх трьох сторінках.
	 */
	.play-heading {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}
	.play-heading__title {
		margin: 0;
		font-size: clamp(1.2rem, 3vw, 1.6rem);
		font-weight: 700;
		color: var(--text-title);
	}
	.play-heading__count {
		display: grid;
		place-items: center;
		min-width: 1.8rem;
		height: 1.8rem;
		padding: 0 0.45rem;
		border-radius: var(--radius-full, 9999px);
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		color: var(--text-muted);
		font-size: 0.82rem;
		font-weight: 700;
	}
	.play-heading__icon {
		display: inline-grid;
		place-items: center;
		width: 2.2rem;
		height: 2.2rem;
		border-radius: var(--radius-md, 12px);
	}
	.play-heading__icon--gold {
		background: rgb(249 179 29 / 0.15);
		border: 1px solid rgb(249 179 29 / 0.3);
		color: #f9b31d;
	}
	.play-heading__icon--primary {
		background: rgb(0 181 236 / 0.15);
		border: 1px solid rgb(0 181 236 / 0.3);
		color: var(--accent-primary);
	}
	.play-section {
		margin-bottom: var(--space-2xl);
	}
	.play-note {
		margin: 0.9rem 0 0;
		max-width: 60ch;
		color: var(--text-muted);
		font-size: 0.9rem;
		line-height: 1.5;
	}
	.play-list {
		margin: 0.5rem 0 0;
		padding-left: 1.1rem;
		color: var(--text-main);
		line-height: 1.6;
	}
	/*
	 * Ті самі числа, що на сторінці групи: по двоє в рядок на телефоні, бо
	 * грид-елемент не вужчий за свій найдовший рядок, а прізвища бувають довгі.
	 */
	.people-grid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(220px, 100%), 1fr));
		gap: 1rem;
	}
	@media (max-width: 767px) {
		.people-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 0.75rem;
		}
	}
	.chips {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.chip {
		display: inline-flex;
		align-items: center;
		padding: 0.35rem 0.9rem;
		border-radius: var(--radius-full, 9999px);
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		color: var(--text-main);
		text-decoration: none;
		font-weight: 600;
		font-size: 0.9rem;
		transition:
			border-color var(--transition-fast),
			color var(--transition-fast);
	}
	.chip:hover,
	.chip:focus-visible {
		border-color: var(--accent-primary);
		color: var(--accent-primary);
	}
	.chips__item--label {
		display: inline-flex;
		align-items: center;
	}
	.supporting-label {
		color: var(--text-muted);
		font-size: 0.85rem;
		font-weight: 500;
		padding: 0 0.25rem;
	}
	.chip--supporting {
		font-size: 0.82rem;
		padding: 0.25rem 0.75rem;
		font-weight: 500;
		opacity: 0.9;
		border-style: dotted;
	}
	.chip--festival {
		border-style: dashed;
	}

</style>
