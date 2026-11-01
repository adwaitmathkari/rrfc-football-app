package com.football.api.common;

import java.io.IOException;

import jakarta.servlet.http.HttpServletResponse;

/** Error body shared by both backends: {"error": "message"}. */
public record ApiError(String error) {

    /** For filters that run before Spring MVC and can't use @RestControllerAdvice. */
    public static void write(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        String escaped = message.replace("\\", "\\\\").replace("\"", "\\\"");
        response.getWriter().write("{\"error\":\"" + escaped + "\"}");
    }
}
