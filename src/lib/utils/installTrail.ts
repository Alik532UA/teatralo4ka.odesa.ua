import { browser } from '$app/environment';
import { beforeNavigate } from '$app/navigation';
import { trail } from '$lib/services/trail.svelte';

/**
 * Підписка на переходи для сліду «звідки прийшов».
 *
 * Окремим файлом рівно з тієї ж причини, що й `viewTransition`: `$app/navigation`
 * у середовищі юніт-тестів не резолвиться взагалі («Failed to resolve import» —
 * розбір у докблоку `i18n/switchLanguage`). Тримати цей імпорт у самій службі
 * означало б, що жодне з її правил відсіву не можна перевірити — а ламалися
 * саме вони. Тут лишився шар, який нічого не вирішує: витягнув дві адреси й
 * заголовок, віддав службі.
 *
 * Викликається з `+layout.svelte`: `beforeNavigate` реєструється тільки під час
 * ініціалізації компонента, тож служба не може підписатися сама.
 */
export function installTrail(): void {
	/* На сервері (prerender) сховища немає, а переходів не буває. */
	if (!browser) return;

	trail.restore();

	beforeNavigate((navigation) => {
		/* «Назад»/«Вперед» браузера — не перехід, а повернення. Див. докблок служби. */
		if (navigation.type === 'popstate') return;
		/* Вихід із сайту або повне перезавантаження: вести нікуди. */
		if (!navigation.from || !navigation.to) return;

		/* `beforeNavigate` спрацьовує ДО заміни вмісту, тож заголовок ще старий. */
		trail.record(navigation.from.url, navigation.to.url, document.title);
	});
}
