console.log("main.js loaded")

document.addEventListener('DOMContentLoaded', () => {
    // Like button toggle
    const likeButtons = document.querySelectorAll('.btn-light');
    likeButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            event.target.classList.toggle('btn-danger');
        });
    });

    // Modal handling for elements with class 'plus-button'
    const plusIcons = document.querySelectorAll('.plus-button'); // Tất cả các phần tử có class plus-button
    const modal = document.getElementById('postModal'); // Modal element
    const closeBtns = document.querySelectorAll('.close-btn, .btn-close-icon'); // Các nút đóng
    const postButton = document.querySelector('.post-btn');
    const threadInput = document.querySelector('.thread-input');

    // Kiểm tra sự tồn tại của modal trước khi thêm sự kiện để tránh lỗi
    if (modal && closeBtns) {
        // Khi nhấn vào bất kỳ phần tử nào có class "plus-button", hiện popup
        plusIcons.forEach(icon => {
            icon.addEventListener('click', () => {
                modal.classList.remove('d-none'); // Hiển thị popup
            });
        });

        // Sự kiện đóng modal
        closeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                modal.classList.add('d-none'); // Ẩn modal
            });
        });

        // Ẩn popup khi nhấn bên ngoài nội dung popup
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.classList.add('d-none'); // Ẩn popup
            }
        });

        // Kích hoạt nút "Post" nếu có nội dung nhập
        threadInput.addEventListener('input', () => {
            if (threadInput.value.trim() !== '') {
                postButton.classList.add('active');
                postButton.removeAttribute('disabled');
            } else {
                postButton.classList.remove('active');
                postButton.setAttribute('disabled', 'true');
            }
        });
    } else {
        console.warn("Các phần tử cần thiết để hiển thị modal không tồn tại.");
    }
});


$('.like-button').click(function (e) {
  e.preventDefault();

  const button = $(this);
  const postId = button.data('post-id');
  const commentId = button.data('comment-id');
  const targetType = postId ? 'post' : 'comment';
  const targetId = postId || commentId;
  const likeIcon = button.find("img.like-icon");

  // Gửi yêu cầu AJAX
  $.ajax({
    url: `/${targetType}/${targetId}/like`,
    method: "POST",
    success: function (response) {
      // Cập nhật giao diện
      button.find(".like-count").text(response.likesCount);

      if (response.isLiked) {
        button.addClass("liked");
        likeIcon.attr("src", "/icons/heart_active.svg");
      } else {
        button.removeClass("liked");
        likeIcon.attr("src", "/icons/heart.svg");
      }
    },
    error: function (xhr) {
      alert(xhr.responseJSON.error || "An error occurred while liking the item.");
    },
  });
});


$(document).ready(function () {
  $('.view-activity').click(function (e) {
    e.preventDefault();
    const postId = $(this).data('post-id');

    $.ajax({
      url: `/post/${postId}/activity`,
      method: 'GET',
      success: function (response) {
        // Đổ dữ liệu Likes vào tab
        const likesList = $('#likes-list');
        likesList.empty();
        response.likes.forEach(user => {
          likesList.append(`
            <div class="user-item">
              <div class="d-flex align-items-center">
                <img src="${user.avatar}" alt="Avatar">
                <h6 class="ms-2">${user.username}</h6>
              </div>
              <button class="btn btn-sm btn-outline-primary btn-follow">Follow</button>
            </div>
          `);
        });

        // Đổ dữ liệu Reposts vào tab
        const repostsList = $('#reposts-list');
        repostsList.empty();
        response.reposts.forEach(user => {
          repostsList.append(`
            <div class="user-item">
              <div class="d-flex align-items-center">
                <img src="${user.avatar}" alt="Avatar">
                <h6 class="ms-2">${user.username}</h6>
              </div>
              <button class="btn btn-sm btn-outline-primary btn-follow">Follow</button>
            </div>
          `);
        });

        // Hiển thị modal
        $('#postActivityModal').modal('show');
      },
      error: function (xhr) {
        alert(xhr.responseJSON.error || 'Error loading activity');
      }
    });
  });
});


