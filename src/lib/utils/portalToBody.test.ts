import { describe, it, expect } from 'vitest';
import { portalToBody } from './portalToBody';

/**
 * Перевіряється саме те, через що плеєр і ламався: вузол мусить ПОКИНУТИ
 * предка з `transform` і повернутися прямо в `body`, а після знищення блока —
 * зникнути, а не лишитися висіти в `body`.
 */
describe('portalToBody', () => {
	it('переносить вузол у body з-під предка з transform', () => {
		const предок = document.createElement('div');
		предок.style.transform = 'translateY(10px)';
		const вузол = document.createElement('div');
		предок.appendChild(вузол);
		document.body.appendChild(предок);

		expect(вузол.parentElement).toBe(предок);
		portalToBody()(вузол);
		expect(вузол.parentElement).toBe(document.body);

		предок.remove();
		вузол.remove();
	});

	it('прибирає вузол за собою, коли блок знищено', () => {
		const вузол = document.createElement('div');
		document.body.appendChild(вузол);
		const прибрати = portalToBody()(вузол);
		expect(вузол.isConnected).toBe(true);

		прибрати?.();
		expect(вузол.isConnected).toBe(false);
	});
});
