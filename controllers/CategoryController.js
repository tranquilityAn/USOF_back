import CategoryService from '../services/CategoryService.js';

class CategoryController {
    async getAllCategories(req, res, next) {
        try {
            const categories = await CategoryService.getAllCategories();
            res.json(categories.map(c => c.toJSON()));
        } catch (err) {
            next(err);
        }
    }

    async getCategory(req, res, next) {
        try {
            const { category_id } = req.params;
            const category = await CategoryService.getCategoryById(category_id);
            res.json(category.toJSON());
        } catch (err) {
            next(err);
        }
    }

    async getPostsByCategory(req, res, next) {
        try {
            const { category_id } = req.params;
            const posts = await CategoryService.getPostsByCategory(category_id);
            res.json(posts);
        } catch (err) {
            next(err);
        }
    }

    async createCategory(req, res, next) {
        try {
            const { title, description } = req.body;
            const category = await CategoryService.createCategory({ title, description });
            res.status(201).json(category.toJSON());
        } catch (err) {
            next(err);
        }
    }

    async updateCategory(req, res, next) {
        try {
            const { category_id } = req.params;
            const updated = await CategoryService.updateCategory(category_id, req.body);
            res.json(updated.toJSON());
        } catch (err) {
            next(err);
        }
    }

    async deleteCategory(req, res, next) {
        try {
            const { category_id } = req.params;
            await CategoryService.deleteCategory(category_id);
            res.json({ message: "Category deleted successfully" });
        } catch (err) {
            next(err);
        }
    }
}

export default new CategoryController();