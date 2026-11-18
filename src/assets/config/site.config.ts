/**
 * Site & Owner Configuration
 * Easily update personal details, site metadata, and social links.
 */

export const SITE_TITLE = "Pierrot // Security & Systems";
export const SITE_DESCRIPTION =
	"Personal workspace and research notes of Pierrot — Blue Team, DFIR, network forensics, systems programming, and DevSecOps.";

export const AUTHOR = {
	name: "Pierrot",
	fullName: "Nguyen Tan Phat",
	role: "SOC / DFIR / Security Engineering",
	status: "ACTIVE",
	telemetry: "PCAP • UDP/53 • TCP/3389",
	systems: "DEBIAN • ARCH LINUX • HCMUT",
	location: "Ho Chi Minh City, VN",
	university: "Ho Chi Minh City University of Technology (HCMUT)",
	faculty: "Faculty of Computer Science and Engineering",
	major: "System and Network Security",
	year: "Third-year Computer Science student",
	email: "phatnguyentan836@gmail.com",
	avatar: "/imgs/avatar.jpg",
	defenseBadge: "DEFENSE_LAB",
	club: {
		name: "Bach Khoa Information Security Club (BKISC)",
		shortName: "BKISC",
		role: "Forensics Team Member",
		description:
			"Forensics team member at Ho Chi Minh City University of Technology (HCMUT). Researching network traffic anomalies, packet captures, and memory dump artifacts.",
		url: "https://bkisc.com/",
		logo: "/bkisc-logo.png",
	},
} as const;

export const SOCIAL_LINKS = {
	github: {
		label: "GitHub",
		url: "https://github.com/IamPierrot",
		username: "@IamPierrot",
	},
	linkedin: {
		label: "LinkedIn",
		url: "https://www.linkedin.com/in/phat-nguyen-860660314/",
		username: "phat-nguyen-860660314",
	},
	hackthebox: {
		label: "HackTheBox",
		url: "https://profile.hackthebox.com/profile/01a00367-1bc8-7233-b722-5b8a475191c1",
		username: "IamPierrot",
		handle: "IamPierrot HTB",
		profileId: "01a00367-1bc8-7233-b722-5b8a475191c1",
	},
	email: {
		label: "Email",
		url: "mailto:phatnguyentan836@gmail.com",
		address: "phatnguyentan836@gmail.com",
	},
	rss: {
		label: "RSS",
		url: "/rss.xml",
	},
} as const;

// Backward-compatibility exports
export const AUTHOR_NAME = AUTHOR.name;
export const GITHUB_URL = SOCIAL_LINKS.github.url;
export const LINKEDIN_URL = SOCIAL_LINKS.linkedin.url;
export const HACKTHEBOX_URL = SOCIAL_LINKS.hackthebox.url;
