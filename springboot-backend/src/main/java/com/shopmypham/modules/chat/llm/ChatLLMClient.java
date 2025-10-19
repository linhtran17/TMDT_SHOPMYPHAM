package com.shopmypham.modules.chat.llm;

import java.util.Map;

public interface ChatLLMClient {
  String complete(String systemPrompt, Map<String,Object> context, String userMessage);
}
