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

// cascade: super ⇒ admin ⇒ seller
function normalizeRoles(user = {}) {
  const isSuper = !!user.is_super_admin;
  const isAdmin = !!user.is_admin || isSuper;
  const isSeller = !!user.is_seller || isAdmin; // admins/supers count as seller too
  return { isSuper, isAdmin, isSeller };
}

function requireRole(required) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { isSuper, isAdmin, isSeller } = normalizeRoles(req.user);

    let allowed = false;
    switch (required) {
      case "super_admin":
        allowed = isSuper;
        break;
      case "admin":
        allowed = isAdmin; // includes super
        break;
      case "seller":
        allowed = isSeller; // includes admin/super
        break;
      default:
        allowed = false;
    }

    if (!allowed) {
      const msg =
        required === "super_admin"
          ? "Super Admin access required"
          : required === "admin"
          ? "Admin access required"
          : "Seller access required";
      return res.status(403).json({ message: msg });
    }

    // expose normalized flags if downstream wants them
    req.userRoles = { isSuper, isAdmin, isSeller };
    next();
  };
}

exports.superAdminOnly = requireRole("super_admin");
exports.adminOnly = requireRole("admin");
exports.sellerOnly = requireRole("seller");
