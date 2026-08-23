export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/") {
      return new Response("PaperBridge is running. Send POST requests with image data.", {
        headers: { "Content-Type": "text/plain" }
      });
    }

    if (request.method === "POST" && url.pathname === "/") {
      return handleOCR(request, env);
    }

    return new Response("Not Found", { status: 404 });
  }
};

async function handleOCR(request, env) {
  try {
    const data = await request.json();

    if (!data?.image_base64) {
      return jsonResponse({ error: "Missing image_base64 field" }, 400);
    }

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a journal OCR and note structurer. Extract the text from the handwritten image and return a JSON response with this structure:\n\n" +
              '{\n  "filename": "type-notes-YYYY-MM-DD",\n  "body": "(Markdown formatted text)",\n  "attachment_link": "(path to uploaded image file)",\n  "hashtags": ["#example1", "#example2"]\n}\n\n' +
              "Use the format 'Type: __' and 'Date: __' to infer the type and date. If not found, default to 'Unknown' and today's date.\n\n" +
              "Suggest 2 relevant hashtags based on tone, purpose, and keywords. They should be short, lowercase, Obsidian-friendly (no spaces or symbols). Return them as an array exactly as shown above."
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Here is the image for OCR and structuring." },
              { type: "image_url", image_url: { url: `data:image/png;base64,${data.image_base64}` } }
            ]
          }
        ],
        max_tokens: 1500
      })
    });

    if (!openaiResponse.ok) {
      const errText = await openaiResponse.text();
      return jsonResponse({ error: "OpenAI API error", details: errText }, 500);
    }

    const openaiData = await openaiResponse.json();
    let gptOutput = openaiData.choices[0].message.content;

    gptOutput = gptOutput.replace(/^```json?\n?/, "").replace(/\n?```$/, "").trim();

    let noteData;
    try {
      noteData = JSON.parse(gptOutput);
    } catch (e) {
      return jsonResponse({ error: "Failed to parse GPT response", details: e.message, raw: gptOutput }, 500);
    }

    return jsonResponse(noteData);

  } catch (e) {
    return jsonResponse({ error: "Server error", details: e.message }, 500);
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
