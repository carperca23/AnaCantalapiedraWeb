import type { ImageMetadata } from 'astro';

const allImages = import.meta.glob<{ default: ImageMetadata }>(
	'/src/assets/proyectos/*/*.{jpg,jpeg,png}',
	{ eager: true },
);

export interface ProjectImage {
	src: ImageMetadata;
	caption?: string;
}

function humanize(stem: string): string {
	return stem.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getProjectImages(slug: string, perImageCaptions = false): ProjectImage[] {
	const entries = Object.entries(allImages)
		.filter(([path]) => path.includes(`/proyectos/${slug}/`))
		.sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));

	return entries.map(([path, mod]) => {
		const stem = path.split('/').pop()!.replace(/\.[^.]+$/, '');
		return {
			src: mod.default,
			caption: perImageCaptions ? humanize(stem) : undefined,
		};
	});
}

export function getProjectCover(slug: string): ImageMetadata | undefined {
	return getProjectImages(slug)[0]?.src;
}
