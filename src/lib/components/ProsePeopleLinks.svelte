<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from 'svelte-i18n';
	import {
		WITH_PAGE,
		findByAddress,
		graduatePhoto,
		type GraduateIndexEntry
	} from '$lib/data/graduates';
	import { asset } from '$app/paths';
	import MASTERS_INDEX from '$lib/data/masters.index.json';
	import INSTITUTIONS_DATA from '$lib/data/institutions.data.json';
	import { openGraduateModal } from '$lib/services/graduateModal.svelte';
	import { stripLocale } from '$lib/i18n/routing';
	import GraduateCardOnPage from '$lib/components/GraduateCardOnPage.svelte';

	/**
	 * Посилання на ЛЮДИНУ всередині тексту: обличчя перед іменем, а натискання
	 * відкриває картку тут, а не веде в галактику.
	 *
	 * ## Що це виправляє
	 *
	 * У новині про сімнадцять студентів чотирнадцять імен — посилання на
	 * сторінки випускників, і натискання вело туди по-справжньому: новина
	 * зникала, а після закриття картки читач опинявся в галактиці й мусив
	 * шукати новину заново. Автор побачив це одразу: «при натисканні на
	 * випускників відкривається сторінка в галактиці випускників; очікуваний
	 * результат — у поточній сторінці».
	 *
	 * Це той самий висновок, який уже зроблено для облич у складі вистав і груп,
	 * і записаний у докблоці `GraduateCardOnPage`. Різниця лише в тому, ЯК
	 * перехоплюється натискання: там кожне обличчя малює `GraduateAvatarRow` і
	 * викликає `openGraduateModal` сам, а тут посилання приходять із markdown —
	 * тобто розмітки, якої компонент не писав. Тому перехоплення делеговане.
	 *
	 * ## ОБЛИЧЧЯ ПЕРЕД ІМЕНЕМ
	 *
	 * Прохання автора: «якщо є фото, то варто його показувати — і це не тільки
	 * до цієї новини, а до всіх, де у нас посилання на випускника чи викладача».
	 * Причина проста й вона вже визнана рештою сайту: у складі вистави, у групі
	 * й у поїздці обличчя стоїть перед іменем, бо впізнається швидше за
	 * прізвище. Текст новини був єдиним місцем, де людина лишалася рядком.
	 *
	 * Тут обличчя ставиться ВСЕРЕДИНУ самого посилання, а не поруч: інакше
	 * знімок і підпис відкривали б різне, і читач, що цілить у фото, промахнувся
	 * б повз посилання.
	 *
	 * ## У КОГО ФОТО НЕМАЄ — КРУЖЕЧОК ІЗ ЛІТЕРОЮ, А НЕ ПОРОЖНЕ МІСЦЕ
	 *
	 * Заміряно 16 вересня 2026: із 23 людей, на яких посилаються новини, фото
	 * має 10. Тобто «немає фото — не малюємо нічого» означало б, що в реченні
	 * «вітаємо ●Наумова та Тріфонова» двоє з чотирьох виділені, а двоє ні — і
	 * читається це як «ці двоє важливіші», хоча йдеться лише про те, чи встигли
	 * ми зібрати знімок.
	 *
	 * Кружечок із літерою — не вигадка заради симетрії: рівно так уже робить
	 * `GraduateAvatarRow` у складі вистав і груп. Тобто рядок лишається рівним, а
	 * читач бачить те саме, що й на решті сайту.
	 *
	 * Коли знімок з'явиться, обличчя стане на місце літери САМО: `hasPhoto`
	 * читається з реєстру на рендері, і жодного рядка в новині правити не треба.
	 *
	 * ## Чому окремий компонент, а не рядки в `StaticPage`
	 *
	 * `StaticPage` малює дев'ятнадцять сторінок сайту, і жодна з решти вісімнадцяти
	 * посилань на людей не має. А `openGraduateModal` і три реєстри — це вага,
	 * яку не можна віддавати кожному, хто відкрив «Історію» чи «Контакти», заради
	 * можливості, якої там немає.
	 *
	 * Тому це окремий компонент, який сторінка вмикає одним рядком. Щойно
	 * посилання на людей з'явиться ще десь у тексті — той рядок дописується там,
	 * а не переїжджає нагору.
	 *
	 * ## Чому делегування на `window`, а не обробник на кожному посиланні
	 *
	 * Розмітка приходить із `{@html}`, тобто в Svelte її немає як шаблону —
	 * навісити `onclick` нема на що. Той самий прийом і з тієї ж причини вже
	 * стоїть у `StaticPage` для знімків у тексті (відкриття лайтбокса).
	 *
	 * З тієї ж причини обличчя вставляються ВРУЧНУ в DOM, а не розміткою, і за
	 * появою нового тексту стежить `MutationObserver`: новина з бази приходить
	 * запитом уже після монтування, і одного проходу на `onMount` їй замало.
	 *
	 * ## ЧОМУ ФАЗА ПЕРЕХОПЛЕННЯ, А НЕ ЗВИЧАЙНА
	 *
	 * Тут варто прочитати обидва заміри, бо перший мене обдурив.
	 *
	 * Перша редакція слухала `window` у фазі спливання — рівно як обробник
	 * знімків у `StaticPage`. Перевірка в браузері показала, що вона НЕ
	 * ПРАЦЮЄ: після натискання адреса стала
	 * `/projects/galaxy-graduates/anastasiia-ivanova/`, новини не лишилося. Я
	 * пояснив це тим, що роутер SvelteKit слухає `<a>` і починає перехід
	 * першим, і поставив `capture: true`.
	 *
	 * Зворотний експеримент цього НЕ ПІДТВЕРДИВ. Прогін `e2e/news-code.spec.ts`
	 * із поверненою фазою спливання пройшов зелено — тобто на СПРАВЖНЬОМУ
	 * натисканні (Playwright клікає по-справжньому) обробник спрацьовує й у
	 * фазі спливання. Різниця була в тому, ЧИМ я клікав: я викликав
	 * `a.click()` зі скрипта, а синтетична подія проходить інакше.
	 *
	 * Тобто причина, яку я був написав, — вигадана, і в докблоці її лишати
	 * не можна. `capture: true` при цьому лишається, і вже з чесною причиною:
	 * він гарантує, що ми перші, незалежно від порядку реєстрації слухачів і
	 * від того, довірена подія чи ні. Поведінка сторінки не має залежати від
	 * такої різниці.
	 */
	interface Props {
		/**
		 * Селектор контейнера з текстом. Типово `.prose` — так зветься текст і в
		 * сторінках репозиторію, і в статтях із бази.
		 */
		within?: string;
	}

	let { within = '.prose' }: Props = $props();

	/** Сторона кружечка в пікселях — та сама, що в `width`/`height` знімка. */
	const РОЗМІР = 20;

	interface Особа {
		name: string;
		/** Адреса знімка, або `undefined` — тоді малюється літера. */
		photo?: string;
		/** Заповнене лише у випускників: лише в них є картка поверх сторінки. */
		випускник?: GraduateIndexEntry;
	}

	type Майстер = { slug: string; displayName: string; photo?: string };
	type Заклад = { name: string; students: { id: string; year?: number }[] };

	/**
	 * Рядки підказки під курсором: випуск, майстер курсу, заклад.
	 *
	 * Рахуються НА НАВЕДЕННЯ, а не наперед для всіх посилань: на сторінці їх
	 * буває півтора десятка, а розкриють одне-два.
	 */
	function рядки(g: GraduateIndexEntry): string[] {
		const out: string[] = [];
		if (g.graduationYear) out.push(`${$t('galaxy.graduated')} ${g.graduationYear}`);

		const майстри = (g.masters ?? [])
			// Майстер в анкеті буває рядком-ключем або записом із `id` — реєстр
			// зберігав обидві форми, і звужувати його заради підказки ні до чого.
			.map((m) => (typeof m === 'string' ? m : m.id))
			.map((id) => (MASTERS_INDEX as Майстер[]).find((x) => x.slug === id)?.displayName)
			.filter(Boolean);
		if (майстри.length)
			out.push(`${майстри.length > 1 ? $t('galaxy.masters') : $t('galaxy.masterOne')}: ${майстри.join(', ')}`);

		/*
		 * Заклад шукається ЗА РЕБРОМ «людина + рік», а не полем в анкеті: у
		 * реєстрі закладів саме там живе вступ, і розбір цього рішення — у
		 * докблоці `data/institutions`.
		 */
		for (const заклад of INSTITUTIONS_DATA as Заклад[]) {
			const студент = заклад.students.find((st) => st.id === g.id);
			if (!студент) continue;
			out.push(
				студент.year
					? `${заклад.name}, ${$t('galaxy.institutionEnrolled', { values: { year: студент.year } })}`
					: заклад.name
			);
			break;
		}
		return out;
	}

	/** Що показує підказка зараз і де вона стоїть. */
	let підказка = $state<{
		x: number;
		y: number;
		знизу: boolean;
		особа: Особа;
		рядки: string[];
	} | null>(null);

	/**
	 * Хто стоїть за посиланням, або `null`.
	 *
	 * Мовний префікс знімається: в англійському файлі новини посилання пишуться
	 * як `/en/projects/galaxy-graduates/…`, і без `stripLocale` жодне з них не
	 * впізналося б.
	 *
	 * У випускників пошук іде по АДРЕСІ, а запасним ходом — по `slug`, і це не
	 * перестраховка. Заміряно: з 25 адрес у новинах дві написані по `slug`
	 * (`nikol-onyshchenko`, `liora-kazatsker`), тоді як адреса в цих людей інша
	 * (`nikolmett`, `liorka`). Сторінка відкривалася — збірка робить заглушку з
	 * перенаправленням, — а от картка НЕ відкривалася: `findByAddress` по
	 * заглушці нікого не знаходить. Тобто рівно та біда, проти якої написано цей
	 * компонент, тихо жила у 8 % посилань. Самі посилання виправлені, а запасний
	 * хід лишається, щоб наступна така описка не коштувала того самого.
	 */
	function особаЗПосилання(href: string): Особа | null {
		if (!href.startsWith('/')) return null;
		const шлях = stripLocale(href.split(/[?#]/)[0]).replace(/\/+$/, '');

		/*
		 * ЗАПРОШЕНИЙ ФАХІВЕЦЬ — кружечок із літерою, і реєстру для цього не
		 * потрібно.
		 *
		 * Сторінка в нього є, тож за домовленістю з автором обличчя йому
		 * належить. Але заміряно 16 вересня 2026: у реєстрі `experts` знімка не
		 * має ЖОДЕН із 25, а посилань на фахівців у текстах поки нуль. Тобто
		 * імпорт реєстру купив би сьогодні рівно нічого — лише ім'я, яке й так
		 * написане в самому посиланні, — і коштував би кілобайта в бандлі, де
		 * вільно менше за нього.
		 *
		 * Тому ім'я береться з тексту посилання. Коли у фахівців з'являться
		 * знімки, сюди повертається `EXPERTS` — і разом із ним причина.
		 */
		if (/^\/projects\/galaxy-graduates\/experts\/[^/]+$/.test(шлях)) return { name: '' };

		const випускник = /^\/projects\/galaxy-graduates\/([^/]+)$/.exec(шлях);
		if (випускник) {
			const g = findByAddress(випускник[1]) ?? WITH_PAGE.find((x) => x.slug === випускник[1]);
			if (!g) return null;
			return {
				name: g.name,
				photo: g.hasPhoto ? graduatePhoto(g.slug, 96) : undefined,
				випускник: g
			};
		}

		const майстер = /^\/residents\/adults\/([^/]+)$/.exec(шлях);
		if (майстер) {
			/*
			 * Реєстр береться СИРИЙ, а не через `MASTERS` із `data/masters`: той
			 * модуль тягне за собою тридцять помічників, яких тут не треба, і в
			 * бандлі це коштувало пів кілобайта при вільних 0.33. Потрібні звідси
			 * рівно два поля.
			 */
			const m = (MASTERS_INDEX as { slug: string; displayName: string; photo?: string }[]).find(
				(x) => x.slug === майстер[1]
			);
			return m ? { name: m.displayName, photo: m.photo ? asset(m.photo) : undefined } : null;
		}

		return null;
	}

	/** Кружечок: знімок, а коли його немає — перша літера імені. */
	function обличчя(особа: Особа): HTMLElement {
		if (особа.photo) {
			const img = document.createElement('img');
			img.className = 'person-face';
			img.src = особа.photo;
			// Розмір атрибутами: місце під кружечок відводиться ДО завантаження,
			// інакше рядок тексту підстрибує, коли знімок приходить.
			img.width = РОЗМІР;
			img.height = РОЗМІР;
			img.alt = '';
			img.loading = 'lazy';
			return img;
		}
		const span = document.createElement('span');
		span.className = 'person-face person-face--letter';
		// Ім'я вже написане поруч — диктору літера не потрібна.
		span.setAttribute('aria-hidden', 'true');
		/*
		 * Літера — АТРИБУТОМ, а не текстом усередині: текст потрапив би в
		 * `textContent`, і скопійований абзац читався б «ІІллю Волинця-Тріфонова».
		 * Вміст псевдоелемента в DOM-тексті не лежить і не копіюється.
		 */
		span.dataset.letter = особа.name.slice(0, 1);
		return span;
	}

	/**
	 * Кружечок разом із ПЕРШИМ СЛОВОМ імені — в одній нерозривній коробці.
	 *
	 * Перше слово забирається з тексту посилання й переїжджає сюди. Це єдиний
	 * спосіб зробити нерозривним саме стик «обличчя — ім'я», не забороняючи
	 * переносу всередині самого імені: `white-space: nowrap` на всьому посиланні
	 * лишило б «Іллю Волинця-Тріфонова» одним шматком, який на телефоні не
	 * влазить у стовпець. Чому не `inline-flex` на посиланні — у `global.css`
	 * біля `.person-face-lead`.
	 */
	function початок(anchor: HTMLAnchorElement, особа: Особа): HTMLElement {
		const коробка = document.createElement('span');
		коробка.className = 'person-face-lead';
		/*
		 * Ім'я для літери: своє, коли реєстр його знає, і текст посилання, коли
		 * ні (запрошений фахівець). Читається з `anchor` ДО того, як перше слово
		 * переїде в коробку.
		 */
		const імʼя = особа.name || (anchor.textContent ?? '').trim();
		коробка.append(обличчя({ ...особа, name: імʼя }));

		const перший = anchor.firstChild;
		if (перший?.nodeType === Node.TEXT_NODE) {
			const слово = /^\s*\S+/.exec(перший.nodeValue ?? '');
			if (слово) {
				коробка.append(слово[0]);
				перший.nodeValue = (перший.nodeValue ?? '').slice(слово[0].length);
			}
		}
		return коробка;
	}

	onMount(() => {
		function handleClick(event: MouseEvent) {
			/* Модифікатори й не-ліва кнопка — не наша справа: це навмисне
			   «відкрити інакше», і забирати його в читача ми не маємо права. Те
			   саме правило й тими самими словами стоїть у `GraduateAvatarRow`. */
			if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
				return;

			const anchor = (event.target as HTMLElement | null)?.closest?.('a');
			if (!anchor || !anchor.closest(within)) return;

			/*
			 * Картку поверх сторінки має лише випускник. Викладач і запрошений
			 * фахівець переходять на свою сторінку, як і переходили: власної
			 * картки в них немає, і вигадувати її заради однорідності означало б
			 * зробити натискання гіршим — воно нічого не показало б.
			 */
			const особа = особаЗПосилання(anchor.getAttribute('href') ?? '');
			if (!особа?.випускник) return;

			event.preventDefault();
			event.stopPropagation();
			openGraduateModal(особа.випускник);
		}

		/*
		 * Прапорець проти власного відлуння: вставка обличчя — теж зміна DOM, і
		 * без нього спостерігач будив би сам себе. Оброблене посилання позначене
		 * `data-person-face`, тож другий прохід нічого не робить, але зайвим
		 * колом по всіх посиланнях сторінки платити ні до чого.
		 */
		let малюємо = false;
		function прикрасити() {
			if (малюємо) return;
			малюємо = true;
			try {
				for (const контейнер of document.querySelectorAll(within))
					for (const anchor of контейнер.querySelectorAll<HTMLAnchorElement>('a[href]')) {
						if (anchor.dataset.personFace) continue;
						const особа = особаЗПосилання(anchor.getAttribute('href') ?? '');
						if (!особа) continue;
						anchor.dataset.personFace = особа.photo ? 'photo' : 'letter';
						anchor.prepend(початок(anchor, особа));
					}
			} finally {
				малюємо = false;
			}
		}

		прикрасити();
		const спостерігач = new MutationObserver(прикрасити);
		спостерігач.observe(document.body, { childList: true, subtree: true });

		/*
		 * Підказка — теж ДЕЛЕГОВАНО, з тієї ж причини, що й натискання: посилань
		 * у Svelte немає як шаблону. `pointerover`/`pointerout` замість
		 * `mouseenter`: перші спливають, других на `window` не діждешся.
		 *
		 * `pointerType` перевіряється навмисно: на дотику наведення не існує —
		 * там натискання одразу відкриває повну картку, і показати замість неї
		 * підказку означало б з'їсти дотик.
		 */
		function наведення(event: PointerEvent) {
			if (event.pointerType === 'touch') return;
			const anchor = (event.target as HTMLElement | null)?.closest?.('a');
			if (!anchor || !anchor.closest(within)) return (підказка = null);
			const особа = особаЗПосилання(anchor.getAttribute('href') ?? '');
			if (!особа?.випускник) return (підказка = null);

			const r = anchor.getBoundingClientRect();
			// Нижче посилання, а коли місця немає — вище: підказка не мусить
			// виїжджати за екран на останньому абзаці сторінки.
			const знизу = r.bottom + 190 < window.innerHeight;
			підказка = {
				x: Math.min(Math.max(r.left, 8), window.innerWidth - 268),
				y: знизу ? r.bottom + 6 : r.top - 6,
				знизу,
				особа,
				рядки: рядки(особа.випускник)
			};
		}

		function відведення(event: PointerEvent) {
			const to = event.relatedTarget as HTMLElement | null;
			// Клас, а не `data-testid`: інваріант `testid-conventions` рахує
			// кожну згадку в файлі, і селектор у скрипті виглядав би для нього
			// другим елементом із тим самим id.
			if (to?.closest?.('.tip')) return;
			підказка = null;
		}

		window.addEventListener('click', handleClick, { capture: true });
		window.addEventListener('pointerover', наведення);
		window.addEventListener('pointerout', відведення);
		// Прокрутка зсуває посилання з-під підказки — тоді вона бреше про те,
		// кого описує.
		window.addEventListener('scroll', () => (підказка = null), { passive: true });
		return () => {
			спостерігач.disconnect();
			window.removeEventListener('click', handleClick, { capture: true });
			window.removeEventListener('pointerover', наведення);
			window.removeEventListener('pointerout', відведення);
		};
	});
</script>

<GraduateCardOnPage />

{#if підказка}
	<!--
		Підказка стоїть у `body`-координатах (`position: fixed`), бо посилання
		живе в тексті, а текст — у колонці з власною прокруткою й обрізанням.
		Вкласти її поруч із посиланням нема куди: розмітку пише markdown.
	-->
	<div
		class="tip"
		class:tip--above={!підказка.знизу}
		style="left: {підказка.x}px; top: {підказка.y}px"
		data-testid="prose-person-tip-card"
	>
		{#if підказка.особа.photo}
			<img class="tip__face" src={підказка.особа.photo} width="48" height="48" alt="" />
		{:else}
			<span class="tip__face tip__face--letter" aria-hidden="true">
				{підказка.особа.name.slice(0, 1)}
			</span>
		{/if}
		<span class="tip__body">
			<span class="tip__name">{підказка.особа.name}</span>
			{#each підказка.рядки as рядок (рядок)}
				<span class="tip__line">{рядок}</span>
			{/each}
		</span>
	</div>
{/if}

<style>
	.tip {
		position: fixed;
		/*
		 * Під модалкою, але над усім іншим: підказка живе на сторінці, а не
		 * поверх картки, яку відкриває натискання. Власної змінної для підказок
		 * у палітрі немає, і заводити її заради одного місця ні до чого.
		 */
		z-index: calc(var(--z-modal) - 1);
		display: flex;
		gap: 0.6rem;
		width: 260px;
		padding: 0.6rem 0.7rem;
		border-radius: 0.8rem;
		background: var(--bg-card);
		border: var(--hairline-width) solid var(--border-main);
		box-shadow: 0 12px 30px rgb(0 0 0 / 0.35);
		pointer-events: none;
	}
	/* Піднята підказка відраховується від СВОГО низу, а не від верху. */
	.tip--above {
		translate: 0 -100%;
	}
	.tip__face {
		flex: none;
		width: 48px;
		height: 48px;
		border-radius: 50%;
		object-fit: cover;
		border: var(--hairline-width) solid var(--border-main);
		background: var(--bg-surface);
	}
	.tip__face--letter {
		display: grid;
		place-items: center;
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--text-muted);
	}
	.tip__body {
		display: grid;
		gap: 0.1rem;
		min-width: 0;
	}
	.tip__name {
		font-weight: 700;
		color: var(--text-title);
	}
	.tip__line {
		font-size: 0.82rem;
		line-height: 1.35;
		color: var(--text-muted);
	}
</style>
