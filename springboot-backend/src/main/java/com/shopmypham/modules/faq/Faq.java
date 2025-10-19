package com.shopmypham.modules.faq;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

import java.sql.Timestamp;

@Entity @Table(name = "faq")
@Getter @Setter
public class Faq {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String question;

  @Column(name = "answer_md", nullable = false, columnDefinition = "TEXT")
  private String answerMd;

  private String tags;

  @Column(nullable = false)
  private Boolean enabled = true;

  @UpdateTimestamp
  private Timestamp updatedAt;
}