$(document).ready(function () {
  // Đóng modal khi click vào backdrop (bên ngoài modal-dialog)
  $('#commentModal').on('click', function (event) {
    if (!$(event.target).closest('.modal-dialog').length) {
      $('#commentModal').modal('hide'); // Chỉ đóng khi click ra ngoài modal-dialog
    }
  });

  // Đóng modal khi nhấn nút Post
  $('#submitReply').on('click', function () {
    console.log("Nút Post đã được nhấn!"); // Ghi log nếu cần
    $('#commentModal').modal('hide'); // Đóng modal
  });
});


$(document).ready(function () {
  // Hàm fetch comments và render động
  function fetchComments(postId) {
    $.ajax({
      url: `/post/${postId}/comments`,
      method: "GET",
      success: function (response) {
        const commentsContainer = $(".comments-container");
        commentsContainer.empty(); // Xóa các comments cũ

        response.comments.forEach(comment => {
          const commentHtml = generateCommentHTML(comment);
          commentsContainer.append(commentHtml);
        });
      },
      error: function (err) {
        console.error("Error fetching comments:", err);
        $(".comments-container").html("<p class='text-muted'>Failed to load comments.</p>");
      }
    });
  }

  // Hàm tạo HTML cho một comment và các reply
  function generateCommentHTML(comment) {
    let repliesHtml = "";

    if (comment.replies && comment.replies.length > 0) {
      repliesHtml = `
        <div class="replies pl-4">
          ${comment.replies.map(reply => `
            <div class="card mb-2">
              <div class="card-body">
                <div class="d-flex align-items-center mb-2">
                  <img src="${reply.author.avatar || '/icons/profile.svg'}" 
                       alt="Avatar" class="rounded-circle mr-3" style="width: 35px; height: 35px;">
                  <div>
                    <h6 class="mb-0">${reply.author.username}</h6>
                    <small class="text-muted">${new Date(reply.createdAt).toLocaleString()}</small>
                  </div>
                </div>
                <p class="card-text">${reply.content}</p>
              </div>
            </div>
          `).join("")}
        </div>
      `;
    }

    return `
      <div class="comment-block border-bottom mb-3">
        <div class="card mb-2">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <div class="d-flex align-items-center">
                <img src="${comment.author.avatar || '/icons/profile.svg'}" 
                     alt="Avatar" class="rounded-circle mr-3" style="width: 40px; height: 40px;">
                <div>
                  <h6 class="mb-0">${comment.author.username}</h6>
                  <small class="text-muted">${new Date(comment.createdAt).toLocaleString()}</small>
                </div>
              </div>
            </div>
            <p class="card-text">${comment.content}</p>
            <div class="d-flex justify-content-start mt-2">
              <button class="btn btn-link like-button" data-comment-id="${comment._id}">
                <img src="/icons/heart.svg" alt="Like" class="like-icon" style="width: 20px; height: 20px;">
                <span class="like-count">0</span>
              </button>

              <button class="btn btn-link comment-button ml-3" data-comment-id="${comment._id}">
                <img src="/icons/comment.svg" alt="Comment" class="comment-icon" style="width: 20px; height: 20px;">
                <span class="comment-count">${comment.replies.length}</span>
              </button>
            </div>
          </div>
        </div>
        ${repliesHtml}
      </div>
    `;
  }

  // Fetch comments khi tải trang
  const postId = $(".comment-button").data("post-id");
  if (postId) fetchComments(postId);

  // Xử lý sự kiện click comment-button (ví dụ mở modal)
  $(document).on("click", ".comment-button", function () {
    const button = $(this);
    const postId = button.data("post-id");
    const commentId = button.data("comment-id");
    console.log("Comment button clicked:", { postId, commentId });
    // Xử lý tiếp ở đây
  });
});



