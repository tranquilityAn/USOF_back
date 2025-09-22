const categoryRepo = require("../repositories/CategoryRepository");

class CategoryService {
    async getAllCategories() {
        return await categoryRepo.findAll();
    }

    async getCategoryById(id) {
        const category = await categoryRepo.findById(id);
        if (!category) throw new Error("Category not found");
        return category;
    }

    async getPostsByCategory(categoryId) {
        const category = await categoryRepo.findById(categoryId);
        if (!category) throw new Error("Category not found");

        return await categoryRepo.findPosts(categoryId);
    }

    async getCategoriesByPost(postId) {
        return await categoryRepo.findCategoriesForPost(postId);
    }

    async createCategory({ title, description }) {
        if (!title) throw new Error("Category title is required");
        return await categoryRepo.create({ title, description });
    }

    async updateCategory(id, fields) {
        const category = await categoryRepo.findById(id);
        if (!category) throw new Error("Category not found");

        return await categoryRepo.update(id, fields);
    }

    async deleteCategory(id) {
        const category = await categoryRepo.findById(id);
        if (!category) throw new Error("Category not found");

        await categoryRepo.delete(id);
        return true;
    }
}

module.exports = new CategoryService();
