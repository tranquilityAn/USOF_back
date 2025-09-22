// models/Like.js
const BaseModel = require("./BaseModel");

class Like extends BaseModel {
    constructor({ id, entityId, entityType, userId, type = "like", createdAt = new Date() }) {
        super(id);
        this.entityId = entityId;
        this.entityType = entityType; // 'post' | 'comment'
        this.userId = userId;
        this.type = type; // 'like' | 'dislike'
        this.createdAt = createdAt;
    }

    toJSON() {
        return {
            id: this.id,
            entityId: this.entityId,
            entityType: this.entityType,
            userId: this.userId,
            type: this.type,
            createdAt: this.createdAt,
        };
    }
}

module.exports = Like;
