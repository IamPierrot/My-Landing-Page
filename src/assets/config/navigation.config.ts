/**
 * Navigation Configuration
 * Global routes, dock links, and switcher state keys.
 */

export type NavigationStyle = 'soc' | 'floating';

export const NAV_STYLE_STORAGE_KEY = 'pierrot-portfolio-nav-style';
export const DEFAULT_NAV_STYLE: NavigationStyle = 'soc';

export interface NavigationItem {
	label: string;
	href: string;
	iconName: 'House' | 'FolderCode' | 'BookOpen' | 'UserRound';
	shortcut?: string;
	badge?: string;
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
	{
		label: 'Home',
		href: '/',
		iconName: 'House',
		shortcut: '1',
	},
	{
		label: 'About',
		href: '/about',
		iconName: 'UserRound',
		shortcut: '2',
	},
	{
		label: 'Projects',
		href: '/projects',
		iconName: 'FolderCode',
		shortcut: '3',
	},
	{
		label: 'Blog',
		href: '/blog',
		iconName: 'BookOpen',
		shortcut: '4',
	},
];

// Alias for existing component compatibility
export const navigationItems = NAVIGATION_ITEMS;
