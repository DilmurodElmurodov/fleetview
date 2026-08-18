package org.example.b2blogistics.web;

import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.example.b2blogistics.dto.ApiResponse;
import org.example.b2blogistics.dto.ErrorDetails;
import org.example.b2blogistics.exception.InvalidZoneGeometryException;
import org.example.b2blogistics.exception.ResourceNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.List;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(ResourceNotFoundException ex) {
        return respond(HttpStatus.NOT_FOUND, ErrorDetails.of("RESOURCE_NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(InvalidZoneGeometryException.class)
    public ResponseEntity<ApiResponse<Void>> handleInvalidGeometry(InvalidZoneGeometryException ex) {
        return respond(HttpStatus.BAD_REQUEST, ErrorDetails.of("INVALID_ZONE_GEOMETRY", ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleBodyValidation(MethodArgumentNotValidException ex) {
        List<ErrorDetails.FieldValidationError> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> new ErrorDetails.FieldValidationError(fe.getField(), fe.getDefaultMessage()))
                .toList();
        return respond(HttpStatus.BAD_REQUEST,
                new ErrorDetails("VALIDATION_FAILED", "Request body validation failed", fieldErrors));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleParameterValidation(ConstraintViolationException ex) {
        List<ErrorDetails.FieldValidationError> fieldErrors = ex.getConstraintViolations().stream()
                .map(v -> new ErrorDetails.FieldValidationError(v.getPropertyPath().toString(), v.getMessage()))
                .toList();
        return respond(HttpStatus.BAD_REQUEST,
                new ErrorDetails("VALIDATION_FAILED", "Request parameter validation failed", fieldErrors));
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<ApiResponse<Void>> handleMalformedRequest(Exception ex) {
        log.debug("Malformed request rejected", ex);
        return respond(HttpStatus.BAD_REQUEST,
                ErrorDetails.of("MALFORMED_REQUEST", "Request could not be parsed"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUnexpected(Exception ex) {
        log.error("Unhandled exception", ex);
        return respond(HttpStatus.INTERNAL_SERVER_ERROR,
                ErrorDetails.of("INTERNAL_ERROR", "An unexpected error occurred"));
    }

    private ResponseEntity<ApiResponse<Void>> respond(HttpStatus status, ErrorDetails details) {
        return ResponseEntity.status(status).body(ApiResponse.failure(details));
    }
}
