import express from 'express';

const router = express.Router();

/**
 * @description setting page
 */
router.get('/admin/settings', async (req, res) => {
  res.render('admin/settings', { title: 'Home Page' });
});

export default router;
