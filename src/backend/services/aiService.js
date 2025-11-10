/**
 * AI Service - Communicates with Python Flask AI server
 * Handles fake news detection for tweets
 */

const AI_SERVER_URL = process.env.AI_SERVER_URL || "http://localhost:5000";

/**
 * Analyze text for fake news using the AI model
 * @param {string} text - The text content to analyze
 * @returns {Promise<Object>} Analysis result with label and confidence
 */
export async function analyzeText(text) {
  // ✅ CHANGED: Added 'export'
  console.log("🤖 Calling AI service to analyze text...");
  console.log(
    `   Text preview: "${text.substring(0, 50)}${
      text.length > 50 ? "..." : ""
    }"`
  );

  try {
    // Make request to Flask AI server
    const response = await fetch(`${AI_SERVER_URL}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    // Check if request was successful
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `AI server responded with status ${response.status}: ${errorText}`
      );
    }

    const result = await response.json();

    // Check if AI analysis was successful
    if (!result.success) {
      throw new Error(result.error || "AI analysis failed");
    }

    console.log("✅ AI analysis complete:");
    console.log(`   Label: ${result.data.label}`);
    console.log(`   Confidence: ${result.data.confidence}%`);

    return {
      success: true,
      data: {
        label: result.data.label,
        confidence: result.data.confidence,
        fakeProbability: result.data.fake_probability, // ✅ FIXED: Match Flask response
        realProbability: result.data.real_probability, // ✅ FIXED: Match Flask response
      },
    };
  } catch (error) {
    console.error("❌ AI analysis failed:", error.message);

    // Return error result (we'll still save the tweet but mark analysis as ERROR)
    return {
      success: false,
      error: error.message,
      data: {
        label: "ERROR",
        confidence: 0,
        fakeProbability: 0,
        realProbability: 0,
      },
    };
  }
}

/**
 * Check if AI service is healthy and running
 * @returns {Promise<boolean>}
 */
export async function checkHealth() {
  // ✅ CHANGED: Added 'export'
  try {
    const response = await fetch(`${AI_SERVER_URL}/health`, {
      method: "GET",
    });

    if (!response.ok) {
      return false;
    }

    const result = await response.json();
    return result.status === "healthy" && result.model_loaded === true;
  } catch (error) {
    console.error("❌ AI health check failed:", error.message);
    return false;
  }
}
