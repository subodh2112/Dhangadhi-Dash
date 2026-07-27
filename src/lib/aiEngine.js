import { base44 } from "@/api/base44Client";

export async function getPersonalizedRecommendations(user, orders, favorites, stores, products) {
  const orderHistory = orders.slice(0, 10).map(o => ({ store: o.store_name, items: o.items, total: o.total_amount }));
  const favNames = favorites.map(f => f.target_name || f.product_name).filter(Boolean).slice(0, 10);
  const storeNames = stores.slice(0, 20).map(s => s.name);
  const productList = products.slice(0, 40).map(p => ({ name: p.name, price: p.price, store: p.store_name, category: p.category, is_spicy: p.is_spicy, food_type: p.food_type }));

  const prompt = `You are a food recommendation AI for Dhangadhi Dash, a delivery app in Dhangadhi, Nepal.
User: ${user?.full_name || "Customer"}
Previous orders: ${JSON.stringify(orderHistory)}
Favorites: ${JSON.stringify(favNames)}
Current time: ${new Date().toLocaleString()} (${getDayPart()})
Available stores: ${JSON.stringify(storeNames)}
Available products: ${JSON.stringify(productList)}

Based on order history, favorites, time of day, and preferences, recommend exactly 4 items. Mix products and stores. Make recommendations relevant to the current time of day.
Return JSON with recommendations array, each having: type ("product" or "store"), name, reason (personalized), price (0 for stores).`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        recommendations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string" },
              name: { type: "string" },
              reason: { type: "string" },
              price: { type: "number" }
            }
          }
        }
      }
    }
  });
  return result;
}

export async function smartSearch(query, products, stores) {
  const productList = products.slice(0, 60).map(p => ({ id: p.id, name: p.name, price: p.price, store: p.store_name, category: p.category, food_type: p.food_type, is_spicy: p.is_spicy, is_available: p.is_available }));
  const storeList = stores.slice(0, 30).map(s => ({ id: s.id, name: s.name, category: s.category, address: s.address, is_open: s.is_open }));

  const prompt = `You are a smart search assistant for Dhangadhi Dash delivery app in Dhangadhi, Nepal.
User query: "${query}"
Available products: ${JSON.stringify(productList)}
Available stores: ${JSON.stringify(storeList)}

Understand the user's intent (food type, budget, location, dietary preferences, spice level) and return matching product and store IDs.
Return JSON with: products (array of product IDs), stores (array of store IDs), interpretation (brief explanation of what user wants).`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        products: { type: "array", items: { type: "string" } },
        stores: { type: "array", items: { type: "string" } },
        interpretation: { type: "string" }
      }
    }
  });
  return result;
}

export async function getChatbotResponse(message, user, context) {
  const prompt = `You are a helpful support assistant for Dhangadhi Dash, a delivery app in Dhangadhi, Nepal.
User: ${user?.full_name || "Customer"} (${user?.email || "unknown"})
User message: "${message}"
Context: ${JSON.stringify(context || {})}

Answer the user's question about orders, delivery tracking, refunds, payments, or general FAQs. Be concise and helpful.
If you cannot resolve the issue or it requires human intervention, set should_create_ticket to true and suggest a category and priority.
Return JSON with: response (your answer), should_create_ticket (boolean), ticket_category (string), ticket_priority (low/medium/high/urgent).`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        response: { type: "string" },
        should_create_ticket: { type: "boolean" },
        ticket_category: { type: "string" },
        ticket_priority: { type: "string" }
      }
    }
  });
  return result;
}

export async function calculateFraudScore(userId, userType, userData, orders, complaints, refunds) {
  const prompt = `You are a fraud detection AI for Dhangadhi Dash delivery platform.
User ID: ${userId}
User type: ${userType}
User data: ${JSON.stringify(userData || {})}
Recent orders: ${JSON.stringify(orders?.slice(0, 10)?.map(o => ({ total: o.total_amount, status: o.status, date: o.created_date, payment: o.payment_method })) || [])}
Complaints filed: ${complaints?.length || 0}
Refunds requested: ${refunds?.length || 0}

Analyze for fraud patterns: fake accounts, refund abuse, coupon abuse, fake orders, location manipulation, rating manipulation.
Assign a fraud score (0-100, higher = more risky) and risk level.
Return JSON with: fraud_score (number 0-100), risk_level ("low"/"medium"/"high"/"critical"), factors (array of strings), recommendation (string).`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        fraud_score: { type: "number" },
        risk_level: { type: "string" },
        factors: { type: "array", items: { type: "string" } },
        recommendation: { type: "string" }
      }
    }
  });
  return result;
}

export async function predictDemand(orders, riders) {
  const orderTimes = orders.slice(0, 100).map(o => ({ time: o.created_date, store: o.store_name, area: o.delivery_address }));
  const prompt = `You are a demand prediction AI for Dhangadhi Dash delivery platform in Dhangadhi, Nepal.
Recent orders (last 7 days): ${JSON.stringify(orderTimes)}
Active riders: ${riders?.length || 0}

Predict: busy hours by time of day, popular areas, high-demand restaurants, and rider staffing recommendations.
Return JSON with: busy_hours (array of {hour, expected_demand}), popular_areas (array of strings), high_demand_stores (array of strings), rider_recommendation (string), forecast_summary (string).`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        busy_hours: { type: "array", items: { type: "object", properties: { hour: { type: "number" }, expected_demand: { type: "string" } } } },
        popular_areas: { type: "array", items: { type: "string" } },
        high_demand_stores: { type: "array", items: { type: "string" } },
        rider_recommendation: { type: "string" },
        forecast_summary: { type: "string" }
      }
    }
  });
  return result;
}

