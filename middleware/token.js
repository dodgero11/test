const jwt = require("jsonwebtoken");
const User = require("../models/userModels"); // Import User model
require("dotenv").config(); // Đảm bảo bạn đã cấu hình biến môi trường trong .env

const authenticateToken = (redirectOnFail = true) => {
  return async (req, res, next) => {
    const token =
      req.cookies.token || req.headers["authorization"]?.split(" ")[1];

    if (!token) {
      if (redirectOnFail) {
        return res.redirect("/home");
      } else {
        req.user = null; // Không có token, trạng thái là khách
        return next();
      }
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (!user) {
        if (redirectOnFail) {
          return res.redirect("/home");
        } else {
          req.user = null;
          return next();
        }
      }

      req.user = user;
      res.locals.user = user;
      next();
    } catch (error) {
      if (redirectOnFail) {
        return res.redirect("/home");
      } else {
        req.user = null;
        next();
      }
    }
  };
};

module.exports = { authenticateToken};
