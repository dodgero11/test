const nodemailer = require('nodemailer');
require('dotenv').config(); // Đảm bảo đã cài dotenv và có file .env

// Cấu hình transporter
const transporter = nodemailer.createTransport({
    service: 'Gmail', // Hoặc SMTP hoặc dịch vụ email khác
    auth: {
        user: process.env.EMAIL_USER, // Email của bạn
        pass: process.env.EMAIL_PASS  // Mật khẩu ứng dụng (App Password)
    }
});

// Kiểm tra kết nối
transporter.verify((error, success) => {
    if (error) {
        console.error('Lỗi cấu hình nodemailer:', error);
    } else {
        console.log('Nodemailer đã sẵn sàng:', success);
    }
});

module.exports = transporter;
