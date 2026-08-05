import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const proyectos = defineCollection({
	loader: glob({ pattern: '*.md', base: './src/content/proyectos' }),
	schema: z.object({
		title: z.string(),
		category: z.enum(['fotografia', 'ilustracion']),
		order: z.number(),
		meta: z.string().optional(),
		perImageCaptions: z.boolean().optional(),
		links: z
			.array(
				z.object({
					label: z.string(),
					url: z.string().url(),
				}),
			)
			.optional(),
	}),
});

export const collections = { proyectos };
