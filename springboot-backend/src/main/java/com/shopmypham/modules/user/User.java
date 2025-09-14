// src/main/java/com/shopmypham/modules/user/User.java
package com.shopmypham.modules.user;

import com.shopmypham.modules.auth.Role;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity @Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "full_name")
  private String fullName;

  @Column(nullable = false, unique = true)
  private String email;

  @Column(nullable = false)
  private String password;

  private String phone;
  @Column(columnDefinition = "text")
  private String address;

  @Column(name = "avatar_url")
  private String avatarUrl;

  @Builder.Default
  private Boolean enabled = true;

  private Instant createdAt;
  private Instant updatedAt;

  @ManyToMany(fetch = FetchType.LAZY)
  @JoinTable(name = "user_roles",
      joinColumns = @JoinColumn(name="user_id"),
      inverseJoinColumns = @JoinColumn(name="role_id"))
  @Builder.Default
  private Set<Role> roles = new HashSet<>();

  @PrePersist void preInsert() {
    createdAt = Instant.now();
    updatedAt = createdAt;
    if (enabled == null) enabled = true;
  }
  @PreUpdate void preUpdate() { updatedAt = Instant.now(); }
}
