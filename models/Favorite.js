import BaseModel from './BaseModel.js';

export default class Favorite extends BaseModel {
    constructor({ userId, postId, createdAt = new Date() }) {
        super(undefined);
        this.userId = userId;
        this.postId = postId;
        this.createdAt = createdAt;
    }

    toJSON() {
        return {
            userId: this.userId,
            postId: this.postId,
            createdAt: this.createdAt,
        };
    }
}
