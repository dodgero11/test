const express = require("express");
const router = express.Router();
const Post = require("../models/postModels"); // Import Post model
const User = require("../models/userModels"); // Import User model
const Notification = require('../models/notificationModel');
const Comment = require('../models/commentModels')
const { authenticateToken } = require("../middleware/token"); // Import middleware
const { avatarUpload } = require("../middleware/upload"); // Import middleware avatarUpload

router.post(
  "/edit-profile",
  authenticateToken(true),
  avatarUpload.single("avatar"), // Xử lý file upload (field name là 'avatar')
  async (req, res) => {
    try {
      const userId = req.user._id; // Lấy ID từ middleware
      const { displayName, bio } = req.body; // Lấy thông tin từ form

      // Cập nhật avatar nếu có upload
      let avatarUrl = req.body.currentAvatar; // Giữ nguyên avatar cũ nếu không có file mới
      if (req.file) {
        avatarUrl = `/avatars/${req.file.filename}`; // Lưu đường dẫn avatar mới
      }

      // Cập nhật thông tin người dùng trong database
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { displayName, bio, avatar: avatarUrl },
        { new: true, runValidators: true } // Trả về thông tin đã cập nhật
      );

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found." });
      }

      res.status(200).json({
        message: "Profile updated successfully.",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Server error." });
    }
  }
);


router.get("/notifications", authenticateToken(true), async (req, res) => {
  try {
    const userId = req.user._id;

    // Lấy tất cả thông báo và sắp xếp theo trạng thái isRead và createdAt
    const notifications = await Notification.find({ user: userId })
      .populate("initiator", "username avatar")
      .sort({ isRead: 1, createdAt: -1 }); // 1: isRead false trước, -1: mới nhất trước

    // NavbarTitle và dropdownOptions (giữ nguyên logic cũ)
    const navbarTitle = "All";
    const dropdownOptions = [
      { href: "/notifications/all", label: "All", type: "all", active: true },
      { href: "/notifications/follow", label: "Follows", type: "follow", active: false },
      { href: "/notifications/replies", label: "Replies", type: "replies", active: false },
      { href: "/notifications/mentions", label: "Mentions", type: "mentions", active: false },
      { href: "/notifications/quotes", label: "Quotes", type: "quotes", active: false },
      { href: "/notifications/reposts", label: "Reposts", type: "reposts", active: false },
      { href: "/notifications/verified", label: "Verified", type: "verified", active: false },
    ];

    // Render trang activity với danh sách đã được sắp xếp
    res.render("activity", {
      notifications,
      navbarTitle,
      dropdownOptions,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).render("activity", {
      notifications: [],
      navbarTitle: "All",
      dropdownOptions: [],
      error: "Lỗi hệ thống khi tải thông báo.",
    });
  }
});



router.get('/notifications/:type?', authenticateToken(true), async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const currentType = req.params.type || 'all'; // Loại thông báo (mặc định là "all")

    // Cập nhật navbarTitle theo loại thông báo
    const navbarTitle = {
      'all': 'All ',
      'follow': 'Follow ',
      'replies': 'Reply ',
      'mentions': 'Mentions',
      'quotes': 'Quotes',
      'reposts': 'Reposts',
      'verified': 'Verified '
    }[currentType] || 'Activity'; // Default is 'Activity' if type is unknown

    // Tùy loại thông báo để thêm điều kiện truy vấn
    const query = currentType === 'all' ? { user: currentUserId } : { user: currentUserId, type: currentType };

    // Lấy thông báo từ cơ sở dữ liệu
    const notifications = await Notification.find(query)
      .populate('initiator', 'username avatar') // Thông tin người thực hiện hành động
      .sort({ createdAt: -1 }); // Sắp xếp từ mới nhất đến cũ nhất

    // Tùy chỉnh dropdown cho giao diện
    const dropdownOptions = [
      { href: "/notifications/all", label: "All", type: "all", active: currentType === "all" },
      { href: "/notifications/follow", label: "Follows", type: "follow", active: currentType === "follow" },
      { href: "/notifications/replies", label: "Replies", type: "replies", active: currentType === "replies" },
      { href: "/notifications/mentions", label: "Mentions", type: "mentions", active: currentType === "mentions" },
      { href: "/notifications/quotes", label: "Quotes", type: "quotes", active: currentType === "quotes" },
      { href: "/notifications/reposts", label: "Reposts", type: "reposts", active: currentType === "reposts" },
      { href: "/notifications/verified", label: "Verified", type: "verified", active: currentType === "verified" },
    ];

    // Render giao diện với thông báo và dropdown
    res.render('activity', { notifications, navbarTitle, dropdownOptions });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).render('activity', {
      notifications: [],
      dropdownOptions: [],
      error: 'Lỗi hệ thống khi tải thông báo.',
    });
  }
});

