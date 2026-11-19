/**
 * Mermaid Diagram Renderer & Interactive Container
 * Lazy-loads the official Mermaid library and renders technical diagrams
 * with zoom controls, fullscreen modal, source code toggle, and error fallbacks.
 */

let mermaidInitialized = false;

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

/**
 * Detects diagram type from first non-empty line of Mermaid syntax
 */
function detectDiagramType(code: string): string {
	const lines = code.trim().split('\n');
	for (const rawLine of lines) {
		const line = rawLine.trim().toLowerCase();
		if (!line || line.startsWith('%%')) continue;

		if (line.startsWith('flowchart') || line.startsWith('graph')) return 'Activity';
		if (line.startsWith('sequencediagram')) return 'Sequence';
		if (line.startsWith('statediagram')) return 'State';
		if (line.startsWith('classdiagram')) return 'Class';
		if (line.startsWith('erdiagram')) return 'Entity Relationship';
		if (line.startsWith('gantt')) return 'Gantt';
		if (line.startsWith('pie')) return 'Pie Chart';
		if (line.startsWith('gitgraph')) return 'Git Graph';
		if (line.startsWith('timeline')) return 'Timeline';
		if (line.startsWith('mindmap')) return 'Mindmap';
		if (line.startsWith('quadrantchart')) return 'Quadrant';
		if (line.startsWith('sankey')) return 'Sankey';
		if (line.startsWith('architecture') || line.startsWith('c4')) return 'Architecture';
		break;
	}
	return 'Diagram';
}

/**
 * Opens fullscreen inspection modal for large diagrams
 */
function openFullscreenDiagram(rawCode: string, svgContent: string, diagramType: string) {
	const existingModal = document.getElementById('mermaid-fullscreen-modal');
	if (existingModal) existingModal.remove();

	const modal = document.createElement('div');
	modal.id = 'mermaid-fullscreen-modal';
	modal.className =
		'fixed inset-0 z-[99999] bg-[#080D18]/95 backdrop-blur-md p-4 sm:p-6 flex flex-col items-center justify-center select-none animate-fade-in';

	let modalZoom = 1.0;

	modal.innerHTML = `
		<div class="relative w-full h-full max-w-7xl bg-[#101A2B] border border-[#243752] rounded-xl flex flex-col overflow-hidden shadow-2xl">
			<!-- Modal Header Bar -->
			<div class="flex items-center justify-between px-5 py-3.5 border-b border-[#243752] bg-[#0A111E] text-xs font-mono text-[#DCE8F5]">
				<div class="flex items-center gap-2">
					<span class="inline-block w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse"></span>
					<span class="font-bold tracking-wide">${diagramType} // Fullscreen</span>
				</div>
				<div class="flex items-center gap-2">
					<button id="modal-zoom-out" type="button" class="mermaid-modal-btn" title="Zoom out">
						<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
					</button>
					<span id="modal-zoom-label" class="text-[11px] text-[#8FA6C2] px-1.5 cursor-pointer" title="Click to reset">100%</span>
					<button id="modal-zoom-in" type="button" class="mermaid-modal-btn" title="Zoom in">
						<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
					</button>
					<button id="modal-copy-btn" type="button" class="mermaid-modal-btn ml-2" title="Copy source">
						<span>Copy</span>
					</button>
					<button id="modal-close-btn" type="button" class="mermaid-modal-btn text-[#F43F5E] hover:border-[#F43F5E]/60 ml-2" title="Close [ESC]">
						<span>Close [ESC]</span>
					</button>
				</div>
			</div>

			<!-- Modal Diagram Viewport -->
			<div id="modal-diagram-viewport" class="flex-1 w-full overflow-auto p-6 flex items-center justify-center bg-[#080D18]">
				<div id="modal-svg-container" class="transition-transform duration-150 origin-center max-w-full">
					${svgContent}
				</div>
			</div>
		</div>
	`;

	document.body.appendChild(modal);

	const originalOverflow = document.body.style.overflow;
	document.body.style.overflow = 'hidden';

	const closeModal = () => {
		document.body.style.overflow = originalOverflow;
		window.removeEventListener('keydown', handleEsc);
		modal.remove();
	};

	const handleEsc = (e: KeyboardEvent) => {
		if (e.key === 'Escape') closeModal();
	};
	window.addEventListener('keydown', handleEsc);

	// Zoom actions inside modal
	const zoomContainer = modal.querySelector<HTMLElement>('#modal-svg-container');
	const zoomLabel = modal.querySelector<HTMLElement>('#modal-zoom-label');
	const updateModalZoom = (z: number) => {
		modalZoom = Math.min(3.0, Math.max(0.4, Math.round(z * 10) / 10));
		if (zoomLabel) zoomLabel.textContent = `${Math.round(modalZoom * 100)}%`;
		if (zoomContainer) {
			zoomContainer.style.transform = `scale(${modalZoom})`;
		}
	};

	modal.querySelector('#modal-zoom-in')?.addEventListener('click', () => updateModalZoom(modalZoom + 0.2));
	modal.querySelector('#modal-zoom-out')?.addEventListener('click', () => updateModalZoom(modalZoom - 0.2));
	modal.querySelector('#modal-zoom-label')?.addEventListener('click', () => updateModalZoom(1.0));
	modal.querySelector('#modal-close-btn')?.addEventListener('click', closeModal);

	// Copy inside modal
	modal.querySelector('#modal-copy-btn')?.addEventListener('click', async () => {
		try {
			await navigator.clipboard.writeText(rawCode);
			const btn = modal.querySelector('#modal-copy-btn span');
			if (btn) {
				btn.textContent = 'Copied!';
				setTimeout(() => {
					btn.textContent = 'Copy';
				}, 2000);
			}
		} catch (e) {}
	});

	// Close on click outside card
	modal.addEventListener('click', (e) => {
		if (e.target === modal) closeModal();
	});
}

