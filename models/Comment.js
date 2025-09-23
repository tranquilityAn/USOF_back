const BaseModel = require("./BaseModel");

class Comment extends BaseModel {
    constructor({
        id,
        postId,
        authorId,
        content,
        publishDate = new Date(),
        updatedAt = new Date(),
    }) {
        super(id);
        this.postId = postId;
        this.authorId = authorId;
        this.content = content;
        this.publishDate = publishDate;
        this.updatedAt = updatedAt;
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
        };
    }
}

module.exports = Comment;
