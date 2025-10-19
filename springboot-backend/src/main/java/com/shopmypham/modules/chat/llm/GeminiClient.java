package com.shopmypham.modules.chat.llm;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;

/** Client gọi REST Gemini: chỉ paraphrase dựa trên Context, không bịa thêm. */
@Component
public class GeminiClient implements ChatLLMClient {

  @Value("${gemini.api-key:}")              // <--- đổi sang gemini.api-key
  private String apiKey;

  @Value("${CHATBOT_MODEL:gemini-1.5-flash}")
  private String model;

  @Value("${CHATBOT_TEMPERATURE:0.2}")
  private double temperature;

  private final ObjectMapper om = new ObjectMapper();

  @Override
  public String complete(String systemPrompt, Map<String, Object> context, String userMessage) {
    try {
      if (apiKey == null || apiKey.isBlank()) {
        System.out.println("[Gemini] Missing API key -> skip LLM");
        return null;
      }
      System.out.println("[Gemini] Calling model=" + model);

      Map<String,Object> req = Map.of(
        "contents", List.of(Map.of(
          "parts", List.of(
            Map.of("text", systemPrompt),
            Map.of("text", "Context:\n" + om.writeValueAsString(context)),
            Map.of("text", "User:\n" + userMessage)
          )
        )),
        "generationConfig", Map.of(
          "temperature", temperature,
          "maxOutputTokens", 1024
        )
      );

      String body = om.writeValueAsString(req);
      String url = String.format(
        "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
        model, apiKey
      );

      HttpRequest httpReq = HttpRequest.newBuilder()
        .uri(URI.create(url))
        .header("Content-Type", "application/json")
        .POST(HttpRequest.BodyPublishers.ofString(body))
        .build();

      HttpClient client = HttpClient.newHttpClient();
      HttpResponse<String> resp = client.send(httpReq, HttpResponse.BodyHandlers.ofString());

      if (resp.statusCode() < 200 || resp.statusCode() >= 300) {
        System.out.println("[Gemini] HTTP " + resp.statusCode() + " body=" + resp.body());
        return null;
      }

      JsonNode root = om.readTree(resp.body());
      JsonNode candidates = root.path("candidates");
      if (!candidates.isArray() || candidates.isEmpty()) return null;

      JsonNode parts = candidates.get(0).path("content").path("parts");
      if (!parts.isArray() || parts.isEmpty()) return null;

      StringBuilder out = new StringBuilder();
      parts.forEach(p -> {
        JsonNode t = p.get("text");
        if (t != null && !t.isNull()) out.append(t.asText());
      });
      return out.toString().trim();
    } catch (Exception e) {
      System.out.println("[Gemini] Error: " + e.getMessage());
      return null;
    }
  }
}
