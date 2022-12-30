import express from 'express';
import blogSettingsRepository from '../repositories/blogSettingsRepository.mjs';
import articlesRepository from '../repositories/articlesRepository.mjs';
import { param, body, validationResult } from 'express-validator';

const router = express.Router();

/**
 * @description home page
 */
router.get('/', async (req, res) => {
  const settings = await blogSettingsRepository.getAllMap();
  res.render('home', { title: 'Home', settings });
});

/**
 * @description article page
 */
router.get('/article/:slug', param('slug').not().isEmpty(), async (req, res) => {
  // Update article views. Not use session here to make it super simple
  await articlesRepository.viewBySlug(req.params.slug);
  // Get article data
  const article = await articlesRepository.getBySlug(req.params.slug, req.sessionID);
  if (!article) {
    return res.status(404).send();
  }
  const settings = await blogSettingsRepository.getAllMap();
  res.render('article', { title: article.article_title, settings, article });
});

export default router;
