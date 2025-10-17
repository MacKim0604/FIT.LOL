const { Router } = require('express');
const { AnalysisController } = require('../controllers/analysis.controller');
const { requireRole } = require('../middlewares/auth');

const analysisRouter = Router();
const controller = new AnalysisController();

// MEMBER+ : Summoner summary
analysisRouter.get('/summoner/:puuid/summary', requireRole('MEMBER'), (req, res) => controller.summonerSummary(req, res));

// LEADER : Global weekly
analysisRouter.get('/global/weekly', requireRole('LEADER'), (req, res) => controller.globalWeekly(req, res));

// LEADER : Generate weekly report (immediate compute)
analysisRouter.post('/report/weekly', requireRole('LEADER'), (req, res) => controller.reportWeekly(req, res));

module.exports = { analysisRouter };
