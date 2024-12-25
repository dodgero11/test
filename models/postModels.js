const mongoose = require('mongoose');

// Định nghĩa schema cho bài đăng
const postSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxlength: 500,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Liên kết với model User
    required: true,
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Liên kết với model User (danh sách người thích bài đăng)
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment', // Liên kết với model Comment
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  postImage: {
    type: [String], // Mảng chứa đường dẫn ảnh
    default: [],
  },
  reposts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], 
  originalPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null }, // Bài viết gốc
});

postSchema.pre("save", function (next) {
  if (!this.originalPost) {
    this.originalPost = this._id; // Gán originalPost bằng chính ID của bài viết
  }
  next();
});

// Tạo model từ schema
const Post = mongoose.model('Post', postSchema);

module.exports = Post;