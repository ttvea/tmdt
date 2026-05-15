package com.tmdt.web.config;

import com.tmdt.web.entity.User;
import com.tmdt.web.repository.UserRep;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AdminAccountInitializer implements CommandLineRunner {

    private static final String ADMIN_EMAIL = "admin@edumatch.vn";
    private static final String ADMIN_PASSWORD = "Admin@123456";

    private final UserRep userRep;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        User admin = userRep.findByEmail(ADMIN_EMAIL)
                .orElseGet(User::new);

        admin.setEmail(ADMIN_EMAIL);
        admin.setPassword(passwordEncoder.encode(ADMIN_PASSWORD));
        admin.setFullName("Admin User");
        admin.setRole(User.RoleAcc.ADMIN);
        admin.setProvider(User.Provider.LOCAL);
        admin.setEnabled(true);
        admin.setVerified(true);

        userRep.save(admin);
    }
}

