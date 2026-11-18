/**
 * Projects Configuration
 * Centralized registry for all projects and CTF investigations.
 */

import { HACKTHEBOX_URL } from './site.config';

export interface ProjectItem {
	id: string;
	title: string;
	summary: string;
	description?: string;
	category: string;
	status: string;
	tags: string[];
	tools: string[];
	contribution: string;
	approach: string;
	lessons: string;
	demoUrl?: string;
	repoUrl?: string;
	htbProfileUrl?: string;
	featured?: boolean;
}

export const PROJECTS: ProjectItem[] = [
	{
		id: 'htb-sherlocks-dfir',
		title: 'HTB Sherlocks: Digital Forensics & Incident Response',
		summary:
			'Practical forensic investigations reconstructing adversary intrusion chains from volatile memory dumps, event logs, and disk artifacts across Hack The Box Sherlocks.',
		description:
			'Practical forensic investigations reconstructing adversary intrusion timelines, unbacked VMA process hollowing, and Windows event artifacts from Hack The Box Sherlocks.',
		category: 'Digital Forensics',
		status: 'Active',
		tags: ['Volatility 3', 'Windows Evtx', 'Virus Total', 'DFIR', 'MFT'],
		tools: [
			'Volatility 3',
			'Autopsy',
			'The Sleuth Kit',
			'Eric Zimmerman Tools',
			'Wireshark',
			'FTK Imager',
		],
		contribution:
			'Performed memory triage with Volatility 3, reconstructed attacker execution timelines from MFT and Prefetch artifacts, and traced lateral movement pathways.',
		approach:
			'Analyzed suspicious Virtual Memory Address (VMA) regions using vadinfo and malfind, extracted injected shellcode payloads, and correlated timestamps across Windows Security Evtx logs.',
		lessons:
			'Volatile artifacts capture ephemeral attacker state that leaves zero footprint on disk; cross-referencing memory state with event logs validates detection fidelity.',
		demoUrl: 'https://app.hackthebox.com/sherlocks',
		htbProfileUrl: HACKTHEBOX_URL,
		featured: true,
	},
];

export const PROJECT_CATEGORIES = Array.from(new Set(PROJECTS.map((p) => p.category)));
export const PROJECT_TOOLS = Array.from(new Set(PROJECTS.flatMap((p) => p.tools))).sort();
export const PROJECT_STATUSES = Array.from(new Set(PROJECTS.map((p) => p.status)));