$(document).ready(function () {
  // Mở modal và lấy nội dung gốc từ API
  $(document).on("click", ".comment-button", function () {
    const button = $(this);
    const postId = button.data("post-id");       // Lấy ID của bài viết
    const commentId = button.data("comment-id"); // Lấy ID của comment (nếu có)
  
    const modal = $("#commentModal");
    const originalCommentContainer = modal.find(".original-comment");
    const replyInput = modal.find(".reply-input");
    const submitButton = $("#submitReply");
  
    // Kiểm tra xem ID có hợp lệ không
    if (!postId && !commentId) {
      console.error("Error: Missing postId or commentId");
      return;
    }
  
    console.log("Post ID:", postId);
    console.log("Comment ID:", commentId);
  
    // Reset modal trước khi hiển thị
    modal.data("post-id", postId);
    modal.data("parent-comment-id", commentId || null); // Gán ID comment cha nếu có
    originalCommentContainer.empty();
    replyInput.val("");
    submitButton.prop("disabled", true).removeClass("active");
  
    // Mở modal
    modal.modal("show");
  
    // Xác định URL API để fetch dữ liệu
    const url = commentId 
      ? `/api/comment/${commentId}`   // Nếu commentId tồn tại, fetch nội dung comment
      : `/api/post/${postId}`;        // Nếu không, fetch nội dung bài viết
  
    // Gửi AJAX request
    $.ajax({
      url: url,
      method: "GET",
      success: function (response) {
        let data = null;
  
        if (response.comment) {
          data = response.comment; // Dữ liệu cho comment
        } else if (response.post) {
          data = response.post; // Dữ liệu cho bài viết
        }
  
        if (!data) {
          console.error("Error: No data received");
          originalCommentContainer.html(
            '<p class="text-muted">Error loading content.</p>'
          );
          return;
        }
  
        // Hiển thị nội dung trong modal
        const html = `
          <div class="media">
            <img src="${data.author.avatar || '/icons/profile.svg'}" 
                 class="mr-3 rounded-circle" 
                 alt="Avatar" style="width: 40px; height: 40px;">
            <div class="media-body">
              <h6 class="mt-0">${data.author.username}</h6>
              <p>${data.content}</p>
              <small class="text-muted">${new Date(data.createdAt).toLocaleString()}</small>
            </div>
          </div>
        `;
        originalCommentContainer.html(html);
      },
      error: function (err) {
        console.error("Error fetching content:", err);
        originalCommentContainer.html(
          '<p class="text-muted">Error loading content.</p>'
        );
      },
    });
  });
  
  // Kích hoạt nút Post khi nội dung thay đổi
  $("#reply-content").on("input", function () {
    const content = $(this).val().trim();
    const submitButton = $("#submitReply");
    if (content.length > 0) {
      submitButton.prop("disabled", false).addClass("active");
    } else {
      submitButton.prop("disabled", true).removeClass("active");
    }
  });

  function generateRepliesHTML(replies, postId) {
    let repliesHTML = '';
  
    replies.forEach(reply => {
      repliesHTML += `
        <div class="card mb-2">
          <div class="card-body">
            <div class="d-flex align-items-center mb-2">
              <img src="${reply.author.avatar || '/icons/profile.svg'}" alt="Avatar" class="rounded-circle mr-3" style="width: 35px; height: 35px;">
              <div>
                <h6 class="mb-0">${reply.author.username}</h6>
                <small class="text-muted">${new Date(reply.createdAt).toLocaleString()}</small>
              </div>
            </div>
            <p class="card-text">${reply.content}</p>
  
            <!-- Nút tương tác -->
            <div class="d-flex justify-content-start mt-2">
              <button class="btn btn-link like-button" data-comment-id="${reply._id}" data-post-id="${postId}">
                <img src="/icons/heart.svg" alt="Like" class="like-icon" style="width: 20px; height: 20px;">
                <span class="like-count">0</span>
              </button>
  
              <button class="btn btn-link comment-button ml-3" data-comment-id="${reply._id}" data-post-id="${postId}">
                <img src="/icons/comment.svg" alt="Comment" class="comment-icon" style="width: 20px; height: 20px;">
                <span class="comment-count">0</span>
              </button>
  
              <button class="btn btn-link repost-button ml-3" data-comment-id="${reply._id}" data-post-id="${postId}">
                <img src="/icons/repost.svg" alt="Repost" class="repost-icon" style="width: 20px; height: 20px;">
                <span class="repost-count">0</span>
              </button>
            </div>
          </div>
        </div>
      `;
    });
  
    return repliesHTML;
  }
  
  // Xử lý khi nhấn nút Post
  $("#submitReply").on("click", function () {
    const postId = $("#commentModal").data("post-id");
    const parentCommentId = $("#commentModal").data("parent-comment-id"); // Lấy ID comment cha nếu có
    const content = $("#reply-content").val().trim();
  
    if (!content) return; // Đảm bảo không gửi nội dung rỗng
    // Tạo payload cho request
    const requestData = { content };
  
    // Gửi request đến route phù hợp
    const url = parentCommentId 
      ? `/comment/${parentCommentId}/replies` // Reply vào comment cha
      : `/post/${postId}/comments`;          // Comment vào bài viết
  
    $.ajax({
      url: url,
      method: "POST",
      data: requestData,
      success: function (response) {
        $("#commentModal").modal("hide"); // Đóng modal
  
        const comment = response.comment;
  
        // Tạo HTML sử dụng template có sẵn
        const replyHTML = generateRepliesHTML([comment], postId);
  
        if (parentCommentId) {
          // Nếu là reply, tìm phần replies của comment cha và thêm vào đó
          const repliesContainer = $(`[data-comment-id='${parentCommentId}']`)
            .closest(".comment-block")
            .find(".replies");
  
          if (repliesContainer.length === 0) {
            // Nếu chưa có phần replies, tạo mới
            const repliesBlock = `<div class="replies pl-4">${replyHTML}</div>`;
            $(`[data-comment-id='${parentCommentId}']`).closest(".comment-block").append(repliesBlock);
          } else {
            // Nếu đã có, thêm vào phần replies
            repliesContainer.append(replyHTML);
          }
        } else {
          // Nếu là comment mới, thêm vào danh sách comment chính
          const newCommentHTML = `
            <div class="comment-block border-bottom mb-3">
              <div class="card mb-2">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <div class="d-flex align-items-center">
                      <img src="${comment.author.avatar || '/icons/profile.svg'}" alt="Avatar" class="rounded-circle mr-3" style="width: 40px; height: 40px;">
                      <div>
                        <h6 class="mb-0">${comment.author.username}</h6>
                        <small class="text-muted">${new Date(comment.createdAt).toLocaleString()}</small>
                      </div>
                    </div>
                  </div>
                  <p class="card-text">${comment.content}</p>
  
                  <!-- Nút tương tác -->
                  <div class="d-flex justify-content-start mt-2">
                    <button class="btn btn-link like-button" data-comment-id="${comment._id}" data-post-id="${postId}">
                      <img src="/icons/heart.svg" alt="Like" class="like-icon" style="width: 20px; height: 20px;">
                      <span class="like-count">0</span>
                    </button>
  
                    <button class="btn btn-link comment-button ml-3" data-comment-id="${comment._id}" data-post-id="${postId}">
                      <img src="/icons/comment.svg" alt="Comment" class="comment-icon" style="width: 20px; height: 20px;">
                      <span class="comment-count">0</span>
                    </button>
  
                    <button class="btn btn-link repost-button ml-3" data-comment-id="${comment._id}" data-post-id="${postId}">
                      <img src="/icons/repost.svg" alt="Repost" class="repost-icon" style="width: 20px; height: 20px;">
                      <span class="repost-count">0</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          `;
  
          $(".comments-container").prepend(newCommentHTML);
        }
      },
      error: function (err) {
        console.error("Error posting reply:", err);
        alert("Failed to post reply.");
      },
    });
    location.reload();
  });

});






