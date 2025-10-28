// ============================================
// CONFIGURATION
// ============================================
const API_BASE_URL = "http://localhost:4000";
let currentUser = null;
 // Track which tweet is being replied to
let replyingToTweetId = null;

console.log("🚀 Dashboard script loaded");

// ============================================
// AUTHENTICATION
// ============================================
async function checkAuthentication() {
  console.log("🔐 Checking authentication...");
  const token = localStorage.getItem("token");

  if (!token) {
    console.log("❌ No token found");
    redirectToLogin();
    return false;
  }

  console.log("✅ Token found");

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    console.log("📦 Response:", data);

    if (!data.success) {
      throw new Error("Invalid token");
    }

    currentUser = data.data.user;
    console.log("✅ Authentication successful! User:", currentUser.username);
    return true;
  } catch (error) {
    console.error("❌ Authentication failed:", error);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    redirectToLogin();
    return false;
  }
}

function redirectToLogin() {
  console.log("🔄 Redirecting to login...");
  window.location.href = "/login.html";
}

// ============================================
// LOAD USER DATA
// ============================================
function loadUserData() {
  console.log("📝 Loading user data...");
  if (!currentUser) {
    console.log("⚠️ No user data available");
    return;
  }

  const userName = document.querySelector(".user-info .user-name");
  const userHandle = document.querySelector(".user-info .user-handle");

  if (userName) {
    userName.textContent = currentUser.fullName || currentUser.fullname;
    console.log("✅ Updated user name:", userName.textContent);
  }

  if (userHandle) {
    userHandle.textContent = `@${currentUser.username}`;
    console.log("✅ Updated user handle:", userHandle.textContent);
  }

  console.log("✅ User data loaded successfully");
}

// ============================================
// NAVIGATION
// ============================================
function setupNavigation() {
  console.log("🧭 Setting up navigation...");

  const navItems = document.querySelectorAll(".nav-item");

  navItems.forEach((item) => {
    item.addEventListener("click", function () {
      const navText = this.querySelector(".nav-text");
      console.log(
        `📍 Navigation clicked: ${navText ? navText.textContent : "Unknown"}`
      );

      navItems.forEach((nav) => nav.classList.remove("active"));
      this.classList.add("active");
    });
  });

  console.log("✅ Navigation setup complete");
}

// ============================================
// TWEET COMPOSER
// ============================================
function setupTweetComposer() {
  console.log("🎨 Setting up tweet composer...");

  const textarea = document.querySelector(".post");
  const charText = document.querySelector(".char-text");
  const postButton = document.querySelector(".post-button");
  const maxLength = 280;

  if (!textarea || !charText || !postButton) {
    console.error("❌ Composer elements not found!");
    return;
  }

  textarea.addEventListener("input", function () {
    const remaining = maxLength - this.value.length;
    charText.textContent = remaining;

    const canPost = this.value.trim().length > 0 && remaining >= 0;
    postButton.disabled = !canPost;

    if (remaining < 0) {
      charText.style.color = "#ff6b6b";
    } else if (remaining < 20) {
      charText.style.color = "#ffa500";
    } else {
      charText.style.color = "#1da1f2";
    }
  });

  console.log("✅ Tweet composer setup complete");
}

// ============================================
// POST TWEET
// ============================================
async function postTweet() {
  console.log("📤 Posting tweet...");

  const textarea = document.querySelector(".post");
  const charText = document.querySelector(".char-text");
  const postButton = document.querySelector(".post-button");
  const content = textarea.value.trim();

  if (!content) {
    alert("Please write something before posting!");
    return;
  }

  if (content.length > 280) {
    alert("Tweet exceeded the character limit!");
    return;
  }

  postButton.disabled = true;
  postButton.textContent = "Posting...";

  try {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_BASE_URL}/api/tweets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    });

    const data = await response.json();
    console.log("📬 Server response:", data);

    if (data.success) {
      console.log("✅ Tweet posted successfully!");

      textarea.value = "";
      charText.textContent = "280";
      charText.style.color = "#1da1f2";
      postButton.textContent = "Post";

      await loadTweets();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      throw new Error(data.message || "Failed to post tweet");
    }
  } catch (error) {
    console.error("❌ Error posting tweet:", error);
    alert("Failed to post tweet. Please try again.");
    postButton.disabled = false;
    postButton.textContent = "Post";
  }
}

