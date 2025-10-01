const { Router } = require('express');
const { HelloController } = require('../controllers/hello.controller');

const helloRouter = Router();
const controller = new HelloController();

helloRouter.get('/hello', (req, res) => controller.getHello(req, res));

module.exports = { helloRouter };
