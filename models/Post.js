const BaseModel = require("./BaseModel");

class Post extends BaseModel {
    constructor({
        id,
        title,
        content,
        authorId,
        //categories = [],
        publishDate = new Date(),
        //updatedAt = new Date(),
        //likesCount = 0,
    }) {
        super(id);
        this.title = title;
        this.content = content;
        this.authorId = authorId;
        //this.categories = categories; // массив строк или id категорий
        this.publishDate = publishDate;
        //this.updatedAt = updatedAt;
        //this.likesCount = likesCount;
    }

    toJSON() {
        const obj = super.toJSON();
        return {
            id: obj.id,
            title: obj.title,
            content: obj.content,
            authorId: obj.authorId,
            //categories: obj.categories,
            publishDate: obj.publishDate,
            //updatedAt: obj.updatedAt,
            //likesCount: obj.likesCount,
        };
    }
}

module.exports = Post;
