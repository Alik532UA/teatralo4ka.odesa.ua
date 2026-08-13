import { get } from 'svelte/store';
import { t } from 'svelte-i18n';
import { toast } from '$lib/controllers/toast.svelte';
import { resolveMailtoClick } from './mailtoLink';

/**
 * Один патерн для БУДЬ-ЯКОГО email на сайті (NOTIFICATIONS-v8 § 4).
 *
 * Клік не відкриває `mailto:` одразу: адреса копіюється в буфер, а тост
 * пропонує дію «Відкрити поштовий клієнт». Причина не косметична — у більшості
 * відвідувачів поштовий клієнт не налаштований, і голий `mailto:` для них не
 * робить нічого видимого взагалі.
 *
 * ## Чому делегування, а не обробник на кожній кнопці
 *
 * До цього патерн жив у двох компонентах (`FooterSection`, `HeroSection`) як
 * дві копії, а email у ТІЛІ сторінки — у markdown сторінок `teatr-pro` —
 * лишався голим `mailto:`. Тобто поведінка залежала від того, у якій частині
 * сторінки опинилося посилання, і кожен новий email за замовчуванням потрапляв
 * у «неправильну» половину.
 *
 * Делегування знімає це на рівні механізму: сторінковий вміст приходить із
 * markdown і власних обробників мати не може в принципі, а нове посилання
 * будь-де отримує патерн без жодних дій автора.
 *
 * ## Прогресивне покращення
 *
 * Самі елементи лишаються звичайними `<a href="mailto:…">`. Без JS вони
 * працюють як раніше, а обробник лише перехоплює клік.
 *
 * Рішення «чи це клік по email» живе в `mailtoLink.ts` і перевіряється
 * тестами; тут — лише підключення до буфера обміну й тостів.
 */
export function copyEmailWithToast(email: string, anchor?: HTMLElement): void {
	const openMail = () => {
		window.location.href = `mailto:${email}`;
	};

	// Поза HTTPS і в старих браузерах `navigator.clipboard` відсутній. Без цієї
	// перевірки кнопка стає мертвою: викликати `.then` нема на чому, помилка
	// летить у консоль, і для відвідувача клік просто нічого не робить.
	if (!navigator.clipboard?.writeText) {
		openMail();
		return;
	}

	navigator.clipboard.writeText(email).then(
		() =>
			toast.success(
				get(t)('common.emailCopied'),
				6000,
				{ label: get(t)('common.openMailClient'), onAction: openMail },
				anchor
			),
		openMail // буфер відмовив — одразу пошта, клік не буває мертвим
	);
}

/**
 * Вішає один обробник на документ. Повертає прибирання для `$effect`.
 *
 * Викликається з кореневого `+layout.svelte`, тож діє на шапку, підвал,
 * панелі, тіло сторінки й адмінку однаково.
 */
export function installMailtoToast(): () => void {
	const onClick = (event: MouseEvent) => {
		const hit = resolveMailtoClick(event);
		if (!hit) return;
		event.preventDefault();
		copyEmailWithToast(hit.email, hit.anchor);
	};

	document.addEventListener('click', onClick);
	return () => document.removeEventListener('click', onClick);
}
