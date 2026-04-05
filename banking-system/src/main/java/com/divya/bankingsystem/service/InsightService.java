package com.divya.bankingsystem.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class InsightService {

  @Value("${groq.api.key}")
  private String groqApiKey;

  private final OkHttpClient httpClient = new OkHttpClient();

  // converts between java objects and json
  /**
   * objectMapper.writeValueAsString(myMap) → "{\"key\":\"value\"}"  // Java → JSON
   * objectMapper.readValue(jsonString, Map.class) → Java Map        // JSON → Java
   */
  private final ObjectMapper objectMapper = new ObjectMapper();

  // ============================================================
  // Calls Claude API with last 30 days transaction data
  // Returns AI generated spending insights as plain text
  // ============================================================
  public String getSpendingInsights(
          String accountHolderName,
          List<Map<String, Object>> transactions) throws Exception {

    String prompt = String.format("""
                    You are a personal finance advisor for NeoBank.
                    Analyse these transactions for %s and give exactly 3 insights with brief suggestions.
        
                    Transactions (last 30 days):
                    %s
        
                    Give these 3 specific insights in this exact order:
                    
                    Line 1 — TOP CATEGORY: Which category has the highest total spend?
                    Show category name, percentage of total spend, and total amount.
                    Example: "You spent 65%% on Food (₹960) this month — consider setting a monthly budget."
        
                    Line 2 — BIGGEST TRANSACTION: What was the single largest transaction?
                    Show amount, type (deposit/withdrawal), and description if available.
                    Example: "Your largest transaction was ₹1,000 withdrawn for stocks — a solid long-term investment."
        
                    Line 3 — SAVINGS SIGNAL: Compare total deposits vs total withdrawals.
                    Tell user if they are in surplus or deficit and by how much.
                    Example: "You received ₹423 but spent ₹1,000 — you have a deficit of ₹577 this month."

                    Rules:
                    - Each insight must be exactly ONE sentence — max 20 words
                    - Always mention the actual ₹ amount
                    - Update the case of category names — Food not FOOD
                    - No decimals in amounts — ₹1,000 not ₹1,000.0
                    - End each sentence with a period
                    - Be specific, helpful and friendly
                    - Plain text only — no bullets, no markdown, no numbering
                    - Separate each insight with a single newline
                """,
            accountHolderName,
            objectMapper.writeValueAsString(transactions)
    );

    Map<String, Object> requestBody = Map.of(
            "model",      "llama-3.3-70b-versatile",
            "max_tokens", 300,
            "messages",   List.of(
                    Map.of("role", "user", "content", prompt)
            )
    );

    Request request = new Request.Builder()
            .url("https://api.groq.com/openai/v1/chat/completions")
            .post(RequestBody.create(
                    MediaType.parse("application/json"),
                    objectMapper.writeValueAsString(requestBody)
            ))
            .addHeader("Authorization", "Bearer " + groqApiKey)
            .addHeader("Content-Type",       "application/json")
            .build();

    // .executes() below is the blocking call, thread waits for the response from claude/groq
    try (Response response = httpClient.newCall(request).execute()) {

      System.out.println("Response :"+response);
      String responseBody = response.body().string();
      System.out.println("Response code: " + response.code());
      System.out.println("Response body: " + responseBody);

      // Rate limit — free tier exhausted
      if (response.code() == 429) {
        throw new RuntimeException("RATE_LIMIT");
      }

      // Other API errors
      if (!response.isSuccessful()) {
        throw new RuntimeException("API_ERROR");
      }

      /**
       * claude response format example
       * {
       *   "id": "msg_xxxx",
       *   "type": "message",
       *   "role": "assistant",
       *   "content": [
       *     {
       *       "type": "text",
       *       "text": "You spent most on Food this month.\nConsider reducing food delivery orders."
       *     }
       *   ],
       *   "model": "claude-sonnet-4-20250514",
       *   "usage": { "input_tokens": 245, "output_tokens": 48 }
       * }
       *
       * // ============================================================
       *             // Groq response format (OpenAI compatible):
       *             // {
       *             //   "choices": [
       *             //     {
       *             //       "message": {
       *             //         "role": "assistant",
       *             //         "content": "Your insights here..."
       *             //       }
       *             //     }
       *             //   ]
       *             // }
       */
      // converts json string into java map
      Map<String, Object> parsed = objectMapper.readValue(
              responseBody, Map.class
      );

      List<Map<String, Object>> choices =
              (List<Map<String, Object>>) parsed.get("choices");

      Map<String, Object> message =
              (Map<String, Object>) choices.get(0).get("message");

      return message.get("content").toString();
    }
  }
}