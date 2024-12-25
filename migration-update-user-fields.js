const mongoose = require('mongoose');
const Comment = require('./models/commentModels'); // Đảm bảo rằng bạn import đúng schema User
const Post = require('./models/postModels');
const User = require('./models/notificationModel');
mongoose.connect('mongodb+srv://PTUDW:se7AeECrLmX6FjwW@ptudw.7otyu.mongodb.net', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('Starting migration...');

    // Lấy tất cả người dùng trong cơ sở dữ liệu
    const users = await User.find();
    
    // Cập nhật mỗi người dùng
    for (let user of users) {
      // Kiểm tra và khởi tạo các trường nếu chưa có
      if (!user.isRead || user.isRead === true) user.isRead = false;
      // Lưu lại sau khi cập nhật
      await user.save();
    }

    console.log('Migration completed successfully!');
    mongoose.connection.close(); // Đóng kết nối sau khi hoàn tất
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    mongoose.connection.close();
  });
