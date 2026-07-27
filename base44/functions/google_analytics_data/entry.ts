import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_analytics');

    // 1. List account summaries to find GA4 properties
    const adminResponse = await fetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const adminData = await adminResponse.json();

    if (adminData.error) {
      return Response.json({ error: `Google Analytics Admin API error: ${adminData.error.message}` });
    }

    if (!adminData.accountSummaries || adminData.accountSummaries.length === 0) {
      return Response.json({
        error: 'No Google Analytics accounts found. Please ensure your Google account has access to at least one GA4 property.'
      });
    }

    // Find the first GA4 property
    let propertyId = null;
    let propertyName = null;
    const properties = [];
    for (const account of adminData.accountSummaries) {
      if (account.propertySummaries) {
        for (const prop of account.propertySummaries) {
          const id = prop.property.replace('properties/', '');
          properties.push({ id, name: prop.displayName });
          if (!propertyId) {
            propertyId = id;
            propertyName = prop.displayName;
          }
        }
      }
    }

    if (!propertyId) {
      return Response.json({
        error: 'No GA4 properties found. Please create a GA4 property in your Google Analytics account.'
      });
    }

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    const baseUrl = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}`;

    // 2. Run all reports in parallel
    const [realtimeRes, trendsRes, pagesRes, sourcesRes] = await Promise.all([
      // Real-time active users + top screens
      fetch(`${baseUrl}:runRealtimeReport`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          dimensions: [{ name: 'unifiedScreenName' }],
          metrics: [{ name: 'activeUsers' }],
          limit: 10,
          orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }]
        })
      }),
      // 7-day traffic trends by date
      fetch(`${baseUrl}:runReport`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'date' }],
          metrics: [
            { name: 'sessions' },
            { name: 'totalUsers' },
            { name: 'screenPageViews' }
          ],
          orderBys: [{ dimension: { dimensionName: 'date' } }]
        })
      }),
      // Top pages (popular items)
      fetch(`${baseUrl}:runReport`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'pageTitle' }, { name: 'pagePath' }],
          metrics: [{ name: 'screenPageViews' }, { name: 'totalUsers' }],
          limit: 10,
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }]
        })
      }),
      // Traffic sources
      fetch(`${baseUrl}:runReport`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'sessionDefaultChannelGroup' }],
          metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
          limit: 10,
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }]
        })
      })
    ]);

    const [realtimeData, trendsData, pagesData, sourcesData] = await Promise.all([
      realtimeRes.json(),
      trendsRes.json(),
      pagesRes.json(),
      sourcesRes.json()
    ]);

    // Helper to extract rows
    const extractRows = (data) => {
      if (!data || !data.rows) return [];
      return data.rows.map(row => ({
        dimensions: row.dimensionValues.map(d => d.value),
        metrics: row.metricValues.map(m => m.value)
      }));
    };

    // Format trends data for charts
    const trendRows = extractRows(trendsData).map(row => ({
      date: row.dimensions[0],
      sessions: parseInt(row.metrics[0]) || 0,
      users: parseInt(row.metrics[1]) || 0,
      pageViews: parseInt(row.metrics[2]) || 0
    }));

    return Response.json({
      property: { id: propertyId, name: propertyName },
      properties,
      realtime: {
        activeUsers: parseInt(realtimeData?.totals?.[0]?.metricValues?.[0]?.value || '0'),
        topPages: extractRows(realtimeData)
      },
      trends: trendRows,
      topPages: extractRows(pagesData),
      trafficSources: extractRows(sourcesData),
      errors: {
        realtime: realtimeData?.error?.message || null,
        trends: trendsData?.error?.message || null,
        pages: pagesData?.error?.message || null,
        sources: sourcesData?.error?.message || null
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});