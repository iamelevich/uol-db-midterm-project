import express from 'express';
import blogSettingsRepository from '../repositories/blogSettingsRepository.mjs';
import { param, body, validationResult } from 'express-validator';

const router = express.Router();

/**
 * API route to get all blog settings
 */
router.get('/api/blog-settings', async (req, res) => {
  try {
    return res.json(await blogSettingsRepository.getAll());
  } catch (err) {
    req.log.error(err, 'Blog setting error');
    return res.status(500).json({
      message: 'Something goes wrong'
    });
  }
});

/**
 * API route to get blog setting
 *
 * param name - Blog setting name
 */
router.get('/api/blog-setting/:name', param('name').not().isEmpty(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { name } = req.params;
  const setting = await blogSettingsRepository.getByName(name);
  if (setting) {
    return res.json(setting);
  }
  return res.status(404).json({ message: 'Not found' });
});

/**
 * API route to update blog setting
 *
 * param name - Blog setting name
 *
 * body setting_value - New blog setting value
 */
router.put(
  '/api/blog-setting/:name',
  param('name').not().isEmpty(),
  body('setting_value').not().isEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name } = req.params;
    const { setting_value: value } = req.body;
    const isUpdated = await blogSettingsRepository.updateByName(name, value);
    if (isUpdated) {
      return res.json({ updated: true });
    }
    return res.status(404).json({ message: 'Not found' });
  }
);

export default router;
