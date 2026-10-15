package lemonadex.lemoguide.lemoguide_mvp.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Envelope for every REST response so the frontends can rely on a single shape.
 *
 * <pre>
 * { "success": true,  "message": "Login successful", "data": { ... } }
 * { "success": false, "message": "Invalid email or password" }
 * </pre>
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(boolean success, String message, T data) {

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, null, data);
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(true, message, data);
    }

    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, message, null);
    }

    public static <T> ApiResponse<T> error(String message, T data) {
        return new ApiResponse<>(false, message, data);
    }
}
