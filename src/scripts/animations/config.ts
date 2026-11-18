export const animationConfig = {
	duration: {
		fast: 0.25,
		normal: 0.45,
		slow: 0.65,
	},
	easing: {
		smooth: [0.16, 1, 0.3, 1] as const, // cubic-bezier easing for smooth tech feel
		easeOut: [0.25, 1, 0.5, 1] as const,
		spring: { stiffness: 350, damping: 25 },
	},
	distance: {
		sm: 12,
		md: 24,
		lg: 36,
	},
	stagger: {
		fast: 0.05,
		normal: 0.08,
		cards: 0.1,
	},
};