router.post('/notifications/mark-as-read/:id', authenticateToken(true), async (req, res) => {
  try {
    const notificationId = req.params.id; // Lấy ID từ URL
    const userId = req.user._id; // Lấy ID của người dùng hiện tại

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId }, // Kiểm tra quyền sở hữu thông báo
      { isRead: true }, // Đánh dấu thông báo đã đọc
      { new: true } // Trả về thông báo đã cập nhật
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found or unauthorized" });
    }

    console.log("Notification marked as read:", notification);
    res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});




router.get("/profile/:userId/:tab?", authenticateToken(true), async (req, res) => {
  try {
   

    const userId = req.params.userId;
    const currentTab = req.params.tab || "threads";
    if (!currentTab) {
      return res.redirect(`/profile/${userId}/threads`);
    }
    const user = await User.findById(userId)
      .populate({
        path: "posts",
        select: "content createdAt",
        options: { sort: { createdAt: -1 } },
      })
      .populate({
        path: "replies",
        select: "content createdAt",
        options: { sort: { createdAt: -1 } },
      })
      .populate({
        path: "reposts",
        select: "content createdAt originalPost",
        options: { sort: { createdAt: -1 } },
        populate: [
          { path: "author", select: "username avatar" }, // Populate tác giả của bài repost
          {
            path: "originalPost",
            populate: { path: "author", select: "username avatar" }, // Populate tác giả bài viết gốc
          },
        ],
      })
      
      .populate({
        path: "followers",
        select: "username avatar",
      })
      .populate({
        path: "following",
        select: "username avatar",
      });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const postsCount = user.posts.length;
    const repliesCount = user.replies.length;
    const repostsCount = user.reposts.length;
    const isNewUser = postsCount === 0 && repliesCount === 0 && repostsCount === 0;

    const followers = user.followers; // Lấy danh sách followers
    const following = user.following; // Lấy danh sách following
    const followersCount = followers.length;
    const followingCount = following.length;

    let tabData = [];
    let tabTitle = "Threads";
    switch (currentTab) {
      case "threads":
        tabData = await Post.find({ author: userId })
          .populate("author", "username avatar")
          .populate("likes", "username")
          .populate({
            path: "comments",
            select: "author content createdAt",
            populate: { path: "author", select: "username avatar" },
          })
          .select("content postImage likes comments createdAt") // Thêm postImage vào kết quả
          .sort({ createdAt: -1 });
        tabTitle = "Your Threads";
        break;


      case "replies":
        tabData = await Comment.find({ author: userId })
        .populate({
          path: "post",
          select: "content author",
          populate: { path: "author", select: "username avatar" },
        })
        .populate({
          path: "parentComment",
          select: "content author",
          populate: { path: "author", select: "username avatar" },
        })
        .populate("author", "username avatar")
        .sort({ createdAt: -1 });
        break;
        
      case "reposts":
        tabData = user.reposts;
        tabTitle = "Your Reposts";
        break;
      default:
        return res.status(400).json({ message: "Invalid tab." });
    }

    // Nếu yêu cầu từ Fetch API/AJAX, trả về JSON
    if (req.xhr || req.headers.accept.includes("json")) {
      return res.json({
        tab: currentTab,
        data: tabData,
        tabTitle,
        followersCount,
        followingCount,
      });
    }

    // Nếu yêu cầu từ trình duyệt, render trang HTML
    res.render("profile", {
      user,
      isNewUser,
      currentTab,
      tabData,
      tabTitle,
      followers,
      following,
      followersCount,
      followingCount,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).send("Server error.");
  }
});




router.get('/search', authenticateToken(true), async (req, res) => {
  try {
      const currentUserId = req.user._id; // Lấy ID của người dùng hiện tại từ middleware
      const users = await User.find(({ _id: { $ne: currentUserId } }))
          .populate('followers', '_id') // Lấy danh sách ID của followers
          .select('username email bio followers avatar displayName');
      
      console.log('Users from database:', users);

      const followList = users.map(user => ({
          _id: user._id,
          username: user.username,
          displayName: user.displayName,
          bio: user.bio,
          avatar: user.avatar,
          email: user.email,
          followersCount: user.followers.length, // Số lượng followers
          isFollowing: user.followers.some(follower => follower._id.toString() === currentUserId.toString()) // Kiểm tra nếu đã follow
      }));

      console.log('Follow List for rendering:', followList);
      res.render('search', { followList });
  } catch (error) {
      console.error('Error in /search route:', error);
      res.status(500).send('Lỗi khi tải danh sách người dùng.');
  }
});



router.post("/user/:userId/follow", authenticateToken(true), async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    if (currentUserId.toString() === userId) {
      return res
        .status(400)
        .json({ success: false, message: "Bạn không thể follow chính mình." });
    }
    const currentUser = await User.findById(currentUserId);
    const userToFollow = await User.findById(userId);
    if (!userToFollow) {
      return res
        .status(404)
        .json({ success: false, message: "Người dùng không tồn tại." });
    }

    if (userToFollow.followers.includes(currentUserId)) {
      return res
        .status(400)
        .json({ success: false, message: "Bạn đã follow người dùng này." });
    }

    userToFollow.followers.push(currentUserId);
    await userToFollow.save();

    currentUser.following.push(userId);
    await currentUser.save();

    // Tạo thông báo follow
    const notification = new Notification({
      user: userId, // Người nhận thông báo là người được follow
      initiator: currentUserId, // Người thực hiện hành động follow
      type: 'follow',
      message: `${currentUser.username} đã follow bạn.`,
      link: `/profile/${currentUserId}`,
    });

    await notification.save();

    return res.status(200).json({ success: true, message: "Follow thành công!" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi hệ thống khi follow." });
  }
});


router.post("/user/:userId/unfollow", authenticateToken(true), async (req, res) => {
  try {
    const { userId } = req.params; // ID của người cần unfollow
    const currentUserId = req.user._id; // ID của người đang thực hiện unfollow

    // Không cho phép unfollow chính mình
    if (currentUserId.toString() === userId) {
      return res
        .status(400)
        .json({ success: false, message: "Bạn không thể unfollow chính mình." });
    }

    // Tìm người dùng cần unfollow
    const userToUnfollow = await User.findById(userId);
    if (!userToUnfollow) {
      return res
        .status(404)
        .json({ success: false, message: "Người dùng không tồn tại." });
    }

    // Tìm người dùng hiện tại
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res
        .status(404)
        .json({ success: false, message: "Người dùng hiện tại không tồn tại." });
    }

    // Kiểm tra nếu chưa follow
    if (!userToUnfollow.followers.includes(currentUserId)) {
      return res
        .status(400)
        .json({ success: false, message: "Bạn chưa follow người dùng này." });
    }

    // Xóa `currentUserId` khỏi danh sách `followers` của người dùng mục tiêu
    userToUnfollow.followers = userToUnfollow.followers.filter(
      (followerId) => followerId.toString() !== currentUserId.toString()
    );
    await userToUnfollow.save();

    // Xóa `userId` khỏi danh sách `following` của người dùng hiện tại
    currentUser.following = currentUser.following.filter(
      (followingId) => followingId.toString() !== userId.toString()
    );
    await currentUser.save();

    // Trả về phản hồi thành công
    return res.status(200).json({
      success: true,
      message: "Unfollow thành công!",
      following: currentUser.following, // Danh sách following mới nếu cần cập nhật frontend
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi hệ thống khi unfollow." });
  }
});

router.get('/search/users', async (req, res) => {
  const query = req.query.q;

  try {
    let results = [];
    if (query && query.trim() !== "") {
      results = await User.find({
        $or: [
          { username: { $regex: query, $options: "i" } },
          { displayName: { $regex: query, $options: "i" } }
        ]
      }).limit(10);
    }

    return res.json({ followList: results });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ followList: [], error: "Đã xảy ra lỗi khi tìm kiếm." });
  }
});


module.exports = router;