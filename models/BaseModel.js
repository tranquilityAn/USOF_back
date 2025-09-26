export default class BaseModel {
    constructor(id) {
        this.id = id;
    }

    toJSON() {
        return { ...this };
    }
}


