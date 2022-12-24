import express from 'express';
import blogSettingsRepository from '../repositories/blogSettingsRepository.mjs';

const router = express.Router();

/**
 * @description setting page
 */
router.get('/', async (req, res) => {
  const settings = await blogSettingsRepository.getAllMap();
  res.render('home', { title: 'Home', settings });
});

export default router;
