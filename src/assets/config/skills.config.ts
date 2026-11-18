/**
 * Skills & Technical Focus Configuration
 * Defines core technical competencies, tools, and research domains.
 */

export interface FocusArea {
	id: string;
	title: string;
	description: string;
	badge: string;
	code: string;
	iconName: 'Microscope' | 'Network' | 'Cpu' | 'Server';
}

export interface SkillGroup {
	title: string;
	level: string;
	iconName: 'Shield' | 'Network' | 'Cpu' | 'Server';
	items: string[];
}

export const FOCUS_AREAS: FocusArea[] = [
	{
		id: 'dfir',
		title: 'Digital Forensics & IR',
		description:
			'Investigating memory dumps with Volatility 3, Windows filesystem artifacts with The Sleuth Kit and Autopsy, and reconstructing incident timelines.',
		badge: 'DFIR',
		code: 'DFIR_SHERLOCK',
		iconName: 'Microscope',
	},
	{
		id: 'network',
		title: 'Network Forensics',
		description:
			'Deep-packet inspection with Wireshark/TShark, protocol dissection (RDP, TPKT, DNS), and identifying lateral movement from PCAP captures.',
		badge: 'Network',
		code: 'PCAP_DEEPSEEK',
		iconName: 'Network',
	},
	{
		id: 'systems',
		title: 'Systems & Defensive Tooling',
		description:
			'Low-level and systems programming in Go and C, manual network packet parsing, and developing lightweight defensive utilities.',
		badge: 'Systems',
		code: 'LOW_LEVEL',
		iconName: 'Cpu',
	},
	{
		id: 'devsecops',
		title: 'DevSecOps & Linux',
		description:
			'Infrastructure automation, Linux systems administration (Arch & Debian), Docker containerization, and secure CI/CD pipelines.',
		badge: 'DevOps',
		code: 'CONTAINER_INFRA',
		iconName: 'Server',
	},
];

export const SKILL_GROUPS: SkillGroup[] = [
	{
		title: 'Digital Forensics & Incident Response',
		level: 'Practiced / CTF Labs',
		iconName: 'Shield',
		items: [
			'Volatility 3 (memory triage, process hollowing, VMA/vadinfo)',
			'Autopsy & The Sleuth Kit (filesystem analysis, deleted file recovery)',
			'Windows Forensic Examination (Evtx logs, registry artifacts, prefetch)',
			'Timeline analysis and incident reconstruction',
			'HTB Sherlocks forensic investigations',
		],
	},
	{
		title: 'Network Forensics & Packet Analysis',
		level: 'Practiced / Research',
		iconName: 'Network',
		items: [
			'Wireshark & TShark command-line triage',
			'Custom Lua Proto dissectors for protocol fingerprinting (RDP, TCP/3389)',
			'TCP/IP stack analysis, handshake inspection, protocol behavior',
			'Network flow dissection & suspicious traffic identification',
		],
	},
	{
		title: 'Systems & Programming',
		level: 'Used',
		iconName: 'Cpu',
		items: [
			'Go (network programming, manual DNS packet parsing, concurrency)',
			'C (system programming, memory management, pointers)',
			'Python (forensic automation, scripting, data processing)',
			'TypeScript / JavaScript (backend tooling, bots, web services)',
			'Linux shell scripting (bash/zsh)',
		],
	},
	{
		title: 'Infrastructure & Automation',
		level: 'Used',
		iconName: 'Server',
		items: [
			'Linux environment (daily driver on Arch Linux, Debian servers)',
			'Containers: Docker, Podman, container networking',
			'CI/CD: GitHub Actions, Jenkins, Git workflow automation',
			'Virtualization: QEMU/KVM',
			'Reverse proxy & web servers: Nginx',
		],
	},
];
