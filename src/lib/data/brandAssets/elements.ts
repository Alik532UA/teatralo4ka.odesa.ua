import type { BrandAsset } from './types';

// Окремі елементи в матриці 4×3 + напис URL
export const SEPARATE_ELEMENTS: BrandAsset[] = [
	// Рядок 1: Кольорові / Жовті (Овал, Сумна, Весела, Долоні)
	{
		id: 'bg-yellow',
		nameUk: 'Овальна підкладка (Жовта)',
		nameEn: 'Oval Background (Yellow)',
		previewUrl: '/brand/elements/preview/element-bg-yellow.webp',
		downloads: [
			{ format: 'SVG', file: '/brand/elements/svg/element-bg-yellow.svg', label: 'SVG', downloadName: 'element-bg-yellow.svg' },
			{ format: 'PNG', file: '/brand/elements/element-bg-yellow-8855x5697.png', label: 'PNG (8855×5697)', downloadName: 'element-bg-yellow.png', sizeSpec: '8855×5697 px' }
		]
	},
	{
		id: 'mask-sad-color',
		nameUk: 'Сумна маска (Кольорова)',
		nameEn: 'Sad Mask (Color)',
		previewUrl: '/brand/elements/preview/element-mask-sad-color.webp',
		downloads: [
			{ format: 'SVG', file: '/brand/elements/svg/element-mask-sad-color.svg', label: 'SVG', downloadName: 'element-mask-sad-color.svg' },
			{ format: 'PNG', file: '/brand/elements/element-mask-sad-color-1125x1210.png', label: 'PNG (1125×1210)', downloadName: 'mask-sad-color.png', sizeSpec: '1125×1210 px' }
		]
	},
	{
		id: 'mask-happy-color',
		nameUk: 'Весела маска (Кольорова)',
		nameEn: 'Happy Mask (Color)',
		previewUrl: '/brand/elements/preview/element-mask-happy-color.webp',
		downloads: [
			{ format: 'SVG', file: '/brand/elements/svg/element-mask-happy-color.svg', label: 'SVG', downloadName: 'element-mask-happy-color.svg' },
			{ format: 'PNG', file: '/brand/elements/element-mask-happy-color-1145x1216.png', label: 'PNG (1145×1216)', downloadName: 'mask-happy-color.png', sizeSpec: '1145×1216 px' }
		]
	},
	{
		id: 'hands-yellow',
		nameUk: 'Долоні серцем (Жовті)',
		nameEn: 'Hands in Heart Shape (Yellow)',
		previewUrl: '/brand/elements/preview/element-hands-yellow.webp',
		downloads: [
			{ format: 'SVG', file: '/brand/elements/svg/element-hands-yellow.svg', label: 'SVG', downloadName: 'element-hands-yellow.svg' },
			{ format: 'PNG', file: '/brand/elements/element-hands-yellow-7938x3651.png', label: 'PNG (7938×3651)', downloadName: 'element-hands-yellow.png', sizeSpec: '7938×3651 px' }
		]
	},

	// Рядок 2: Білі (Овал, Сумна, Весела, Долоні)
	{
		id: 'bg-white',
		nameUk: 'Овальна підкладка (Біла)',
		nameEn: 'Oval Background (White)',
		previewUrl: '/brand/elements/preview/element-bg-white.webp',
		downloads: [
			{ format: 'SVG', file: '/brand/elements/svg/element-bg-white.svg', label: 'SVG', downloadName: 'element-bg-white.svg' },
			{ format: 'PNG', file: '/brand/elements/element-bg-white-8892x5734.png', label: 'PNG (8892×5734)', downloadName: 'element-bg-white.png', sizeSpec: '8892×5734 px' }
		]
	},
	{
		id: 'mask-sad-white',
		nameUk: 'Сумна маска (Біла)',
		nameEn: 'Sad Mask (White)',
		previewUrl: '/brand/elements/preview/element-mask-sad-white.webp',
		downloads: [
			{ format: 'SVG', file: '/brand/elements/svg/element-mask-sad-white.svg', label: 'SVG', downloadName: 'element-mask-sad-white.svg' },
			{ format: 'PNG', file: '/brand/elements/element-mask-sad-white-1125x1210.png', label: 'PNG (1125×1210)', downloadName: 'mask-sad-white.png', sizeSpec: '1125×1210 px' }
		]
	},
	{
		id: 'mask-happy-white',
		nameUk: 'Весела маска (Біла)',
		nameEn: 'Happy Mask (White)',
		previewUrl: '/brand/elements/preview/element-mask-happy-white.webp',
		downloads: [
			{ format: 'SVG', file: '/brand/elements/svg/element-mask-happy-white.svg', label: 'SVG', downloadName: 'element-mask-happy-white.svg' },
			{ format: 'PNG', file: '/brand/elements/element-mask-happy-white-1145x1216.png', label: 'PNG (1145×1216)', downloadName: 'mask-happy-white.png', sizeSpec: '1145×1216 px' }
		]
	},
	{
		id: 'hands-white',
		nameUk: 'Долоні серцем (Білі)',
		nameEn: 'Hands in Heart Shape (White)',
		previewUrl: '/brand/elements/preview/element-hands-white.webp',
		downloads: [
			{ format: 'SVG', file: '/brand/elements/svg/element-hands-white.svg', label: 'SVG', downloadName: 'element-hands-white.svg' },
			{ format: 'PNG', file: '/brand/elements/element-hands-white-7938x3651.png', label: 'PNG (7938×3651)', downloadName: 'element-hands-white.png', sizeSpec: '7938×3651 px' }
		]
	},

	// Рядок 3: Прозорі / Контурні (Овал, Сумна, Весела, Долоні)
	{
		id: 'bg-outline',
		nameUk: 'Овальна рамка (Контурна)',
		nameEn: 'Oval Frame (Outline)',
		previewUrl: '/brand/elements/preview/element-bg-outline.webp',
		downloads: [
			{ format: 'SVG', file: '/brand/elements/svg/element-bg-outline.svg', label: 'SVG', downloadName: 'element-bg-outline.svg' },
			{ format: 'PNG', file: '/brand/elements/element-bg-outline-8892x5734.png', label: 'PNG (8892×5734)', downloadName: 'element-bg-outline.png', sizeSpec: '8892×5734 px' }
		]
	},
	{
		id: 'mask-sad-outline',
		nameUk: 'Сумна маска (Прозора)',
		nameEn: 'Sad Mask (Outline)',
		previewUrl: '/brand/elements/preview/element-mask-sad-outline.webp',
		downloads: [
			{ format: 'SVG', file: '/brand/elements/svg/element-mask-sad-outline.svg', label: 'SVG', downloadName: 'element-mask-sad-outline.svg' },
			{ format: 'PNG', file: '/brand/elements/element-mask-sad-outline-1125x1210.png', label: 'PNG (1125×1210)', downloadName: 'mask-sad-outline.png', sizeSpec: '1125×1210 px' }
		]
	},
	{
		id: 'mask-happy-outline',
		nameUk: 'Весела маска (Прозора)',
		nameEn: 'Happy Mask (Outline)',
		previewUrl: '/brand/elements/preview/element-mask-happy-outline.webp',
		downloads: [
			{ format: 'SVG', file: '/brand/elements/svg/element-mask-happy-outline.svg', label: 'SVG', downloadName: 'element-mask-happy-outline.svg' },
			{ format: 'PNG', file: '/brand/elements/element-mask-happy-outline-1145x1216.png', label: 'PNG (1145×1216)', downloadName: 'mask-happy-outline.png', sizeSpec: '1145×1216 px' }
		]
	},
	{
		id: 'hands-outline',
		nameUk: 'Долоні серцем (Контурні)',
		nameEn: 'Hands in Heart Shape (Outline)',
		previewUrl: '/brand/elements/preview/element-hands-outline.webp',
		downloads: [
			{ format: 'SVG', file: '/brand/elements/svg/element-hands-outline.svg', label: 'SVG', downloadName: 'element-hands-outline.svg' },
			{ format: 'PNG', file: '/brand/elements/element-hands-outline-7938x3651.png', label: 'PNG (7938×3651)', downloadName: 'element-hands-outline.png', sizeSpec: '7938×3651 px' }
		]
	},

	// Рядок 4 (Внизу): Фірмовий вигнутий напис URL
	{
		id: 'text-url',
		nameUk: 'Фірмовий вигин напису URL',
		nameEn: 'Branded Curved URL Inscription',
		descUk: 'Вигнутий напис «teatralo4ka.odesa.ua» за лінією долонь.',
		descEn: 'Curved site address conforming to the hands contour.',
		previewUrl: '/brand/elements/preview/element-text-url.webp',
		downloads: [
			{ format: 'SVG', file: '/brand/elements/svg/element-text-url.svg', label: 'SVG', downloadName: 'element-text-url.svg' },
			{ format: 'PNG', file: '/brand/elements/element-text-url-5679x1060.png', label: 'PNG (5679×1060)', downloadName: 'element-text-url.png', sizeSpec: '5679×1060 px' }
		]
	}
];
