import { PostsService } from './posts.service';
export declare class UploadController {
    upload(file: Express.Multer.File): Promise<{
        url: string;
    }>;
}
export declare class SectionsController {
    private postsService;
    constructor(postsService: PostsService);
    list(category?: string): Promise<({
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
}
export declare class SearchController {
    private postsService;
    constructor(postsService: PostsService);
    search(q?: string, category?: string): Promise<({
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
}
export declare class PostsController {
    private postsService;
    constructor(postsService: PostsService);
    list(category?: string, published?: string, sectionId?: string): Promise<({
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
    comments(id: number): Promise<any[]>;
    createComment(id: number, req: any, body: {
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
    rate(id: number, req: any, body: {
        score: number;
    }): Promise<{
        ratingAvg: number;
        ratingCount: number;
    }>;
    getRating(id: number, req: any): Promise<{
        score: number;
    }>;
    getOne(id: number): Promise<{
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
}
export declare class CommentController {
    private postsService;
    constructor(postsService: PostsService);
    delete(id: number, req: any): Promise<{
        message: string;
    }>;
}
export declare class AdminSectionsController {
    private postsService;
    constructor(postsService: PostsService);
    create(body: {
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
    update(id: number, body: {
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
    delete(id: number): Promise<{
        message: string;
    }>;
}
export declare class AdminPostsController {
    private postsService;
    constructor(postsService: PostsService);
    list(category?: string, published?: string, sectionId?: string): Promise<({
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
    create(body: {
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
    update(id: number, body: {
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
    delete(id: number): Promise<{
        message: string;
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
}
export declare class AdminStatsController {
    private postsService;
    constructor(postsService: PostsService);
    get(): Promise<{
        pendingPosts: number;
        publishedPosts: number;
        userCount: number;
    }>;
}
//# sourceMappingURL=posts.controller.d.ts.map