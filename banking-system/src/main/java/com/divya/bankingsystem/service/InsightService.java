package com.divya.bankingsystem.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class InsightService {

  @Value("${claude.api.key}")
  private String claudeApiKey;

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
                You are a personal finance advisor for NeoBank, an Indian banking app.
                Analyse these transactions for %s and give exactly 2 short insights.

                Transactions (last 30 days):
                %s

                Rules:
                - Each insight must be 1-2 sentences only
                - Use Indian Rupee format (₹)
                - Be specific with amounts from the data
                - Be friendly and practical
                - Focus on biggest spend category or saving suggestions
                - Return plain text only — no markdown, no bullet points
                - Separate the two insights with a single newline
                """,
            accountHolderName,
            objectMapper.writeValueAsString(transactions)
    );

    Map<String, Object> requestBody = Map.of(
            "model",      "claude-sonnet-4-20250514",
            "max_tokens", 300,
            "messages",   List.of(
                    Map.of("role", "user", "content", prompt)
            )
    );

    Request request = new Request.Builder()
            .url("https://api.anthropic.com/v1/messages")
            .post(RequestBody.create(
                    MediaType.parse("application/json"),
                    objectMapper.writeValueAsString(requestBody)
            ))
            .addHeader("x-api-key",claudeApiKey)
            .addHeader("anthropic-version", "2023-06-01")
            .addHeader("Content-Type",       "application/json")
            .build();

    // .executes() below is the blocking call, thread waits for the response from claude
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
       */
      // converts json string into java map
      Map<String, Object> parsed = objectMapper.readValue(
              responseBody, Map.class
      );

      List<Map<String, Object>> content =
              (List<Map<String, Object>>) parsed.get("content");

      return content.get(0).get("text").toString();
    }
  }
}