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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminStatsController = exports.AdminPostsController = exports.AdminSectionsController = exports.CommentController = exports.PostsController = exports.SearchController = exports.SectionsController = exports.UploadController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const posts_service_1 = require("./posts.service");
const admin_guard_1 = require("./admin.guard");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
// ===== 图片上传 =====
let UploadController = class UploadController {
    async upload(file) {
        return { url: `/uploads/${file.filename}` };
    }
};
exports.UploadController = UploadController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads',
            filename: (_req, file, cb) => {
                const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
                cb(null, unique + (0, path_1.extname)(file.originalname));
            },
        }),
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
        fileFilter: (_req, file, cb) => {
            if (!file.mimetype.startsWith('image/')) {
                cb(new common_1.BadRequestException('仅支持图片文件'), false);
            }
            else {
                cb(null, true);
            }
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "upload", null);
exports.UploadController = UploadController = __decorate([
    (0, common_1.Controller)('admin/upload'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard)
], UploadController);
// ===== 公开接口（Web 前端使用）=====
let SectionsController = class SectionsController {
    constructor(postsService) {
        this.postsService = postsService;
    }
    async list(category) {
        return this.postsService.findAllSections(category);
    }
};
exports.SectionsController = SectionsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SectionsController.prototype, "list", null);
exports.SectionsController = SectionsController = __decorate([
    (0, common_1.Controller)('sections'),
    __metadata("design:paramtypes", [posts_service_1.PostsService])
], SectionsController);
let SearchController = class SearchController {
    constructor(postsService) {
        this.postsService = postsService;
    }
    async search(q, category) {
        if (!q?.trim())
            return [];
        return this.postsService.search(q, category);
    }
};
exports.SearchController = SearchController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "search", null);
exports.SearchController = SearchController = __decorate([
    (0, common_1.Controller)('search'),
    __metadata("design:paramtypes", [posts_service_1.PostsService])
], SearchController);
let PostsController = class PostsController {
    constructor(postsService) {
        this.postsService = postsService;
    }
    async list(category, published, sectionId) {
        return this.postsService.findAllPosts({
            category,
            published: published === 'true' ? true : published === 'false' ? false : undefined,
            sectionId: sectionId ? parseInt(sectionId) : undefined,
        });
    }
    // ===== 评论（必须在 :id 之前注册，避免路由冲突）=====
    async comments(id) {
        return this.postsService.findPostDetail(id).then((p) => p.comments);
    }
    async createComment(id, req, body) {
        if (!body.content?.trim())
            throw new common_1.BadRequestException('评论内容不能为空');
        return this.postsService.createComment(id, req.user.id, {
            content: body.content.trim(),
            parentId: body.parentId,
        });
    }
    // ===== 评分（必须在 :id 之前）=====
    async rate(id, req, body) {
        return this.postsService.ratePost(id, req.user.id, body.score);
    }
    async getRating(id, req) {
        return this.postsService.getUserRating(id, req.user.id);
    }
    // ===== 详情（:id 必须放最后，否则会拦截上面的子路由）=====
    async getOne(id) {
        return this.postsService.findPostDetail(id);
    }
};
exports.PostsController = PostsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('category')),
    __param(1, (0, common_1.Query)('published')),
    __param(2, (0, common_1.Query)('sectionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id/comments'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "comments", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':id/comments'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "createComment", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':id/rate'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "rate", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(':id/rating'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "getRating", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "getOne", null);
exports.PostsController = PostsController = __decorate([
    (0, common_1.Controller)('posts'),
    __metadata("design:paramtypes", [posts_service_1.PostsService])
], PostsController);
let CommentController = class CommentController {
    constructor(postsService) {
        this.postsService = postsService;
    }
    async delete(id, req) {
        await this.postsService.deleteComment(id, req.user.id);
        return { message: '评论已删除' };
    }
};
exports.CommentController = CommentController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], CommentController.prototype, "delete", null);
exports.CommentController = CommentController = __decorate([
    (0, common_1.Controller)('comments'),
    __metadata("design:paramtypes", [posts_service_1.PostsService])
], CommentController);
// ===== 管理员接口 =====
let AdminSectionsController = class AdminSectionsController {
    constructor(postsService) {
        this.postsService = postsService;
    }
    async create(body) {
        return this.postsService.createSection(body);
    }
    async update(id, body) {
        return this.postsService.updateSection(id, body);
    }
    async delete(id) {
        await this.postsService.deleteSection(id);
        return { message: '栏目已删除' };
    }
};
exports.AdminSectionsController = AdminSectionsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminSectionsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AdminSectionsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminSectionsController.prototype, "delete", null);
exports.AdminSectionsController = AdminSectionsController = __decorate([
    (0, common_1.Controller)('admin/sections'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __metadata("design:paramtypes", [posts_service_1.PostsService])
], AdminSectionsController);
let AdminPostsController = class AdminPostsController {
    constructor(postsService) {
        this.postsService = postsService;
    }
    async list(category, published, sectionId) {
        return this.postsService.findAllPosts({
            category,
            published: published === 'true' ? true : published === 'false' ? false : undefined,
            sectionId: sectionId ? parseInt(sectionId) : undefined,
        });
    }
    async create(body) {
        return this.postsService.createPost(body);
    }
    async update(id, body) {
        return this.postsService.updatePost(id, body);
    }
    async delete(id) {
        await this.postsService.deletePost(id);
        return { message: '卡片已删除' };
    }
    async togglePublish(id) {
        return this.postsService.togglePublish(id);
    }
};
exports.AdminPostsController = AdminPostsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('category')),
    __param(1, (0, common_1.Query)('published')),
    __param(2, (0, common_1.Query)('sectionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminPostsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminPostsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AdminPostsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminPostsController.prototype, "delete", null);
__decorate([
    (0, common_1.Patch)(':id/toggle'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminPostsController.prototype, "togglePublish", null);
exports.AdminPostsController = AdminPostsController = __decorate([
    (0, common_1.Controller)('admin/posts'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __metadata("design:paramtypes", [posts_service_1.PostsService])
], AdminPostsController);
let AdminStatsController = class AdminStatsController {
    constructor(postsService) {
        this.postsService = postsService;
    }
    async get() {
        return this.postsService.getStats();
    }
};
exports.AdminStatsController = AdminStatsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminStatsController.prototype, "get", null);
exports.AdminStatsController = AdminStatsController = __decorate([
    (0, common_1.Controller)('admin/stats'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __metadata("design:paramtypes", [posts_service_1.PostsService])
], AdminStatsController);
//# sourceMappingURL=posts.controller.js.map