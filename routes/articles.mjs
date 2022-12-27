import express from 'express';
import articlesRepository from '../repositories/articlesRepository.mjs';
import { query, validationResult } from 'express-validator';

const router = express.Router();

/**
 * @description returns all articles
 */
router.get(
  '/api/articles',
  query('page').isNumeric().default(1),
  query('pageSize').isNumeric().default(10),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      return res.json(
        await articlesRepository.getAll({
          page: req.query.page,
          pageSize: req.query.pageSize
        })
      );
    } catch (err) {
      req.log.error(err, 'Articles error');
      return res.status(500).json({
        message: 'Something goes wrong'
      });
    }
  }
);

/**
 * @description returns published articles
 */
router.get(
  '/api/articles/published',
  query('page').isNumeric().default(1),
  query('pageSize').isNumeric().default(10),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      return res.json(
        await articlesRepository.getPublished({
          page: req.query.page,
          pageSize: req.query.pageSize
        })
      );
    } catch (err) {
      req.log.error(err, 'Articles error');
      return res.status(500).json({
        message: 'Something goes wrong'
      });
    }
  }
);

export default router;
