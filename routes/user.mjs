import express from 'express';
import blogSettingsRepository from '../repositories/blogSettingsRepository.mjs';
import articlesRepository from '../repositories/articlesRepository.mjs';

const router = express.Router();

/**
 * @description setting page
 */
router.get('/', async (req, res) => {
  const settings = await blogSettingsRepository.getAllMap();
  const articles = await articlesRepository.getPublished();
  res.render('home', { title: 'Home', settings, articles });
});

export default router;
