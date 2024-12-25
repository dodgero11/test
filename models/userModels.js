const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Định nghĩa schema cho người dùng
const userSchema = new mongoose.Schema({
  displayName: {
    type: String,
    required: false,
    minlength: 2,
    maxlength: 40,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
    maxlength: 50,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please fill a valid email address'],
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  avatar: {
    type: String, // URL hoặc tên file của avatar (nếu có)
    default: 'icons/profile.svg',
  },
  bio: {
    type: String,
    maxlength: 200,
    default: '',
  },
  isVerified: {
    type: Boolean, // Xác định người dùng đã xác thực email hay chưa
    default: false,
  },
  followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  following: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post', // Liên kết tới Post model
    }
  ],
  replies: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post', // Liên kết tới Post model (các bài viết mà user đã comment)
    }
  ],
  reposts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post', // Liên kết tới Post model (các bài viết mà user đã repost)
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Mã hóa mật khẩu trước khi lưu
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    console.log('Mật khẩu người dùng nhập:', this.password);
    const hashedPassword = await bcrypt.hash(this.password, 10);
    console.log('Mật khẩu sau khi mã hóa:', hashedPassword); // Xem mật khẩu sau khi mã hóa
    this.password = hashedPassword;
  }
  next();
});

// Tạo model từ schema
const User = mongoose.model('User', userSchema);

module.exports = User;