export async function getMerchantInsights(storeId, orders, products) {
  const orderData = orders.slice(0, 50).map(o => ({ items: o.items, total: o.total_amount, date: o.created_date }));
  const productData = products.map(p => ({ name: p.name, price: p.price, stock: p.stock, is_popular: p.is_popular, is_bestseller: p.is_bestseller, category: p.category }));

  const prompt = `You are a merchant intelligence AI for Dhangadhi Dash delivery platform.
Store ID: ${storeId}
Recent orders: ${JSON.stringify(orderData)}
Products: ${JSON.stringify(productData)}

Provide actionable insights: best selling products, slow-moving products, pricing recommendations, peak order times, stock alerts, and growth suggestions.
Return JSON with: best_sellers (array), slow_products (array), pricing_suggestions (array of {product, current_price, suggested_price, reason}), peak_times (array), stock_alerts (array of {product, alert}), suggestions (array).`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        best_sellers: { type: "array", items: { type: "string" } },
        slow_products: { type: "array", items: { type: "string" } },
        pricing_suggestions: { type: "array", items: { type: "object", properties: { product: { type: "string" }, current_price: { type: "number" }, suggested_price: { type: "number" }, reason: { type: "string" } } } },
        peak_times: { type: "array", items: { type: "string" } },
        stock_alerts: { type: "array", items: { type: "object", properties: { product: { type: "string" }, alert: { type: "string" } } } },
        suggestions: { type: "array", items: { type: "string" } }
      }
    }
  });
  return result;
}

export async function predictETA(order, store, rider) {
  const prompt = `You are a delivery time prediction AI for Dhangadhi Dash.
Order: ${JSON.stringify({ store: order?.store_name, items: order?.items, delivery_address: order?.delivery_address })}
Store: ${JSON.stringify({ name: store?.name, delivery_minutes: store?.delivery_minutes, category: store?.category })}
Rider: ${JSON.stringify({ name: rider?.name, vehicle: rider?.vehicle_type })}
Current time: ${new Date().toLocaleString()}

Predict estimated delivery time considering preparation, travel distance, traffic patterns, and order complexity.
Return JSON with: eta_minutes (number), preparation_minutes (number), travel_minutes (number), confidence ("low"/"medium"/"high").`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        eta_minutes: { type: "number" },
        preparation_minutes: { type: "number" },
        travel_minutes: { type: "number" },
        confidence: { type: "string" }
      }
    }
  });
  return result;
}

export async function processVoiceOrder(transcript, products) {
  const productList = products.slice(0, 50).map(p => ({ id: p.id, name: p.name, price: p.price, store: p.store_name }));
  const prompt = `You are a voice ordering AI for Dhangadhi Dash delivery app.
User said: "${transcript}"
Available products: ${JSON.stringify(productList)}

Understand what the user wants to order and match to available products. Handle quantities.
Return JSON with: matched_products (array of {product_id, name, quantity}), confirmation_message (string confirming what will be added to cart).`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        matched_products: { type: "array", items: { type: "object", properties: { product_id: { type: "string" }, name: { type: "string" }, quantity: { type: "number" } } } },
        confirmation_message: { type: "string" }
      }
    }
  });
  return result;
}

export async function generateMarketingActions(segments, campaigns) {
  const segmentSummary = Object.entries(segments).map(([k, v]) => ({ segment: k, count: v }));
  const prompt = `You are a marketing automation AI for Dhangadhi Dash delivery platform in Dhangadhi, Nepal.
User segment counts: ${JSON.stringify(segmentSummary)}
Active campaigns: ${JSON.stringify(campaigns.map(c => c.campaign_name))}

Generate automated marketing actions for each user segment. Consider Nepali festivals and local context.
Return JSON with: actions (array of {segment, action, message, discount_percent}).`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        actions: { type: "array", items: { type: "object", properties: { segment: { type: "string" }, action: { type: "string" }, message: { type: "string" }, discount_percent: { type: "number" } } } }
      }
    }
  });
  return result;
}

export async function getBusinessInsights(orders, revenue, riders, stores) {
  const recentOrders = orders.slice(0, 30).map(o => ({ date: o.created_date, amount: o.total_amount, store: o.store_name, status: o.status }));
  const prompt = `You are a business intelligence AI for Dhangadhi Dash delivery platform in Dhangadhi, Nepal.
Total orders: ${orders.length}
Total revenue: Rs ${revenue.toLocaleString()}
Active riders: ${riders?.length || 0}
Active stores: ${stores?.length || 0}
Recent order trends: ${JSON.stringify(recentOrders)}

Provide: growth prediction, revenue forecast, customer trends, delivery efficiency assessment, and 3-5 actionable recommendations.
Return JSON with: growth_prediction (string), revenue_forecast (string), customer_trends (array), delivery_efficiency (string), recommendations (array).`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        growth_prediction: { type: "string" },
        revenue_forecast: { type: "string" },
        customer_trends: { type: "array", items: { type: "string" } },
        delivery_efficiency: { type: "string" },
        recommendations: { type: "array", items: { type: "string" } }
      }
    }
  });
  return result;
}

function getDayPart() {
  const h = new Date().getHours();
  if (h < 10) return "morning";
  if (h < 14) return "lunch";
  if (h < 17) return "afternoon";
  if (h < 21) return "evening/dinner";
  return "late night";
}