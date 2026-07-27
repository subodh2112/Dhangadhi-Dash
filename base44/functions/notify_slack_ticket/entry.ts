import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const SLACK_CHANNEL_ID = "C0BJMT3T84C"; // #all-dhangadhi-dash

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const ticket = body.ticket || body;

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("slackbot");

    const priorityEmoji = { urgent: "🔴", high: "🟠", medium: "🟡", low: "🟢" };
    const emoji = priorityEmoji[ticket.priority] || "🟡";

    const message = {
      channel: SLACK_CHANNEL_ID,
      username: "DDash Support",
      icon_emoji: ":headphones:",
      text: `🎫 New Support Ticket: ${ticket.subject || "No subject"}`,
      blocks: [
        {
          type: "header",
          text: { type: "plain_text", text: "🎫 New Support Ticket" }
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*Subject:*\n${ticket.subject || "No subject"}` },
            { type: "mrkdwn", text: `*Priority:* ${emoji} ${ticket.priority || "medium"}` },
            { type: "mrkdwn", text: `*Category:*\n${(ticket.category || "other").replace(/_/g, " ")}` },
            { type: "mrkdwn", text: `*Submitted by:*\n${ticket.user_name || "Unknown user"}` }
          ]
        },
        {
          type: "section",
          text: { type: "mrkdwn", text: `*Description:*\n${ticket.description || "No description provided"}` }
        },
        {
          type: "context",
          elements: [
            { type: "mrkdwn", text: `Ticket ID: ${ticket.ticket_id || "N/A"} · Dhangadhi Dash Support` }
          ]
        }
      ]
    };

    const postRes = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(message)
    });
    const postData = await postRes.json();

    if (!postData.ok) {
      return Response.json({ error: postData.error }, { status: 500 });
    }

    return Response.json({ success: true, channel: SLACK_CHANNEL_ID, ts: postData.ts });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});