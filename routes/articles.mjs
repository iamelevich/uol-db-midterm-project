import express from 'express';
import articlesRepository from '../repositories/articlesRepository.mjs';
import { param, body, validationResult } from 'express-validator';

const router = express.Router();

/**
 * @description returns all articles
 */
router.get('/api/articles', async (req, res) => {
  try {
    return res.json(await blogSettingsRepository.getAll());
  } catch (err) {
    req.log.error(err, 'Articles error');
    return res.status(500).json({
      message: 'Something goes wrong'
    });
  }
});

/**
 * @description returns published articles
 */
router.get('/api/articles/published', async (req, res) => {
  try {
    return res.json(await blogSettingsRepository.getPublished());
  } catch (err) {
    req.log.error(err, 'Articles error');
    return res.status(500).json({
      message: 'Something goes wrong'
    });
  }
});

export default router;
