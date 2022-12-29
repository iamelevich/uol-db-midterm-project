import express from 'express';
import blogSettingsRepository from '../repositories/blogSettingsRepository.mjs';

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
  res.render('admin/draft', { title: 'Create Draft', settings });
});

/**
 * @description setting page
 */
router.get('/admin/settings', async (req, res) => {
  const settings = await blogSettingsRepository.getAllMap();
  res.render('admin/settings', { title: 'Settings', settings });
});

export default router;
