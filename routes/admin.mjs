import express from 'express';
import articlesRepository from '../repositories/articlesRepository.mjs';
import blogSettingsRepository from '../repositories/blogSettingsRepository.mjs';
import tagsRepository from '../repositories/tagsRepository.mjs';

const router = express.Router();

/**
 * Admin page
 * Renders admin/admin.ejs file
 */
router.get('/admin', async (req, res) => {
  const settings = await blogSettingsRepository.getAllMap();
  res.render('admin/admin', { title: 'Admin', settings });
});

/**
 * Create draft article page
 * Renders admin/draft.ejs file
 */
router.get('/admin/draft', async (req, res) => {
  const settings = await blogSettingsRepository.getAllMap();
  const tags = await tagsRepository.getAll();
  res.render('admin/draft', { title: 'Create Draft', settings, tags });
});

/**
 * Edit article page
 * Renders admin/draft.ejs file
 *
 * param article_id - Article ID from DB
 */
router.get('/admin/edit/:article_id', async (req, res) => {
  const article = await articlesRepository.getByIdForEdit(req.params.article_id);
  if (!article) {
    return res.status(404).send();
  }
  const settings = await blogSettingsRepository.getAllMap();
  const tags = await tagsRepository.getAll();
  res.render('admin/draft', { title: 'Create Draft', settings, tags, article });
});

/**
 * Settings page
 * Renders admin/settings.ejs file
 */
router.get('/admin/settings', async (req, res) => {
  const settings = await blogSettingsRepository.getAllMap();
  res.render('admin/settings', { title: 'Settings', settings });
});

export default router;
