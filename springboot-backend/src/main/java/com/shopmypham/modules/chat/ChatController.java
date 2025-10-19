package com.shopmypham.modules.chat;

import com.shopmypham.modules.chat.dto.AskRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

  private final ChatService chatService;

  @PostMapping("/ask")
  public ResponseEntity<?> ask(@RequestBody AskRequest req){
    return ResponseEntity.ok(chatService.ask(req));
  }

  @PostMapping("/reset")
  public ResponseEntity<?> reset(){
    // Hiện chỉ để FE clear local state; 
    return ResponseEntity.ok(Map.of("ok", true, "messages", List.of()));
  }
}
