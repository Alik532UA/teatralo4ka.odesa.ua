<script lang="ts">
	import { Plus } from 'lucide-svelte';
	import EditContactButton from '$lib/components/EditContactButton.svelte';

	/**
	 * Звернення «додай те, чого в архіві немає» — плиткою або рядком.
	 *
	 * ## Звідки взялося
	 *
	 * Картка жила сніпетом у переліку груп і була ПЛИТКОЮ. У плитці вона на
	 * місці, а в двох інших режимах (хронологія, список) та сама плитка стояла
	 * над переліком рядків окремим прямокутником шириною 24rem — тобто в списку
	 * лежав шматок іншого режиму. У переліку вистав звернення не було зовсім.
	 *
	 * Тому один компонент і два вигляди. Різниця не косметична: плитка стоїть
	 * У СІТЦІ й тягнеться на всю висоту клітинки, рядок стоїть НАД переліком і
	 * тягнеться на всю ширину — це різні розкладки, а не різні кольори.
	 *
	 * ## Чому стилі свої, а не сторінкові
	 *
	 * `.group-card` лежить у scoped-стилях сторінки груп, тобто ззовні
	 * недосяжний, а в переліку вистав його немає взагалі. Значення повторені з
	 * нього свідомо: інакше ті самі двадцять рядків мусили б лежати у ДВОХ
	 * сторінках, а не в одному компоненті.
	 *
	 * ## Пунктир — не оздоба
	 *
	 * Він єдине, що відрізняє звернення від справжнього запису поруч. Суцільна
	 * рамка робила б із прохання ще одну групу в переліку, а порожня картка без
	 * рамки читалася б як збій завантаження.
	 */
	interface Props {
		/** «Додати групу» / «Додати виставу». */
		title: string;
		/** Рядок під назвою: чому це прохання, а не кнопка адмінки. */
		hint: string;
		/** Префікс локаторів: `<префікс>-card` і `<префікс>-contact-*`. */
		testIdPrefix: string;
		/**
		 * `tile` — у сітку карток, `row` — над переліком рядків.
		 * Типове `tile`: саме таким звернення й було, поки жило в одному режимі.
		 */
		variant?: 'tile' | 'row';
	}

	let { title, hint, testIdPrefix, variant = 'tile' }: Props = $props();
</script>

<div
	class="add"
	class:add--tile={variant === 'tile'}
	class:add--row={variant === 'row'}
	data-testid="{testIdPrefix}-card"
>
	<span class="add__head">
		<span class="add__badge" aria-hidden="true"><Plus size={13} /></span>
		<span class="add__title">{title}</span>
	</span>
	<span class="add__hint">{hint}</span>
	<!--
		Розгорнуто, без олівця: прохання написати вже стоїть рядком вище, і кнопка
		поруч питала б удруге те саме, ховаючи відповідь за ще одним натисканням.

		`showGreeting={false}` — з тієї самої причини, лише на рівень глибше. Меню
		типово малює обличчя й підпис «Привіт!) Щоб внести правки — напиши мені», а
		над ним уже стоїть «Напишіть мені — і показ з'явиться в архіві». Дві різні
		фрази про одну дію поруч змушували читача вибирати, яка з них справжня.
	-->
	<EditContactButton
		testIdPrefix="{testIdPrefix}-contact"
		mode="inline"
		showGreeting={false}
	/>
</div>

<style>
	.add {
		display: flex;
		border-radius: var(--radius-xl, 20px);
		background: var(--bg-card);
		border: 1px dashed var(--border-main);
		box-shadow: var(--shadow-sm);
		color: inherit;
	}

	.add__head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}

	.add__badge {
		display: inline-flex;
		align-items: center;
		padding: 0.15rem 0.5rem;
		border-radius: var(--radius-sm, 6px);
		background: rgb(99 102 241 / 0.15);
		border: 1px solid rgb(99 102 241 / 0.3);
		color: #a5b4fc;
	}

	.add__title {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--text-title);
		line-height: 1.25;
	}

	.add__hint {
		font-size: 0.84rem;
		color: var(--text-muted);
		line-height: 1.4;
	}

	/* Плитка: стовпчиком і на всю висоту клітинки сітки — інакше вона була б
	   нижчою за сусідні картки й ряд просів би. */
	.add--tile {
		flex-direction: column;
		gap: 0.6rem;
		height: 100%;
		padding: 1.1rem 1.25rem;
		justify-content: space-between;
	}

	.add--tile .add__hint {
		margin-top: auto;
		padding-top: 0.5rem;
		border-top: 1px dashed var(--border-main);
	}

	/* Рядок: усе в одну лінію, як у сусідніх рядках переліку. Кнопка звернення
	   притиснута до правого краю — там, де в рядках стоять позначки. */
	.add--row {
		flex-direction: row;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem 1rem;
		padding: 0.75rem 1.1rem;
		margin-bottom: 1.25rem;
	}

	.add--row .add__hint {
		flex: 1 1 12rem;
		min-width: 0;
	}

	@media (max-width: 640px) {
		/* На телефоні рядок теж стає стовпчиком: три блоки в лінію дають три
		   вузькі колонки, у яких напис переноситься щослова. */
		.add--row {
			flex-direction: column;
			align-items: flex-start;
		}

		.add--row .add__hint {
			flex: none;
		}
	}
</style>
