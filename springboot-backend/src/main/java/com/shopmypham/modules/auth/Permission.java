package com.shopmypham.modules.auth;

import jakarta.persistence.*;
import lombok.*;
@Entity
@Table(name = "permissions")
@Getter @Setter
public class Permission {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true)
  private String name;

  private String description;
}