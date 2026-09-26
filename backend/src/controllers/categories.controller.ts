import { Request, Response } from 'express';
import { CategoriesService } from '../services/categories.service';

export class CategoriesController {
  static async getCategories(req: Request, res: Response) {
    try {
      const categories = await CategoriesService.getCategories(req.userId!);
      return res.json(categories);
    } catch (err) {
      console.error('[categories/get]', err);
      return res.status(500).json({ error: 'Failed to fetch categories' });
    }
  }

  static async createCategory(req: Request, res: Response) {
    try {
      const { name, color } = req.body;
      if (!name?.trim()) return res.status(400).json({ error: 'Category name is required' });

      const category = await CategoriesService.createCategory(req.userId!, name, color);
      return res.status(201).json(category);
    } catch (err) {
      console.error('[categories/create]', err);
      return res.status(500).json({ error: 'Failed to create category' });
    }
  }

  static async updateCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updated = await CategoriesService.updateCategory(req.userId!, id, req.body);
      
      if (!updated) return res.status(404).json({ error: 'Category not found' });
      return res.json(updated);
    } catch (err) {
      console.error('[categories/update]', err);
      return res.status(500).json({ error: 'Failed to update category' });
    }
  }

  static async deleteCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const success = await CategoriesService.deleteCategory(req.userId!, id);
      
      if (!success) return res.status(404).json({ error: 'Category not found' });
      return res.json({ success: true });
    } catch (err) {
      console.error('[categories/delete]', err);
      return res.status(500).json({ error: 'Failed to delete category' });
    }
  }
}
