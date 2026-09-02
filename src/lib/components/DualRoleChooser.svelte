<script lang="ts">
	import { t } from 'svelte-i18n';
	import { X, GraduationCap, Users } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { focusTrap } from '$lib/utils/focusTrap';
	import { overlayFade, overlayPop } from '$lib/utils/overlayTransition';
	import { localeFromPath } from '$lib/i18n/routing';
	import { masterProfilePath, type Master } from '$lib/data/masters';
	import type { GraduateIndexEntry } from '$lib/data/graduates';
	import { openGraduateModal } from '$lib/services/graduateModal.svelte';
	import { dualRoleMasterLabelKey } from '$lib/utils/masterLabel';

	/**
	 * Вибір, яку зі ДВОХ сторінок відкрити, коли людина є і випускником, і
	 * працівником школи.
	 *
	 * ## Чому питання, а не перехід
	 *
	 * Доти зірка такої людини вела просто на сторінку працівника — і це був
	 * односторонній вибір за читача. Але в неї справді дві сторінки, і вони
	 * відповідають на різні питання: «ким я тут був» і «чим я тут займаюся».
	 * Клікаючи обличчя в потоці учнів майстра, читач майже напевно хоче першу;
	 * клікаючи те саме обличчя в переліку команди — другу. Вгадати за нього
	 * означало б помилятися в половині випадків.
	 *
	 * Таких людей одинадцять — перелік і причини в
	 * [`data/dualRole.ts`](../data/dualRole.ts).
	 *
	 * ## Чому окремий компонент
	 *
	 * У `MasterGraduateFlow` лишалося 14 рядків до стелі `structure.test.ts`, а
	 * вікно з пасткою фокуса й двома кнопками коротшим не буває. До того ж вибір
	 * знадобиться і в інших місцях, де стоїть та сама людина.
	 */
	interface Props {
		/** Запис працівника тієї самої людини. */
		master: Master;
		/** Її ж запис випускника — саме він дає ім'я й рік випуску. */
		graduate: GraduateIndexEntry;
		onclose: () => void;
	}

	let { master, graduate, onclose }: Props = $props();

	/*
	 * Підписи й переходи рахуються ТУТ, а не в того, хто відкрив вікно.
	 *
	 * Спершу вони жили у виклику, і `MasterGraduateFlow` переростав стелю
	 * `structure.test.ts` на 14 рядків саме на них. Але справа не в рядках:
	 * місце, що показує вибір, і мусить знати, як виглядає кожен варіант і куди
	 * веде. Тому вікно приймає два ЗАПИСИ, а не готові рядки.
	 */
	const graduateCaption = $derived(
		graduate.graduationYear
			? `${$t('galaxy.graduated', { default: 'випуск' })} ${graduate.graduationYear}`
			: null
	);
	const masterCaption = $derived(master.roleTitle ?? null);

	/*
	 * Значення читаються ДО закриття, і це не стиль, а необхідність.
	 *
	 * Пропси у Svelte 5 — геттери: `graduate` тут не копія запису, а виклик
	 * `chooser.entry.graduate` у того, хто відкрив вікно. `onclose()` ставить
	 * `chooser = null`, і наступне звернення до пропа падає:
	 *
	 *     TypeError: Cannot read properties of null (reading 'entry')
	 *         at get graduate (MasterGraduateFlow.svelte)
	 *         at onGraduate (DualRoleChooser.svelte)
	 *
	 * Тобто вікно закривалося, а перехід не відбувався — натискання виглядало як
	 * «нічого не сталося». У `onMaster` та сама вада: `master.slug` читався після
	 * закриття, просто про неї ще не спіткнулися.
	 *
	 * Закрити ПІСЛЯ переходу було б гіршим виправленням: тоді порядок знову
	 * важить, просто в інший бік. Знімок значення не залежить від порядку взагалі.
	 */
	function onGraduate() {
		const запис = graduate;
		onclose();
		openGraduateModal(запис);
	}

	function onMaster() {
		const шлях = masterProfilePath(master.slug, localeFromPath(page.url.pathname));
		onclose();
		goto(шлях);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key !== 'Escape') return;
		event.preventDefault();
		onclose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div
	class="backdrop"
	transition:overlayFade
	onclick={onclose}
	role="presentation"
	data-testid="dual-role-backdrop"
