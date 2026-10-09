const express = require('express');
const router = express.Router();
const helpController = require('../controllers/helpController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const validate = require('../middleware/validate');
const { createArticleSchema, updateArticleSchema } = require('../validations/helpValidation');
const { objectIdParamSchema } = require('../validations/commonValidation');

const validId = validate(objectIdParamSchema, 'params');

router.get('/articles', helpController.getAllArticles);
router.get('/:id', validId, helpController.getArticleById);
router.post('/', authMiddleware, adminMiddleware, validate(createArticleSchema), helpController.createArticle);
router.put('/:id', authMiddleware, adminMiddleware, validId, validate(updateArticleSchema), helpController.updateArticle);
router.delete('/:id', authMiddleware, adminMiddleware, validId, helpController.deleteArticle);

module.exports = router;
