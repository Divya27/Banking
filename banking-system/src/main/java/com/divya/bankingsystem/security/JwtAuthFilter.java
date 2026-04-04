package com.divya.bankingsystem.security;

import com.divya.bankingsystem.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * - Once per request means it executes once per every http request
 * - doFilterInternal -- it's the main method of the filter -- it intercepts every request before controller execution
 * - get the header from request, extract token - validate token, extract username
 * - Check user is authenticated or not, if not then load user from db
 * - Create auth object, set auth content in spring security context
 * - filter chain - do filter -- passes over to next filter
 * Filter1
 *    ↓
 * Filter2
 *    ↓
 * JWT Filter
 *    ↓
 * Controller
 *
 * Security context -- spring stores the current logged in user (Stored in security context holder)
 * Authentication represents:
 *  - Who is the user?
 *  - Is the user authenticated?
 *  - What roles does the user have?
 * Structure : e.g.
 * Authentication
 *  ├── Principal -- user identity / user details object
 *  ├── Credentials -- password, in jwt its null as password verified during login
 *  └── Authorities -- granted authorities  (ROLE_USER, ROLE_ADMIN)
 *
 * - UsernamePasswordAuthenticationToken --> spring uses this to represent authenticated users
 * object contains --
 * Principal : UserDetails
 * Credentials : null
 * Authorities : ROLE_USER
 * Authenticated : true
 *
 * We set authentication in spring security context, to let spring know that user is authenticated (after that only controller runs)
 *
 *  SecurityContextHolder stores authentication details of the currently logged-in user for the duration of the request so that Spring Security can authorize access to protected resources.
 *
 *  @Autowired tells Spring to automatically inject a required object (bean) into a class. (Spring, please create this object and give it to me automatically.)
        @Autowired --> Injects dependency directly, Usually field injection, Less preferred now
        @RequiredArgsConstructor --> Uses constructor injection, Better for immutability, Preferred in modern Spring

    Bean -- it is an object managed by the spring container
 */
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final TokenBlacklistService tokenBlacklistService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        if (tokenBlacklistService.isBlacklisted(token)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        String email = jwtService.extractEmail(token);

        if (email != null &&
                SecurityContextHolder.getContext().getAuthentication() == null) {

            UserDetails userDetails =
                    userDetailsService.loadUserByUsername(email);

            if (jwtService.isTokenValid(token, userDetails)) {

                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );

                SecurityContextHolder
                        .getContext()
                        .setAuthentication(authToken);
            }
        }

        filterChain.doFilter(request, response);
    }
}
