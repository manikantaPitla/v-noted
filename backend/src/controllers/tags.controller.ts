import { Request, Response } from 'express';
import { TagsService } from '../services/tags.service';

export class TagsController {
  static async getTags(req: Request, res: Response) {
    try {
      const tags = await TagsService.getTags(req.userId!);
      return res.json(tags);
    } catch (err) {
      console.error('[tags/get]', err);
      return res.status(500).json({ error: 'Failed to fetch tags' });
    }
  }

  static async createTag(req: Request, res: Response) {
    try {
      const { name } = req.body;
      if (!name?.trim()) return res.status(400).json({ error: 'Tag name is required' });

      const tag = await TagsService.createTag(req.userId!, name);
      return res.status(201).json(tag);
    } catch (err) {
      console.error('[tags/create]', err);
      return res.status(500).json({ error: 'Failed to create tag' });
    }
  }

  static async deleteTag(req: Request, res: Response) {
    try {
      const tagName = req.params.name;
      if (!tagName) return res.status(400).json({ error: 'Invalid tag name' });

      await TagsService.deleteTag(req.userId!, tagName);
      return res.json({ success: true });
    } catch (err) {
      console.error('[tags/delete]', err);
      return res.status(500).json({ error: 'Failed to delete tag' });
    }
  }
}
