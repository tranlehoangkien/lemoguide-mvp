package lemonadex.lemoguide.lemoguide_mvp.cv.service;

import java.io.IOException;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;

/**
 * Extracts raw text from an uploaded CV PDF so it can be handed to the AI CV
 * Builder chat as context (see {@code CvAiAssistantPanel.jsx}'s file-attach
 * flow). Text-layer extraction only - a scanned/image-only PDF yields no text
 * and is rejected rather than silently producing an empty CV; OCR is future
 * work, not part of this first cut.
 */
@Service
public class CvPdfImportService {

    private static final long MAX_FILE_SIZE_BYTES = 5L * 1024 * 1024;
    private static final int MIN_MEANINGFUL_CHARS = 20;

    public String extractText(MultipartFile file) {
        validate(file);

        String text;
        try (PDDocument document = Loader.loadPDF(file.getBytes())) {
            if (document.isEncrypted()) {
                throw new AppException(ErrorCode.BAD_REQUEST,
                        "File PDF nay dang duoc bao ve bang mat khau, vui long go bao ve roi tai lai.");
            }
            text = new PDFTextStripper().getText(document);
        } catch (IOException ex) {
            throw new AppException(ErrorCode.BAD_REQUEST,
                    "Khong doc duoc file PDF nay, vui long kiem tra lai file va thu lai.");
        }

        if (text == null || text.trim().length() < MIN_MEANINGFUL_CHARS) {
            throw new AppException(ErrorCode.BAD_REQUEST,
                    "Khong trich xuat duoc noi dung tu file PDF nay (co the la file scan hinh anh, chua ho tro OCR). "
                            + "Vui long dung file PDF co van ban chon duoc, hoac nhap noi dung truc tiep vao khung chat.");
        }
        return text.trim();
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Vui long chon mot file PDF de tai len");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new AppException(ErrorCode.BAD_REQUEST,
                    "File PDF phai nho hon " + (MAX_FILE_SIZE_BYTES / (1024 * 1024)) + "MB");
        }
        String filename = file.getOriginalFilename();
        boolean looksLikePdf = "application/pdf".equalsIgnoreCase(file.getContentType())
                || (filename != null && filename.toLowerCase().endsWith(".pdf"));
        if (!looksLikePdf) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Chi ho tro file PDF o buoc nay");
        }
    }
}
