package lemonadex.lemoguide.lemoguide_mvp.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Bound from {@code app.upload.*} in application.yaml. Controls where uploaded
 * avatar images and CV template thumbnails are stored on disk and the URL
 * prefixes they are served under (see {@code WebConfig}).
 *
 * @param avatarDir filesystem directory avatar files are written to
 * @param avatarUrlPrefix URL path the {@code avatarDir} is exposed under
 * @param maxAvatarSizeBytes largest avatar file accepted, in bytes
 * @param cvTemplateThumbnailDir filesystem directory CV template thumbnails are written to
 * @param cvTemplateThumbnailUrlPrefix URL path the {@code cvTemplateThumbnailDir} is exposed under
 * @param maxCvTemplateThumbnailSizeBytes largest CV template thumbnail accepted, in bytes
 */
@ConfigurationProperties(prefix = "app.upload")
public record UploadProperties(
        String avatarDir,
        String avatarUrlPrefix,
        long maxAvatarSizeBytes,
        String cvTemplateThumbnailDir,
        String cvTemplateThumbnailUrlPrefix,
        long maxCvTemplateThumbnailSizeBytes
) {

    public UploadProperties {
        if (avatarDir == null || avatarDir.isBlank()) {
            avatarDir = "uploads/avatars";
        }
        if (avatarUrlPrefix == null || avatarUrlPrefix.isBlank()) {
            avatarUrlPrefix = "/uploads/avatars";
        } else if (avatarUrlPrefix.endsWith("/")) {
            avatarUrlPrefix = avatarUrlPrefix.substring(0, avatarUrlPrefix.length() - 1);
        }
        if (maxAvatarSizeBytes <= 0) {
            maxAvatarSizeBytes = 2L * 1024 * 1024;
        }
        if (cvTemplateThumbnailDir == null || cvTemplateThumbnailDir.isBlank()) {
            cvTemplateThumbnailDir = "uploads/cv-templates";
        }
        if (cvTemplateThumbnailUrlPrefix == null || cvTemplateThumbnailUrlPrefix.isBlank()) {
            cvTemplateThumbnailUrlPrefix = "/uploads/cv-templates";
        } else if (cvTemplateThumbnailUrlPrefix.endsWith("/")) {
            cvTemplateThumbnailUrlPrefix = cvTemplateThumbnailUrlPrefix.substring(0, cvTemplateThumbnailUrlPrefix.length() - 1);
        }
        if (maxCvTemplateThumbnailSizeBytes <= 0) {
            maxCvTemplateThumbnailSizeBytes = 3L * 1024 * 1024;
        }
    }
}
