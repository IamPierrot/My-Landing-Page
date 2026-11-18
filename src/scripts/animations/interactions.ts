import { animate } from 'motion';
import { animationConfig } from './config';

let abortController: AbortController | null = null;

export function setupInteractions() {
	if (typeof window === 'undefined') return;

	// Check prefers-reduced-motion
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		return;
	}

	cleanupInteractions();
	abortController = new AbortController();
	const { signal } = abortController;

	// 1. Elements marked with data-motion-hover
	const hoverElements = document.querySelectorAll<HTMLElement>(
		'[data-motion-hover], .btn-motion'
	);
	hoverElements.forEach((el) => {
		el.addEventListener(
			'mouseenter',
			() => {
				animate(
					el,
					{ scale: 1.02 },
					{ duration: animationConfig.duration.fast, ease: animationConfig.easing.smooth }
				);
			},
			{ signal }
		);

		el.addEventListener(
			'mouseleave',
			() => {
				const anim = animate(
					el,
					{ scale: 1 },
					{ duration: animationConfig.duration.fast, ease: animationConfig.easing.smooth }
				);
				anim.then(() => {
					el.style.transform = '';
				});
			},
			{ signal }
		);
	});

	// 2. Elements marked with data-motion-tap
	const tapElements = document.querySelectorAll<HTMLElement>(
		'[data-motion-tap], button:not([disabled]), a.btn-tap'
	);
	tapElements.forEach((el) => {
		el.addEventListener(
			'pointerdown',
			() => {
				animate(el, { scale: 0.97 }, { duration: 0.1, ease: 'easeOut' });
			},
			{ signal }
		);

		const resetScale = () => {
			const anim = animate(el, { scale: 1 }, { duration: 0.2, ease: animationConfig.easing.smooth });
			anim.then(() => {
				el.style.transform = '';
			});
		};

		el.addEventListener('pointerup', resetScale, { signal });
		el.addEventListener('pointercancel', resetScale, { signal });
	});
}

export function cleanupInteractions() {
	if (abortController) {
		abortController.abort();
		abortController = null;
	}
}
