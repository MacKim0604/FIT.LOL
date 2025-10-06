const { Router } = require('express');
const { ClanController } = require('../controllers/clan.controller');
const { authenticate, requireRole } = require('../middlewares/auth');

const clanRouter = Router();
const controller = new ClanController();

clanRouter.get('/members', authenticate, requireRole('MEMBER'), (req, res) => controller.listMembers(req, res));
clanRouter.post('/members', authenticate, requireRole('LEADER'), (req, res) => controller.addMember(req, res));
clanRouter.get('/members/:userId', authenticate, requireRole('MEMBER'), (req, res) => controller.getMember(req, res));
clanRouter.delete('/members/:userId', authenticate, requireRole('LEADER'), (req, res) => controller.deleteMember(req, res));

module.exports = { clanRouter };
