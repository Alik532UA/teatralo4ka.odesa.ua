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
		background-image:
			radial-gradient(1.4px 1.4px at 12% 28%, rgb(207 228 255 / 0.9), transparent),
			radial-gradient(1.1px 1.1px at 34% 66%, rgb(207 228 255 / 0.7), transparent),
			radial-gradient(1.6px 1.6px at 58% 18%, rgb(207 228 255 / 0.85), transparent),
			radial-gradient(1.2px 1.2px at 77% 52%, rgb(207 228 255 / 0.75), transparent),
			radial-gradient(1.3px 1.3px at 91% 34%, rgb(207 228 255 / 0.8), transparent),
			radial-gradient(1px 1px at 24% 84%, rgb(207 228 255 / 0.6), transparent),
			radial-gradient(1.5px 1.5px at 66% 88%, rgb(207 228 255 / 0.7), transparent);
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
