<!--
	Зоряне тло для пункту «Жива галактика» у вітальному вікні.

	Не `Starfield.svelte`: той малює на canvas окремим рушієм, і заводити його
	заради смужки у сто пікселів означало б тримати другий цикл анімації заради
	оздоби. Тут вистачає шару крапок, який повільно пливе — саме так, як летять
	зірки в самій галактиці.

	Окремим файлом, бо вікно з ним переростало стелю `structure.test.ts`.
-->
<span class="stars" aria-hidden="true"></span>

<style>
	.stars {
		position: absolute;
		inset: -50%;
		z-index: -1;
		pointer-events: none;
		/* Чотирнадцять зір удвічі більшого розміру: сім було замало, щоб смуга
		   читалася як небо, а не як пил на екрані. */
		background-image:
			radial-gradient(2.8px 2.8px at 12% 28%, rgb(207 228 255 / 0.9), transparent),
			radial-gradient(2.2px 2.2px at 34% 66%, rgb(207 228 255 / 0.7), transparent),
			radial-gradient(3.2px 3.2px at 58% 18%, rgb(207 228 255 / 0.85), transparent),
			radial-gradient(2.4px 2.4px at 77% 52%, rgb(207 228 255 / 0.75), transparent),
			radial-gradient(2.6px 2.6px at 91% 34%, rgb(207 228 255 / 0.8), transparent),
			radial-gradient(2px 2px at 24% 84%, rgb(207 228 255 / 0.6), transparent),
			radial-gradient(3px 3px at 66% 88%, rgb(207 228 255 / 0.7), transparent),
			radial-gradient(2.6px 2.6px at 6% 56%, rgb(207 228 255 / 0.8), transparent),
			radial-gradient(2.2px 2.2px at 45% 38%, rgb(207 228 255 / 0.65), transparent),
			radial-gradient(3px 3px at 52% 74%, rgb(207 228 255 / 0.85), transparent),
			radial-gradient(2.4px 2.4px at 84% 10%, rgb(207 228 255 / 0.7), transparent),
			radial-gradient(2px 2px at 18% 12%, rgb(207 228 255 / 0.6), transparent),
			radial-gradient(2.8px 2.8px at 38% 94%, rgb(207 228 255 / 0.75), transparent),
			radial-gradient(2.2px 2.2px at 71% 64%, rgb(207 228 255 / 0.7), transparent);
		background-size: 50% 50%;
		animation: update-stars 34s linear infinite alternate;
	}
	@keyframes update-stars {
		from {
			transform: translate3d(-6%, 4%, 0);
		}
		to {
			transform: translate3d(6%, -4%, 0);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.stars {
			animation: none;
		}
	}
</style>
