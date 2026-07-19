
import {z} from 'zod';

export const postsUploadSchema = z.object({
    content: z.string().min(1),
    classId: z.string().min(1),
})

export const updatePostSchema = z.object({
    content: z.string().min(1).optional(),
    attachments: z.array(z.string()).optional(),
})