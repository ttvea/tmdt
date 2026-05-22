package com.tmdt.web.config;

import com.tmdt.web.service.JwtService;
import com.tmdt.web.repository.UserRep;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRep userRep;

    public JwtAuthenticationFilter(JwtService jwtService, UserRep userRep) {
        this.jwtService = jwtService;
        this.userRep = userRep;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String token;
        final String username;

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        token = authHeader.substring(7);
        if (!jwtService.validateToken(token)) {
            filterChain.doFilter(request, response);
            return;
        }

        username = jwtService.extractUsername(token);

        com.tmdt.web.entity.User appUser = userRep.findByEmail(username).orElse(null);
        if (appUser == null || Boolean.FALSE.equals(appUser.getEnabled())) {
            SecurityContextHolder.clearContext();
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("text/plain;charset=UTF-8");
            response.getWriter().write("Tài khoản không tồn tại hoặc đã bị khóa");
            return;
        }

        UsernamePasswordAuthenticationToken authToken =
                new UsernamePasswordAuthenticationToken(
                        new User(username, "", Collections.emptyList()),
                        null,
                        Collections.emptyList()
                );
        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

        SecurityContextHolder.getContext().setAuthentication(authToken);

        filterChain.doFilter(request, response);
    }
}

