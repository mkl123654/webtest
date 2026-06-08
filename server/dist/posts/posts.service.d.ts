import { PrismaService } from '../prisma/prisma.service';
export declare class PostsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAllSections(category?: string): Promise<({
        posts: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            sortOrder: number;
            published: boolean;
            description: string;
            emoji: string;
            badge: string;
            content: string | null;
            images: string | null;
            ratingAvg: number;
            ratingCount: number;
            sectionId: number;
        }[];
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        category: string;
        sortOrder: number;
    })[]>;
    search(q: string, category?: string): Promise<({
        section: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            category: string;
            sortOrder: number;
        };
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        sortOrder: number;
        published: boolean;
        description: string;
        emoji: string;
        badge: string;
        content: string | null;
        images: string | null;
        ratingAvg: number;
        ratingCount: number;
        sectionId: number;
    })[]>;
    createSection(data: {
        title: string;
        category: string;
        sortOrder?: number;
    }): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        category: string;
        sortOrder: number;
    }>;
    updateSection(id: number, data: {
        title?: string;
        category?: string;
        sortOrder?: number;
    }): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        category: string;
        sortOrder: number;
    }>;
    deleteSection(id: number): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        category: string;
        sortOrder: number;
    }>;
    private findSectionOrFail;
    findAllPosts(params: {
        category?: string;
        published?: boolean;
        sectionId?: number;
    }): Promise<({
        section: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            category: string;
            sortOrder: number;
        };
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        sortOrder: number;
        published: boolean;
        description: string;
        emoji: string;
        badge: string;
        content: string | null;
        images: string | null;
        ratingAvg: number;
        ratingCount: number;
        sectionId: number;
    })[]>;
    findPostById(id: number): Promise<{
        section: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            category: string;
            sortOrder: number;
        };
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        sortOrder: number;
        published: boolean;
        description: string;
        emoji: string;
        badge: string;
        content: string | null;
        images: string | null;
        ratingAvg: number;
        ratingCount: number;
        sectionId: number;
    }>;
    findPostDetail(id: number): Promise<{
        comments: any[];
        section: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            category: string;
            sortOrder: number;
        };
        id: number;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        sortOrder: number;
        published: boolean;
        description: string;
        emoji: string;
        badge: string;
        content: string | null;
        images: string | null;
        ratingAvg: number;
        ratingCount: number;
        sectionId: number;
    }>;
    createPost(data: {
        title: string;
        description: string;
        emoji: string;
        badge: string;
        sectionId: number;
        published?: boolean;
        sortOrder?: number;
        content?: string;
        images?: string;
    }): Promise<{
        section: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            category: string;
            sortOrder: number;
        };
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        sortOrder: number;
        published: boolean;
        description: string;
        emoji: string;
        badge: string;
        content: string | null;
        images: string | null;
        ratingAvg: number;
        ratingCount: number;
        sectionId: number;
    }>;
    updatePost(id: number, data: {
        title?: string;
        description?: string;
        emoji?: string;
        badge?: string;
        sectionId?: number;
        published?: boolean;
        sortOrder?: number;
        content?: string;
        images?: string;
    }): Promise<{
        section: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            category: string;
            sortOrder: number;
        };
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        sortOrder: number;
        published: boolean;
        description: string;
        emoji: string;
        badge: string;
        content: string | null;
        images: string | null;
        ratingAvg: number;
        ratingCount: number;
        sectionId: number;
    }>;
    deletePost(id: number): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        sortOrder: number;
        published: boolean;
        description: string;
        emoji: string;
        badge: string;
        content: string | null;
        images: string | null;
        ratingAvg: number;
        ratingCount: number;
        sectionId: number;
    }>;
    togglePublish(id: number): Promise<{
        section: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            category: string;
            sortOrder: number;
        };
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        sortOrder: number;
        published: boolean;
        description: string;
        emoji: string;
        badge: string;
        content: string | null;
        images: string | null;
        ratingAvg: number;
        ratingCount: number;
        sectionId: number;
    }>;
    createComment(postId: number, userId: number, data: {
        content: string;
        parentId?: number;
    }): Promise<{
        user: {
            id: number;
            username: string;
            avatar: string;
        };
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        postId: number;
        userId: number;
        parentId: number | null;
    }>;
    deleteComment(id: number, userId: number): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        postId: number;
        userId: number;
        parentId: number | null;
    }>;
    ratePost(postId: number, userId: number, score: number): Promise<{
        ratingAvg: number;
        ratingCount: number;
    }>;
    getUserRating(postId: number, userId: number): Promise<{
        score: number;
    }>;
    getStats(): Promise<{
        pendingPosts: number;
        publishedPosts: number;
        userCount: number;
    }>;
}
//# sourceMappingURL=posts.service.d.ts.map