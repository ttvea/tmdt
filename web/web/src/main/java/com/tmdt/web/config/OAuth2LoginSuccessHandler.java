package com.tmdt.web.config;

import com.tmdt.web.entity.User;
import com.tmdt.web.repository.UserRep;
import com.tmdt.web.service.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler
        extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRep userRepository;
    private final JwtService jwtService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException {

        OAuth2User oAuth2User =
                (OAuth2User) authentication.getPrincipal();

        String provider =
                ((OAuth2AuthenticationToken) authentication)
                        .getAuthorizedClientRegistrationId();

        String email = null;
        String name = null;

        if (provider.equals("google")) {
            email = oAuth2User.getAttribute("email");
            name = oAuth2User.getAttribute("name");
        } else if (provider.equals("facebook")) {
            email = oAuth2User.getAttribute("email");
            name = oAuth2User.getAttribute("name");

            if (email == null) {
                email = oAuth2User.getAttribute("id") + "@facebook.com";
            }
        }

        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            user = new User();
            user.setEmail(email);
            user.setFullName(
                    name != null && !name.isBlank()
                            ? name
                            : email
            );
            user.setRole(User.RoleAcc.STUDENT);
            user.setProvider(
                    User.Provider.valueOf(provider.toUpperCase())
            );

            userRepository.save(user);
        }

        if (Boolean.FALSE.equals(user.getEnabled())) {
            getRedirectStrategy().sendRedirect(
                    request,
                    response,
                    frontendUrl + "/login?error=account_locked"
            );
            return;
        }

        String token = jwtService.generateToken(user.getEmail());

        getRedirectStrategy().sendRedirect(
                request,
                response,
                frontendUrl + "/oauth2/redirect?token=" + token
        );
    }

}
