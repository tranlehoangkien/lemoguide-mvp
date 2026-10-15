package lemonadex.lemoguide.lemoguide_mvp.interviewpractice.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;
import lemonadex.lemoguide.lemoguide_mvp.interviewpractice.dto.InterviewAnswerRequest;
import lemonadex.lemoguide.lemoguide_mvp.interviewpractice.dto.InterviewSessionRequest;
import lemonadex.lemoguide.lemoguide_mvp.interviewpractice.dto.InterviewSessionResponse;
import lemonadex.lemoguide.lemoguide_mvp.interviewpractice.dto.InterviewSessionSummary;
import lemonadex.lemoguide.lemoguide_mvp.interviewpractice.service.InterviewSessionService;
import lombok.RequiredArgsConstructor;

/** Interview Studio: start, answer, skip, finish and review the caller's own practice sessions. */
@RestController
@RequestMapping("/api/me/interview-sessions")
@RequiredArgsConstructor
public class InterviewSessionController {

    private final InterviewSessionService service;

    /** Writes the questions (one model call) and opens the session. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<InterviewSessionResponse> create(@Valid @RequestBody InterviewSessionRequest request) {
        return ApiResponse.success(service.create(request));
    }

    /** The practice history, most recently touched first. */
    @GetMapping
    public ApiResponse<List<InterviewSessionSummary>> list() {
        return ApiResponse.success(service.list());
    }

    @GetMapping("/{id}")
    public ApiResponse<InterviewSessionResponse> get(@PathVariable Long id) {
        return ApiResponse.success(service.get(id));
    }

    /** Grades an answer. Answering a question again replaces its previous attempt while the session is open. */
    @PostMapping("/{id}/questions/{questionId}/answer")
    public ApiResponse<InterviewSessionResponse> answer(@PathVariable Long id, @PathVariable Long questionId,
            @Valid @RequestBody InterviewAnswerRequest request) {
        return ApiResponse.success(service.answer(id, questionId, request));
    }

    @PostMapping("/{id}/questions/{questionId}/skip")
    public ApiResponse<InterviewSessionResponse> skip(@PathVariable Long id, @PathVariable Long questionId) {
        return ApiResponse.success(service.skip(id, questionId));
    }

    @PostMapping("/{id}/questions/{questionId}/hint")
    public ApiResponse<java.util.Map<String, String>> suggestAnswer(@PathVariable Long id, @PathVariable Long questionId) {
        return ApiResponse.success(service.suggestAnswer(id, questionId));
    }

    /** Scores the session and writes the report (one model call). Safe to repeat. */
    @PostMapping("/{id}/finish")
    public ApiResponse<InterviewSessionResponse> finish(@PathVariable Long id) {
        return ApiResponse.success(service.finish(id));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ApiResponse.success(null);
    }
}
