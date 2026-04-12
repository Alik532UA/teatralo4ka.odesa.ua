import { z } from 'zod';

export const NewsItemSchema = z.object({
	id: z.number().int().positive("News ID must be positive"),
	title: z.string().min(3, "Title too short").max(200, "Title too long"),
	date: z.string().min(1, "Date is required"),
	category: z.string().optional().default('General'),
	color: z.string().optional(),
});

export type NewsItem = z.infer<typeof NewsItemSchema>;

export function validateNews(data: unknown[]): NewsItem[] {
	return data.map(item => NewsItemSchema.parse(item));
}