></div>

<div
	class="sheet"
	transition:overlayPop
	role="dialog"
	aria-modal="true"
	aria-labelledby="dual-role-title"
	{@attach focusTrap()}
	data-testid="dual-role-modal"
>
	<button
		type="button"
		class="sheet__close"
		aria-label={$t('common.close', { default: 'Закрити' })}
		onclick={onclose}
		data-testid="dual-role-close-btn"
	>
		<X size={18} aria-hidden="true" />
	</button>

	<!--
		Пояснювального рядка тут НЕМА навмисно. Він казав «Ця людина є і
		випускницею, і працівницею школи» — і в цій фразі рід зашитий у слова, тож
		на Павлі Кошці вона читалася неправдою. Родових варіантів довелося б
		тримати два, а вибирати між ними — за даними, яких у реєстрі немає: статі
		ми не зберігаємо й зберігати не збираємося.
		Але головне не це: дві кнопки нижче й так називають, що саме відкриється,
		тож рядок нічого не додавав.
	-->
	<h2 class="sheet__title" id="dual-role-title">{graduate.name}</h2>

	<div class="sheet__choices">
		<button type="button" class="choice" onclick={onGraduate} data-testid="dual-role-graduate-btn">
			<GraduationCap size={20} aria-hidden="true" />
			<span class="choice__body">
				<span class="choice__name">{$t('galaxy.graduatePageLink', { default: 'Сторінка випускника' })}</span>
				{#if graduateCaption}<span class="choice__meta">{graduateCaption}</span>{/if}
			</span>
		</button>

		<button type="button" class="choice" onclick={onMaster} data-testid="dual-role-master-btn">
			<Users size={20} aria-hidden="true" />
			<span class="choice__body">
				<span class="choice__name">{$t(dualRoleMasterLabelKey(master), { default: 'Сторінка викладача' })}</span>
				{#if masterCaption}<span class="choice__meta">{masterCaption}</span>{/if}
			</span>
		</button>
	</div>
</div>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 60;
		background: rgb(4 12 28 / 0.66);
		backdrop-filter: blur(3px);
	}

	.sheet {
		position: fixed;
		z-index: 61;
		top: 50%;
		left: 50%;
		translate: -50% -50%;
		width: min(92vw, 27rem);
		padding: 1.4rem 1.2rem 1.2rem;
		border-radius: var(--radius-lg, 16px);
		background: var(--bg-card);
		border: 1px solid var(--border-main);
		box-shadow: var(--shadow-main);
	}

	.sheet__close {
		position: absolute;
		top: 0.6rem;
		right: 0.6rem;
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		color: var(--text-title);
		cursor: pointer;
	}

	.sheet__title {
		margin: 0 2rem 0.9rem 0;
		font-size: 1.15rem;
		font-weight: 700;
		color: var(--text-title);
	}

	.sheet__choices {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.choice {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		width: 100%;
		padding: 0.7rem 0.9rem;
		border-radius: var(--radius-md, 12px);
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		color: var(--text-title);
		text-align: left;
		cursor: pointer;
		transition:
			border-color var(--transition-base, 0.2s ease),
			transform var(--transition-base, 0.2s ease);
	}
	.choice:hover {
		border-color: var(--accent-primary);
		transform: translateX(3px);
	}

	.choice__body {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		min-width: 0;
	}
	.choice__name {
		font-weight: 600;
	}
	.choice__meta {
		font-size: 0.8rem;
		color: var(--text-muted);
	}
</style>
