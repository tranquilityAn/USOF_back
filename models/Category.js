const BaseModel = require("./BaseModel");

class Category extends BaseModel {
    constructor({ id, title, description = null }) {
        super(id);
        this.title = title;
        this.description = description;
    }

    toJSON() {
        const obj = super.toJSON();
        return {
            id: obj.id,
            title: obj.title,
            description: obj.description,
        };
    }
}

module.exports = Category;

