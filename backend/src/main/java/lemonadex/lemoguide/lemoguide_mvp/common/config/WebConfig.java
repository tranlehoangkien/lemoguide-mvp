package lemonadex.lemoguide.lemoguide_mvp.common.config;

import java.nio.file.Path;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import lombok.RequiredArgsConstructor;

/**
 * Serves uploaded avatar files and CV template thumbnails straight off disk
 * under {@code app.upload.avatar-url-prefix} / {@code
 * app.upload.cv-template-thumbnail-url-prefix} (see {@link UploadProperties}).
 * Paired with {@code SecurityConfig}, which leaves the {@code /uploads/**} path
 * publicly readable so an {@code <img>} tag doesn't need a Bearer token.
 */
@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final UploadProperties uploadProperties;
    private final lemonadex.lemoguide.lemoguide_mvp.adminconsole.AdminAccessInterceptor adminAccessInterceptor;

    /** Module permissions + activity log for every admin API call (see AdminAccessInterceptor). */
    @Override
    public void addInterceptors(org.springframework.web.servlet.config.annotation.InterceptorRegistry registry) {
        registry.addInterceptor(adminAccessInterceptor).addPathPatterns("/api/admin/**");
    }

    @org.springframework.beans.factory.annotation.Value("${app.upload.network-dir:uploads/network}")
    private String networkUploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler(uploadProperties.avatarUrlPrefix() + "/**")
                .addResourceLocations("file:" + Path.of(uploadProperties.avatarDir()).toAbsolutePath() + "/");
        // Images attached to LemoNetwork posts (NetworkImageStorage).
        registry.addResourceHandler("/uploads/network/**")
                .addResourceLocations("file:" + Path.of(networkUploadDir).toAbsolutePath() + "/");
        registry.addResourceHandler(uploadProperties.cvTemplateThumbnailUrlPrefix() + "/**")
                .addResourceLocations("file:" + Path.of(uploadProperties.cvTemplateThumbnailDir()).toAbsolutePath() + "/");
    }
}
