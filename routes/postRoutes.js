const express = require("express");
const router = express.Router();
const Post = require("../models/postModels"); // Import Post model
const User = require("../models/userModels"); // Import User model
const Comment = require("../models/commentModels");
const Notification = require("../models/notificationModel"); // Import Notification model
const { postImageUpload } = require('../middleware/upload');
const { authenticateToken } = require("../middleware/token"); // Import middleware
router.get("/home",authenticateToken(false), async (req, res) => {
  try {
    if (req.user) {
      // Người dùng đã đăng nhập
      const posts = await Post.find()
        .populate("author", "username avatar")
        .populate("likes", "username avatar")
        .populate({
          path: "comments",
          populate: { path: "author", select: "username avatar" },
        })
        .sort({ createdAt: -1 });

      return res.render("index", {
        posts,
        currentUserId: req.user._id.toString(),
        currentUserUsername: req.user.username,
        currentUserAvatar: req.user.avatar,
      });
    } else {
      // Người dùng chưa đăng nhập
      const posts = await Post.find()
        .populate("author", "username avatar")
        .sort({ createdAt: -1 });

      return res.render("index_guest", { posts });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});



router.post(
  "/create",
  authenticateToken(true),
  postImageUpload.array("postImages", 5), // Cho phép upload tối đa 5 file
  async (req, res) => {
    try {
      const authorId = req.user._id; // Lấy ID từ middleware
      const { content } = req.body; // Lấy nội dung bài đăng

      // Kiểm tra nội dung bài đăng
      if (!content && req.files.length === 0) {
        return res.status(400).json({
          message: "Content or at least one image is required",
        });
      }

      // Tạo đường dẫn đến các ảnh upload
      const uploadedImages = req.files.map((file) => `/postImage/${file.filename}`);

      // Tạo bài đăng mới với nội dung và ảnh
      const newPost = new Post({
        content,
        author: authorId,
        postImage: uploadedImages, // Đẩy mảng đường dẫn ảnh vào postImage
      });

      // Lưu bài đăng vào database
      await newPost.save();

      // Cập nhật trường "posts" trong người dùng (thêm ID bài viết vào danh sách posts)
      const user = await User.findById(authorId);
      user.posts.push(newPost._id); // Thêm ID bài viết vào mảng posts của người dùng
      await user.save();

      res.status(201).json(newPost); // Trả về bài đăng đã tạo
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);



router.post("/:type/:id/like", authenticateToken(true), async (req, res) => {
  try {
    const { type, id } = req.params; // `type` là "post" hoặc "comment"
    const userId = req.user._id;

    let target = null;

    if (type === "post") {
      target = await Post.findById(id);
    } else if (type === "comment") {
      target = await Comment.findById(id);
    }

    if (!target) {
      return res.status(404).json({ error: `${type.charAt(0).toUpperCase() + type.slice(1)} not found` });
    }

    // Kiểm tra trạng thái Like
    const hasLiked = target.likes.includes(userId);
    let isLiked = false;

    if (!hasLiked) {
      target.likes.push(userId);
      isLiked = true;

      // Thêm thông báo khi Like
      if (type === "post" || type === "comment") {
        const notification = new Notification({
          user: target.author, // Người nhận thông báo
          initiator: userId, // Người thực hiện Like
          type: "like",
          message: `${req.user.username} đã thích ${type === "post" ? "bài viết" : "bình luận"} của bạn.`,
          link: `/${type}/${id}`, // Đường dẫn tới bài viết hoặc comment
        });
        await notification.save();
      }
    } else {
      target.likes = target.likes.filter((like) => like.toString() !== userId.toString());
    }

    await target.save();

    // Trả kết quả về frontend
    res.status(200).json({
      message: isLiked ? `${type.charAt(0).toUpperCase() + type.slice(1)} liked` : `${type.charAt(0).toUpperCase() + type.slice(1)} unliked`,
      likesCount: target.likes.length,
      isLiked,
    });
  } catch (error) {
    console.error("Error liking:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});



router.get("/api/post/:postId", authenticateToken(true), async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId)
      .populate("author", "username avatar")
      .populate({
        path: "comments",
        populate: { path: "author", select: "username avatar" },
      })
      .populate("likes", "username avatar");

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json({ post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/post/:postId", authenticateToken(true), async (req, res) => {
  try {
    const { postId } = req.params;

    // Populate bài viết và tác giả
    const post = await Post.findById(postId)
      .populate("author", "username avatar")
      .populate("likes", "username avatar");

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Lấy tất cả comment cha của bài viết (parentComment = null)
    const parentComments = await Comment.find({ post: postId, parentComment: null })
      .populate("author", "username avatar")
      .lean(); // .lean() để chuyển sang object JSON

    // Lấy tất cả replies liên quan đến comment cha
    const commentIds = parentComments.map(comment => comment._id);
    const replies = await Comment.find({ parentComment: { $in: commentIds } })
      .populate("author", "username avatar")
      .lean();

    // Gán replies vào comment cha tương ứng
    parentComments.forEach(comment => {
      comment.replies = replies.filter(reply => reply.parentComment.toString() === comment._id.toString());
    });

    res.render("post", {
      post,
      parentComments,
      currentUserId: req.user ? req.user._id.toString() : null,
      currentUserUsername: req.user.username,
      currentUserAvatar: req.user.avatar,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


router.get("/post/:postId/activity", authenticateToken(true), async (req, res) => {
  try {
    const { postId } = req.params;

    // Tìm bài viết trong MongoDB
    const post = await Post.findById(postId)
      .populate("author", "username avatar")
      .populate("likes", "username avatar")
      .populate("reposts", "username avatar");

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Dữ liệu trả về
    const data = {
      viewsCount: post.views || 0,
      likesCount: post.likes.length,
      likes: post.likes.map(user => ({
        username: user.username,
        avatar: user.avatar || "/icons/profile.svg",
      })),
      repostsCount: post.reposts.length,
      reposts: post.reposts.map(user => ({
        username: user.username,
        avatar: user.avatar || "/icons/profile.svg",
      })),
    };

    res.json(data); // Gửi dữ liệu JSON
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});


router.get('/repost/:postId', authenticateToken(true), async (req, res) => {
  try {
    // Lấy thông tin bài viết cần repost
    const postToRepost = await Post.findById(req.params.postId);

    if (!postToRepost) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Xác định bài viết gốc (nếu bài viết này là repost, lấy originalPost; nếu không, chính nó là bài viết gốc)
    const originalPostId = postToRepost.originalPost
      ? postToRepost.originalPost
      : postToRepost._id;

    // Tạo bài viết repost mới
    const repost = new Post({
      content: postToRepost.content, // Nội dung giống bài viết gốc
      author: req.user._id, // Người thực hiện repost
      postImage: postToRepost.postImage, // Sao chép hình ảnh (nếu có)
      originalPost: originalPostId, // ID của bài viết gốc
    });

    // Lưu bài viết repost vào database
    await repost.save();

    // Cập nhật bài viết gốc (lưu ID của bài repost vào trường reposts)
    await Post.findByIdAndUpdate(originalPostId, {
      $push: { reposts: repost._id },
    });

    // Cập nhật user (lưu ID của bài repost vào trường reposts của user)
    await User.findByIdAndUpdate(req.user._id, {
      $push: { reposts: repost._id },
    });

    res.status(201).json({
      message: "Reposted successfully",
      repost,
    });
  } catch (error) {
    console.error("Error reposting:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/post/:postId/comments",authenticateToken(true), async (req, res) => {
  try {
    const { postId } = req.params;

    const comments = await Comment.find({ post: postId, parentComment: null })
      .populate("author", "username avatar")
      .populate({
        path: "replies",
        populate: { path: "author", select: "username avatar" },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Comments fetched successfully",
      comments,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});



router.get("/api/comment/:commentId",authenticateToken(true), async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId)
      .populate("author", "username avatar")
      .populate({
        path: "replies",
        populate: { path: "author", select: "username avatar" },
      });

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    res.status(200).json({
      message: "Comment fetched successfully",
      comment,
    });
  } catch (error) {
    console.error("Error fetching comment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


router.post("/post/:postId/comments", authenticateToken(true), async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, parentCommentId } = req.body;
    const userId = req.user._id;

    if (!content || content.trim() === "") {
      return res.status(400).json({ error: "Comment content cannot be empty" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    let parentComment = null;
    if (parentCommentId) {
      parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({ error: "Parent comment not found" });
      }
    }

    const newComment = new Comment({
      content,
      author: userId,
      post: postId,
      parentComment: parentCommentId || null,
    });

    await newComment.save();

    if (parentComment) {
      parentComment.replies.push(newComment._id); // Thêm ID của comment mới vào replies
      await parentComment.save();
    } else {
      post.comments.push(newComment._id);
      await post.save();
    }

    await newComment.populate("author", "username avatar");

    res.status(201).json({
      message: "Comment added successfully",
      comment: newComment,
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


router.get("/api/comment/:commentId",authenticateToken(true), async (req, res) => {
  try {
    const { commentId } = req.params;

    // Kiểm tra ObjectId hợp lệ
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ error: "Invalid comment ID" });
    }

    const comment = await Comment.findById(commentId)
      .populate("author", "username avatar")
      .populate({
        path: "replies",
        populate: { path: "author", select: "username avatar" },
      });

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    res.status(200).json({
      message: "Comment fetched successfully",
      comment,
    });
  } catch (error) {
    console.error("Error fetching comment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /comment/:commentId/replies
router.post("/comment/:commentId/replies", authenticateToken(true), async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    // Kiểm tra nội dung không rỗng
    if (!content || content.trim() === "") {
      return res.status(400).json({ error: "Reply content cannot be empty" });
    }

    // Tìm comment cha
    const parentComment = await Comment.findById(commentId);
    if (!parentComment) {
      return res.status(404).json({ error: "Parent comment not found" });
    }

    // Tạo reply mới
    const newReply = new Comment({
      content,
      author: userId,
      post: parentComment.post, // Giữ ID bài viết gốc
      parentComment: commentId, // Liên kết với comment cha
    });

    // Lưu reply mới
    await newReply.save();

    // Thêm reply vào mảng replies của comment cha
    parentComment.replies.push(newReply._id);
    await parentComment.save();

    // Populate dữ liệu reply để gửi lại cho frontend
    await newReply.populate("author", "username avatar");

    res.status(201).json({
      message: "Reply added successfully",
      comment: newReply,
    });
  } catch (error) {
    console.error("Error adding reply:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});



module.exports = router;