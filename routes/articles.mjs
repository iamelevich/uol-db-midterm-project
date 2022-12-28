import express from 'express';
import articlesRepository from '../repositories/articlesRepository.mjs';
import { query, param, validationResult } from 'express-validator';

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
        message: 'Something went wrong'
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
        message: 'Something went wrong'
      });
    }
  }
);

/**
 * @description delete article
 */
router.delete(
  '/api/articles/:article_id',
  param('article_id').isNumeric().not().isEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      return res.json({
        success: await articlesRepository.delete(req.params.article_id)
      });
    } catch (err) {
      req.log.error(err, `Article(ID: ${req.params.article_id}) deleting error`);
      return res.status(500).json({
        message: 'Something went wrong'
      });
    }
  }
);

/**
 * @description publish article
 */
router.put(
  '/api/articles/:article_id/publish',
  param('article_id').isNumeric().not().isEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      return res.json({
        success: await articlesRepository.publish(req.params.article_id)
      });
    } catch (err) {
      req.log.error(err, `Article(ID: ${req.params.article_id}) publishing error`);
      return res.status(500).json({
        message: 'Something went wrong'
      });
    }
  }
);

/**
 * @description unpublish article
 */
router.put(
  '/api/articles/:article_id/unpublish',
  param('article_id').isNumeric().not().isEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      return res.json({
        success: await articlesRepository.unpublish(req.params.article_id)
      });
    } catch (err) {
      req.log.error(err, `Article(ID: ${req.params.article_id}) unpublishing error`);
      return res.status(500).json({
        message: 'Something went wrong'
      });
    }
  }
);

export default router;
