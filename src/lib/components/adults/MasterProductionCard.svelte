<script module lang="ts">
	import { GRADUATES, type GraduateIndexEntry } from '$lib/data/graduates';
	import { getAllMasters } from '$lib/data/masters';
	import { createNameMatcher } from '$lib/utils/participantMatch';

	/*
	 * Розкладка робиться ОДИН раз на модуль, а не на кожну картку вистави: у
	 * Федора Ткача їх вісімдесят, і доти кожна перебирала пів тисячі випускників
	 * заново.
	 *
	 * Саме правило зіставлення — у `utils/participantMatch`: воно чисте, має
	 * реальні приклади й перевіряється тестом, а не оком на сторінці.
	 */
	/* Готовий реєстр, а не сирий JSON: там форму вже звірив компілятор, і звідти
	 * не потраплять приховані записи — зв'язок вів би на картку, якої немає. */
	const matchGraduate = createNameMatcher(GRADUATES);

	/* Майстер може згадуватися і ПІБ, і коротким іменем — обидва ведуть до нього. */
	const matchMaster = createNameMatcher(
		getAllMasters().flatMap((m) => [
			{ slug: m.slug, name: m.fullName, master: m },
			{ slug: m.slug, name: m.displayName, master: m }
		])
	);
</script>

<script lang="ts">
	import { t } from 'svelte-i18n';
	import { Video, ExternalLink, Calendar, Users, Trophy } from 'lucide-svelte';
	import { masterProfilePath } from '$lib/data/masters';
	import type { Play } from '$lib/data/plays';
	import { openGraduateModal } from '$lib/services/graduateModal.svelte';
	import type { ResolvedPathname } from '$app/types';

	interface Props {
		prod: Play;
		index: number;
		isEn?: boolean;
	}

	let { prod, index, isEn = false }: Props = $props();

	type Participant =
		| { kind: 'graduate'; graduate: GraduateIndexEntry }
		| { kind: 'master'; href: ResolvedPathname }
		| { kind: 'plain' };

	/**
	 * Ким є учасник вистави: випускником, викладачем чи просто іменем.
	 *
	 * Випускником вважається БУДЬ-ХТО з реєстру, а не лише той, у кого є `code`.
	 * Доти анкета була умовою посилання, і на сторінці Федора Ткача з 188 імен
	 * натискалися 17 — решта у реєстрі є, просто ще не заповнили анкету. Картка
	 * дістає анкету сама й однаково відкривається для тих, у кого її немає, —
	 * те саме рішення, що й у потоці учнів.
	 */
	function participantLink(name: string): Participant {
		const g = matchGraduate(name);
		if (g) return { kind: 'graduate', graduate: g };
		const m = matchMaster(name);
		if (m) return { kind: 'master', href: masterProfilePath(m.slug, isEn ? 'en' : 'uk') };
		return { kind: 'plain' };
	}
</script>

