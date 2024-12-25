const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
require('dotenv').config();
const cookieParser = require('cookie-parser');
const cors = require('cors');
const app = express();


app.use(cors({
    origin: 'http://localhost:3000',  // Địa chỉ của frontend
    credentials: true,  // Cho phép gửi cookie
}));


// Kiểm tra biến môi trường quan trọng
if (!process.env.MONGO_URI || !process.env.PORT || !process.env.SESSION_SECRET) {
    console.error("Các biến môi trường quan trọng thiếu!");
    process.exit(1);  // Dừng ứng dụng nếu các biến môi trường không có giá trị
}
app.use(cookieParser());


app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key',  // Thay đổi key bảo mật
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }  // Nếu bạn đang dùng HTTP không an toàn, set secure: false
}));

// Middleware để parse dữ liệu gửi lên
app.use(express.json());  // Sử dụng Express's built-in JSON parser
app.use(express.urlencoded({ extended: true }));  // URL-encoded middleware



// Import các route
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/auth', authRoutes);
// Thiết lập EJS làm view engine và thư mục views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Thiết lập thư mục chứa các file tĩnh (CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Sử dụng các route từ các file riêng biệt
app.use(authRoutes);  
app.use(postRoutes);  
app.use(userRoutes);






// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,  // Thời gian chờ kết nối
    socketTimeoutMS: 45000,  // Thời gian chờ khi không có dữ liệu từ MongoDB
}).then(() => {
    console.log('MongoDB connected');
}).catch((err) => {
    console.log('MongoDB connection error:', err);
    process.exit(1);  // Dừng ứng dụng nếu không thể kết nối
});



// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
