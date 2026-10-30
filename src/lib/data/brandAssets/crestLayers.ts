import crestPaths from './crest-paths.json';

export type CrestElement = 'bgOval' | 'hands' | 'maskRed' | 'maskBlue' | 'text';
export type CrestSubPart = 'fill' | 'outline';

export interface CrestConfig {
	hasOval: boolean;
	ovalColor: string;
	hasText: boolean;
	textColor: string;
	hasHandsFill: boolean;
	handsColor: string;
	hasHandsContour: boolean;
	handsContourColor: string;
	hasMasksFill: boolean;
	maskRedColor: string;
	maskRedOutlineColor: string;
	maskBlueColor: string;
	maskBlueOutlineColor: string;
}

export interface CrestPreset {
	id: string;
	nameUk: string;
	nameEn: string;
	config: CrestConfig;
}

export const BRAND_PALETTE = [
	{ hex: '#ffed00', nameUk: 'Жовтий', nameEn: 'Yellow', textColor: '#1d1d1d' },
	{ hex: '#00b5ec', nameUk: 'Блакитний', nameEn: 'Blue', textColor: '#1d1d1d' },
	{ hex: '#e20413', nameUk: 'Червоний', nameEn: 'Red', textColor: '#ffffff' },
	{ hex: '#1d1d1d', nameUk: 'Графіт', nameEn: 'Charcoal', textColor: '#ffffff' },
	{ hex: '#ffffff', nameUk: 'Білий', nameEn: 'White', textColor: '#1d1d1d' },
	{ hex: '#f9b31d', nameUk: 'Помаранчевий', nameEn: 'Orange', textColor: '#1d1d1d' },
	{ hex: '#cfe2f3', nameUk: 'Небесний', nameEn: 'Sky', textColor: '#1d1d1d' }
] as const;

function makeConfig(
	hasOval: boolean,
	hasText: boolean,
	hasHandsFill: boolean,
	hasHandsContour: boolean,
	hasMasksFill: boolean,
	ovalColor: string,
	handsColor: string,
	maskRedColor: string,
	maskBlueColor: string,
	textColor = '#1d1d1d',
	outlineColor = '#1d1d1d'
): CrestConfig {
	return {
		hasOval,
		ovalColor,
		hasText,
		textColor,
		hasHandsFill,
		handsColor,
		hasHandsContour,
		handsContourColor: outlineColor,
		hasMasksFill,
		maskRedColor,
		maskRedOutlineColor: outlineColor,
		maskBlueColor,
		maskBlueOutlineColor: outlineColor
	};
}

export const DEFAULT_CREST_CONFIG: CrestConfig = makeConfig(
	true,
	true,
	true,
	true,
	true,
	'#ffed00',
	'#ffed00',
	'#e20413',
	'#00b5ec',
	'#1d1d1d',
	'#1d1d1d'
);

export const CREST_PRESETS: CrestPreset[] = [
	{
		id: 'master-2025',
		nameUk: 'з url',
		nameEn: 'With URL',
		config: makeConfig(true, true, true, true, true, '#ffed00', '#ffed00', '#e20413', '#00b5ec')
	},
	{
		id: 'classic-2022',
		nameUk: 'без url',
		nameEn: 'Without URL',
		config: makeConfig(false, false, true, true, true, '#ffed00', '#ffed00', '#e20413', '#00b5ec')
	},
	{
		id: 'outline-hands',
		nameUk: 'Контурні руки',
		nameEn: 'Outline Hands',
		config: makeConfig(false, false, false, true, true, '#ffed00', '#ffed00', '#e20413', '#00b5ec')
	},
	{
		id: 'mono-white',
		nameUk: 'Монохром білий',
		nameEn: 'Monochrome White',
		config: makeConfig(false, true, true, true, true, '#ffed00', '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff')
	},
	{
		id: 'mono-dark',
		nameUk: 'Монохром темний',
		nameEn: 'Monochrome Dark',
		config: makeConfig(false, true, true, true, true, '#ffed00', '#1d1d1d', '#1d1d1d', '#1d1d1d', '#1d1d1d', '#1d1d1d')
	},
	{
		id: 'golden-anniversary',
		nameUk: 'Золотий ювілей',
		nameEn: 'Golden Anniversary',
		config: makeConfig(true, true, true, true, true, '#1d1d1d', '#f9b31d', '#ffed00', '#f9b31d', '#f9b31d', '#1d1d1d')
	}
];

