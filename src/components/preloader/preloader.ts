import { animate, stagger } from 'motion';

/**
 * Compulsory Website Startup Boot Sequence
 * Runs the terminal boot preloader animation sequentially,
 * and resolves when the exit transition is complete.
 */
export function runPreloader(preloaderEl: HTMLElement, onExit?: () => void): Promise<void> {
	return new Promise((resolve) => {
		// Session check: if already seen in this session, skip immediately
		try {
			if (sessionStorage.getItem('pierrot_preloader_seen') === 'true') {
				if (onExit) {
					try {
						onExit();
					} catch (e) {}
				}
				preloaderEl.remove();
				resolve();
				return;
			}
		} catch (e) {}

		// Accessibility: Check prefers-reduced-motion
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			try {
				sessionStorage.setItem('pierrot_preloader_seen', 'true');
			} catch (e) {}
			if (onExit) {
				try {
					onExit();
				} catch (e) {}
			}
			preloaderEl.remove();
			resolve();
			return;
		}

		// Prevent background scrolling during startup boot sequence
		const originalOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';

		const promptEl = preloaderEl.querySelector('.boot-prompt') as HTMLElement | null;
		const logLines = preloaderEl.querySelectorAll('.boot-line');
		const progressBar = preloaderEl.querySelector('.boot-progress-fill') as HTMLElement | null;
		const progressText = preloaderEl.querySelector('.boot-progress-text') as HTMLElement | null;
		const readyLine = preloaderEl.querySelector('.boot-ready') as HTMLElement | null;
		const cardEl = preloaderEl.querySelector('.boot-card') as HTMLElement | null;

		let isCompleted = false;

		const cleanupAndResolve = () => {
			document.body.style.overflow = originalOverflow;
			preloaderEl.remove();
			resolve();
		};

		async function finishPreloader() {
			if (isCompleted) return;
			isCompleted = true;

			try {
				sessionStorage.setItem('pierrot_preloader_seen', 'true');
			} catch (e) {}
			document.documentElement.classList.add('preloader-skipped');

			// Trigger exit hand-off immediately so page entrance animates in parallel with exit dissolve
			if (onExit) {
				try {
					onExit();
				} catch (e) {}
			}

			// Remove skip listeners
			preloaderEl.removeEventListener('click', handleSkip);
			window.removeEventListener('keydown', handleKeydown);

			// Disable pointer events immediately so interactions pass through
			preloaderEl.style.pointerEvents = 'none';

			// Floating exit animation (terminal card floats upward + dissolves)
			try {
				const exitPromises: Promise<void>[] = [];

				if (cardEl) {
					const cardAnim = animate(
						cardEl,
						{
							y: [0, -35],
							opacity: [1, 0],
							scale: [1, 0.98],
						},
						{
							duration: 0.35,
							ease: [0.16, 1, 0.3, 1],
						}
					);
					exitPromises.push(cardAnim.then(() => {}));
				}

				const bgAnim = animate(
					preloaderEl,
					{
						opacity: [1, 0],
					},
					{
						duration: 0.35,
						ease: [0.16, 1, 0.3, 1],
					}
				);
				exitPromises.push(bgAnim.then(() => {}));

				await Promise.all(exitPromises);
			} catch (err) {
				// Continue cleanup if error occurs
			}

			cleanupAndResolve();
		}

		// Quick skip handlers
		const handleSkip = () => {
			clearTimeout(safetyTimeout);
			finishPreloader();
		};

		const handleKeydown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
				handleSkip();
			}
		};

		preloaderEl.addEventListener('click', handleSkip, { once: true });
		window.addEventListener('keydown', handleKeydown, { once: true });

		// Fallback safety timer (2.2s maximum)
		const safetyTimeout = setTimeout(finishPreloader, 2200);

		// Coordinated boot sequence
		(async () => {
			try {
				// Initial states
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

				// Phase 1: Card entrance (0.25s)
				if (cardEl) {
					await animate(
						cardEl,
						{ opacity: [0, 1], y: [12, 0], scale: [0.98, 1] },
						{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }
					);
				}
				if (isCompleted) return;

				// Phase 2: Command prompt reveal (0.15s)
				if (promptEl) {
					await animate(promptEl, { opacity: [0, 1] }, { duration: 0.15 });
				}
				if (isCompleted) return;

				// Phase 3: Staggered log lines & progress bar fill (0.45s)
				const lineAnim = animate(
					logLines,
					{ opacity: [0, 1], x: [-6, 0] },
					{ delay: stagger(0.06), duration: 0.18, ease: [0.25, 1, 0.5, 1] }
				);

				if (progressBar) {
					animate(
						progressBar,
						{ width: ['0%', '100%'] },
						{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }
					);
				}

				// Smooth numeric progress counter update
				if (progressText) {
					const startTime = performance.now();
					const totalDuration = 450;
					const updateProgress = (currentTime: number) => {
						if (isCompleted) return;
						const elapsed = currentTime - startTime;
						const percent = Math.min(100, Math.round((elapsed / totalDuration) * 100));
						progressText.textContent = `${percent}%`;
						if (percent < 100) {
							requestAnimationFrame(updateProgress);
						}
					};
					requestAnimationFrame(updateProgress);
				}

				await lineAnim;
				if (isCompleted) return;

				// Phase 4: System Ready announcement (0.15s)
				if (readyLine) {
					await animate(readyLine, { opacity: [0, 1] }, { duration: 0.15, ease: [0.25, 1, 0.5, 1] });
				}
				if (isCompleted) return;

				// Phase 5: Brief hold before exit transition (0.18s)
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

/**
 * Backward compatibility alias
 */
export function initPreloader(preloaderEl: HTMLElement): void {
	runPreloader(preloaderEl);
}
