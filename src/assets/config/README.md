# Website Content & Configuration Hub

All configurable content for this portfolio and technical journal is centralized in this directory (`assets/config` / `src/assets/config`).

## Configuration Files

| File | Purpose |
| :--- | :--- |
| **`site.config.ts`** | Site title, description, author info, email, and social profiles (GitHub, LinkedIn, HackTheBox). |
| **`projects.config.ts`** | Verified projects, Hack The Box Sherlocks, CTF investigations, and tools. |
| **`skills.config.ts`** | Technical focus areas displayed on the homepage and skill categories on the About page. |
| **`experience.config.ts`** | Academic background, club research (BKISC), and timeline milestones. |
| **`navigation.config.ts`** | Header and floating dock navigation routes. |

## Quick How-To

### 1. Updating Social Links or Profiles
Edit [`site.config.ts`](./site.config.ts):
```ts
export const SOCIAL_LINKS = {
  hackthebox: {
    label: "HackTheBox",
    url: "https://profile.hackthebox.com/profile/01a00367-1bc8-7233-b722-5b8a475191c1",
    username: "IamPierrot",
    handle: "IamPierrot HTB"
  },
  ...
};
```

### 2. Adding / Modifying Projects
Edit [`projects.config.ts`](./projects.config.ts):
```ts
export const PROJECTS: ProjectItem[] = [
  {
    id: "htb-sherlocks-dfir",
    title: "HTB Sherlocks: Digital Forensics & Incident Response",
    category: "Digital Forensics",
    status: "Active",
    tags: ["Volatility 3", "Windows Evtx", "DFIR"],
    ...
  }
];
```

### 3. Adding Skills or Focus Areas
Edit [`skills.config.ts`](./skills.config.ts) to update items displayed across the homepage and about page.