export function isColorDark(hex: string): boolean {
	const c = hex.replace('#', '');
	if (c.length !== 6 && c.length !== 3) return false;
	const r = parseInt(c.length === 3 ? c[0] + c[0] : c.slice(0, 2), 16);
	const g = parseInt(c.length === 3 ? c[1] + c[1] : c.slice(2, 4), 16);
	const b = parseInt(c.length === 3 ? c[2] + c[2] : c.slice(4, 6), 16);
	const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
	return lum < 0.28;
}

export function isPresetActive(config: CrestConfig, preset: CrestPreset): boolean {
	const c = config;
	const p = preset.config;
	return (
		c.hasOval === p.hasOval &&
		c.hasText === p.hasText &&
		c.hasHandsFill === p.hasHandsFill &&
		c.hasHandsContour === p.hasHandsContour &&
		c.hasMasksFill === p.hasMasksFill &&
		(!c.hasOval || c.ovalColor.toLowerCase() === p.ovalColor.toLowerCase()) &&
		(!c.hasText || c.textColor.toLowerCase() === p.textColor.toLowerCase()) &&
		(!c.hasHandsFill || c.handsColor.toLowerCase() === p.handsColor.toLowerCase()) &&
		(!c.hasHandsContour || c.handsContourColor.toLowerCase() === p.handsContourColor.toLowerCase()) &&
		(!c.hasMasksFill || c.maskRedColor.toLowerCase() === p.maskRedColor.toLowerCase()) &&
		c.maskRedOutlineColor.toLowerCase() === p.maskRedOutlineColor.toLowerCase() &&
		(!c.hasMasksFill || c.maskBlueColor.toLowerCase() === p.maskBlueColor.toLowerCase()) &&
		c.maskBlueOutlineColor.toLowerCase() === p.maskBlueOutlineColor.toLowerCase()
	);
}

export function getCrestViewBox(config: CrestConfig): {
	viewBox: string;
	width: number;
	height: number;
} {
	if (config.hasOval) {
		return { viewBox: '0 0 2125 1367', width: 2125, height: 1367 };
	}
	if (config.hasText) {
		return { viewBox: '107 133 1905 1105', width: 1905, height: 1105 };
	}
	return { viewBox: '107 133 1905 876', width: 1905, height: 876 };
}

export function getCrestSvgString(config: CrestConfig): string {
	const vb = getCrestViewBox(config);

	let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.viewBox}" width="${vb.width}" height="${vb.height}">\n`;

	if (config.hasOval) {
		svg += `  <ellipse cx="1062.5" cy="683.5" rx="1062.5" ry="683.5" fill="${config.ovalColor}"/>\n`;
	}

	if (config.hasText) {
		svg += `  <g id="text" fill="${config.textColor}">\n`;
		for (const p of crestPaths.text) {
			svg += `    <path d="${p}"/>\n`;
		}
		svg += `  </g>\n`;
	}

	if (config.hasHandsFill) {
		svg += `  <g id="HandsFill" fill="${config.handsColor}" fill-rule="evenodd">\n`;
		for (const p of crestPaths.handsFill) {
			svg += `    <path d="${p}"/>\n`;
		}
		svg += `  </g>\n`;
	}

	if (config.hasHandsContour) {
		svg += `  <g id="HandsContour" fill="${config.handsContourColor}" fill-rule="evenodd">\n`;
		svg += `    <path d="${crestPaths.handsContour}"/>\n`;
		svg += `  </g>\n`;
	}

	svg += `  <g id="logo-mini">\n`;
	svg += `    <g id="MaskRed">\n`;
	svg += `      <path fill="${config.maskRedOutlineColor}" d="${crestPaths.maskRed.shadow}"/>\n`;
	if (config.hasMasksFill) {
		svg += `      <path fill="${config.maskRedColor}" d="${crestPaths.maskRed.fill}"/>\n`;
	}
	svg += `      <path fill="${config.maskRedOutlineColor}" d="${crestPaths.maskRed.details}"/>\n`;
	svg += `    </g>\n`;
	svg += `    <g id="MaskBlue">\n`;
	svg += `      <path fill="${config.maskBlueOutlineColor}" d="${crestPaths.maskBlue.shadow}"/>\n`;
	if (config.hasMasksFill) {
		svg += `      <path fill="${config.maskBlueColor}" d="${crestPaths.maskBlue.fill}"/>\n`;
	}
	svg += `      <path fill="${config.maskBlueOutlineColor}" d="${crestPaths.maskBlue.details}"/>\n`;
	svg += `    </g>\n`;
	svg += `  </g>\n`;

	svg += `</svg>`;
	return svg;
}

export { crestPaths };