// ============================================
// CREATE TWEET HTML
// ============================================
function createTweetHTML(tweet, isReply = false) {
  const author = tweet.author || currentUser;
  const authorName = author.fullName || author.fullname || "Unknown User";
  const authorHandle = author.username || "unknown";
  const authorAvatar = author.avatar || "../src/assets/profile.jpg";
  const timeAgo = getTimeAgo(new Date(tweet.createdAt));
  const safeContent = escapeHTML(tweet.content);

  const isOwnTweet = currentUser && tweet.author._id === currentUser._id;

  const isLiked =
    Array.isArray(tweet.likes) &&
    tweet.likes.some(
      (like) => (typeof like === "string" ? like : like._id) === currentUser._id
    );
  const isRetweeted =
    Array.isArray(tweet.retweets) &&
    tweet.retweets.some(
      (retweet) =>
        (typeof retweet === "string" ? retweet : retweet._id) ===
        currentUser._id
    );

  const likesCount = Array.isArray(tweet.likes) ? tweet.likes.length : 0;
  const retweetsCount = Array.isArray(tweet.retweets)
    ? tweet.retweets.length
    : 0;
  const repliesCount = tweet.repliesCount || 0;
  const viewsCount = tweet.views || 0;

  const replyClass = isReply ? "reply-tweet" : "";
  const replyIcon = isReply
    ? '<i class="fa-solid fa-reply" style="color:#536471; margin-right:8px;"></i>'
    : "";

  return `
    <div class="post-item ${replyClass}" data-tweet-id="${tweet._id}">
      ${replyIcon}
      <img src="${authorAvatar}" alt="Profile" class="profile-pic" />
      <div class="post-content">
        <div class="post-header">
          <span class="username">${authorName}</span>
          <span class="handle">@${authorHandle}</span>
          <span class="timestamp">· ${timeAgo}</span>
          ${
            isOwnTweet
              ? `
            <div class="post-menu" onclick="deleteTweet('${tweet._id}')" style="margin-left: auto;">
              <i class="fa-solid fa-trash" style="color:#f91880; cursor:pointer;" title="Delete tweet"></i>
            </div>
          `
              : `
            <div class="post-menu" style="margin-left: auto;">
              <i class="fa-solid fa-ellipsis"></i>
            </div>
          `
          }
        </div>
        <p class="post-text">${safeContent}</p>
        <div class="post-stats">
          <div class="stat-item comment-btn" onclick="openReplyModal('${
            tweet._id
          }')" style="cursor: pointer;">
            <i class="fa-regular fa-comment"></i>
            <span>${repliesCount}</span>
          </div>
          <div class="stat-item retweet-btn" onclick="retweetTweet('${
            tweet._id
          }')" style="cursor:pointer; ${isRetweeted ? "color:#00ba7c;" : ""}">
            <i class="fa-solid fa-retweet"></i>
            <span>${retweetsCount}</span>
          </div>
          <div class="stat-item like-btn" onclick="likeTweet('${
            tweet._id
          }')" style="cursor: pointer; ${isLiked ? "color: #f91880;" : ""}">
            <i class="fa-${isLiked ? "solid" : "regular"} fa-heart"></i>
            <span>${likesCount}</span>
          </div>
          <div class="stat-item" style="cursor: pointer;">
            <i class="fa-regular fa-chart-bar"></i>
            <span>${viewsCount}</span>
          </div>
          <div class="stat-item" style="cursor: pointer;">
            <i class="fa-regular fa-share-from-square"></i>
          </div>
        </div>
        
        ${
          !isReply && repliesCount > 0
            ? `
          <div class="view-replies-btn" onclick="toggleReplies('${
            tweet._id
          }')" style="cursor:pointer; color:#1da1f2; font-size:14px; margin-top:12px; display:flex; align-items:center; gap:4px;">
            <i class="fa-solid fa-chevron-down" id="reply-chevron-${
              tweet._id
            }"></i>
            <span>View ${repliesCount} ${
                repliesCount === 1 ? "reply" : "replies"
              }</span>
          </div>
          <div class="replies-container" id="replies-${
            tweet._id
          }" style="display:none; margin-top:16px;"></div>
        `
            : ""
        }
      </div>
    </div>
  `;
}