<article class="prod-card" class:prod-card--has-award={prod.awards?.length} data-testid="master-production-card-{prod.number ?? index}">
	<div class="prod-card__header">
		<div class="prod-card__meta">
			{#if prod.number}<span class="num-badge" title="Номер вистави в ДТШ">#{prod.number}</span>{/if}
			<span class="year-badge">
				<Calendar size={13} aria-hidden="true" />
				<span>{prod.year}{prod.dateNote ? ` · ${prod.dateNote}` : ''}</span>
			</span>
			{#if prod.theatreGroup}<span class="group-badge">{prod.theatreGroup}</span>{/if}
		</div>
		{#if prod.isDtsh === false && prod.institution}<span class="institution-badge">{prod.institution}</span>{/if}
	</div>

	<h3 class="prod-card__title">{prod.title}</h3>
	{#if prod.author}<p class="prod-card__author">{prod.author}</p>{/if}

	{#if prod.awards?.length}
		<div class="prod-card__awards" data-testid="master-production-awards-list">
			{#each prod.awards as award (award)}
				<div class="award-item"><Trophy size={16} aria-hidden="true" /><span>{award}</span></div>
			{/each}
		</div>
	{/if}

	{#if prod.videoUrl}
		<div class="prod-card__video-wrap">
			<a href={prod.videoUrl} target="_blank" rel="external noopener noreferrer" class="video-btn" data-testid="master-production-video-link">
				<Video size={15} aria-hidden="true" />
				<span>{$t('galaxy.watchVideo', { default: 'Дивитися відео' })}</span>
				<ExternalLink size={13} aria-hidden="true" />
			</a>
		</div>
	{/if}

	{#if prod.guests?.length}
		<div class="prod-card__participants">
			<div class="participants-header">
				<Users size={14} aria-hidden="true" />
				<span>{$t('galaxy.guestActors')}:</span>
			</div>
			<div class="participants-tags" data-testid="master-production-guests-list">
				<!--
					Тільки текстом: гості школи не закінчували, і зіставляти їх із
					реєстром випускників нема з чим. Див. `guests` у `data/plays.ts`.
				-->
				{#each prod.guests as guest (guest)}
					<span class="part-tag part-tag--plain">{guest}</span>
				{/each}
			</div>
		</div>
	{/if}

	{#if prod.participants?.length}
		<div class="prod-card__participants">
			<div class="participants-header">
				<Users size={14} aria-hidden="true" />
				<span>{$t('galaxy.participants', { default: 'Учасники' })}:</span>
			</div>
			<div class="participants-tags">
				<!--
					Випускник відкривається КАРТКОЮ тут, а не переходом у галактику
					— так само, як у потоці учнів поруч. Людина прийшла дивитися
					вистави майстра, і посилання забирало б її зі сторінки; кнопка
					«летіти до галактики» є в самій картці.

					Картку малює `MasterGraduateFlow` на цій же сторінці: вибір
					живе в стані сторінки, тож досить його туди покласти.
				-->
				{#each prod.participants as part, partIdx (part + partIdx)}
					{@const who = participantLink(part)}
					{#if who.kind === 'graduate'}
						<button
							type="button"
							class="part-tag part-tag--link part-tag--grad"
							onclick={() => openGraduateModal(who.graduate)}
							title="Переглянути картку випускника"
							data-testid="master-production-participant-btn-{partIdx}"
						>{part}</button>
					{:else if who.kind === 'master'}
						<a
							href={who.href}
							class="part-tag part-tag--link part-tag--master"
							title="Переглянути профіль викладача"
							data-testid="master-production-participant-link-{partIdx}"
						>{part}</a>
					{:else}
						<span class="part-tag part-tag--plain">{part}</span>
					{/if}
				{/each}
			</div>
		</div>
	{/if}
</article>

<style>
	.prod-card {
		display: flex; flex-direction: column; background: var(--bg-card);
		border: 1px solid var(--border-main); border-radius: var(--radius-xl, 20px);
		padding: 1.35rem; box-shadow: var(--shadow-sm);
		transition: transform var(--transition-base, 0.25s ease), border-color var(--transition-base, 0.25s ease), box-shadow var(--transition-base, 0.25s ease);
	}
	.prod-card:hover { transform: translateY(-3px); border-color: var(--accent-primary); box-shadow: var(--shadow-main); }
	.prod-card--has-award {
		border-color: rgba(217, 119, 6, 0.35);
		background: linear-gradient(180deg, var(--bg-card) 0%, rgba(217, 119, 6, 0.04) 100%);
	}
	.prod-card__header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.75rem; }
	.prod-card__meta { display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem; }
	.num-badge { padding: 0.2rem 0.55rem; border-radius: var(--radius-sm, 6px); background: var(--bg-surface); border: 1px solid var(--border-main); color: var(--text-title); font-size: 0.75rem; font-weight: 700; }
	.year-badge { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.2rem 0.6rem; border-radius: var(--radius-sm, 6px); background: var(--bg-surface); border: 1px solid var(--border-main); color: var(--text-main); font-size: 0.8rem; font-weight: 600; }
	.group-badge { padding: 0.2rem 0.6rem; border-radius: var(--radius-sm, 6px); background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.25); color: #2563eb; font-size: 0.8rem; font-weight: 600; }
	:global(.theme-dark) .group-badge, :global(.theme-dark-cyan) .group-badge { color: #60a5fa; background: rgba(37, 99, 235, 0.2); }
	.institution-badge { padding: 0.2rem 0.55rem; border-radius: var(--radius-sm, 6px); background: var(--bg-surface); border: 1px solid var(--border-main); color: var(--text-muted); font-size: 0.75rem; }
	.prod-card__title { margin: 0.2rem 0 0.4rem; font-size: 1.2rem; font-weight: 700; color: var(--text-title); line-height: 1.3; }
	.prod-card__author { margin: 0 0 0.85rem; font-size: 0.88rem; color: var(--text-muted); font-style: italic; line-height: 1.4; }
	.prod-card__awards { margin-bottom: 0.85rem; display: flex; flex-direction: column; gap: 0.4rem; }
	.award-item { display: flex; align-items: flex-start; gap: 0.5rem; padding: 0.5rem 0.75rem; border-radius: var(--radius-md, 10px); background: rgba(217, 119, 6, 0.08); border: 1px solid rgba(217, 119, 6, 0.25); color: #b45309; font-size: 0.84rem; font-weight: 600; line-height: 1.35; }
	:global(.theme-dark) .award-item, :global(.theme-dark-cyan) .award-item { color: #fbbf24; background: rgba(217, 119, 6, 0.15); }
	.prod-card__video-wrap { margin-bottom: 0.85rem; }
	.video-btn { display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.4rem 0.8rem; border-radius: var(--radius-md, 8px); background: rgba(220, 38, 38, 0.08); border: 1px solid rgba(220, 38, 38, 0.25); color: #dc2626; font-size: 0.82rem; font-weight: 600; text-decoration: none; transition: all var(--transition-base, 0.2s ease); }
	.video-btn:hover { background: #dc2626; color: #ffffff; border-color: #dc2626; }
	.prod-card__participants { margin-top: auto; padding-top: 0.85rem; border-top: 1px dashed var(--border-main); }
	.participants-header { display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.45rem; }
	.participants-tags { display: flex; flex-wrap: wrap; gap: 0.35rem; }
	/* `font-family` — бо частина плашок тепер <button>, а він шрифт не успадковує. */
	.part-tag { display: inline-block; padding: 0.18rem 0.5rem; border-radius: var(--radius-sm, 6px); background: var(--bg-surface); border: 1px solid var(--border-main); font-family: inherit; font-size: 0.78rem; color: var(--text-main); text-decoration: none; line-height: 1.3; }
	/*
	 * Ім'я, якого немає в реєстрі, — приглушене.
	 *
	 * Доти натискні й ненатискні плашки виглядали однаково, і дізнатися різницю
	 * можна було лише спробувавши натиснути. Таких на сторінці Федора Ткача
	 * вісімдесят п'ять зі ста вісімдесяти восьми — майже половина списку
	 * обіцяла дію, якої немає.
	 */
	.part-tag--plain { opacity: 0.7; }
	.part-tag--link { cursor: pointer; transition: all var(--transition-base, 0.18s ease); }
	.part-tag--grad:hover { background: rgba(220, 38, 38, 0.1); border-color: var(--accent-primary); color: var(--accent-primary); transform: translateY(-1px); }
	.part-tag--master { background: rgba(16, 185, 129, 0.08); border-color: rgba(16, 185, 129, 0.25); color: #059669; }
	:global(.theme-dark) .part-tag--master, :global(.theme-dark-cyan) .part-tag--master { color: #34d399; }
	.part-tag--master:hover { background: rgba(16, 185, 129, 0.2); border-color: #10b981; transform: translateY(-1px); }
</style>
