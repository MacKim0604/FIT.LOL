const { upsertUserFromToken } = require('../store/memory');

class AuthController {
  async getMe(req, res) {
    try {
      const token = req.user;
      const user = upsertUserFromToken(token);
      const roles = token?.realm_access?.roles || [];
      return res.status(200).json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          username: user.username,
          roles,
          oidcSub: user.oidcSub,
        },
      });
    } catch (error) {
      console.error('auth/me error:', error.message);
      return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to resolve user', details: error.message } });
    }
  }
}

module.exports = { AuthController };
