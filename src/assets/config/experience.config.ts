/**
 * Experience & Timeline Configuration
 * Academic background, club research, and competitive CTF activity.
 */

export interface ExperienceItem {
	title: string;
	organization: string;
	location: string;
	period: string;
	role: string;
	description: string;
	url?: string;
	badge?: string;
}

export const EXPERIENCES: ExperienceItem[] = [
	{
		title: 'Bach Khoa Information Security Club (BKISC)',
		organization: 'BKISC',
		location: 'Ho Chi Minh City, Vietnam',
		period: '2025 - Present',
		role: 'Forensics Team Member',
		description:
			'Active forensics team member at BKISC. Conducting research on network packet captures (PCAP), memory forensics with Volatility 3, protocol reverse engineering, and competing in CTF events.',
		url: 'https://bkisc.com/',
		badge: 'Club / Research',
	},
	{
		title: 'Youth Digital Citizen Challenge (YDCC)',
		organization: 'UEH',
		location: 'Ho Chi Minh City, Vietnam',
		period: '2025',
		role: 'Developer / Technical Advisor',
		description:
			'Advised on system architecture and technology selection, and contributed to software solution development.',
		badge: 'Advisory',
	},
	{
		title: 'Ho Chi Minh City University of Technology (HCMUT)',
		organization: 'HCMUT - VNU-HCM',
		location: 'Ho Chi Minh City, Vietnam',
		period: '2023 - Present',
		role: 'Computer Science Student',
		description:
			'Third-year undergraduate student focusing on System and Network Security, operating systems, and network forensics.',
		badge: 'Education',
	},
];
