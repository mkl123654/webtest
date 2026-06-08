"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PostsService = class PostsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    // ========== Sections ==========
    async findAllSections(category) {
        return this.prisma.section.findMany({
            where: category ? { category } : undefined,
            orderBy: { sortOrder: 'asc' },
            include: {
                posts: {
                    where: { published: true },
                    orderBy: { sortOrder: 'asc' },
                },
            },
        });
    }
    async search(q, category) {
        const kw = q?.trim();
        if (!kw)
            return [];
        return this.prisma.post.findMany({
            where: {
                published: true,
                ...(category ? { section: { category } } : {}),
                OR: [
                    { title: { contains: kw } },
                    { description: { contains: kw } },
                ],
            },
            orderBy: { sortOrder: 'asc' },
            include: { section: true },
        });
    }
    async createSection(data) {
        return this.prisma.section.create({ data });
    }
    async updateSection(id, data) {
        await this.findSectionOrFail(id);
        return this.prisma.section.update({ where: { id }, data });
    }
    async deleteSection(id) {
        await this.findSectionOrFail(id);
        return this.prisma.section.delete({ where: { id } });
    }
    async findSectionOrFail(id) {
        const section = await this.prisma.section.findUnique({ where: { id } });
        if (!section)
            throw new common_1.NotFoundException('栏目不存在');
        return section;
    }
    // ========== Posts ==========
    async findAllPosts(params) {
        const where = {};
        if (params.published !== undefined)
            where.published = params.published;
        if (params.sectionId)
            where.sectionId = params.sectionId;
        if (params.category)
            where.section = { category: params.category };
        return this.prisma.post.findMany({
            where,
            orderBy: { sortOrder: 'asc' },
            include: { section: true },
        });
    }
    async findPostById(id) {
        const post = await this.prisma.post.findUnique({
            where: { id },
            include: { section: true },
        });
        if (!post)
            throw new common_1.NotFoundException('卡片不存在');
        return post;
    }
    async findPostDetail(id) {
        const post = await this.prisma.post.findUnique({
            where: { id },
            include: {
                section: true,
                comments: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                        user: { select: { id: true, username: true, avatar: true } },
                    },
                },
            },
        });
        if (!post)
            throw new common_1.NotFoundException('卡片不存在');
        // Build comment tree
        const commentMap = new Map();
        const roots = [];
        for (const c of post.comments) {
            commentMap.set(c.id, { ...c, replies: [] });
        }
        for (const c of commentMap.values()) {
            if (c.parentId && commentMap.has(c.parentId)) {
                commentMap.get(c.parentId).replies.push(c);
            }
            else {
                roots.push(c);
            }
        }
        const { comments, ...postData } = post;
        return { ...postData, comments: roots };
    }
    async createPost(data) {
        return this.prisma.post.create({
            data,
            include: { section: true },
        });
    }
    async updatePost(id, data) {
        await this.findPostById(id);
        return this.prisma.post.update({
            where: { id },
            data,
            include: { section: true },
        });
    }
    async deletePost(id) {
        await this.findPostById(id);
        return this.prisma.post.delete({ where: { id } });
    }
    async togglePublish(id) {
        const post = await this.findPostById(id);
        return this.prisma.post.update({
            where: { id },
            data: { published: !post.published },
            include: { section: true },
        });
    }
    // ========== Comments ==========
    async createComment(postId, userId, data) {
        await this.findPostById(postId);
        if (data.parentId) {
            const parent = await this.prisma.comment.findUnique({ where: { id: data.parentId } });
            if (!parent || parent.postId !== postId)
                throw new common_1.NotFoundException('父评论不存在');
        }
        return this.prisma.comment.create({
            data: { content: data.content, postId, userId, parentId: data.parentId || null },
            include: { user: { select: { id: true, username: true, avatar: true } } },
        });
    }
    async deleteComment(id, userId) {
        const comment = await this.prisma.comment.findUnique({ where: { id } });
        if (!comment)
            throw new common_1.NotFoundException('评论不存在');
        if (comment.userId !== userId)
            throw new common_1.ForbiddenException('只能删除自己的评论');
        return this.prisma.comment.delete({ where: { id } });
    }
    // ========== Ratings ==========
    async ratePost(postId, userId, score) {
        if (score < 1 || score > 5 || !Number.isInteger(score)) {
            throw new common_1.ForbiddenException('评分必须在 1-5 之间');
        }
        await this.findPostById(postId);
        await this.prisma.rating.upsert({
            where: { postId_userId: { postId, userId } },
            create: { postId, userId, score },
            update: { score },
        });
        // Recalculate average
        const agg = await this.prisma.rating.aggregate({
            where: { postId },
            _avg: { score: true },
            _count: true,
        });
        await this.prisma.post.update({
            where: { id: postId },
            data: {
                ratingAvg: agg._avg.score || 0,
                ratingCount: agg._count,
            },
        });
        return { ratingAvg: agg._avg.score || 0, ratingCount: agg._count };
    }
    async getUserRating(postId, userId) {
        const rating = await this.prisma.rating.findUnique({
            where: { postId_userId: { postId, userId } },
        });
        return rating ? { score: rating.score } : { score: 0 };
    }
    // ========== Stats ==========
    async getStats() {
        const [pendingPosts, publishedPosts, userCount] = await Promise.all([
            this.prisma.post.count({ where: { published: false } }),
            this.prisma.post.count({ where: { published: true } }),
            this.prisma.user.count(),
        ]);
        return { pendingPosts, publishedPosts, userCount };
    }
};
exports.PostsService = PostsService;
exports.PostsService = PostsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PostsService);
//# sourceMappingURL=posts.service.js.map