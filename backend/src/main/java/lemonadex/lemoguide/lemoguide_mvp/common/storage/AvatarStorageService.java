package lemonadex.lemoguide.lemoguide_mvp.common.storage;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import lemonadex.lemoguide.lemoguide_mvp.common.config.UploadProperties;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;

/**
 * Stores avatar images on the local filesystem under {@code app.upload.avatar-dir}
 * and returns the public URL they are served under (see {@code WebConfig}).
 * Shared by the self-service {@code /api/me/avatar} endpoint and the admin
 * "manage admins" / "manage users" avatar endpoints.
 */
@Service
@RequiredArgsConstructor
public class AvatarStorageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

    private final UploadProperties uploadProperties;

    /** Validates and saves {@code file}, returning the URL to persist as {@code avatarUrl}. */
    public String store(MultipartFile file) {
        validate(file);
        String filename = UUID.randomUUID() + extensionFor(file.getContentType());
        Path targetDir = Path.of(uploadProperties.avatarDir());
        try {
            Files.createDirectories(targetDir);
            file.transferTo(targetDir.resolve(filename));
        } catch (IOException e) {
            throw new AppException(ErrorCode.INTERNAL_ERROR, "Could not store the uploaded avatar");
        }
        return uploadProperties.avatarUrlPrefix() + "/" + filename;
    }

    /**
     * Best-effort delete of a previously uploaded avatar, called when it is being
     * replaced. Ignores {@code null}, external URLs, and anything that doesn't
     * resolve to a plain filename directly under the avatar directory, so a
     * crafted {@code avatarUrl} can never be used to delete an unrelated file.
     */
    public void deleteIfOwned(String avatarUrl) {
        String prefix = uploadProperties.avatarUrlPrefix() + "/";
        if (avatarUrl == null || !avatarUrl.startsWith(prefix)) {
            return;
        }
        String filename = avatarUrl.substring(prefix.length());
        if (filename.isBlank() || filename.contains("/") || filename.contains("..")) {
            return;
        }
        try {
            Files.deleteIfExists(Path.of(uploadProperties.avatarDir()).resolve(filename));
        } catch (IOException ignored) {
            // Best-effort cleanup only; a stale file left on disk must not fail the request.
        }
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "No file was uploaded");
        }
        if (file.getSize() > uploadProperties.maxAvatarSizeBytes()) {
            throw new AppException(ErrorCode.BAD_REQUEST,
                    "Avatar must be at most " + (uploadProperties.maxAvatarSizeBytes() / (1024 * 1024)) + "MB");
        }
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if (!ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Avatar must be a JPEG, PNG, or WebP image");
        }
    }

    private String extensionFor(String contentType) {
        return switch (contentType.toLowerCase(Locale.ROOT)) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
    }
}
