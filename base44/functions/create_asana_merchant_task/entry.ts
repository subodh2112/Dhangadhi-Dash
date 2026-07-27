import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const application_id = body.application_id || body.id || "";

    if (!application_id) {
      return Response.json({ success: false, error: "Missing application_id" }, { status: 400 });
    }

    // Fetch the merchant application
    let application;
    try {
      application = await base44.asServiceRole.entities.MerchantApplication.get(application_id);
    } catch {
      return Response.json({ success: false, error: "Application not found" }, { status: 404 });
    }
    if (!application) {
      return Response.json({ success: false, error: "Application not found" }, { status: 404 });
    }

    // Get Asana OAuth connection
    const { accessToken } = await base44.asServiceRole.connectors.getConnection("asana");

    // Get workspaces
    const workspacesRes = await fetch("https://app.asana.com/api/1.0/workspaces", {
      headers: { Authorization: "Bearer " + accessToken }
    });
    const workspacesData = await workspacesRes.json();
    const workspaces = workspacesData.data || [];
    if (workspaces.length === 0) {
      return Response.json({ success: false, error: "No Asana workspaces found" }, { status: 400 });
    }
    const workspaceGid = workspaces[0].gid;

    // Create the onboarding task
    const taskName = "Partner Application: " + (application.business_name || "New Business");
    const taskNotes = [
      "Business: " + (application.business_name || "N/A"),
      "Owner: " + (application.owner_name || "N/A"),
      "Phone: " + (application.phone_number || "N/A"),
      "Email: " + (application.email || "N/A"),
      "Category: " + (application.store_category || "N/A"),
      "Address: " + (application.business_address || "N/A"),
      "PAN: " + (application.pan_number || "N/A"),
      "Application #: " + (application.application_number || application_id),
      "",
      "Review the application in the admin dashboard to approve or reject.",
    ].join("\n");

    const createRes = await fetch("https://app.asana.com/api/1.0/tasks", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + accessToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        data: {
          name: taskName,
          notes: taskNotes,
          workspace: workspaceGid,
        }
      })
    });

    const createData = await createRes.json();

    if (!createRes.ok) {
      return Response.json({ success: false, error: "Failed to create Asana task", details: createData }, { status: 500 });
    }

    return Response.json({
      success: true,
      task_gid: createData.data?.gid || null,
      task_name: taskName,
      workspace: workspaces[0].name
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});