package com.shopmypham.modules.chat.log;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import java.sql.Timestamp;

@Entity @Table(name = "chat_log")
@Getter @Setter
public class ChatLog {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "session_id") private String sessionId;
  @Column(name = "user_id")    private Long userId;
  @Column(nullable=false)      private String role; // "user" | "assistant"
  @Column(columnDefinition="TEXT") private String message;
  @Column(name="sources_json", columnDefinition="TEXT") private String sourcesJson;

  @CreationTimestamp @Column(name="created_at", updatable=false)
  private Timestamp createdAt;

  
}
