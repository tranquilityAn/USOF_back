import BaseModel from './BaseModel.js';

export default class Category extends BaseModel {
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

