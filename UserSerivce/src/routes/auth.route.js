const { Router } = require('express');
const { AuthController } = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth');

const authRouter = Router();
const controller = new AuthController();

authRouter.get('/auth/me', authenticate, (req, res) => controller.getMe(req, res));

module.exports = { authRouter };
