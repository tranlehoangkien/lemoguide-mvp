package lemonadex.lemoguide.lemoguide_mvp.network;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;

/**
 * Stores images attached to community posts under {@code app.upload.network-dir}, served at /uploads/network/ by
 * WebConfig. The type is decided from the file's own bytes (JPEG, PNG or WebP), never from the client's header,
 * because these files are publicly readable.
 */
@Component
public class NetworkImageStorage {
    static final String URL_PREFIX = "/uploads/network";
    static final long MAX_BYTES = 3L * 1024 * 1024;
    private final Path dir;

    public NetworkImageStorage(@Value("${app.upload.network-dir:uploads/network}") String dir) {
        this.dir = Path.of(dir);
    }

    /** Uploads leave no database row, so the per-account hourly cap is kept in memory (single instance). */
    private final java.util.Map<Long, java.util.Deque<Long>> recent = new java.util.concurrent.ConcurrentHashMap<>();
    static final int MAX_PER_HOUR = 20;

    public String store(long account, MultipartFile file) {
        long now = System.currentTimeMillis();
        var times = recent.computeIfAbsent(account, k -> new java.util.ArrayDeque<>());
        synchronized (times) {
            while (!times.isEmpty() && now - times.peekFirst() > 3_600_000L) times.pollFirst();
            if (times.size() >= MAX_PER_HOUR) throw new AppException(ErrorCode.RATE_LIMITED, "Bạn đã tải lên nhiều ảnh trong một giờ. Hãy thử lại sau.");
            times.addLast(now);
        }
        return store(file);
    }

    String store(MultipartFile file) {
        if (file == null || file.isEmpty()) throw bad("Chưa chọn ảnh để tải lên.");
        if (file.getSize() > MAX_BYTES) throw bad("Ảnh tối đa 3MB.");
        byte[] head = new byte[12];
        int read;
        try (InputStream in = file.getInputStream()) { read = in.readNBytes(head, 0, head.length); }
        catch (IOException e) { throw new AppException(ErrorCode.INTERNAL_ERROR, "Không đọc được ảnh tải lên."); }
        String extension = extension(head, read);
        if (extension == null) throw bad("Ảnh phải ở định dạng JPEG, PNG hoặc WebP.");
        String name = UUID.randomUUID() + extension;
        try {
            Files.createDirectories(dir);
            try (InputStream in = file.getInputStream()) { Files.copy(in, dir.resolve(name), StandardCopyOption.REPLACE_EXISTING); }
        } catch (IOException e) {
            throw new AppException(ErrorCode.INTERNAL_ERROR, "Không lưu được ảnh, vui lòng thử lại.");
        }
        return URL_PREFIX + "/" + name;
    }

    static String extension(byte[] b, int n) {
        if (n >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) return ".jpg";
        if (n >= 8 && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G' && b[4] == 0x0D && b[5] == 0x0A && b[6] == 0x1A && b[7] == 0x0A) return ".png";
        if (n >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F' && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') return ".webp";
        return null;
    }

    private static AppException bad(String message) { return new AppException(ErrorCode.BAD_REQUEST, message); }
}
