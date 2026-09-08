<script lang="ts">
	import { Flower2 } from 'lucide-svelte';
	import { graduatePhoto, graduatePhotoSrcset, type GraduateIndexEntry } from '$lib/data/graduates';

	/**
	 * Обличчя учня — портрет у колі або САМА КВІТКА.
	 *
	 * ## Чому в кого немає фото — без кола
	 *
	 * Доти квітка сиділа в такому самому колі, як портрет: те саме тло, та сама
	 * рамка, та сама тінь. Виходило, що порожній запис важить на малюнку рівно
	 * стільки ж, скільки заповнений, — а це неправда й проти самої мети сторінки
	 * (щоб анкети заповнювали). Автор попросив як у галактиці випускників: «у кого
	 * є фото, буде мати більше місця, ніж ті, хто фото немає, тому без фото просто
	 * квітка без додаткового фону».
	 *
	 * Міняється ТІЛЬКИ коло. Ні місце під обличчя, ні розмір самої квітки не
	 * чіпаються: місце тримає розкладку (від нього залежить, що ніхто ні на кого
	 * не налазить), а квітка й так була такою, якою її бачив автор.
	 *
	 * ## Чому квітка, а не порожньо
	 *
	 * Рішення автора з першої редакції сторінки: квітка каже «тут росте», а
	 * порожнеча казала б «тут нікого».
	 *
	 * ## Розмір
	 *
	 * Місце під обличчя приходить ЗЗОВНІ через `--face`: на кулі воно рахується
	 * з кількості учнів (`fitFaceFraction`), у переліку імен — сталі 34 px.
	 */
	interface Props {
		student: GraduateIndexEntry;
		/** Розмір іконки-квітки: у дрібному обличчі велика квітка не влазить. */
		icon?: number;
	}

	let { student, icon = 28 }: Props = $props();
</script>

{#if student.hasPhoto}
	<span class="face">
		<img
			src={graduatePhoto(student.slug, 192)}
			srcset={graduatePhotoSrcset(student.slug)}
			sizes="96px"
			width="96"
			height="96"
			alt=""
			loading="lazy"
		/>
	</span>
{:else}
	<span class="face face--bloom">
		<Flower2 size={icon} aria-hidden="true" />
	</span>
{/if}

<style>
	/*
	 * `--face` задає ТОЙ, ХТО СТАВИТЬ обличчя, і саме тому вона не оголошена
	 * тут: власне оголошення на `.face` перебило б значення, успадковане від
	 * розкладки, — у користувацьких властивостей оголошення на елементі
	 * сильніше за успадкування. Хто її задає і чому, записано в
	 * `css-variables.test.ts` → `CROSS_COMPONENT`.
	 */
	.face {
		display: grid;
		place-items: center;
		width: var(--face, 72px);
		height: var(--face, 72px);
		border-radius: 50%;
		overflow: hidden;
		background: var(--bg-card);
		border: 2px solid color-mix(in srgb, var(--accent-primary) 55%, var(--border-main));
		color: var(--accent-text);
		box-shadow: var(--shadow-main);
		transition: border-color var(--transition-base);
	}
	.face img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	/*
	 * Місце те саме, диска немає. `border: 0`, а не `border-color: transparent`:
	 * прозора рамка все одно з'їдала б два пікселі з боку, і квітка стояла б
	 * трохи не там, де портрет сусіда.
	 */
	.face--bloom {
		background: none;
		border: 0;
		box-shadow: none;
	}
</style>
