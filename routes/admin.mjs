import express from 'express';
import blogSettingsRepository from '../repositories/blogSettingsRepository.mjs';
import tagsRepository from '../repositories/tagsRepository.mjs';

const router = express.Router();

/**
 * @description admin page
 */
router.get('/admin', async (req, res) => {
  const settings = await blogSettingsRepository.getAllMap();
  res.render('admin/admin', { title: 'Admin', settings });
});

/**
 * @description create draft page
 */
router.get('/admin/draft', async (req, res) => {
  const settings = await blogSettingsRepository.getAllMap();
  const tags = await tagsRepository.getAll();
  res.render('admin/draft', { title: 'Create Draft', settings, tags });
});

/**
 * @description setting page
 */
router.get('/admin/settings', async (req, res) => {
  const settings = await blogSettingsRepository.getAllMap();
  res.render('admin/settings', { title: 'Settings', settings });
});

export default router;
