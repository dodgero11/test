const mongoose = require('mongoose');

// Định nghĩa schema cho thông báo
const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Người nhận thông báo
    required: true,
  },
  initiator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Người khởi tạo hành động (người like, follow, etc.)
    required: true,
  },
  type: {
    type: String,
    enum: ['like', 'comment', 'follow', 'mention', 'quote', 'repost', 'verified'], // Loại thông báo
    required: true,
  },
  message: {
    type: String,
    required: true, // Mô tả chi tiết nội dung thông báo
  },
  link: {
    type: String, // Liên kết đến bài viết, người dùng, hoặc trang liên quan
    default: '',
  },
  isRead: {
    type: Boolean,
    default: false, // Thông báo đã được đọc hay chưa
  },
  createdAt: {
    type: Date,
    default: Date.now, // Thời gian tạo thông báo
  },
});

// Tạo model từ schema
const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;