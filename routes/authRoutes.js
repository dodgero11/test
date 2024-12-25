const express = require("express");
const router = express.Router();
const User = require("../models/userModels");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const expressSession = require("express-session");
require("dotenv").config();
const { authenticateToken } = require("../middleware/token");
const nodemailer = require('nodemailer'); // Dùng để gửi email

// Route gốc, chuyển hướng dựa trên trạng thái đăng nhập
router.get("/",authenticateToken(false), (req, res) => {
  const token = req.cookies.token || req.session.token;
  if (!token) {
    return res.redirect("/home");
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.redirect("/home");
    }
    return res.redirect("/home");
  });
});

// Route login
router.get("/login", (req, res) => {
  const token = req.cookies.token || req.session.token;
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (!err) {
        return res.redirect("/home");
      }
    });
  }
  res.render("login", { error: null });
});

// Route register
router.get("/register", (req, res) => {
  const token = req.cookies.token || req.session.token;
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (!err) {
        return res.redirect("/home");
      }
    });
  }
  res.render("register", { error: null });
});

// Route forgot password
router.get("/forgotPassWord", (req, res) => {
  res.render("forgotPassWord", { error: null });
});

// Đăng nhập
router.post("/login", async (req, res) => {
  const { usernameOrEmail, password } = req.body;

  if (!usernameOrEmail || !password) {
    return res.render("login", {
      error: "Vui lòng nhập tên người dùng hoặc email và mật khẩu.",
    });
  }

  try {
    const user = await User.findOne({
      $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
    });

    if (!user) {
      return res.render("login", { error: "Tên người dùng hoặc email không tồn tại." });
    }

    // Kiểm tra xem tài khoản đã được xác thực chưa
    if (!user.isVerified) {
      return res.render("login", { error: "Tài khoản chưa được xác thực. Vui lòng kiểm tra email." });
    }
    
    // So sánh mật khẩu đã nhập với mật khẩu đã mã hóa
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render("login", { error: "Mật khẩu không đúng." });
    }

    // Tạo token và thực hiện đăng nhập
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, { httpOnly: false, maxAge: 3600000 });
    return res.redirect("/home");
  } catch (error) {
    console.error(error);
    return res.render("login", { error: "Lỗi hệ thống khi đăng nhập." });
  }
});


// Thêm hàm gửi email xác thực
const sendVerificationEmail = async (user, req) => {
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
  const verificationLink = `${process.env.APP_URL}/auth/verify-email/${token}`;

  const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Xác thực tài khoản",
      text: `Nhấn vào liên kết sau để xác thực tài khoản của bạn: ${verificationLink}`,
  };

  await transporter.sendMail(mailOptions);
};

// Cập nhật route đăng ký
router.post("/register", async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  if (!username || !email || !password || !confirmPassword) {
    return res.render("register", { error: "Vui lòng điền đầy đủ thông tin." });
  }

  if (password !== confirmPassword) {
    return res.render("register", {
      error: "Mật khẩu và xác thực mật khẩu không trùng khớp.",
    });
  }

  try {
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.render("register", {
        error: "Email hoặc tên người dùng đã được sử dụng.",
      });
    }

    const newUser = new User({
      username,
      email,
      password,
      isVerified:false
    });

    await newUser.save();

    // Gửi email xác thực
    await sendVerificationEmail(newUser, req);

    return res.render("register", { error: null, message: "Email xác thực đã được gửi, vui lòng kiểm tra hộp thư!" });
  } catch (error) {
    console.error(error);
    return res.render("register", { error: "Lỗi hệ thống khi đăng ký." });
  }
});


// Route xác thực email
router.get("/verify-email/:token", async (req, res) => {
  const { token } = req.params;

  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user) {
          return res.status(404).send("Người dùng không tồn tại.");
      }

      if (user.isVerified) {
          return res.send("Tài khoản đã được xác thực trước đó.");
      }

      user.isVerified = true;
      await user.save();

      return res.send("Tài khoản của bạn đã được xác thực thành công!");
  } catch (error) {
      console.error("Lỗi xác thực email:", error);
      return res.status(400).send("Link xác thực không hợp lệ hoặc đã hết hạn.");
  }
});

