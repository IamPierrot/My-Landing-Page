# Pierrot's Security Engineering & DFIR Portfolio

Personal portfolio and technical research journal for **Pierrot** ([@IamPierrot](https://github.com/IamPierrot)), focused on Blue Team, DFIR (Digital Forensics & Incident Response), network forensics, system programming, and DevSecOps.

## 🛠️ Stack & Design System

- **Framework**: [Astro](https://astro.build/) v7
- **Language**: TypeScript
- **Styling**: SOC Terminal Design Tokens (`--color-bg: #090D0B`, `--color-accent: #42D392`)
- **Typography**: Inter (Body & Headings) + JetBrains Mono (Code, Badges & Metadata)
- **Content**: Astro Content Collections (`src/content/blog/`) with Zod schema validation
- **Syntax Highlighting**: Shiki (`github-dark-default`)
- **Feeds & SEO**: RSS (`/rss.xml`), Sitemap (`/sitemap-index.xml`), Open Graph & Canonical meta

## 📁 Information Architecture

```text
src/
├── components/
│   ├── BaseHead.astro       # SEO, font preloading, and canonical metadata
│   ├── Footer.astro         # SOC terminal status line, copyright, links
│   ├── FormattedDate.astro  # Accessible date time rendering
│   ├── Header.astro         # Minimal terminal navigation
│   └── HeaderLink.astro     # Route-aware active links
├── content/
│   └── blog/                # Markdown technical articles & write-ups
│       ├── building-dns-blocker-in-go.md
│       ├── rdp-traffic-analysis-lua-dissector.md
│       └── windows-memory-forensics-volatility3.md
├── layouts/
│   └── BlogPost.astro       # High-readability dark article layout
├── pages/
│   ├── index.astro          # Landing page (hero, focus, featured work, recent posts)
│   ├── about.astro          # Education, BKISC affiliation, verified skills
│   ├── projects.astro       # Detailed directory of confirmed projects
│   ├── 404.astro            # Minimalist 404 page
│   └── blog/                # Blog index and slug router
└── styles/
    └── global.css           # SOC Terminal design tokens & global typography
```

## 🧞 Available Commands

All commands are run using `pnpm`:

| Command | Action |
| :--- | :--- |
| `pnpm install` | Install workspace dependencies |
| `pnpm dev` | Start local Astro development server |
| `pnpm build` | Build static production assets to `./dist` |
| `pnpm preview` | Preview production build locally |
| `pnpm astro check` | Run TypeScript & Astro component diagnostics |
