import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get Instagram OAuth connection
    const { accessToken } = await base44.asServiceRole.connectors.getConnection("instagram");

    // Get user ID and username
    const meRes = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`);
    const meData = await meRes.json();
    const userId = meData.id;
    const username = meData.username;

    if (!userId) {
      return Response.json({ success: false, error: "Could not get Instagram user ID" }, { status: 400 });
    }

    // Get recent media (last 10 posts)
    const mediaRes = await fetch(
      `https://graph.instagram.com/${userId}/media?fields=id,caption,timestamp&limit=10&access_token=${accessToken}`
    );
    const mediaData = await mediaRes.json();
    const media = mediaData.data || [];

    const autoReplyMessage = "Hi! 👋 Thanks for your comment! For quick assistance, please use our in-app support chat or visit our help center. We're here to help! 🛍️🛵";

    let repliedCount = 0;
    let processedComments = 0;
    const replies = [];

    for (const post of media) {
      // Get comments on this post
      const commentsRes = await fetch(
        `https://graph.instagram.com/${post.id}/comments?fields=id,text,timestamp,username&access_token=${accessToken}`
      );
      const commentsData = await commentsRes.json();
      const comments = commentsData.data || [];

      for (const comment of comments) {
        processedComments++;

        // Only reply to comments from the last 24 hours
        const commentTime = new Date(comment.timestamp).getTime();
        const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
        if (commentTime < dayAgo) continue;

        // Check if we already replied (check for existing replies)
        const repliesRes = await fetch(
          `https://graph.instagram.com/${comment.id}/replies?fields=id,username&access_token=${accessToken}`
        );
        const repliesData = await repliesRes.json();
        const existingReplies = repliesData.data || [];

        // Skip if already has replies
        if (existingReplies.length > 0) continue;

        // Post a reply to the comment
        const replyBody = new URLSearchParams();
        replyBody.append("message", autoReplyMessage);
        replyBody.append("access_token", accessToken);

        const replyRes = await fetch(
          `https://graph.instagram.com/${comment.id}/replies`,
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: replyBody
          }
        );

        if (replyRes.ok) {
          repliedCount++;
          replies.push({
            comment_id: comment.id,
            comment_text: (comment.text || "").substring(0, 80),
            username: comment.username,
            post_id: post.id
          });
        }
      }
    }

    return Response.json({
      success: true,
      username,
      posts_checked: media.length,
      comments_processed: processedComments,
      replies_sent: repliedCount,
      replies
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});