// ============================================
// LOAD TWEETS
// ============================================
async function loadTweets() {
  console.log("📡 Loading tweets from backend...");

  const postsContainer = document.querySelector(".posts");

  if (!postsContainer) {
    console.error("❌ Posts container not found!");
    return;
  }

  postsContainer.innerHTML = `
    <div style="text-align:center; padding:40px; color:#536471;">
      <i class="fas fa-spinner fa-spin" style="font-size:32px;"></i>
      <p style="margin-top:16px;">Loading tweets...</p>
    </div>
  `;

  try {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_BASE_URL}/api/tweets`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    console.log("📦 Tweets response:", data);

    if (data.success) {
      const tweets = data.data.tweets;
      console.log(`✅ Loaded ${tweets.length} tweets`);

      if (tweets.length === 0) {
        postsContainer.innerHTML = `
          <div style="text-align:center; padding:40px; color:#536471;">
            <i class="fas fa-feather-alt" style="font-size:48px; margin-bottom:16px;"></i>
            <h3 style='color:#e7e9ea; margin-bottom:8px;'>No tweets yet</h3>
            <p>Be the first to post something!</p>
          </div>
        `;
      } else {
        postsContainer.innerHTML = "";
        tweets.forEach((tweet) => {
          const tweetHTML = createTweetHTML(tweet);
          postsContainer.insertAdjacentHTML("beforeend", tweetHTML);
        });
      }
    } else {
      throw new Error(data.message || "Failed to load tweets");
    }
  } catch (error) {
    console.error("❌ Error loading tweets:", error);
    postsContainer.innerHTML = `
      <div style="text-align:center; padding:40px; color:#f91880;">
        <i class="fas fa-exclamation-circle" style="font-size:48px; margin-bottom:16px;"></i>
        <h3 style="color:#e7e9ea; margin-bottom:8px;">Failed to load tweets</h3>
        <p>${error.message}</p>
        <button onclick="loadTweets()" style="margin-top:16px; padding:10px 20px; background:#1da1f2; color:white; border:none; border-radius:20px; cursor:pointer;">
          Retry
        </button>
      </div>
    `;
  }
}

// ============================================
// LIKE TWEET
// ============================================
async function likeTweet(tweetId) {
  console.log("❤️ Toggling like for tweet:", tweetId);

  try {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_BASE_URL}/api/tweets/${tweetId}/like`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    console.log("📦 Like response:", data);

    if (data.success) {
      const tweetElement = document.querySelector(
        `[data-tweet-id="${tweetId}"]`
      );
      if (tweetElement) {
        const likeBtn = tweetElement.querySelector(".stat-item.like-btn");
        const likeIcon = likeBtn.querySelector("i");
        const likeCount = likeBtn.querySelector("span");

        if (data.data.isLiked) {
          likeIcon.classList.remove("fa-regular");
          likeIcon.classList.add("fa-solid");
          likeBtn.style.color = "#f91880";
        } else {
          likeIcon.classList.remove("fa-solid");
          likeIcon.classList.add("fa-regular");
          likeBtn.style.color = "";
        }

        likeCount.textContent = data.data.likesCount;
        console.log(`✅ Like UI updated - Count: ${data.data.likesCount}`);
      }
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error("❌ Error liking tweet:", error);
    alert("Failed to like tweet. Please try again.");
  }
}