// Route GET logout
router.get("/logout",authenticateToken(true), (req, res) => {
  res.clearCookie("token");
  req.session.destroy((err) => {
    if (err) {
      console.error("Lỗi khi đăng xuất:", err);
      return res.status(500).render("home", { error: "Lỗi khi đăng xuất." });
    }
    return res.redirect("/home");
  });
});

// Đăng xuất
router.post("/logout",authenticateToken, (req, res) => {
  res.clearCookie("token");
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
  });
  res.redirect("/home");
});


// Hàm tạo chuỗi ngẫu nhiên
function generateRandomString(length) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

router.get("/create-users",authenticateToken, async (req, res) => {
  try {
    const numberOfUsers = req.body.numberOfUsers || 5; // Số lượng người dùng cần tạo (mặc định là 5)
    const createdUsers = [];

    for (let i = 0; i < numberOfUsers; i++) {
      // Tạo dữ liệu ngẫu nhiên
      const username = `user_${generateRandomString(5)}`;
      const email = `${generateRandomString(5)}@example.com`;
      const password = "password123"; // Mặc định password giống nhau (hoặc tạo ngẫu nhiên nếu cần)

      // Kiểm tra xem người dùng đã tồn tại chưa
      const existingUser = await User.findOne({ email });
      if (!existingUser) {
        const newUser = new User({
          username,
          email,
          password: password,
        });

        // Lưu vào cơ sở dữ liệu
        await newUser.save();
        createdUsers.push(newUser);
      }
    }

    res.status(201).json({
      message: `${createdUsers.length} users created successfully!`,
      createdUsers,
    });
  } catch (error) {
    console.error("Error creating users:", error);
    res.status(500).json({ message: "Error creating users", error });
  }
});

const transporter = require('../config/nodemailer'); // Import file config nodemailer

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).send('Email không tồn tại.');
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
        const resetLink = `${process.env.APP_URL}/auth/reset-password/${token}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Đặt lại mật khẩu',
            text: `Nhấn vào đường dẫn sau để đặt lại mật khẩu: ${resetLink}`
        };

        await transporter.sendMail(mailOptions);
        res.status(200).send('Link đặt lại mật khẩu đã được gửi đến email của bạn.');
    } catch (error) {
        console.error('Lỗi gửi email:', error);
        res.status(500).send('Có lỗi xảy ra, vui lòng thử lại sau.');
    }
});


router.get('/reset-password/:token', (req, res) => {
  const { token } = req.params;

  // Kiểm tra token hợp lệ không
  try {
      jwt.verify(token, process.env.JWT_SECRET);
      res.render('resetPassword', { token });
  } catch (error) {
      console.error('Token không hợp lệ:', error);
      res.status(400).send('Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
      return res.status(400).send('Mật khẩu xác nhận không trùng khớp.');
  }

  try {
      // Giải mã token để lấy userId
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId;

      // Tìm người dùng và cập nhật mật khẩu
      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).send('Người dùng không tồn tại.');
      }

      user.password = newPassword; // Ghi đè mật khẩu mới
      await user.save(); // Lưu thay đổi

      res.status(200).send('Mật khẩu đã được cập nhật thành công.');
  } catch (error) {
      console.error('Lỗi khi đặt lại mật khẩu:', error);
      res.status(500).send('Đã xảy ra lỗi, vui lòng thử lại sau.');
  }
});
// Hiện tại
router.get("/register", (req, res) => {
  const token = req.cookies.token || req.session.token;
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (!err) {
        return res.redirect("/home");
      }
    });
  }
  res.render("register", { error: null }); // Thêm cả message: null
});

module.exports = router;
