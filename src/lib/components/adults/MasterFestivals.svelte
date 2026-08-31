<script lang="ts">
	import { t } from 'svelte-i18n';
	import { Globe } from 'lucide-svelte';
	import { getFestivalsByMaster } from '$lib/data/festivals';
	import GraduateFestivals from '$lib/components/GraduateFestivals.svelte';

	/**
	 * Фестивалі, на які їздив цей працівник.
	 *
	 * Доти сторінка викладача про них не знала нічого, хоч зв'язок у реєстрі є:
	 * `masterIds` заповнені в усіх чотирьох фестивалях (по 2–5 людей). Побачити
	 * поїздку можна було лише з боку випускника — тобто «зайди в чиюсь анкету і
	 * там прочитай».
	 *
	 * Сам перелік малює `GraduateFestivals` — той самий компонент, що в анкеті
	 * випускника. Різниця лише в тому, ЧИЙ список йому дати: тут `masterIds`,
	 * там `memberIds`.
	 *
	 * Мініатюри учасників малює той самий `GraduateFestivals` (`showMembers`) —
	 * усередині картки свого фестивалю. Окремим списком під усіма фестивалями
	 * вони висіли самі по собі, і з екрана не було видно, хто з якої поїздки.
	 * Свій підпис списку вимкнений: заголовок секції вже каже «Фестивалі».
	 *
	 * `Globe` — та сама іконка, якою фестивалі підписані в галактиці; своя
	 * іконка для того самого поняття означала б, що читач їх не зіставить.
	 */
	interface Props {
		masterId: string;
	}

	let { masterId }: Props = $props();

	const festivals = $derived(getFestivalsByMaster(masterId));
</script>

{#if festivals.length}
	<section class="fests-section" data-testid="master-festivals-section">
		<div class="section-header">
			<div class="section-icon">
				<Globe size={24} aria-hidden="true" />
			</div>
			<h2 class="section-title" data-testid="master-festivals-title">
				{$t('galaxy.festivalsTitle', { default: 'Фестивалі' })}
			</h2>
		</div>

		<GraduateFestivals {festivals} testIdPrefix="master-festivals" showMembers showTitle={false} />
	</section>
{/if}

<style>
	.fests-section {
		margin-top: clamp(1.5rem, 3vw, 2.5rem);
	}

	.section-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.section-icon {
		display: grid;
		place-items: center;
		width: 46px;
		height: 46px;
		border-radius: var(--radius-lg, 16px);
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		/* `--text-title`, а не `--accent-primary`: акцент на `--bg-surface` дає
		   1.96:1 у темі «yellow» і 2.16:1 у «light» — гейт `contrast.test.ts`
		   назвав обидві. Та сама пара, що в `MasterGroups`, і проходить. */
		color: var(--text-title);
		flex-shrink: 0;
	}

	.section-title {
		margin: 0;
		font-size: clamp(1.15rem, 2.2vw, 1.5rem);
		font-weight: 700;
		color: var(--text-title);
	}

</style>
