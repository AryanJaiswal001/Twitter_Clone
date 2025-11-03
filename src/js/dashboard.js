// ============================================
// CONFIGURATION
// ============================================
const API_BASE_URL = "http://localhost:4000";
let currentUser = null;
// Track which tweet is being replied to
let replyingToTweetId = null;

console.log(
  "🚀 Dashboard script loaded - v16 (EMOJI FIXED) - " +
    new Date().toLocaleTimeString()
);
console.log("🔧 API Base URL:", API_BASE_URL);

// ============================================
// AUTHENTICATION
// ============================================
async function checkAuthentication() {
  console.log("🔐 Checking authentication...");
  console.log("📍 Current URL:", window.location.href);

  const token = localStorage.getItem("token");
  console.log("🔑 Token exists:", !!token);
  console.log(
    "🔑 Token value (first 20 chars):",
    token ? token.substring(0, 20) + "..." : "null"
  );

  if (!token) {
    console.log("❌ No token found - redirecting to login");
    redirectToLogin();
    return false;
  }

  console.log("✅ Token found - verifying with server...");

  try {
    console.log("📡 Fetching:", `${API_BASE_URL}/api/auth/me`);
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("📥 Response status:", response.status);
    const data = await response.json();
    console.log("📦 Response data:", data);

    if (!data.success) {
      console.error("❌ Server returned success=false");
      throw new Error("Invalid token");
    }

    currentUser = data.data.user;
    console.log("✅ Authentication successful!");
    console.log("👤 User data:", {
      id: currentUser._id,
      username: currentUser.username,
      email: currentUser.email,
      fullName: currentUser.fullName,
    });
    return true;
  } catch (error) {
    console.error("❌ Authentication failed:", error);
    console.error("❌ Error details:", error.message);
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
  console.log("👤 Current user:", currentUser);

  if (!currentUser) {
    console.error("❌ No user data available!");
    return;
  }

  const userName = document.querySelector(".user-info .user-name");
  const userHandle = document.querySelector(".user-info .user-handle");

  console.log("🔍 Found userName element:", !!userName);
  console.log("🔍 Found userHandle element:", !!userHandle);

  if (userName) {
    const displayName =
      currentUser.fullName || currentUser.fullname || currentUser.username;
    userName.textContent = displayName;
    console.log("✅ Updated user name to:", displayName);
  } else {
    console.warn("⚠️ .user-info .user-name element not found!");
  }

  if (userHandle) {
    userHandle.textContent = `@${currentUser.username}`;
    console.log("✅ Updated user handle to: @" + currentUser.username);
  } else {
    console.warn("⚠️ .user-info .user-handle element not found!");
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
    updateCharacterCount();
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

  //Get poll data
  const pollData = getPollData();

  //Allow tweets with only media
  if (!content && selectedMediaFiles.length === 0) {
    alert("Please write something or attach media before posting!");
    return;
  }

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
    //Step 1:Upload media first (in any)
    let mediaData = [];
    if (selectedMediaFiles.length > 0) {
      postButton.textContent = "Uploading media...";
      mediaData = await uploadMediaToServer();
      console.log("Media uploaded", mediaData.length, "files");
    }

    //Step-2 Post tweet with media URL's
    postButton.textContent = "Posting tweet...";

    const tweetData = {
      content: content,
      media: mediaData,
    };

    // Only add poll if it exists
    if (pollData) {
      tweetData.poll = pollData;
    }

    //Posting it to backend
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/api/tweets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(tweetData),
    });

    const data = await response.json();
    console.log("📬 Server response:", data);

    if (data.success) {
      console.log("✅ Tweet posted successfully!");

      textarea.value = "";
      charText.textContent = "280";
      charText.style.color = "#1da1f2";
      postButton.textContent = "Post";

      //Clear media
      selectedMediaFiles = [];
      document.getElementById("media-preview-container").style.display = "none";
      document.getElementById("media-upload").value = "";

      //Clear poll
      clearPollUI();

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

  const authorAvatar =
    author.avatar ||
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%231d9bf0'/%3E%3Ctext x='50' y='50' font-size='50' fill='white' text-anchor='middle' dominant-baseline='central' font-family='Arial'%3E👤%3C/text%3E%3C/svg%3E";

  const timeAgo = getTimeAgo(new Date(tweet.createdAt));
  const safeContent = tweet.content ? escapeHTML(tweet.content.trim()) : "";
  const isOwnTweet = currentUser && tweet.author._id === currentUser._id;

  // Media rendering
  let mediaHTML = "";
  if (tweet.media && Array.isArray(tweet.media) && tweet.media.length > 0) {
    console.log(
      `  📷 Tweet has ${tweet.media.length} media file(s):`,
      tweet.media
    );

    const mediaCount = tweet.media.length;
    const gridClass =
      mediaCount === 1 ? "single" : mediaCount === 2 ? "double" : "multiple";

    mediaHTML = `
    <div class="tweet-media ${gridClass}" style="margin-top:12px; display:grid; gap:2px; border-radius:16px; overflow:hidden; ${
      mediaCount === 1
        ? "grid-template-columns: 1fr;"
        : mediaCount === 2
        ? "grid-template-columns: 1fr 1fr;"
        : "grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr;"
    }">
    ${tweet.media
      .map((media, index) => {
        console.log(`    🖼️ Media ${index + 1}:`, media);

        if (media.type === "image") {
          return `
        <div style="${
          mediaCount > 2 && index === 0 ? "grid-row: span 2;" : ""
        } position: relative;">
          <img src="${media.url}" alt="${media.altText || "Tweet image"}"
            style="width: 100%; height: 100%; object-fit: cover; cursor: pointer; display: block;"
            onclick="openMediaModal('${media.url}', 'image')" 
            onerror="console.error('Failed to load image:', '${media.url}')" />
        </div>
        `;
        } else if (media.type === "video") {
          return `
        <div style="${
          mediaCount > 2 && index === 0 ? "grid-row: span 2;" : ""
        } position: relative;">
          <video src="${media.url}" controls
            style="width: 100%; height: 100%; object-fit: cover; display: block;"
            onerror="console.error('Failed to load video:', '${media.url}')">
            Your browser does not support the video tag.
          </video>
        </div>
        `;
        }
        return "";
      })
      .join("")}
    </div>
    `;
  }

  // ✅ FIXED: Poll rendering with proper template string syntax
  let pollHTML = "";
  if (tweet.poll && tweet.poll.options && tweet.poll.options.length > 0) {
    console.log(
      `  🗳️ Tweet has a poll with ${tweet.poll.options.length} options`
    );

    const totalVotes = tweet.poll.options.reduce(
      (sum, option) => sum + option.votes.length,
      0
    );
    const hasVoted = tweet.poll.options.some((option) =>
      option.votes.includes(currentUser._id)
    );
    const pollEnded =
      tweet.poll.endsAt && new Date() > new Date(tweet.poll.endsAt);

    pollHTML = `
    <div class="tweet-poll" style="margin-top:12px; padding:12px; border:1px solid #eff3f4; border-radius:12px;">
      ${tweet.poll.options
        .map((option, index) => {
          const voteCount = option.votes.length;
          const percentage =
            totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(1) : 0;
          const isUserVote = option.votes.includes(currentUser._id);

          if (hasVoted || pollEnded) {
            // Show results
            return `
              <div class="poll-option-result" style="margin-bottom:8px; position:relative; cursor:default;">
                <div style="background: ${
                  isUserVote ? "#1da1f2" : "#eff3f4"
                }; border-radius:4px; padding:12px; position:relative; overflow:hidden;">
                  <div style="position:absolute; left:0; top:0; bottom:0; width:${percentage}%; background:${
              isUserVote ? "#1a8cd8" : "#d7dbdc"
            }; transition:width 0.3s ease;"></div>
                  <div style="position:relative; display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-weight: ${
                      isUserVote ? "bold" : "normal"
                    };">
                      ${isUserVote ? "✓ " : ""}${escapeHTML(option.text)}
                    </span>
                    <span style="font-weight: bold;">${percentage}%</span>
                  </div>
                </div>
              </div>
            `;
          } else {
            // Show voteable options
            return `
              <button class="poll-option" onclick="voteOnPoll('${
                tweet._id
              }', ${index})" 
  style="width: 100%; margin-bottom: 8px; padding: 12px; border: 1px solid #eff3f4; 
  border-radius: 4px; background: white; cursor: pointer; text-align: left; 
  transition: background 0.2s; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px;">
                ${escapeHTML(option.text)}
              </button>
            `;
          }
        })
        .join("")}
      <div style="margin-top: 12px; color: #536471; font-size: 13px; display: flex; justify-content: space-between;">
        <span>${totalVotes} ${totalVotes === 1 ? "vote" : "votes"}</span>
        <span>${
          pollEnded
            ? "Final results"
            : getTimeRemaining(new Date(tweet.poll.endsAt))
        }</span>
      </div>
    </div>
    `;
  }

  // Calculate tweet stats and state
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
      <img src="${authorAvatar}" alt="Profile" class="profile-pic" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27%3E%3Ccircle cx=%2750%27 cy=%2750%27 r=%2750%27 fill=%27%231d9bf0%27/%3E%3Ctext x=%2750%27 y=%2750%27 font-size=%2750%27 fill=%27white%27 text-anchor=%27middle%27 dominant-baseline=%27central%27 font-family=%27Arial%27%3E👤%3C/text%3E%3C/svg%3E'" />
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
        ${safeContent ? `<p class="post-text">${safeContent}</p>` : ""}
        ${mediaHTML}
        ${pollHTML}
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
  console.log("🔗 API URL:", `${API_BASE_URL}/api/tweets`);

  const postsContainer = document.querySelector(".posts");
  console.log("🔍 Posts container found:", !!postsContainer);

  if (!postsContainer) {
    console.error("❌ Posts container not found!");
    console.error("❌ Available elements:", {
      posts: document.querySelectorAll(".posts").length,
      mainContent: document.querySelectorAll(".main-content").length,
      container: document.querySelectorAll(".container").length,
    });
    return;
  }

  console.log("⏳ Showing loading spinner...");
  postsContainer.innerHTML = `
    <div style="text-align:center; padding:40px; color:#536471;">
      <i class="fas fa-spinner fa-spin" style="font-size:32px;"></i>
      <p style="margin-top:16px;">Loading tweets...</p>
    </div>
  `;

  try {
    const token = localStorage.getItem("token");
    console.log(
      "🔑 Using token (first 20 chars):",
      token ? token.substring(0, 20) + "..." : "null"
    );

    console.log("📡 Fetching tweets...");
    const response = await fetch(`${API_BASE_URL}/api/tweets`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("📥 Response status:", response.status);
    const data = await response.json();
    console.log("📦 Tweets response:", data);

    if (data.success) {
      const tweets = data.data.tweets;
      console.log(`✅ Loaded ${tweets.length} tweets`);

      if (tweets.length === 0) {
        console.log("ℹ️ No tweets found - showing empty state");
        postsContainer.innerHTML = `
          <div style="text-align:center; padding:40px; color:#536471;">
            <i class="fas fa-feather-alt" style="font-size:48px; margin-bottom:16px;"></i>
            <h3 style='color:#e7e9ea; margin-bottom:8px;'>No tweets yet</h3>
            <p>Be the first to post something!</p>
          </div>
        `;
      } else {
        console.log("✅ Rendering tweets...");
        postsContainer.innerHTML = "";
        tweets.forEach((tweet, index) => {
          console.log(`  Rendering tweet ${index + 1}/${tweets.length}:`, {
            id: tweet._id,
            author: tweet.author?.username,
            content: tweet.content?.substring(0, 50),
          });
          const tweetHTML = createTweetHTML(tweet);
          postsContainer.insertAdjacentHTML("beforeend", tweetHTML);
        });
        console.log("✅ All tweets rendered successfully");
      }
    } else {
      console.error("❌ Server returned success=false:", data.message);
      throw new Error(data.message || "Failed to load tweets");
    }
  } catch (error) {
    console.error("❌ Error loading tweets:", error);
    console.error("❌ Error stack:", error.stack);
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
// Add this helper function after the getTimeAgo function

function getTimeRemaining(endDate) {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end - now;

  if (diff <= 0) {
    return "Poll ended";
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days} day${days > 1 ? "s" : ""} left`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""} left`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? "s" : ""} left`;
  } else {
    return "Less than a minute left";
  }
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

//MEDIA UPLOAD VARIBALES
let selectedMediaFiles = [];
let uploadedMediaUrls = [];

//SETUP MEDIA UPLOAD
function setupMediaUpload() {
  console.log("📷 Setting up media upload...");

  const mediaInput = document.getElementById("media-upload");
  const previewContainer = document.getElementById("media-preview-container");
  const previewDiv = document.getElementById("media-previews");

  if (!mediaInput) {
    console.error("Media input not found");
    return;
  }

  mediaInput.addEventListener("change", function (e) {
    const files = Array.from(e.target.files);
    console.log(`📁 ${files.length} files selected`);

    // Validate file count
    if (selectedMediaFiles.length + files.length > 4) {
      alert("Maximum 4 media files allowed");
      e.target.value = ""; // Reset input
      return;
    }

    // Validate each file
    for (const file of files) {
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        alert("Only images and videos are allowed");
        e.target.value = ""; // Reset input
        return;
      }

      const maxSize = file.type.startsWith("video/") ? 50 : 5;
      if (file.size > maxSize * 1024 * 1024) {
        alert(
          `${
            file.type.startsWith("video/") ? "Video" : "Image"
          } file too large. Max size: ${maxSize}MB`
        );
        e.target.value = ""; // Reset input
        return;
      }
    }

    // Add files to selected array
    selectedMediaFiles = [...selectedMediaFiles, ...files];
    console.log(`✅ Total media files: ${selectedMediaFiles.length}`);

    // Show previews
    displayMediaPreviews();
    if (previewContainer) {
      previewContainer.style.display = "block";
    }

    // Reset the input so same file can be selected again
    e.target.value = "";
  });

  console.log("✅ Media upload setup complete");
}

// ============================================
// POLL FUNCTIONALITY
// ============================================

let pollOptionCount = 2; // ✅ Only declaration needed

// Get poll data from UI
function getPollData() {
  const pollContainer = document.getElementById("poll-creation-container");

  if (!pollContainer || pollContainer.style.display === "none") {
    return null;
  }

  const options = [];
  for (let i = 1; i <= 4; i++) {
    const input = document.getElementById(`poll-option-${i}`);
    if (input && input.style.display !== "none" && input.value.trim()) {
      options.push({ text: input.value.trim() });
    }
  }

  if (options.length < 2) {
    return null;
  }

  const duration = parseInt(document.getElementById("poll-duration").value);

  return {
    options,
    duration,
  };
}

// Clear poll UI after posting
function clearPollUI() {
  const pollContainer = document.getElementById("poll-creation-container");
  if (pollContainer) {
    pollContainer.style.display = "none";
  }

  pollOptionCount = 2;

  for (let i = 1; i <= 4; i++) {
    const input = document.getElementById(`poll-option-${i}`);
    if (input) {
      input.value = "";
      if (i > 2) {
        input.style.display = "none";
      }
    }
  }

  const addOptionBtn = document.getElementById("add-poll-option-btn");
  if (addOptionBtn) {
    addOptionBtn.disabled = false;
    addOptionBtn.style.opacity = "1";
  }

  const mediaUploadBtn = document.querySelector('label[for="media-upload"]');
  if (mediaUploadBtn) {
    mediaUploadBtn.style.pointerEvents = "auto";
    mediaUploadBtn.style.opacity = "1";
  }
}

// Vote on a poll
async function voteOnPoll(tweetId, optionIndex) {
  try {
    console.log(
      `🗳️ Voting on poll for tweet ${tweetId}, option ${optionIndex}`
    );
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_BASE_URL}/api/tweets/${tweetId}/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ optionIndex }),
    });
    const data = await response.json();
    console.log("📦 Vote response:", data);
    if (data.success) {
      console.log("✅ Vote successful, reloading tweets...");
      await loadTweets();
      setTimeout(() => {
        const tweetElement = document.querySelector(
          `[data-tweet-id="${tweetId}"]`
        );
      }, 1000);
    } else {
      console.error("❌ Vote failed:", data.message);
      alert("Failed to vote on poll: " + data.message);
    }
  } catch (error) {
    console.error("❌ Error voting on poll:", error);
    alert("Failed to vote on poll. Please try again.");
  }
}

// Setup poll creation UI
function setupPollCreation() {
  console.log("🗳️ Setting up poll creation...");

  const pollButton = document.querySelector(".fa-poll");
  const pollContainer = document.getElementById("poll-creation-container");
  const addOptionBtn = document.getElementById("add-poll-option-btn");
  const removePollBtn = document.getElementById("remove-poll-btn");
  const mediaUploadBtn = document.querySelector('label[for="media-upload"]');

  if (!pollButton || !pollContainer) {
    console.error("❌ Poll elements not found");
    return;
  }

  pollButton.addEventListener("click", () => {
    const isVisible = pollContainer.style.display !== "none";

    if (isVisible) {
      // Hide poll
      pollContainer.style.display = "none";
      mediaUploadBtn.style.pointerEvents = "auto";
      mediaUploadBtn.style.opacity = "1";
    } else {
      // Show poll
      pollContainer.style.display = "block";
      // Hide media
      mediaUploadBtn.style.pointerEvents = "none";
      mediaUploadBtn.style.opacity = "0.5";
      // Clear any selected media
      selectedMediaFiles = [];
      displayMediaPreviews();
    }
  });

  // Add poll option
  addOptionBtn.addEventListener("click", () => {
    if (pollOptionCount < 4) {
      pollOptionCount++;
      const optionInput = document.getElementById(
        `poll-option-${pollOptionCount}`
      );
      if (optionInput) {
        optionInput.style.display = "block";
      }
      if (pollOptionCount === 4) {
        addOptionBtn.disabled = true;
        addOptionBtn.style.opacity = "0.5";
      }
    }
  });

  // Remove poll
  removePollBtn.addEventListener("click", () => {
    pollContainer.style.display = "none";
    pollOptionCount = 2;

    // Clear all inputs
    for (let i = 1; i <= 4; i++) {
      const input = document.getElementById(`poll-option-${i}`);
      if (input) {
        input.value = "";
        if (i > 2) {
          input.style.display = "none";
        }
      }
    }
    addOptionBtn.disabled = false;
    addOptionBtn.style.opacity = "1";
    mediaUploadBtn.style.pointerEvents = "auto";
    mediaUploadBtn.style.opacity = "1";
  });

  console.log("✅ Poll creation setup complete");
}

let emojiPicker=null;
let currentEmojiTarget=null;

//Initailise emoji picker
function setupEmojiPicker(){
  console.log("Setting up emoji picker")

  const emojiButton=document.getElementById("emoji-button");
  const emojiContainer=document.getElementById("emoji-picker-container");

  if(!emojiButton|| !emojiContainer)
  {
    console.log("Emoji elements not found")
    return
  }

  //Create the emoji picker element (only once)
  if(!emojiPicker){
    console.log("Creating emoji picker element")
    emojiPicker=document.getElementById("emoji-picker");

    if(!emojiPicker){
      console.log("Creating emoji picker element...")
      emojiPicker=document.createElement("emoji-picker");

      //Style picker
      emojiPicker.style.cssText=`
      --border-radius: 12px;
      --border-color:#eff3f4;
      width:350px;
      max-width:90vw;
      `;
    }
    emojiContainer.appendChild(emojiPicker)
    console.log("Emoji picker created");

    //Handle emoji selection
    emojiPicker.addEventListener("emoji-click",(e)=>{
      console.log("Emoji selected:",e.detail.unicode);
      insertEmojiAtCursor(e.detail.unicode);
    });

  }
   //Set initail target to main text area
   currentEmojiTarget=document.querySelector(".post");

   //Add click event listener 
   emojiButton.addEventListener("click",(e)=>{
    e.stopPropagation();
    console.log("Emoji button clicked");
    toggleEmojiPicker();
   });
    
    document.addEventListener("click",(e)=>{
      const container=document.getElementById("emoji-picker-container");
      const button=document.getElementById("emoji-button");

      if(
        container &&
        container.style.display==="block" &&
        !container.contains(e.target) && 
        !button.contains(e.target)
      ){
        console.log("Closing picker (Clicked outside");
        container.style.display="none";
      }
  });
   console.log("Emoji picker setup complete");

}

function insertEmojiAtCursor(emoji){
  if(!currentEmojiTarget)
  {
    console.error("No target text area found")
    return;
  }
  console.log(`Inserting emoji "${emoji}" into textarea`);

  //Current cursor position
  const cursorPos=currentEmojiTarget.selectionStart;
  const cursorEnd=currentEmojiTarget.selectionEnd;
  const text=currentEmojiTarget.value;

  console.log(`Cursor position ${cursorPos}-${cursorEnd}`);
  console.log(`Current text length: ${text.length}`);

  //Split text at cursor
  const before=text.substring(0,cursorPos);
  const after=text.substring(cursorEnd)

  //Insert emoji
  currentEmojiTarget.value=before+emoji+after;

  //Move cursor after emoji 
  const newCursorPos=cursorPos+emoji.length;
  currentEmojiTarget.selectionStart=newCursorPos;
  currentEmojiTarget.selectionEnd=newCursorPos;

  console.log(`Inserting at position ${cursorPos}`);
  console.log(`New cursor position ${newCursorPos}`);
  console.log(`New text length: ${currentEmojiTarget.value.length}`);

  currentEmojiTarget.focus();

  updateCharacterCount();

   const postButton = document.querySelector(".post-button");
   if (postButton && currentEmojiTarget.value.trim().length > 0) {
     postButton.disabled = false;
   }
}
function updateCharacterCount(){
  const textarea=document.querySelector(".post");
  const charText=document.querySelector("char-text");
  const postButton=document.querySelector(".post-button");

  if(!textarea||!charText) return;
    const remaining=280-textarea.value.length;
    charText.textContent=remaining;

    //Update color based on remaining 
    if(remaining<0){
      charText.style.color="$f4212e"; //Red
      if(postButton) postButton.disabled=true;
    } else if(remaining<20){
      charText.style.color="#ffd400"; //Yellow warning
    } else{
      charText.style.color="1da1f2";//Blue
    }

    if(postButton){
      const hasContent=textarea.value.trim().length>0 && remaining>=0;
      postButton.disabled=!hasContent;
    }
}


//Toggle emoji picker visibility
function toggleEmojiPicker(){
  const emojiContainer=document.getElementById("emoji-picker-container");

  if(!emojiContainer){
    console.error("Emoji container not found");
    return;
  }
  const isVisible=emojiContainer.style.display!=="none";

  if(isVisible){
    console.log("Hiding emoji picker");
    emojiContainer.style.display="none";
  }
  else{
    console.log("Showing emoji picker");
    emojiContainer.style.display="block";
  
  //Focus the textarea so user knows where emoji will go
  if(currentEmojiTarget){
    currentEmojiTarget.focus();
  }
  }
}

//Media preview
function displayMediaPreviews() {
  console.log("🖼️ Displaying media previews...");
  const previewsDiv = document.getElementById("media-previews");

  if (!previewsDiv) {
    console.error("❌ media-previews element not found!");
    return;
  }

  previewsDiv.innerHTML = "";
  console.log(`📸 Creating previews for ${selectedMediaFiles.length} files`);

  selectedMediaFiles.forEach((file, index) => {
    const reader = new FileReader();

    reader.onload = function (e) {
      console.log(`✅ Loaded preview for file ${index + 1}`);
      const previewItem = document.createElement("div");
      previewItem.style.cssText =
        "position: relative; border-radius:12px; overflow:hidden; aspect-ratio:1;";

      if (file.type.startsWith("image/")) {
        previewItem.innerHTML = `
        <img src="${e.target.result}" style="width:100%; height:100%; object-fit:cover;"/>
        <button onclick="removeMedia(${index})" style="position:absolute;top:4px;right:4px; background: rgba(0,0,0,0.7); color: white; border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
        <i class="fa-solid fa-xmark"></i>
        </button>`;
      } else if (file.type.startsWith("video/")) {
        previewItem.innerHTML = `
        <video src="${e.target.result}" style="width:100%; height:100%; object-fit:cover;"/>
        <button onclick="removeMedia(${index})" style="position:absolute;top:4px;right:4px; background: rgba(0,0,0,0.7); color: white; border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
        <i class="fa-solid fa-xmark"></i>
        </button>
         <div style="position: absolute; bottom: 8px; left: 8px; background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
            <i class="fa-solid fa-video"></i> Video
          </div>`;
      }
      previewsDiv.appendChild(previewItem);
    };
    reader.readAsDataURL(file);
  });
}

//Remove media from preview
function removeMedia(index) {
  console.log("🗑️ Removing media at index", index);
  selectedMediaFiles.splice(index, 1);

  if (selectedMediaFiles.length === 0) {
    const previewContainer = document.getElementById("media-preview-container");
    if (previewContainer) {
      previewContainer.style.display = "none";
    }
  }
  displayMediaPreviews();
}

//Upload media to server
async function uploadMediaToServer() {
  if (selectedMediaFiles.length === 0) {
    return [];
  }
  console.log("Uploading", selectedMediaFiles.length, "files to server...");

  const formData = new FormData();
  selectedMediaFiles.forEach((file) => {
    formData.append("media", file);
  });

  try {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_BASE_URL}/api/media/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    console.log("Upload response", data);

    if (data.success) {
      console.log("Media uploaded successfully!");
      return data.data.media;
    } else {
      throw new Error(data.message || "Failed to upload media");
    }
  } catch (error) {
    console.error("Error uploading media", error);
    throw error;
  }
}

// ============================================
// INITIALIZE DASHBOARD
// ============================================
async function initDashboard() {
  console.log("🚀 Initializing dashboard...");
  console.log("=".repeat(50));

  // Check authentication
  console.log("Step 1: Checking authentication...");
  const isAuthenticated = await checkAuthentication();

  if (!isAuthenticated) {
    console.log("❌ Authentication failed - stopping initialization");
    return;
  }

  console.log("✅ User authenticated - continuing initialization");
  console.log("Step 2: Showing dashboard UI...");

  // Show dashboard now that user is authenticated - with safety checks
  const loadingElement = document.querySelector(".auth-loading");
  if (loadingElement) {
    console.log("✅ Found .auth-loading element, hiding it...");
    loadingElement.style.display = "none";
  } else {
    console.warn("⚠️ .auth-loading element not found!");
  }

  console.log("✅ Adding 'authenticated' class to body...");
  document.body.classList.add("authenticated");

  // Verify body is visible
  const bodyDisplay = window.getComputedStyle(document.body).display;
  console.log("✅ Body display style:", bodyDisplay);

  console.log("Step 3: Loading user data...");
  loadUserData();

  console.log("Step 4: Setting up tweet composer...");
  setupTweetComposer();

  console.log("Step 5: Setting up media upload...");
  setupMediaUpload();

  console.log("Step 6: Setting up navigation...");
  setupNavigation();

  console.log("Step 7: Setting up poll creation");
  setupPollCreation();

  console.log("Step-8: Setting up emoji creation")
  setupEmojiPicker();

  console.log("Step 8: Setting up logout...");
  setupLogout();

  console.log("Step 9: Loading tweets...");
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
