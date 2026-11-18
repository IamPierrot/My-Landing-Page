/**
 * Smart autohide navigation controller
 * - Smoothly hides on scroll down (past threshold) to maximize reading canvas
 * - Smoothly reveals and sticks on scroll up
 * - Always reveals near top of page
 * - Never hides while mobile navigation drawer is open
 */

let lastScrollY = 0;
let isTicking = false;
let isInitialized = false;

const SCROLL_THRESHOLD = 6; // px to ignore micro-jitter
const HIDE_OFFSET = 60; // px past top before autohide activates

export function revealNav() {
	const navs = document.querySelectorAll<HTMLElement>('.autohide-nav');
	navs.forEach((nav) => {
		nav.style.transform = '';
		nav.classList.remove('nav-hidden');
	});
}

export function hideNav() {
	const navs = document.querySelectorAll<HTMLElement>('.autohide-nav');
	navs.forEach((nav) => {
		nav.style.transform = '';
		nav.classList.add('nav-hidden');
	});
}

function updateStuckState(currentScrollY: number) {
	const navs = document.querySelectorAll<HTMLElement>('.autohide-nav');
	const isStuck = currentScrollY > 15;
	navs.forEach((nav) => {
		if (isStuck) {
			nav.classList.add('nav-stuck');
		} else {
			nav.classList.remove('nav-stuck');
		}
	});
}

function handleScroll() {
	if (isTicking) return;
	isTicking = true;

	requestAnimationFrame(() => {
		isTicking = false;

		const currentScrollY = window.scrollY || window.pageYOffset;
		const documentHeight = document.documentElement.scrollHeight;
		const windowHeight = window.innerHeight;

		// 1. Guard against bounce / rubber-banding at edges (macOS / iOS)
		if (currentScrollY < 0 || currentScrollY + windowHeight > documentHeight + 20) {
			return;
		}

		updateStuckState(currentScrollY);

		// 2. Always show navigation near top of page
		if (currentScrollY <= 25) {
			revealNav();
			lastScrollY = currentScrollY;
			return;
		}

		// 3. Ignore micro-movements to avoid flicker
		const delta = currentScrollY - lastScrollY;
		if (Math.abs(delta) < SCROLL_THRESHOLD) {
			return;
		}

		// 4. Check if mobile drawer is currently open
		const mobileToggle = document.getElementById('mobile-drawer-toggle');
		const isMobileMenuOpen = mobileToggle?.getAttribute('aria-expanded') === 'true';

		if (delta > 0 && currentScrollY > HIDE_OFFSET) {
			// Scrolling DOWN: autohide unless mobile drawer is open
			if (!isMobileMenuOpen) {
				hideNav();
			}
		} else if (delta < 0) {
			// Scrolling UP: smoothly unhide and stick
			revealNav();
		}

		lastScrollY = currentScrollY;
	});
}

export function initNavigationAutohide() {
	if (typeof window === 'undefined') return;

	// Reset state on execution
	lastScrollY = window.scrollY || window.pageYOffset;
	revealNav();
	updateStuckState(lastScrollY);

	if (!isInitialized) {
		isInitialized = true;
		window.addEventListener('scroll', handleScroll, { passive: true });

		// Reset on client-side route navigation
		document.addEventListener('astro:page-load', () => {
			lastScrollY = window.scrollY || window.pageYOffset;
			revealNav();
			updateStuckState(lastScrollY);
		});

		// Reveal when user toggles navigation style
		window.addEventListener('nav-style-changed', () => {
			revealNav();
		});
	}
}
