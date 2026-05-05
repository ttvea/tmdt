package com.tmdt.web.config;

import com.tmdt.web.entity.User;
import com.tmdt.web.repository.UserRep;
import com.tmdt.web.service.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRep userRepository;
    private final JwtService jwtService;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String provider = ((OAuth2AuthenticationToken) authentication)
                .getAuthorizedClientRegistrationId();

        String email = null;
        String name = null;
        assert oAuth2User != null;
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
            user.setFullName(name);
//            user.setRole();
            user.setProvider(User.Provider.valueOf(provider.toUpperCase()));

            userRepository.save(user);
        }

        String token = jwtService.generateToken(user.getEmail());

        String redirectUrl = "http://localhost:5173/oauth2/redirect?token=" + token;

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}