exports.handler = async function(event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  const { email } = JSON.parse(event.body);

  if (!email) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Email required" }) };
  }

  try {
    const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/subscribers?email=eq.${encodeURIComponent(email)}&app=eq.story-ours&active=eq.true&select=email`, {
      headers: {
        "apikey": process.env.SUPABASE_PUBLISHABLE_KEY,
        "Authorization": `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
      },
    });

    const data = await res.json();
    const isSubscribed = Array.isArray(data) && data.length > 0;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ subscribed: isSubscribed }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