/**
 * Initializes and processes all Mermaid code blocks in the article prose.
 * Lazy-loads the Mermaid library on demand.
 */
export async function initMermaidDiagrams() {
	if (typeof window === 'undefined') return;

	const prose = document.getElementById('article-prose') || document.querySelector('.prose');
	if (!prose) return;

	// Locate all candidate mermaid code blocks
	const candidateBlocks = Array.from(prose.querySelectorAll<HTMLPreElement>('pre')).filter((pre) => {
		if (pre.getAttribute('data-mermaid-processed') === 'true') return false;
		if (pre.classList.contains('mermaid-processed')) return false;

		const lang = pre.getAttribute('data-language') || '';
		if (lang === 'mermaid') return true;

		const codeEl = pre.querySelector('code');
		if (codeEl) {
			const classList = Array.from(codeEl.classList);
			if (classList.includes('language-mermaid')) return true;
		}

		if (pre.classList.contains('mermaid')) return true;
		return false;
	});

	if (candidateBlocks.length === 0) {
		// Zero mermaid blocks on page: lazy-load zero extra JS
		return;
	}

	// Dynamically import official mermaid library
	const mermaidModule = await import('mermaid');
	const mermaid = mermaidModule.default;

	if (!mermaidInitialized) {
		mermaid.initialize({
			startOnLoad: false,
			securityLevel: 'strict', // Security: blocks malicious script injection
			fontFamily: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
			fontSize: 11,
			flowchart: {
				htmlLabels: true,
				curve: 'basis',
				padding: 8,
			},
			sequence: {
				actorFontSize: 11,
				messageFontSize: 11,
				noteFontSize: 10,
				actorMargin: 35,
				messageMargin: 25,
			},
			theme: 'base',
			themeVariables: {
				darkMode: true,
				fontSize: '11px',
				fontFamily: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
				background: '#080D18',
				mainBkg: '#101A2B',
				clusterBkg: '#0A111E',
				clusterBorder: '#243752',
				primaryColor: '#101A2B',
				primaryBorderColor: '#243752',
				primaryTextColor: '#DCE8F5',
				secondaryColor: '#16233B',
				secondaryBorderColor: '#243752',
				secondaryTextColor: '#DCE8F5',
				tertiaryColor: '#0A111E',
				tertiaryBorderColor: '#243752',
				tertiaryTextColor: '#DCE8F5',
				lineColor: '#546C8E',
				edgeLabelBackground: '#080D18',
				textColor: '#DCE8F5',
				noteBkgColor: '#16233B',
				noteBorderColor: '#38BDF8',
				noteTextColor: '#DCE8F5',
				actorBkg: '#101A2B',
				actorBorder: '#243752',
				actorTextColor: '#DCE8F5',
				actorLineColor: '#546C8E',
				signalColor: '#8FA6C2',
				signalTextColor: '#DCE8F5',
				labelBoxBkgColor: '#101A2B',
				labelBoxBorderColor: '#243752',
				labelTextColor: '#DCE8F5',
				loopTextColor: '#DCE8F5',
				activationBorderColor: '#38BDF8',
				activationBkgColor: '#16233B',
				stateBkg: '#101A2B',
				stateBorder: '#243752',
				stateLabelColor: '#DCE8F5',
				altBackground: '#0A111E',
				classText: '#DCE8F5',
				git0: '#38BDF8',
				git1: '#0284C7',
				git2: '#F59E0B',
				git3: '#F43F5E',
				gitBranchLabel0: '#DCE8F5',
				gitBranchLabel1: '#DCE8F5',
				gitBranchLabel2: '#DCE8F5',
				gitBranchLabel3: '#DCE8F5',
				pie1: '#38BDF8',
				pie2: '#0284C7',
				pie3: '#F59E0B',
				pie4: '#F43F5E',
				pie5: '#10B981',
				pie6: '#8B5CF6',
				pieTitleTextColor: '#DCE8F5',
				pieSectionTextColor: '#DCE8F5',
				pieLegendTextColor: '#8FA6C2',
			},
		});
		mermaidInitialized = true;
	}

	let diagramCounter = 0;

	for (const pre of candidateBlocks) {
		pre.setAttribute('data-mermaid-processed', 'true');
		pre.classList.add('mermaid-processed');

		// Extract raw code text
		const rawCode = pre.textContent?.trim() || '';
		if (!rawCode) continue;

		diagramCounter++;
		const uniqueId = `mermaid-svg-${Date.now()}-${diagramCounter}`;
		const diagramType = detectDiagramType(rawCode);

		// Diagram Container element
		const container = document.createElement('figure');
		container.className = 'mermaid-diagram-container not-prose';
		container.setAttribute('data-diagram-type', diagramType);

		// Container Header
		const header = document.createElement('div');
		header.className = 'mermaid-diagram-header';

		// Title badge
		const titleBadge = document.createElement('div');
		titleBadge.className = 'mermaid-diagram-title';
		titleBadge.innerHTML = `
			<span class="mermaid-status-dot"></span>
			<span>${diagramType}</span>
		`;
		header.appendChild(titleBadge);

		// Actions bar
		const actions = document.createElement('div');
		actions.className = 'mermaid-diagram-actions';

		// Zoom controls
		const zoomOutBtn = document.createElement('button');
		zoomOutBtn.type = 'button';
		zoomOutBtn.className = 'mermaid-btn mermaid-btn-icon';
		zoomOutBtn.title = 'Zoom out';
		zoomOutBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`;

		const zoomLabel = document.createElement('span');
		zoomLabel.className = 'mermaid-zoom-label';
		zoomLabel.title = 'Click to reset zoom (100%)';
		zoomLabel.textContent = '100%';

		const zoomInBtn = document.createElement('button');
		zoomInBtn.type = 'button';
		zoomInBtn.className = 'mermaid-btn mermaid-btn-icon';
		zoomInBtn.title = 'Zoom in';
		zoomInBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`;

		// Fullscreen button
		const fullscreenBtn = document.createElement('button');
		fullscreenBtn.type = 'button';
		fullscreenBtn.className = 'mermaid-btn mermaid-btn-icon';
		fullscreenBtn.title = 'Expand fullscreen';
		fullscreenBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>`;

		// Copy button
		const copyBtn = document.createElement('button');
		copyBtn.type = 'button';
		copyBtn.className = 'mermaid-btn';
		copyBtn.title = 'Copy Mermaid source';
		copyBtn.innerHTML = `
			<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
			<span>Copy</span>
		`;

		actions.appendChild(zoomOutBtn);
		actions.appendChild(zoomLabel);
		actions.appendChild(zoomInBtn);
		actions.appendChild(fullscreenBtn);
		actions.appendChild(copyBtn);
		header.appendChild(actions);
		container.appendChild(header);

		// Body viewports
		const body = document.createElement('div');
		body.className = 'mermaid-diagram-body';

		const svgWrapper = document.createElement('div');
		svgWrapper.className = 'mermaid-svg-wrapper';

		const sourceWrapper = document.createElement('div');
		sourceWrapper.className = 'mermaid-source-wrapper hidden';
		const sourcePre = document.createElement('pre');
		sourcePre.className = 'mermaid-source-pre';
		sourcePre.textContent = rawCode;
		sourceWrapper.appendChild(sourcePre);

		body.appendChild(svgWrapper);
		body.appendChild(sourceWrapper);
		container.appendChild(body);

		// Render via mermaid
		let renderedSvg = '';
		try {
			const renderResult = await mermaid.render(uniqueId, rawCode);
			renderedSvg = renderResult.svg;
			svgWrapper.innerHTML = renderedSvg;
		} catch (err: any) {
			// Section 5: Fallback preserves original code block without breaking the page
			container.classList.add('mermaid-error-container');
			titleBadge.innerHTML = `
				<span class="mermaid-status-dot mermaid-status-error"></span>
				<span class="text-[#F43F5E]">Syntax Error</span>
			`;
			svgWrapper.innerHTML = `
				<div class="mermaid-error-notice">
					<p class="mermaid-error-msg">Failed to parse diagram: ${escapeHtml(err?.message || 'Syntax error')}</p>
					<p class="text-[11px] text-[#8FA6C2] mt-1 font-mono">Original source code preserved below:</p>
				</div>
			`;
			sourceWrapper.classList.remove('hidden');
			zoomInBtn.remove();
			zoomOutBtn.remove();
			zoomLabel.remove();
			fullscreenBtn.remove();
		}

		// Zoom handler
		let currentZoom = 1.0;
		const updateZoom = (z: number) => {
			currentZoom = Math.min(2.0, Math.max(0.6, Math.round(z * 10) / 10));
			zoomLabel.textContent = `${Math.round(currentZoom * 100)}%`;
			const svg = svgWrapper.querySelector('svg');
			if (svg) {
				svg.style.transform = `scale(${currentZoom})`;
				svg.style.transformOrigin = 'center center';
				svg.style.transition = 'transform 0.15s ease';
			}
		};

		zoomInBtn.addEventListener('click', () => updateZoom(currentZoom + 0.15));
		zoomOutBtn.addEventListener('click', () => updateZoom(currentZoom - 0.15));
		zoomLabel.addEventListener('click', () => updateZoom(1.0));

		// Copy handler
		copyBtn.addEventListener('click', async () => {
			try {
				await navigator.clipboard.writeText(rawCode);
				const span = copyBtn.querySelector('span');
				if (span) {
					const orig = span.textContent;
					span.textContent = 'Copied!';
					copyBtn.classList.add('copied');
					setTimeout(() => {
						span.textContent = orig;
						copyBtn.classList.remove('copied');
					}, 2000);
				}
			} catch (e) {
				copyBtn.textContent = 'Failed';
			}
		});

		// Fullscreen handler
		fullscreenBtn.addEventListener('click', () => {
			openFullscreenDiagram(rawCode, renderedSvg, diagramType);
		});

		// Check for an immediate figcaption or italicized caption paragraph following this block
		const nextElem = pre.nextElementSibling;
		if (nextElem && (nextElem.tagName === 'FIGCAPTION' || (nextElem.tagName === 'P' && nextElem.querySelector('em')))) {
			const captionText = nextElem.textContent?.trim() || '';
			if (captionText) {
				const footer = document.createElement('figcaption');
				footer.className = 'mermaid-diagram-caption';
				footer.textContent = captionText;
				container.appendChild(footer);
				nextElem.remove();
			}
		}

		// Replace pre with interactive container
		pre.parentNode?.replaceChild(container, pre);
	}
}
