/**
 * controllers/chatbotController.js
 * Proxies chat messages to the Anthropic API.
 * The API key lives ONLY on the server — never exposed to the browser.
 */

const ApiResponse = require("../utils/ApiResponse");
const logger      = require("../utils/logger");

// ── System prompt ─────────────────────────────────────────────────────────────
// This is the "personality" and knowledge base for the chatbot.
// Edit this whenever services, staff, or contact details change.
const SYSTEM_PROMPT = `You are a warm, helpful assistant for Samvardhan Bloom Rehabilitation Centre — a paediatric therapy and rehabilitation centre in Patna, Bihar, India.

ABOUT THE CENTRE:
- Full name: Samvardhan Bloom Rehabilitation Centre
- Address: Pillar No 15, B/60, Maurya Path, near Bailey Road, Ashokpuri, Khajpura, Patna, Bihar 800014
- Phone: +91 95872 46814
- WhatsApp: +91 95872 46814

LEAD THERAPIST:
- Dr. Sanit Ranjan — Pediatric Occupational Therapist
- Qualifications: Master of Occupational Therapy (MOT — Paediatrics, KMCH), Certified Sensory Integration Therapist (USC)
- Experience: 15+ years, 300+ children treated
- Specialisations: ASD, ADHD, Sensory Processing Disorder

SERVICES OFFERED:
1. Speech Therapy — communication, language development, speech clarity
2. Occupational Therapy — fine motor skills, daily living independence
3. ABA Therapy — behaviour therapy for autism and developmental delays
4. Child Psychology — emotional and behavioural support for children and families
5. ADHD Support — assessment and structured behaviour management
6. Learning Disability Programs — tailored academic and cognitive support
7. Behavioural Therapy — targeted behaviour intervention plans

KEY FACTS:
- 500+ children helped
- 98% parent satisfaction rate
- Bihar's premier paediatric rehabilitation centre
- Free initial consultation available
- Early intervention is strongly recommended

BOOKING:
- Users can book through the website's "Book Now" form
- Or call/WhatsApp: +91 95872 46814
- The team responds within 24 hours

RESPONSE RULES:
- Be warm, empathetic, and professional — parents reaching out are often anxious
- Keep replies concise: under 100 words unless a detailed explanation is genuinely needed
- Always end with a clear next step (book a consultation, call us, or fill the form)
- Never provide medical diagnoses or clinical advice — always recommend a professional consultation
- If asked something you don't know about the centre, say you'll have the team follow up
- Respond in the same language the user writes in (English or Hindi)
- Never make up staff names, prices, or services not listed above`;

// ── Controller ────────────────────────────────────────────────────────────────

/**
 * POST /api/chat
 * Public route — proxies messages to Anthropic API.
 *
 * Body: { messages: [{ role: "user"|"assistant", content: string }] }
 * Response: { success: true, data: { reply: string } }
 */
exports.chat = async (req, res, next) => {
  try {
    const { messages } = req.body;

    // ── Validate input ────────────────────────────────────────────────────────
    if (!Array.isArray(messages) || messages.length === 0) {
      return ApiResponse.error(res, 400, "messages array is required.");
    }

    if (messages.length > 40) {
      return ApiResponse.error(res, 400, "Conversation too long. Please start a new chat.");
    }

    // Sanitise: keep only role + content, strip anything unexpected
    const sanitised = messages
      .filter((m) => ["user", "assistant"].includes(m.role) && typeof m.content === "string")
      .map((m) => ({
        role:    m.role,
        content: m.content.slice(0, 2000), // cap per-message length
      }));

    // Anthropic requires messages to alternate and start with "user"
    if (sanitised[0]?.role !== "user") {
      return ApiResponse.error(res, 400, "First message must be from the user.");
    }

    // ── Call Anthropic API ────────────────────────────────────────────────────
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model:      "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system:     SYSTEM_PROMPT,
        messages:   sanitised,
      }),
    });

    // ── Handle Anthropic errors ───────────────────────────────────────────────
    if (!anthropicRes.ok) {
      const errBody = await anthropicRes.json().catch(() => ({}));
      logger.error(`Anthropic API error ${anthropicRes.status}:`, errBody);

      // Map Anthropic status codes to friendly messages
      if (anthropicRes.status === 401) {
        return ApiResponse.error(res, 500, "Chatbot configuration error. Please contact support.");
      }
      if (anthropicRes.status === 429) {
        return ApiResponse.error(res, 429, "The assistant is busy right now. Please try again in a moment.");
      }
      return ApiResponse.error(res, 502, "The assistant is temporarily unavailable. Please call us directly.");
    }

    const data  = await anthropicRes.json();
    const reply = data.content?.[0]?.text;

    if (!reply) {
      logger.warn("Anthropic returned empty content:", data);
      return ApiResponse.error(res, 502, "Received an empty response. Please try again.");
    }

    logger.debug(`Chatbot replied (${reply.length} chars) to: "${sanitised.at(-1).content.slice(0, 60)}"`);

    return ApiResponse.success(res, 200, "OK", { reply });

  } catch (err) {
    // Network-level failure reaching Anthropic
    if (err.cause?.code === "ECONNREFUSED" || err.name === "TypeError") {
      logger.error("Network error reaching Anthropic:", err.message);
      return ApiResponse.error(res, 503, "Could not reach the assistant. Please call +91 95872 46814.");
    }
    next(err);
  }
};
