const jwt = require('jsonwebtoken');

exports.auth = (req, res, next) => {
  let token;

  // 1️. Check Authorization header
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    token = header.split(' ')[1];
  }

  // 2️. Fallback to cookie (if you later store access token there)
  if (!token && req.cookies?.['CK-ACC-T']) {
    token = req.cookies['CK-ACC-T'];
  }

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

exports.adminOnly = (req, res, next) => {
  if (!req.user?.is_admin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};
