import express from 'express';
import commentsRepository from '../repositories/commentsRepository.mjs';
import { param, body, validationResult } from 'express-validator';

const router = express.Router();

/**
 * API route to get all article comments
 *
 * param article_id - Article ID from DB
 */
router.get('/api/comments/:article_id', param('article_id').isNumeric().not().isEmpty(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    return res.json(await commentsRepository.getForArticle(req.params.article_id));
  } catch (err) {
    req.log.error(err, 'Comments error');
    return res.status(500).json({
      message: 'Something goes wrong'
    });
  }
});

/**
 * API route to post an article comment
 *
 * param article_id - Article ID from DB
 */
router.post(
  '/api/comments/:article_id',
  param('article_id').isNumeric().not().isEmpty(),
  body('text').not().isEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      return res.json(await commentsRepository.create(req.params.article_id, req.body.text));
    } catch (err) {
      req.log.error(err, 'Comments error');
      return res.status(500).json({
        message: 'Something goes wrong'
      });
    }
  }
);

export default router;
