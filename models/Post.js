import BaseModel from './BaseModel.js';

export default class Post extends BaseModel {
    constructor({
        id,
        title,
        content,
        authorId,
        publishDate = new Date(),
        //updatedAt = new Date(),
        status = 'active',
        lockedByAuthor,
        commentsCount = 0,
    }) {
        super(id);
        this.title = title;
        this.content = content;
        this.authorId = authorId;
        this.publishDate = publishDate;
        //this.updatedAt = updatedAt;
        this.status = status;
        this.lockedByAuthor = !!lockedByAuthor;
        this.commentsCount = commentsCount;
    }

    toJSON() {
        const obj = super.toJSON();
        return {
            id: obj.id,
            title: obj.title,
            content: obj.content,
            authorId: obj.authorId,
            publishDate: obj.publishDate,
            //updatedAt: obj.updatedAt,
            status: this.status,
            lockedByAuthor: obj.lockedByAuthor,
            commentsCount: obj.commentsCount,
        };
    }
}

