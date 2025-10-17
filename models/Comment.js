import BaseModel from './BaseModel.js';

export default class Comment extends BaseModel {
    constructor({
        id,
        postId,
        authorId,
        content,
        publishDate = new Date(),
        updatedAt = new Date(),
        locked,
        parentId = null,
        replyCount = undefined,
    }) {
        super(id);
        this.postId = postId;
        this.authorId = authorId;
        this.content = content;
        this.publishDate = publishDate;
        this.updatedAt = updatedAt;
        this.locked = !!locked;
        this.parentId = parentId;
        this.replyCount = replyCount;
    }

    toJSON() {
        const obj = super.toJSON();
        return {
            id: obj.id,
            postId: obj.postId,
            authorId: obj.authorId,
            content: obj.content,
            publishDate: obj.publishDate,
            updatedAt: obj.updatedAt,
            locked: obj.locked,
            parentId: obj.parentId,
            ...(obj.replyCount !== undefined ? { replyCount: obj.replyCount } : {}),
        };
    }
}
