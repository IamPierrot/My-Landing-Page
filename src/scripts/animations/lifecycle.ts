import { runPreloader } from '../../components/preloader/preloader';
import { runPageEntrance, resetPageEntrance, preparePageEntrance } from './entrance';
import { setupScrollReveal, cleanupScrollReveal } from './scroll-reveal';
import { setupInteractions, cleanupInteractions } from './interactions';

let isLifecycleSetup = false;
let hasStartedForThisPage = false;

/**
 * Initializes and orchestrates the startup animation pipeline:
 * 1. Prepares initial hidden state if boot preloader is present.
 * 2. Runs the compulsory website boot preloader with a parallel onExit hand-off.
 * 3. Smoothly transitions into page entrance animations with zero visual flash.
 * 4. Initializes scroll-triggered reveals and micro-interactions.
 */
export async function initAnimations() {
	if (typeof window === 'undefined') return;

	// Prevent duplicate execution of animations on the same page
	if (hasStartedForThisPage) return;
	hasStartedForThisPage = true;

	// Check prefers-reduced-motion
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		document.documentElement.classList.remove('is-booting');
		const preloader = document.getElementById('site-preloader');
		if (preloader) preloader.remove();
		setupInteractions();
		return;
	}

	// Check session storage: if already seen in this session, skip preloader
	const isSkipped = (() => {
		try {
			return sessionStorage.getItem('pierrot_preloader_seen') === 'true';
		} catch (e) {
			return false;
		}
	})();

	// 1. Run preloader ONLY on first session visit when not skipped
	const preloader = document.getElementById('site-preloader');
	if (preloader && !isSkipped) {
		preparePageEntrance();
		await runPreloader(preloader, () => {
			document.documentElement.classList.remove('is-booting');
			runPageEntrance();
		});
	} else {
		if (preloader) preloader.remove();
		document.documentElement.classList.remove('is-booting');
		runPageEntrance();
	}

	setupScrollReveal();
	setupInteractions();
}

export function destroyAnimations() {
	hasStartedForThisPage = false;
	resetPageEntrance();
	cleanupScrollReveal();
	cleanupInteractions();
}

export function setupAnimationLifecycle() {
	if (typeof window === 'undefined') return;

	if (!isLifecycleSetup) {
		isLifecycleSetup = true;

		// Initial page load
		initAnimations();

		// Astro View Transitions lifecycle hooks
		document.addEventListener('astro:page-load', () => {
			initAnimations();
		});

		document.addEventListener('astro:before-swap', () => {
			destroyAnimations();
		});
	}
}
