package lemonadex.lemoguide.lemoguide_mvp.cvtemplate.service;

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
 * Stores CV template thumbnail images on the local filesystem under {@code
 * app.upload.cv-template-thumbnail-dir} and returns the public URL they are
 * served under (see {@code WebConfig}). Mirrors {@code AvatarStorageService}.
 */
@Service
@RequiredArgsConstructor
public class CvTemplateThumbnailStorageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

    private final UploadProperties uploadProperties;

    /** Validates and saves {@code file}, returning the URL to persist as {@code thumbnailUrl}. */
    public String store(MultipartFile file) {
        validate(file);
        String filename = UUID.randomUUID() + extensionFor(file.getContentType());
        Path targetDir = Path.of(uploadProperties.cvTemplateThumbnailDir());
        try {
            Files.createDirectories(targetDir);
            file.transferTo(targetDir.resolve(filename));
        } catch (IOException e) {
            throw new AppException(ErrorCode.INTERNAL_ERROR, "Could not store the uploaded thumbnail");
        }
        return uploadProperties.cvTemplateThumbnailUrlPrefix() + "/" + filename;
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "No file was uploaded");
        }
        if (file.getSize() > uploadProperties.maxCvTemplateThumbnailSizeBytes()) {
            throw new AppException(ErrorCode.BAD_REQUEST,
                    "Thumbnail must be at most " + (uploadProperties.maxCvTemplateThumbnailSizeBytes() / (1024 * 1024)) + "MB");
        }
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if (!ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Thumbnail must be a JPEG, PNG, or WebP image");
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