$(document).on('click', '.follow-button', function (e) {
  e.preventDefault();
  const button = $(this);
  const userId = button.data('user-id'); // ID của người cần follow/unfollow
  const isFollowing = button.hasClass('following');
  const action = isFollowing ? 'unfollow' : 'follow';
  button.prop('disabled', true);
  $.ajax({
    url: `/user/${userId}/${action}`,
    method: 'POST',
    success: function (response) {
      if (response.success) {
        // Cập nhật trạng thái nút
        if (action === 'follow') {
          button.addClass('following').text('Unfollow');
        } else {
          button.removeClass('following').text('Follow');
        }
      } else {
        alert(response.message || 'Action failed.');
      }
    },
    error: function (xhr) {
      alert(xhr.responseJSON?.message || 'Error performing the action');
    },
    complete: function () {
      // Kích hoạt lại nút sau khi quá trình hoàn tất
      button.prop('disabled', false);
    }
  });
});



document.addEventListener('DOMContentLoaded', function() {
  const cardInfoElements = document.querySelectorAll('.card-info');
  cardInfoElements.forEach(el => {
    const postId = el.getAttribute('data-post-id');
    el.style.cursor = 'pointer'; // Cho người dùng biết vùng này có thể click
    el.addEventListener('click', () => {
      window.location.href = '/post/' + postId;
    });
  });
});


