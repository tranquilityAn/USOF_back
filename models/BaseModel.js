class BaseModel {
    constructor(id) {
        this.id = id;
    }

    toJSON() {
        return { ...this };
    }
}

module.exports = BaseModel;
