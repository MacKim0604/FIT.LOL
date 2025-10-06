const usersById = new Map();
const usersBySub = new Map();
const membersById = new Map();

function genId(prefix = 'usr') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function upsertUserFromToken(token) {
  const sub = token?.sub;
  if (!sub) throw new Error('Token missing sub');
  let user = usersBySub.get(sub);
  const roles = token?.realm_access?.roles || [];
  const role = roles.includes('LEADER') ? 'LEADER' : 'MEMBER';
  if (!user) {
    user = {
      id: genId('usr'),
      oidcSub: sub,
      provider: 'keycloak',
      email: token?.email || `${sub}@placeholder.local`,
      username: token?.preferred_username || `user_${sub.slice(0, 8)}`,
      role,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    usersById.set(user.id, user);
    usersBySub.set(sub, user);
  } else {
    if (user.role !== role) {
      user.role = role;
      user.updatedAt = new Date().toISOString();
    }
  }
  return user;
}

function getUserById(id) {
  return usersById.get(id) || null;
}

function listMembers() {
  return Array.from(membersById.values());
}

function addMember({ email, username, role = 'MEMBER' }) {
  const id = genId('usr');
  const member = {
    id,
    email: email || null,
    username,
    role,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  membersById.set(id, member);
  return member;
}

function getMember(id) {
  return membersById.get(id) || null;
}

function deleteMember(id) {
  return membersById.delete(id);
}

module.exports = {
  upsertUserFromToken,
  getUserById,
  listMembers,
  addMember,
  getMember,
  deleteMember,
};
