const express = require('express');
const router = express.Router();
const helpController = require('../controllers/helpController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.get('/articles', helpController.getAllArticles);
router.get('/:id', helpController.getArticleById);
router.post('/', authMiddleware, adminMiddleware, helpController.createArticle);
router.put('/:id', authMiddleware, adminMiddleware, helpController.updateArticle);
router.delete('/:id', authMiddleware, adminMiddleware, helpController.deleteArticle);

module.exports = router;
