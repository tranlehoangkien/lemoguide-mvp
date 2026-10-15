package lemonadex.lemoguide.lemoguide_mvp.common.exception;

import lombok.Getter;

/**
 * Application-level exception for expected business failures. {@link
 * GlobalExceptionHandler} turns it into a clean {@code ApiResponse} using the
 * carried {@link ErrorCode} (which also decides the HTTP status).
 */
@Getter
public class AppException extends RuntimeException {

    private final transient ErrorCode errorCode;

    public AppException(ErrorCode errorCode) {
        super(errorCode.getDefaultMessage());
        this.errorCode = errorCode;
    }

    public AppException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }
}
