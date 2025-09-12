const jwt = require("jsonwebtoken");

exports.auth = (req, res, next) => {
  let token;

  // 1️. Check Authorization header
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    token = header.split(" ")[1];
  }

  // 2️. Fallback to cookie (if you later store access token there)
  if (!token && req.cookies?.["CK-ACC-T"]) {
    token = req.cookies["CK-ACC-T"];
  }

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

exports.allowRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const user = req.user;
    console.log("req.user::", req.user);

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Map roles to a hierarchy level
    const roleHierarchy = {
      seller: 1,
      admin: 2,
      superadmin: 3,
    };
    // Detect user’s role
    let userRole;
    if (user.is_super_admin) userRole = "superadmin";
    else if (user.is_admin) userRole = "admin";
    else if (user.is_seller) userRole = "seller";

    if (!userRole) {
      return res.status(403).json({ message: "No valid role assigned" });
    }

    // Check if user role is in allowed roles
    const userLevel = roleHierarchy[userRole];
    const minRequiredLevel = Math.min(
      ...allowedRoles.map((r) => roleHierarchy[r])
    );

    if (userLevel >= minRequiredLevel) {
      return next();
    }

    return res.status(403).json({ message: "Access denied" });
  };
};
