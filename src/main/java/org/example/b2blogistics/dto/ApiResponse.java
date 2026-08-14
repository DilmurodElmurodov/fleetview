package org.example.b2blogistics.dto;

import java.time.Instant;

public record ApiResponse<T>(boolean success, T data, ErrorDetails error, Instant timestamp) {

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, null, Instant.now());
    }

    public static ApiResponse<Void> failure(ErrorDetails error) {
        return new ApiResponse<>(false, null, error, Instant.now());
    }
}
