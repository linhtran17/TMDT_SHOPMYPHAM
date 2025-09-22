package com.shopmypham.modules.auth;

import com.shopmypham.modules.user.User;
import com.shopmypham.modules.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Profile("dev")
@RequiredArgsConstructor
public class DevAdminInitializer implements CommandLineRunner {

  private final UserRepository userRepo;
  private final RoleRepository roleRepo;
  private final PermissionRepository permRepo; // ✅ thêm
  private final PasswordEncoder encoder;

  @Value("${ADMIN_EMAIL:admin@local}")
  private String adminEmail;

  @Value("${ADMIN_PASSWORD:admin123}")
  private String adminPassword;

  @Override
  public void run(String... args) {
    var adminRole = roleRepo.findByName("ROLE_ADMIN").orElseGet(() -> {
      var r = new Role();
      r.setName("ROLE_ADMIN");
      return roleRepo.save(r);
    });

    // ✅ DEV: ROLE_ADMIN có tất cả permission
    adminRole.setPermissions(new java.util.LinkedHashSet<>(permRepo.findAll()));
    roleRepo.save(adminRole);

    if (!userRepo.existsByEmail(adminEmail)) {
      var admin = new User();
      admin.setEmail(adminEmail);
      admin.setPassword(encoder.encode(adminPassword));
      admin.setEnabled(true);
      admin.setRoles(java.util.Set.of(adminRole));
      userRepo.save(admin);
    }
  }
}