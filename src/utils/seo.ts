import { AUTHOR, SITE_DESCRIPTION, SITE_TITLE, SOCIAL_LINKS } from '../assets/config';

export interface BreadcrumbItem {
	name: string;
	url: string;
}

export interface ArticleSchemaInput {
	siteUrl: URL;
	pageUrl: string;
	title: string;
	description: string;
	imageUrl: string;
	pubDate: Date;
	updatedDate?: Date;
	category: string;
	tags: string[];
}

export interface CollectionEntryItem {
	name: string;
	url: string;
	description?: string;
}

function resolveOrigin(siteUrl: URL): string {
	return siteUrl.origin;
}

function absoluteUrl(siteUrl: URL, path: string): string {
	return new URL(path, siteUrl).href;
}

export function buildPersonNode(siteUrl: URL, imageUrl?: string): Record<string, unknown> {
	const origin = resolveOrigin(siteUrl);
	const sameAs = [
		SOCIAL_LINKS.github.url,
		SOCIAL_LINKS.linkedin.url,
		SOCIAL_LINKS.hackthebox.url,
	];

	return {
		'@type': 'Person',
		'@id': `${origin}/#person`,
		name: AUTHOR.name,
		alternateName: AUTHOR.fullName,
		url: `${origin}/`,
		...(imageUrl ? { image: imageUrl } : {}),
		description: `${AUTHOR.year} interested in Blue Team, DFIR, network forensics, and DevSecOps.`,
		affiliation: [
			{
				'@type': 'EducationalOrganization',
				name: AUTHOR.university,
			},
			{
				'@type': 'Organization',
				name: AUTHOR.club.name,
				url: AUTHOR.club.url,
			},
		],
		knowsAbout: [
			'Digital Forensics',
			'Incident Response',
			'Network Forensics',
			'Packet Analysis',
			'Detection Engineering',
			'Systems Programming',
			'Linux',
		],
		sameAs,
	};
}

export function buildWebSiteNode(siteUrl: URL): Record<string, unknown> {
	const origin = resolveOrigin(siteUrl);
	return {
		'@type': 'WebSite',
		'@id': `${origin}/#website`,
		url: `${origin}/`,
		name: SITE_TITLE,
		description: SITE_DESCRIPTION,
		inLanguage: 'en',
		publisher: {
			'@id': `${origin}/#person`,
		},
	};
}

export function buildBreadcrumbNode(
	siteUrl: URL,
	pageUrl: string,
	items: BreadcrumbItem[],
): Record<string, unknown> {
	return {
		'@type': 'BreadcrumbList',
		'@id': `${pageUrl}#breadcrumb`,
		itemListElement: items.map((item, idx) => ({
			'@type': 'ListItem',
			position: idx + 1,
			name: item.name,
			item: absoluteUrl(siteUrl, item.url),
		})),
	};
}

export function buildHomeSchema(
	siteUrl: URL,
	pageUrl: string,
	imageUrl: string,
): Record<string, unknown> {
	const origin = resolveOrigin(siteUrl);
	return {
		'@context': 'https://schema.org',
		'@graph': [
			buildWebSiteNode(siteUrl),
			buildPersonNode(siteUrl, imageUrl),
			{
				'@type': 'WebPage',
				'@id': `${pageUrl}#webpage`,
				url: pageUrl,
				name: SITE_TITLE,
				description: SITE_DESCRIPTION,
				inLanguage: 'en',
				isPartOf: { '@id': `${origin}/#website` },
				about: { '@id': `${origin}/#person` },
				primaryImageOfPage: {
					'@type': 'ImageObject',
					url: imageUrl,
				},
			},
		],
	};
}

export function buildProfileSchema(
	siteUrl: URL,
	pageUrl: string,
	title: string,
	description: string,
	imageUrl: string,
): Record<string, unknown> {
	const origin = resolveOrigin(siteUrl);
	return {
		'@context': 'https://schema.org',
		'@graph': [
			buildWebSiteNode(siteUrl),
			buildPersonNode(siteUrl, imageUrl),
			{
				'@type': 'ProfilePage',
				'@id': `${pageUrl}#profilepage`,
				url: pageUrl,
				name: title,
				description,
				inLanguage: 'en',
				isPartOf: { '@id': `${origin}/#website` },
				mainEntity: { '@id': `${origin}/#person` },
				breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
			},
			buildBreadcrumbNode(siteUrl, pageUrl, [
				{ name: 'Home', url: '/' },
				{ name: 'About', url: '/about/' },
			]),
		],
	};
}

export function buildCollectionSchema(
	siteUrl: URL,
	pageUrl: string,
	pageType: 'CollectionPage' | 'Blog',
	title: string,
	description: string,
	items: CollectionEntryItem[],
	breadcrumbs: BreadcrumbItem[],
): Record<string, unknown> {
	const origin = resolveOrigin(siteUrl);
	return {
		'@context': 'https://schema.org',
		'@graph': [
			buildWebSiteNode(siteUrl),
			buildPersonNode(siteUrl),
			{
				'@type': pageType,
				'@id': `${pageUrl}#collection`,
				url: pageUrl,
				name: title,
				description,
				inLanguage: 'en',
				isPartOf: { '@id': `${origin}/#website` },
				author: { '@id': `${origin}/#person` },
				breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
				mainEntity: {
					'@type': 'ItemList',
					itemListElement: items.map((item, idx) => ({
						'@type': 'ListItem',
						position: idx + 1,
						name: item.name,
						url: absoluteUrl(siteUrl, item.url),
						...(item.description ? { description: item.description } : {}),
					})),
				},
			},
			buildBreadcrumbNode(siteUrl, pageUrl, breadcrumbs),
		],
	};
}

export function buildArticleSchema(input: ArticleSchemaInput): Record<string, unknown> {
	const { siteUrl, pageUrl, title, description, imageUrl, pubDate, updatedDate, category, tags } =
		input;
	const origin = resolveOrigin(siteUrl);

	return {
		'@context': 'https://schema.org',
		'@graph': [
			buildWebSiteNode(siteUrl),
			buildPersonNode(siteUrl),
			{
				'@type': 'TechArticle',
				'@id': `${pageUrl}#article`,
				mainEntityOfPage: {
					'@type': 'WebPage',
					'@id': pageUrl,
				},
				headline: title,
				description,
				image: [imageUrl],
				datePublished: pubDate.toISOString(),
				dateModified: (updatedDate ?? pubDate).toISOString(),
				inLanguage: 'en',
				articleSection: category,
				keywords: tags.join(', '),
				author: { '@id': `${origin}/#person` },
				publisher: { '@id': `${origin}/#person` },
				isPartOf: { '@id': `${origin}/#website` },
			},
			buildBreadcrumbNode(siteUrl, pageUrl, [
				{ name: 'Home', url: '/' },
				{ name: 'Blog', url: '/blog/' },
				{ name: title, url: pageUrl },
			]),
		],
	};
}