// ============================================
// RETWEET
// ============================================
async function retweetTweet(tweetId) {
  console.log("🔁 Toggling retweet for tweet:", tweetId);

  try {
    const token = localStorage.getItem("token");

    const response = await fetch(
      `${API_BASE_URL}/api/tweets/${tweetId}/retweet`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    console.log("📦 Retweet response:", data);

    if (data.success) {
      const tweetElement = document.querySelector(
        `[data-tweet-id="${tweetId}"]`
      );
      if (tweetElement) {
        const retweetBtn = tweetElement.querySelector(".stat-item.retweet-btn");
        const retweetCount = retweetBtn.querySelector("span");

        if (data.data.isRetweeted) {
          retweetBtn.style.color = "#00ba7c";
        } else {
          retweetBtn.style.color = "";
        }

        retweetCount.textContent = data.data.retweetsCount;
        console.log(
          `✅ Retweet UI updated - Count: ${data.data.retweetsCount}`
        );
      }
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error("❌ Error retweeting:", error);
    alert("Failed to retweet. Please try again.");
  }
}

// ============================================
// DELETE TWEET
// ============================================
async function deleteTweet(tweetId) {
  console.log("🗑️ Deleting tweet:", tweetId);

  if (!confirm("Are you sure you want to delete this tweet?")) {
    return;
  }

  try {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_BASE_URL}/api/tweets/${tweetId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    console.log("📦 Delete response:", data);

    if (data.success) {
      const tweetElement = document.querySelector(
        `[data-tweet-id="${tweetId}"]`
      );
      if (tweetElement) {
        tweetElement.style.opacity = "0";
        tweetElement.style.transform = "translateX(-100%)";
        tweetElement.style.transition = "all 0.3s ease";

        setTimeout(() => {
          tweetElement.remove();
          console.log("✅ Tweet removed from UI");
        }, 300);
      }
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error("❌ Error deleting tweet:", error);
    alert("Failed to delete tweet. Please try again.");
  }
}

// ============================================
// TOGGLE REPLIES
// ============================================
async function toggleReplies(tweetId) {
  console.log("👁️ Toggling replies for tweet:", tweetId);

  const repliesContainer = document.getElementById(`replies-${tweetId}`);
  const chevron = document.getElementById(`reply-chevron-${tweetId}`);

  if (!repliesContainer) {
    console.error("❌ Replies container not found");
    return;
  }

  if (repliesContainer.innerHTML.trim() !== "") {
    if (repliesContainer.style.display === "none") {
      repliesContainer.style.display = "block";
      chevron.classList.remove("fa-chevron-down");
      chevron.classList.add("fa-chevron-up");
    } else {
      repliesContainer.style.display = "none";
      chevron.classList.remove("fa-chevron-up");
      chevron.classList.add("fa-chevron-down");
    }
    return;
  }

  try {
    repliesContainer.innerHTML =
      '<p style="color:#536471; padding:12px;">Loading replies...</p>';
    repliesContainer.style.display = "block";
    chevron.classList.remove("fa-chevron-down");
    chevron.classList.add("fa-chevron-up");

    const token = localStorage.getItem("token");
    const response = await fetch(
      `${API_BASE_URL}/api/tweets/${tweetId}/replies`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    console.log("📦 Replies response:", data);

    if (data.success) {
      const replies = data.data.replies;

      if (replies.length === 0) {
        repliesContainer.innerHTML =
          '<p style="color:#536471; padding:12px;">No replies yet</p>';
      } else {
        repliesContainer.innerHTML = "";
        replies.forEach((reply) => {
          const replyHTML = createTweetHTML(reply, true);
          repliesContainer.insertAdjacentHTML("beforeend", replyHTML);
        });
      }
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error("❌ Error loading replies:", error);
    repliesContainer.innerHTML =
      '<p style="color:#f91880; padding:12px;">Failed to load replies</p>';
  }
}

// ============================================
// REPLY MODAL
// ============================================
let currentReplyTweetId = null;

function openReplyModal(tweetId) {
  console.log("💬 Opening reply modal for tweet:", tweetId);
  currentReplyTweetId = tweetId;

  const modal = document.getElementById("reply-modal");
  const textarea = document.getElementById("reply-textarea");
  const submitBtn = document.getElementById("reply-submit-btn");

  textarea.value = "";
  modal.style.display = "flex";
  submitBtn.onclick = () => submitReply(currentReplyTweetId);

  setTimeout(() => textarea.focus(), 100);
}

function closeReplyModal() {
  console.log("❌ Closing reply modal");
  const modal = document.getElementById("reply-modal");
  modal.style.display = "none";
  currentReplyTweetId = null;
}

// ============================================
// SUBMIT REPLY
// ============================================
async function submitReply(tweetId) {
  console.log("💬 Submitting reply to tweet:", tweetId);

  const textarea = document.getElementById("reply-textarea");
  const content = textarea.value.trim();

  if (!content) {
    alert("Please write something before replying!");
    return;
  }

  if (content.length > 280) {
    alert("Reply exceeds 280 character limit!");
    return;
  }

  try {
    const token = localStorage.getItem("token");

    const response = await fetch(
      `${API_BASE_URL}/api/tweets/${tweetId}/reply`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      }
    );

    const data = await response.json();
    console.log("📦 Reply response:", data);

    if (data.success) {
      console.log("✅ Reply posted successfully!");
      closeReplyModal();

      await loadTweets();

      const repliesContainer = document.getElementById(`replies-${tweetId}`);
      if (repliesContainer) {
        repliesContainer.innerHTML = "";
        await toggleReplies(tweetId);
      }

      alert("Reply posted successfully!");
    } else {
      throw new Error(data.message || "Failed to post reply");
    }
  } catch (error) {
    console.error("❌ Error posting reply:", error);
    alert("Failed to post reply. Please try again.");
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y";

  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo";

  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d";

  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h";

  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m";

  return Math.floor(seconds) + "s";
}

function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ============================================
// LOGOUT
// ============================================
function setupLogout() {
  console.log("🚪 Setting up logout...");
  const logoutBtn = document.querySelector(".logout-btn");

  if (!logoutBtn) {
    console.log("⚠️ No logout button found");
    return;
  }

  logoutBtn.addEventListener("click", function () {
    console.log("🚪 Logout clicked");

    if (confirm("Are you sure you want to logout?")) {
      console.log("✅ User confirmed logout");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      console.log("🗑️ Cleared localStorage");
      window.location.href = "/login.html";
    } else {
      console.log("❌ User cancelled logout");
    }
  });

  console.log("✅ Logout setup complete");
}

// ============================================
// INITIALIZE DASHBOARD
// ============================================
async function initDashboard() {
  console.log("🚀 Initializing dashboard...");
  console.log("=".repeat(50));

  const isAuthenticated = await checkAuthentication();

  if (!isAuthenticated) {
    console.log("❌ Authentication failed - stopping initialization");
    return;
  }

  console.log("✅ User authenticated - continuing initialization");

  loadUserData();
  setupTweetComposer();
  setupNavigation();
  setupLogout();

  await loadTweets();

  const postButton = document.querySelector(".post-button");
  if (postButton) {
    postButton.addEventListener("click", postTweet);
    console.log("✅ Post button connected");
  }

  console.log("=".repeat(50));
  console.log("✅ Dashboard initialization complete!");
}

// ============================================
// EVENT LISTENERS
// ============================================
document.addEventListener("DOMContentLoaded", initDashboard);

// Close modal when clicking outside
document.addEventListener("click", function (e) {
  const modal = document.getElementById("reply-modal");
  if (e.target === modal) {
    closeReplyModal();
  }
});
