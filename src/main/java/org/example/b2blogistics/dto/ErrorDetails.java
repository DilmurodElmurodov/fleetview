package org.example.b2blogistics.dto;

import java.util.List;

public record ErrorDetails(String code, String message, List<FieldValidationError> fieldErrors) {

    public record FieldValidationError(String field, String message) {
    }

    public static ErrorDetails of(String code, String message) {
        return new ErrorDetails(code, message, List.of());
    }
}