// Lắng nghe sự kiện thay đổi dropdown
document.querySelectorAll('.dropdown-item').forEach((item) => {
  item.addEventListener('click', function (event) {
      const type = this.getAttribute('data-type');
      if (type) {
          console.log('Selected Type:', type);
          if (window.location.pathname === '/notifications') {
              fetchNotifications(type);
          }
      }
  });
});

// Gửi yêu cầu AJAX để lấy thông báo
function fetchNotifications(type) {
  $.ajax({
      url: `/notifications/${type || 'all'}`,
      method: 'GET',
      success: function (response) {
          console.log('Notifications:', response);
          renderNotifications(response.notifications);
      },
      error: function (xhr) {
          console.error('Error loading notifications:', xhr);
      }
  });
}


document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".nav-link-profile");
  const tabContent = document.getElementById("tab-content");
  const profileContainer = document.getElementById("profile-container");
  const userId = profileContainer.getAttribute("data-user-id");

  if (!profileContainer) {
    console.warn("Profile container not found. Exiting tab logic.");
    return;
  }
  if (!tabContent) {
    console.error("Tab content container (#tab-content) not found in DOM.");
    return;
  }


  async function loadTabData(tab) {
    tabContent.innerHTML = "<p>Loading...</p>";
    try {
      const response = await fetch(`/profile/${userId}/${tab}`, {
        headers: { Accept: "application/json" },
      });
  
      const result = await response.json();
  
      if (response.ok) {
        if (result.data.length > 0) {
          // Tạo nội dung dựa trên tab
          const contentHTML = result.data
            .map((item) => {
              const author = item.author || { username: "Unknown", avatar: "/default-avatar.png" };
              const likesCount = item.likes ? item.likes.length : 0;
              const commentsCount = item.comments ? item.comments.length : 0;
  
              if (tab === "threads") {
                return `
                  <div class="post-item mb-3 border rounded p-3">
                    <div class="d-flex align-items-center mb-2">
                      <img src="${author.avatar}" alt="Avatar" class="rounded-circle" style="width: 40px; height: 40px;">
                      <div class="ml-2">
                        <h6 class="mb-0">${author.username}</h6>
                        <small class="text-muted">${new Date(item.createdAt).toLocaleString()}</small>
                      </div>
                    </div>
                    <p>${item.content}</p>
                    ${
                      item.postImage && item.postImage.length > 0
                        ? `<div class="post-images mt-2">
                             ${item.postImage
                               .map(
                                 (image) =>
                                   `<img src="${image}" alt="Post Image" class="img-fluid mb-2 rounded" style="max-width: 100%;">`
                               )
                               .join("")}
                           </div>`
                        : ""
                    }
                    <div class="d-flex justify-content-between mt-2">
                      <div>
                        <span class="mr-3"><i class="bi bi-heart"></i> ${likesCount}</span>
                        <span class="mr-3"><i class="bi bi-chat"></i> ${commentsCount}</span>
                        <span class="mr-3"><i class="bi bi-repeat"></i> ${item.reposts ? item.reposts.length : 0}</span>
                      </div>
                      <div><i class="bi bi-three-dots"></i></div>
                    </div>
                  </div>
                `;
              }
              
  
              if (tab === "replies") {
                const post = item.post || {};
                const parentComment = item.parentComment || {};
  
                return `
                  <div class="post-item mb-3 border rounded p-3">
                    <div class="text-muted mb-1">
                      <i class="bi bi-reply"></i>
                      ${
                        parentComment.content
                          ? `Replying to <strong>@${parentComment.author.username}</strong> in comment: "${parentComment.content}"`
                          : `Commented on <strong>@${post.author.username}</strong>'s post: "${post.content}"`
                      }
                    </div>
                    <p>${item.content}</p>
                    <div class="d-flex align-items-center">
                      <img src="${author.avatar}" alt="Avatar" class="rounded-circle" style="width: 30px; height: 30px;">
                      <small class="ml-2 text-muted">${author.username} · ${new Date(item.createdAt).toLocaleString()}</small>
                    </div>
                  </div>
                `;
              }
  
              if (tab === "reposts") {
                const originalPost = item.originalPost;
                if (!originalPost) {
                  return `<div class="post-item"><p class="text-danger">Original post not found.</p></div>`;
                }
  
                return `
                  <div class="post-item mb-3 border rounded p-3">
                    <p class="text-muted mb-1">
                      <i class="bi bi-repeat"></i> Reposted by <strong>${author.username}</strong> at ${new Date(item.createdAt).toLocaleString()}
                    </p>
                    <div class="original-post bg-light p-2 rounded">
                      <div class="d-flex align-items-center mb-2">
                        <img src="${originalPost.author.avatar}" alt="Avatar" class="rounded-circle" style="width: 40px; height: 40px;">
                        <div class="ml-2">
                          <h6 class="mb-0">${originalPost.author.username}</h6>
                          <small class="text-muted">${new Date(originalPost.createdAt).toLocaleString()}</small>
                        </div>
                      </div>
                      <p>${originalPost.content}</p>
                    </div>
                  </div>
                `;
              }
            })
            .join("");
  
          tabContent.innerHTML = contentHTML;
        } else {
          tabContent.innerHTML = `<p>You don't have any ${tab} yet.</p>`;
        }
      } else {
        tabContent.innerHTML = `<p>Error: ${result.message}</p>`;
      }
    } catch (error) {
      console.error("Error loading tab data:", error);
      tabContent.innerHTML = "<p>Error loading data.</p>";
    }
  }
  
  loadTabData("threads");

  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();

      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      const selectedTab = tab.getAttribute("data-tab");
      loadTabData(selectedTab);
    });
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const notificationItems = document.querySelectorAll('.notification-item');

  notificationItems.forEach(item => {
    item.addEventListener('click', function (e) {
      e.preventDefault();

      const notificationId = this.dataset.notificationId;

      // Gửi AJAX request để đánh dấu thông báo là đã đọc
      fetch(`/notifications/mark-as-read/${notificationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }).then(response => {
        if (response.ok) {
          // Thêm class 'read' để đổi CSS
          this.classList.add('read');

          // Thêm class 'fade-out' để tạo hiệu ứng
          this.classList.add('fade-out');

          // Đợi 0.5s để hiệu ứng hoàn tất trước khi xóa khỏi DOM
          setTimeout(() => {
            this.remove();
          }, 500);
        } else {
          console.error('Failed to mark notification as read');
        }
      }).catch(err => {
        console.error('Error:', err);
      });
    });
  });
});
