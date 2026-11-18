import { animate, inView, stagger } from 'motion';
import { animationConfig } from './config';

let cleanupFunctions: Array<() => void> = [];

export function setupScrollReveal() {
	if (typeof window === 'undefined') return;

	// Check prefers-reduced-motion
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		return;
	}

	cleanupScrollReveal();

	const viewportHeight = window.innerHeight;

	// 1. Standalone [data-reveal] elements below fold
	const revealElements = document.querySelectorAll<HTMLElement>('[data-reveal]');
	revealElements.forEach((el) => {
		const rect = el.getBoundingClientRect();
		// If already in viewport during initial load, let entrance handle or animate immediately
		if (rect.top > viewportHeight * 0.95) {
			// Initially hide to avoid flash before scroll
			el.style.opacity = '0';
			el.style.transform = `translateY(${animationConfig.distance.md}px)`;

			const stop = inView(
				el,
				() => {
					const anim = animate(
						el,
						{ opacity: [0, 1], y: [animationConfig.distance.md, 0] },
						{
							duration: animationConfig.duration.normal,
							ease: animationConfig.easing.smooth,
						}
					);
					anim.then(() => {
						el.style.transform = '';
					});
				},
				{ margin: '0px 0px -40px 0px' }
			);

			cleanupFunctions.push(stop);
		}
	});

	// 2. Elements with [data-animate] below fold
	const animElements = document.querySelectorAll<HTMLElement>(
		'[data-animate]:not([data-animate="stagger"])'
	);
	animElements.forEach((el) => {
		const rect = el.getBoundingClientRect();
		if (rect.top > viewportHeight * 0.95) {
			const type = el.getAttribute('data-animate');
			const delay = parseFloat(el.getAttribute('data-delay') || '0');
			const duration = parseFloat(
				el.getAttribute('data-duration') || String(animationConfig.duration.normal)
			);

			// Hide initially
			el.style.opacity = '0';
			if (type === 'fade-up') el.style.transform = `translateY(${animationConfig.distance.md}px)`;
			else if (type === 'slide-left') el.style.transform = `translateX(${animationConfig.distance.lg}px)`;
			else if (type === 'scale-in') el.style.transform = 'scale(0.96)';

			const stop = inView(
				el,
				() => {
					let anim: ReturnType<typeof animate> | null = null;
					switch (type) {
						case 'fade-up':
							anim = animate(
								el,
								{ opacity: [0, 1], y: [animationConfig.distance.md, 0] },
								{ duration, delay, ease: animationConfig.easing.smooth }
							);
							break;
						case 'fade-in':
							anim = animate(
								el,
								{ opacity: [0, 1] },
								{ duration, delay, ease: animationConfig.easing.smooth }
							);
							break;
						case 'slide-left':
							anim = animate(
								el,
								{ opacity: [0, 1], x: [animationConfig.distance.lg, 0] },
								{ duration, delay, ease: animationConfig.easing.smooth }
							);
							break;
						case 'scale-in':
							anim = animate(
								el,
								{ opacity: [0, 1], scale: [0.96, 1] },
								{ duration, delay, ease: animationConfig.easing.smooth }
							);
							break;
					}
					if (anim) {
						anim.then(() => {
							el.style.transform = '';
						});
					}
				},
				{ margin: '0px 0px -40px 0px' }
			);

			cleanupFunctions.push(stop);
		}
	});

	// 3. Stagger containers below fold
	const staggerContainers = document.querySelectorAll<HTMLElement>('[data-animate="stagger"]');
	staggerContainers.forEach((container) => {
		const rect = container.getBoundingClientRect();
		if (rect.top > viewportHeight * 0.95) {
			const children = Array.from(container.children) as HTMLElement[];
			children.forEach((child) => {
				child.style.opacity = '0';
				child.style.transform = `translateY(${animationConfig.distance.md}px)`;
			});

			const staggerDelay = parseFloat(
				container.getAttribute('data-stagger') || String(animationConfig.stagger.cards)
			);

			const stop = inView(
				container,
				() => {
					const anim = animate(
						children,
						{ opacity: [0, 1], y: [animationConfig.distance.md, 0] },
						{
							delay: stagger(staggerDelay),
							duration: animationConfig.duration.normal,
							ease: animationConfig.easing.smooth,
						}
					);
					anim.then(() => {
						children.forEach((c) => {
							c.style.transform = '';
						});
					});
				},
				{ margin: '0px 0px -50px 0px' }
			);

			cleanupFunctions.push(stop);
		}
	});
}

export function cleanupScrollReveal() {
	cleanupFunctions.forEach((cleanup) => {
		try {
			cleanup();
		} catch (e) {}
	});
	cleanupFunctions = [];
}
