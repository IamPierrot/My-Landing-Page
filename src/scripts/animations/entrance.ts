import { animate, stagger } from 'motion';
import { animationConfig } from './config';

let hasEnteredCurrentPage = false;

export function resetPageEntrance() {
	hasEnteredCurrentPage = false;
}

export function preparePageEntrance() {
	if (typeof window === 'undefined') return;

	const navElements = document.querySelectorAll<HTMLElement>('header, .nav-floating, .nav-soc');
	navElements.forEach((el) => {
		el.style.opacity = '0';
		el.style.transform = 'translateY(-8px)';
	});

	const heroEyebrow = document.querySelector<HTMLElement>('[data-hero-eyebrow]');
	if (heroEyebrow) {
		heroEyebrow.style.opacity = '0';
		heroEyebrow.style.transform = 'translateY(-10px)';
	}

	const heroTitle = document.querySelector<HTMLElement>('[data-hero-title]');
	if (heroTitle) {
		heroTitle.style.opacity = '0';
		heroTitle.style.transform = `translateY(${animationConfig.distance.md}px)`;
	}

	const heroBio = document.querySelector<HTMLElement>('[data-hero-bio]');
	if (heroBio) {
		heroBio.style.opacity = '0';
		heroBio.style.transform = `translateY(${animationConfig.distance.sm}px)`;
	}

	const heroActions = document.querySelector<HTMLElement>('[data-hero-actions]');
	if (heroActions) {
		Array.from(heroActions.children).forEach((b) => {
			(b as HTMLElement).style.opacity = '0';
			(b as HTMLElement).style.transform = 'translateY(12px)';
		});
	}

	const heroAvatar = document.querySelector<HTMLElement>('[data-hero-avatar]');
	if (heroAvatar) {
		heroAvatar.style.opacity = '0';
		heroAvatar.style.transform = 'scale(0.94)';
	}
}

export function runPageEntrance() {
	if (typeof window === 'undefined') return;

	// Check prefers-reduced-motion
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		return;
	}

	// Prevent duplicate execution of entrance animations on the same page
	if (hasEnteredCurrentPage) {
		return;
	}
	hasEnteredCurrentPage = true;

	// 1. Navigation entrance
	const navElements = document.querySelectorAll<HTMLElement>('header, .nav-floating, .nav-soc');
	if (navElements.length > 0) {
		const navAnim = animate(
			navElements,
			{ opacity: [0, 1], y: [-8, 0] },
			{ duration: animationConfig.duration.normal, ease: animationConfig.easing.smooth }
		);
		navAnim.then(() => {
			navElements.forEach((el) => {
				el.style.transform = '';
			});
		});
	}

	// 2. Coordinated Hero sequence if present
	const heroEyebrow = document.querySelector<HTMLElement>('[data-hero-eyebrow]');
	const heroTitle = document.querySelector<HTMLElement>('[data-hero-title]');
	const heroBio = document.querySelector<HTMLElement>('[data-hero-bio]');
	const heroActions = document.querySelector<HTMLElement>('[data-hero-actions]');
	const heroAvatar = document.querySelector<HTMLElement>('[data-hero-avatar]');

	if (heroEyebrow) {
		const anim = animate(
			heroEyebrow,
			{ opacity: [0, 1], y: [-10, 0] },
			{ duration: 0.4, delay: 0.1, ease: animationConfig.easing.smooth }
		);
		anim.then(() => {
			heroEyebrow.style.transform = '';
		});
	}

	if (heroTitle) {
		const anim = animate(
			heroTitle,
			{ opacity: [0, 1], y: [animationConfig.distance.md, 0] },
			{ duration: 0.5, delay: 0.18, ease: animationConfig.easing.smooth }
		);
		anim.then(() => {
			heroTitle.style.transform = '';
		});
	}

	if (heroBio) {
		const anim = animate(
			heroBio,
			{ opacity: [0, 1], y: [animationConfig.distance.sm, 0] },
			{ duration: 0.45, delay: 0.26, ease: animationConfig.easing.smooth }
		);
		anim.then(() => {
			heroBio.style.transform = '';
		});
	}

	if (heroActions) {
		const buttons = Array.from(heroActions.children) as HTMLElement[];
		if (buttons.length > 0) {
			const anim = animate(
				buttons,
				{ opacity: [0, 1], y: [12, 0] },
				{
					delay: stagger(animationConfig.stagger.fast, { startDelay: 0.35 }),
					duration: 0.4,
					ease: animationConfig.easing.smooth,
				}
			);
			anim.then(() => {
				buttons.forEach((b) => {
					b.style.transform = '';
				});
			});
		}
	}

	if (heroAvatar) {
		const anim = animate(
			heroAvatar,
			{ opacity: [0, 1], scale: [0.94, 1] },
			{ duration: 0.55, delay: 0.22, ease: animationConfig.easing.smooth }
		);
		anim.then(() => {
			heroAvatar.style.transform = '';
		});
	}

	// 3. Staggered containers annotated with data-animate="stagger"
	const staggerContainers = document.querySelectorAll<HTMLElement>('[data-animate="stagger"]');
	staggerContainers.forEach((container) => {
		const children = Array.from(container.children) as HTMLElement[];
		if (children.length > 0) {
			const rect = container.getBoundingClientRect();
			// Only animate immediately if in or near viewport
			if (rect.top < window.innerHeight * 1.1) {
				const staggerDelay = parseFloat(
					container.getAttribute('data-stagger') || String(animationConfig.stagger.cards)
				);
				const anim = animate(
					children,
					{ opacity: [0, 1], y: [animationConfig.distance.md, 0] },
					{
						delay: stagger(staggerDelay, { startDelay: 0.18 }),
						duration: animationConfig.duration.normal,
						ease: animationConfig.easing.smooth,
					}
				);
				anim.then(() => {
					children.forEach((c) => {
						c.style.transform = '';
					});
				});
			}
		}
	});

	// 4. Standalone elements with data-animate attribute (near viewport)
	const animatedElements = document.querySelectorAll<HTMLElement>(
		'[data-animate]:not([data-animate="stagger"])'
	);
	animatedElements.forEach((el) => {
		const rect = el.getBoundingClientRect();
		if (rect.top < window.innerHeight * 1.1) {
			const type = el.getAttribute('data-animate');
			const delay = parseFloat(el.getAttribute('data-delay') || '0.12');
			const duration = parseFloat(
				el.getAttribute('data-duration') || String(animationConfig.duration.normal)
			);

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
						{ opacity: [0, 1], scale: [0.95, 1] },
						{ duration, delay, ease: animationConfig.easing.smooth }
					);
					break;
			}

			if (anim) {
				anim.then(() => {
					el.style.transform = '';
				});
			}
		}
	});
}
