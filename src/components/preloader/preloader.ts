/**
 * Terminal Preload Animation Sequence
 * Runs once per session on the first visit.
 * Implemented with pure Web Animations API (zero external dependencies).
 */

export function runPreloader(preloaderEl: HTMLElement): Promise<void> {
	return new Promise((resolve) => {
		// 1. Session check: skip immediately if already seen in this session
		try {
			if (sessionStorage.getItem('pierrot_preloader_seen') === 'true') {
				preloaderEl.remove();
				resolve();
				return;
			}
		} catch (e) {
			// Ignore sessionStorage errors (e.g. private mode restrictions)
		}

		// 2. Accessibility: Skip immediately if prefers-reduced-motion is active
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			try {
				sessionStorage.setItem('pierrot_preloader_seen', 'true');
			} catch (e) {}
			document.documentElement.classList.add('preloader-skipped');
			preloaderEl.remove();
			resolve();
			return;
		}

		// 3. Fallback if Web Animations API is not supported
		if (typeof preloaderEl.animate !== 'function') {
			try {
				sessionStorage.setItem('pierrot_preloader_seen', 'true');
			} catch (e) {}
			document.documentElement.classList.add('preloader-skipped');
			preloaderEl.remove();
			resolve();
			return;
		}

		// Lock body scroll during preloader
		const originalOverflow = document.body ? document.body.style.overflow : '';
		if (document.body) {
			document.body.style.overflow = 'hidden';
		}

		const promptEl = preloaderEl.querySelector('.boot-prompt') as HTMLElement | null;
		const logLines = preloaderEl.querySelectorAll('.boot-line');
		const progressBar = preloaderEl.querySelector('.boot-progress-fill') as HTMLElement | null;
		const progressText = preloaderEl.querySelector('.boot-progress-text') as HTMLElement | null;
		const readyLine = preloaderEl.querySelector('.boot-ready') as HTMLElement | null;
		const cardEl = preloaderEl.querySelector('.boot-card') as HTMLElement | null;

		let isCompleted = false;

		const cleanupAndResolve = () => {
			if (document.body) {
				document.body.style.overflow = originalOverflow;
			}
			preloaderEl.remove();
			resolve();
		};

		async function finishPreloader(fast = false) {
			if (isCompleted) return;
			isCompleted = true;

			preloaderEl.removeEventListener('click', handleSkip);
			window.removeEventListener('keydown', handleKeydown);

			// Disable pointer events immediately so interactions pass through to page below
			preloaderEl.style.pointerEvents = 'none';

			// Smooth floating up exit animation (curtain lift, zero flash)
			const duration = fast ? 320 : 520;
			try {
				const exitAnimations: Animation[] = [];

				// Float the entire preloader screen smoothly off the top of the viewport
				const preloaderAnim = preloaderEl.animate(
					[
						{ transform: 'translateY(0%)' },
						{ transform: 'translateY(-100%)' },
					],
					{
						duration,
						easing: 'cubic-bezier(0.76, 0, 0.24, 1)',
						fill: 'forwards',
					}
				);
				exitAnimations.push(preloaderAnim);

				// Terminal card also lifts up with a subtle parallax drift
				if (cardEl) {
					const cardAnim = cardEl.animate(
						[
							{ transform: 'translateY(0) scale(1)' },
							{ transform: 'translateY(-35px) scale(0.98)' },
						],
						{
							duration: Math.round(duration * 0.9),
							easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
							fill: 'forwards',
						}
					);
					exitAnimations.push(cardAnim);
				}

				await Promise.all(exitAnimations.map((anim) => anim.finished));
			} catch (err) {
				// Continue to cleanup if animation fails
			}

			// ONLY AFTER floating exit completes, persist session state and suppress
			try {
				sessionStorage.setItem('pierrot_preloader_seen', 'true');
			} catch (e) {}
			document.documentElement.classList.add('preloader-skipped');

			cleanupAndResolve();
		}

		// Quick skip handlers
		const handleSkip = () => {
			clearTimeout(safetyTimeout);
			finishPreloader(true);
		};

		const handleKeydown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
				handleSkip();
			}
		};

		preloaderEl.addEventListener('click', handleSkip, { once: true });
		window.addEventListener('keydown', handleKeydown, { once: true });

		// Maximum safety timer (2.2s)
		const safetyTimeout = setTimeout(finishPreloader, 2200);

		// Execute boot sequence
		(async () => {
			try {
				// Set initial styles
				if (cardEl) {
					cardEl.style.opacity = '0';
					cardEl.style.transform = 'translateY(12px) scale(0.98)';
				}
				if (promptEl) promptEl.style.opacity = '0';
				logLines.forEach((l) => {
					const el = l as HTMLElement;
					el.style.opacity = '0';
					el.style.transform = 'translateX(-6px)';
				});
				if (progressBar) progressBar.style.width = '0%';
				if (readyLine) readyLine.style.opacity = '0';

				// Phase 1: Card entrance (0.2s)
				if (cardEl) {
					const cardIn = cardEl.animate(
						[
							{ opacity: '0', transform: 'translateY(12px) scale(0.98)' },
							{ opacity: '1', transform: 'translateY(0) scale(1)' },
						],
						{
							duration: 200,
							easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
							fill: 'forwards',
						}
					);
					await cardIn.finished;
				}
				if (isCompleted) return;

				// Phase 2: Command prompt reveal (0.15s)
				if (promptEl) {
					const promptIn = promptEl.animate(
						[{ opacity: '0' }, { opacity: '1' }],
						{ duration: 150, fill: 'forwards' }
					);
					await promptIn.finished;
				}
				if (isCompleted) return;

				// Phase 3: Staggered log lines & progress bar fill (0.42s)
				const linePromises: Promise<Animation>[] = [];
				logLines.forEach((line, index) => {
					const el = line as HTMLElement;
					const anim = el.animate(
						[
							{ opacity: '0', transform: 'translateX(-6px)' },
							{ opacity: '1', transform: 'translateX(0)' },
						],
						{
							delay: index * 55,
							duration: 160,
							easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
							fill: 'forwards',
						}
					);
					linePromises.push(anim.finished);
				});

				if (progressBar) {
					progressBar.animate(
						[{ width: '0%' }, { width: '100%' }],
						{
							duration: 420,
							easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
							fill: 'forwards',
						}
					);
				}

				// Numeric counter update
				if (progressText) {
					const startTime = performance.now();
					const totalDuration = 420;
					const updateCounter = (currentTime: number) => {
						if (isCompleted) return;
						const elapsed = currentTime - startTime;
						const percent = Math.min(100, Math.round((elapsed / totalDuration) * 100));
						progressText.textContent = `${percent}%`;
						if (percent < 100) {
							requestAnimationFrame(updateCounter);
						}
					};
					requestAnimationFrame(updateCounter);
				}

				await Promise.all(linePromises);
				if (isCompleted) return;

				// Phase 4: System Ready announcement (0.15s)
				if (readyLine) {
					const readyIn = readyLine.animate(
						[{ opacity: '0' }, { opacity: '1' }],
						{
							duration: 150,
							easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
							fill: 'forwards',
						}
					);
					await readyIn.finished;
				}
				if (isCompleted) return;

				// Phase 5: Brief hold before clean exit (180ms)
				await new Promise((r) => setTimeout(r, 180));
				if (isCompleted) return;

				clearTimeout(safetyTimeout);
				finishPreloader();
			} catch (err) {
				clearTimeout(safetyTimeout);
				finishPreloader();
			}
		})();
	});
}
