<script lang="ts">
	import { ArrowLeft, ArrowRight } from 'lucide-svelte';
	import type { ResolvedPathname } from '$app/types';

	interface Props {
		/** Куди «назад» — уже з мовним префіксом (`localizedPath`). */
		backHref: ResolvedPathname;
		backLabel: string;
		backTestId: string;
		/**
		 * Куди «вперед», зазвичай у саму галактику.
		 *
		 * Необов'язкове: на сторінці наповнення архіву друга кнопка не потрібна —
		 * там назад і вперед означали б одне й те саме місце.
		 */
		forwardHref?: ResolvedPathname;
		forwardLabel?: string;
		forwardTestId?: string;
		/**
		 * ДВА ВИГЛЯДИ, і обидва вже були в проєкті.
		 *
		 * `pill` — плашка з фоном і рамкою; так виглядають вісім сторінок із
		 * одинадцяти. `plain` — просто приглушений текст зі стрілкою, без фону;
		 * так стояло на сторінці вистави й на сторінці наповнення архіву.
		 *
		 * Це не вибір оформлення заднім числом: коли одинадцять копій зводили в
		 * один компонент, виявилося, що вони НЕ однакові, і `svelte-check`
		 * показав це списком невживаних селекторів. Звести все до плашки
		 * означало б тихо перемалювати дві сторінки — тому вигляд лишився
		 * пропом, а не зник.
		 */
		variant?: 'pill' | 'plain';
	}

	let {
		backHref,
		backLabel,
		backTestId,
		forwardHref,
		forwardLabel,
		forwardTestId,
		variant = 'pill'
	}: Props = $props();
</script>

<!--
	Рядок «назад у перелік / у галактику» — ОДИН на одинадцять сторінок.
	Розбір, чому винесено й скільком це дорівнює, — у докблоці стилів нижче.
-->
<nav class="crumbs clears-logo" class:crumbs--plain={variant === 'plain'} aria-label="Breadcrumb">
	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
	<a href={backHref} class="crumbs__link" data-testid={backTestId}>
		<ArrowLeft size={18} aria-hidden="true" />
		<span>{backLabel}</span>
	</a>

	{#if forwardHref && forwardLabel && forwardTestId}
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
		<a href={forwardHref} class="crumbs__link crumbs__link--forward" data-testid={forwardTestId}>
			<span>{forwardLabel}</span>
			<ArrowRight size={18} aria-hidden="true" />
		</a>
	{/if}
</nav>

<style>
	/*
	 * ЧОМУ ЦЕЙ КОМПОНЕНТ Є.
	 *
	 * Той самий рядок навігації був написаний ОДИНАДЦЯТЬ разів: на сторінках
	 * груп, фестивалів, вистав, навчальних закладів і театрів (по дві кожного)
	 * плюс наповнення архіву. Щоразу та сама розмітка й ті самі шість правил
	 * стилів, що відрізнялися лише префіксом класу — `nav-link`,
	 * `nav-back-link`, `inst-nav`, `play-nav`, `th-nav`.
	 *
	 * ## СКІЛЬКИ ЦЕ КОШТУВАЛО НАСПРАВДІ — І ЯК Я ПОМИЛИВСЯ В ЗАМІРІ
	 *
	 * Борг був записаний у докблоці бюджету розміру ще на четвертому переліку, з
	 * чесним визнанням, що вартості я не мірив. Потім я зміряв — і прочитав
	 * замір неправильно.
	 *
	 * Дослід: прибрати рядок з ОДНІЄЇ сторінки. Звіт показав 683 → 682 КБ, і я
	 * зрозумів це як «кілобайт за копію», тобто під десять кілобайтів за всі
	 * одинадцять. Насправді зведення всіх одинадцяти дало ту саму одиницю: 683 →
	 * 682. Тобто копія коштує близько СОТНІ БАЙТІВ, а не кілобайта, і зміна на
	 * одиницю в округленому числі означала лише перехід через межу.
	 *
	 * Причина зрозуміла заднім числом: Vite тримає помічники шаблонів спільними,
	 * а brotli стискає однакову розмітку в сусідніх чанках майже безкоштовно.
	 * Повторення в коді дороге для ЛЮДИНИ, а не для архіватора.
	 *
	 * Отже винос НЕ оплатив розділу театрів — поріг усе одно піднято, і в його
	 * докблоці це сказано. Виграш тут інший і теж справжній: один рядок замість
	 * одинадцяти, і наступна правка навігації робиться в одному місці.
	 *
	 * Значення взяті з тих правил дослівно — з ОДНИМ винятком, названим вголос:
	 * на сторінці навчальної групи стояли ще й два правила `:global(.light-theme)
	 * .nav-back-link`, які прописували плашці конкретні сірі кольори замість
	 * токенів теми. Вони були лише там, у решти семи плашка бралася з токенів,
	 * тож при зведенні прибрані: та сторінка тепер виглядає як інші. Це єдина
	 * видима зміна від виносу.
	 */
	.crumbs {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}
	.crumbs__link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border-radius: var(--radius-full, 9999px);
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		color: var(--text-main);
		font-size: 0.9rem;
		font-weight: 600;
		text-decoration: none;
		transition:
			border-color var(--transition-base),
			transform var(--transition-base);
	}
	.crumbs__link:hover {
		border-color: var(--accent-primary);
		transform: translateX(-3px);
	}
	/* Уперед — і зсув під курсором теж уперед: та сама відповідь руху на бік,
	   у який веде посилання. */
	.crumbs__link--forward:hover {
		transform: translateX(3px);
	}

	/*
	 * Простий вигляд: жодної плашки, лише приглушений текст. Скидання йде ПІСЛЯ
	 * правил плашки — вага однакова (по одному класу), тож вирішує порядок у
	 * файлі. Через `!important` було б коротше й гірше: медіазапити й теми вже
	 * не змогли б це перебити.
	 */
	.crumbs--plain .crumbs__link {
		padding: 0;
		gap: 0.4rem;
		background: none;
		border: 0;
		border-radius: 0;
		color: var(--text-muted);
		transition: color var(--transition-fast);
	}
	.crumbs--plain .crumbs__link:hover,
	.crumbs--plain .crumbs__link:focus-visible {
		color: var(--accent-primary);
		transform: none;
	}
</style>
