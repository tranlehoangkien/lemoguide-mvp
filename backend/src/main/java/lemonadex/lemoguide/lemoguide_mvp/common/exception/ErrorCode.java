package lemonadex.lemoguide.lemoguide_mvp.common.exception;

import org.springframework.http.HttpStatus;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Central catalogue of business error conditions. Keeping the HTTP status next to
 * the message means handlers never have to guess which status an error maps to.
 */
@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    VALIDATION_FAILED(HttpStatus.BAD_REQUEST, "Validation failed"),
    BAD_REQUEST(HttpStatus.BAD_REQUEST, "The request could not be processed"),
    RESOURCE_NOT_FOUND(HttpStatus.NOT_FOUND, "The requested resource was not found"),
    RESOURCE_CONFLICT(HttpStatus.CONFLICT, "The request conflicts with the current state"),
    UNAUTHENTICATED(HttpStatus.UNAUTHORIZED, "Authentication is required"),
    ACCESS_DENIED(HttpStatus.FORBIDDEN, "You do not have permission to access this resource"),
    AI_CREDIT_EXHAUSTED(HttpStatus.PAYMENT_REQUIRED, "You have run out of AI credits"),
    DAILY_MESSAGE_LIMIT(HttpStatus.TOO_MANY_REQUESTS, "Đã hết lượt tin nhắn trong ngày"),
    WEEKLY_MESSAGE_LIMIT(HttpStatus.TOO_MANY_REQUESTS, "Đã hết lượt tin nhắn trong tuần"),
    MONTHLY_MESSAGE_LIMIT(HttpStatus.TOO_MANY_REQUESTS, "Đã hết lượt tin nhắn trong tháng"),
    CV_LIMIT_REACHED(HttpStatus.CONFLICT, "Đã đạt giới hạn số lượng CV"),
    RATE_LIMITED(HttpStatus.TOO_MANY_REQUESTS, "Bạn thao tác quá nhanh, vui lòng thử lại sau"),
    AI_PROVIDER_ERROR(HttpStatus.BAD_GATEWAY, "The AI provider could not complete this request"),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "Something went wrong, please try again later");

    private final HttpStatus status;
    private final String defaultMessage;
}
