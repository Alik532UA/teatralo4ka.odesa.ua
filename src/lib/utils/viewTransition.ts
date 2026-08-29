import { onNavigate } from '$app/navigation';

/**
 * Плавні переходи між сторінками через View Transitions API.
 *
 * Доти перехід був різким: SvelteKit міняє вміст миттєво, тож стара сторінка
 * зникала в тому ж кадрі, у якому з'являлася нова. Браузер уміє зняти обидві й
 * перевести одну в іншу — треба лише сказати йому, коли саме міняється вміст.
 *
 * Сама анімація описана в `global.css` (`::view-transition-old/new`), бо це
 * псевдоелементи документа: до `<style>` компонента вони не належать, і
 * scoping Svelte до них не дотягується.
 *
 * ## Чому не CSS-правило `@view-transition { navigation: auto }`
 *
 * Воно вмикає переходи лише для НАВІГАЦІЇ БРАУЗЕРА (перехід між документами).
 * Тут же навігація клієнтська: документ той самий, змінюється лише вміст, і
 * браузер про цю зміну сам не дізнається. Тому потрібен саме `onNavigate`.
 */
export function installViewTransitions(): void {
	onNavigate((navigation) => {
		/*
		 * Підтримки немає — переходимо як раніше. Перевірка не косметична:
		 * `startViewTransition` немає в Firefox і в старих Safari, а виклик
		 * неіснуючого методу зупинив би НАВІГАЦІЮ, а не лише анімацію.
		 */
		if (!document.startViewTransition) return;

		/*
		 * Прохання про менший рух виконується тут, а не самою лише CSS: без
		 * цього браузер усе одно знімає й порівнює два кадри цілої сторінки на
		 * кожному переході — робота, яку ніхто не побачить.
		 */
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		/*
		 * Перехід між тими самими сторінками (клік по вже відкритому пункті
		 * меню, зміна лише параметрів пошуку) анімувати нема чого: обидва
		 * знімки однакові, і вийшло б блимання без причини. `pushState` для
		 * картки випускника — саме такий випадок.
		 */
		if (navigation.from?.url.pathname === navigation.to?.url.pathname) return;

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
}
