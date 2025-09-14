// src/main/java/com/shopmypham/modules/auth/DevAdminInitializer.java
package com.shopmypham.modules.auth;

import com.shopmypham.modules.user.User;             // <— entity user mới
import com.shopmypham.modules.user.UserRepository;  // <— repo mới

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.boot.CommandLineRunner;

import java.util.Set;

@Component
@Profile("dev")
@RequiredArgsConstructor
public class DevAdminInitializer implements CommandLineRunner {

  private final UserRepository userRepo;   // <— repo mới
  private final RoleRepository roleRepo;
  private final PasswordEncoder encoder;

  @Value("${ADMIN_EMAIL:admin@local}")
  private String adminEmail;

  @Value("${ADMIN_PASSWORD:admin123}")
  private String adminPassword;

  @Override
  public void run(String... args) {
    if (userRepo.existsByEmail(adminEmail)) return;

    var adminRole = roleRepo.findByName("ROLE_ADMIN").orElseGet(() -> {
      var r = new Role();
      r.setName("ROLE_ADMIN");
      return roleRepo.save(r);
    });

    var admin = new User();
    admin.setEmail(adminEmail);
    admin.setPassword(encoder.encode(adminPassword));
    admin.setEnabled(true);
    admin.setRoles(Set.of(adminRole));

    userRepo.save(admin);
  }
}
