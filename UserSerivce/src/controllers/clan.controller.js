const { listMembers, addMember, getMember, deleteMember } = require('../store/memory');

class ClanController {
  async listMembers(req, res) {
    const members = listMembers();
    return res.status(200).json({ success: true, data: { members, pagination: { page: 1, limit: members.length, total: members.length, totalPages: 1 } } });
  }

  async addMember(req, res) {
    const { email, username, role } = req.body || {};
    if (!username) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'username is required' } });
    }
    const m = addMember({ email, username, role });
    return res.status(201).json({ success: true, data: m });
  }

  async getMember(req, res) {
    const { userId } = req.params;
    const m = getMember(userId);
    if (!m) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Member not found' } });
    return res.status(200).json({ success: true, data: m });
  }

  async deleteMember(req, res) {
    const { userId } = req.params;
    const ok = deleteMember(userId);
    if (!ok) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Member not found' } });
    return res.status(200).json({ success: true, message: 'Member deleted successfully' });
  }
}

module.exports = { ClanController };
