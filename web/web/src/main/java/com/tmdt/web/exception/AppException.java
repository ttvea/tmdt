package com.tmdt.web.exception;


public class AppException extends RuntimeException {
    private final int statusCode;

    public AppException(String message, int statusCode) {
        super(message);
        this.statusCode = statusCode;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public static AppException notFound(String message) {
        return new AppException(message, 404);
    }

    public static AppException badRequest(String message) {
        return new AppException(message, 400);
    }

    public static AppException forbidden(String message) {
        return new AppException(message, 403);
    }

    public static AppException conflict(String message) {
        return new AppException(message, 409);
    }
}
