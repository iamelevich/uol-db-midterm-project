import express from 'express';
import articlesRepository from '../repositories/articlesRepository.mjs';
import { query, param, body, validationResult } from 'express-validator';

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
        await articlesRepository.getPublished(req.sessionID, {
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
 * @description delete article
 */
router.post(
  '/api/articles/draft',
  body('article_title').custom((value) => {
    if (!value) {
      throw new Error("Title shouldn't be empty!");
    }
    return true;
  }),
  body('article_subtitle').custom((value) => {
    if (!value) {
      throw new Error("Subtitle shouldn't be empty!");
    }
    return true;
  }),
  body('article_text').custom((value) => {
    if (!value) {
      throw new Error("Text shouldn't be empty!");
    }
    return true;
  }),
  body('article_url').custom(async (value) => {
    if (!value) {
      throw new Error("Url shouldn't be empty!");
    }
    if (!(await articlesRepository.isUrlUnique(value))) {
      throw new Error('Url should be unique');
    }
    return true;
  }),
  body('tags').isArray(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { tags, ...article } = req.body;
      return res.json({
        success: await articlesRepository.create(article, tags)
      });
    } catch (err) {
      req.log.error(err, `Article(${JSON.stringify(req.body)}) creating error`);
      return res.status(500).json({
        message: 'Something went wrong'
      });
    }
  }
);

/**
 * @description update article
 */
router.put(
  '/api/articles/:article_id',
  param('article_id').isNumeric().not().isEmpty(),
  body('article_title').custom((value) => {
    if (!value) {
      throw new Error("Title shouldn't be empty!");
    }
    return true;
  }),
  body('article_subtitle').custom((value) => {
    if (!value) {
      throw new Error("Subtitle shouldn't be empty!");
    }
    return true;
  }),
  body('article_text').custom((value) => {
    if (!value) {
      throw new Error("Text shouldn't be empty!");
    }
    return true;
  }),
  body('article_url').custom(async (value, { req }) => {
    if (!value) {
      throw new Error("Url shouldn't be empty!");
    }
    if (!(await articlesRepository.isUrlUnique(value, req.params.article_id))) {
      throw new Error('Url should be unique');
    }
    return true;
  }),
  body('tags').isArray(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      return res.json({
        success: await articlesRepository.update({
          article_id: req.params.article_id,
          article_title: req.body.article_title,
          article_subtitle: req.body.article_subtitle,
          article_text: req.body.article_text,
          article_url: req.body.article_url,
          tag_ids: req.body.tags
        })
      });
    } catch (err) {
      req.log.error(
        {
          err,
          body: req.body,
          params: req.params
        },
        `Article updating error`
      );
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

/**
 * @description like article
 */
router.put(
  '/api/articles/:article_id/like',
  param('article_id').isNumeric().not().isEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      return res.json({
        success: await articlesRepository.like(req.params.article_id, req.sessionID)
      });
    } catch (err) {
      req.log.error(
        {
          err
        },
        `Article like error`
      );
      return res.status(500).json({
        message: 'Something went wrong'
      });
    }
  }
);

/**
 * @description unlike article
 */
router.put(
  '/api/articles/:article_id/unlike',
  param('article_id').isNumeric().not().isEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      return res.json({
        success: await articlesRepository.unlike(req.params.article_id, req.sessionID)
      });
    } catch (err) {
      req.log.error(
        {
          err
        },
        `Article unlike error`
      );
      return res.status(500).json({
        message: 'Something went wrong'
      });
    }
  }
);

export default router;
