package lemonadex.lemoguide.lemoguide_mvp.network;

import java.util.List;
import java.util.Map;
import jakarta.validation.constraints.*;

public final class NetworkDtos {
    private NetworkDtos() { }
    public record Shared(@NotBlank @Pattern(regexp="SKILL|PROJECT|EXPERIENCE|CERTIFICATE") String kind, @Positive long itemId) { }
    public record Settings(@NotBlank @Pattern(regexp="[a-z0-9][a-z0-9_-]{2,39}") String handle,
            boolean published, @Size(max=600) String bio, @Size(max=300) String topics,
            boolean showGoals, boolean allowCompare, boolean allowRequests, boolean availableToHelp, Boolean autoShareMilestones,
            @NotNull @Size(max=100) List<@jakarta.validation.Valid Shared> shared, @Size(max=300) String mentorTopics) { }
    public record PostInput(@NotBlank @Pattern(regexp="KNOWLEDGE|QUESTION|PROJECT|MILESTONE|FEEDBACK") String kind,
            @NotBlank @Size(max=6000) String content, @Size(max=300) String tags,
            @Size(max=500) String imageUrl, @Size(max=500) String resourceUrl, @Positive Long projectId, @Positive Long taskId,
            @Size(max=100) String feedbackAspects) { }
    public record Text(@NotBlank @Size(max=2000) String content) { }
    public record PostEdit(@NotBlank @Size(max=6000) String content, @Size(max=300) String tags,
            @Size(max=500) String imageUrl, @Size(max=500) String resourceUrl) { }
    public record CommentInput(@NotBlank @Size(max=2000) String content, @Positive Long parentId) { }
    public record PublishInput(boolean autoShareMilestones) { }
    public record CohortJoin(@NotBlank @Pattern(regexp="COURSE|ROLE") String kind, @NotBlank @Size(max=200) String refKey) { }
    public record CheckinInput(@Size(max=500) String note) { }
    public record CohortMessage(@NotBlank @Size(max=3000) String content) { }
    public record State(boolean enabled) { }
    public record MessageInput(@NotBlank @Size(max=3000) String content, @Positive Long sharedPostId,
            @Positive Long sharedProfileId, @Positive Long sharedProjectId, @Positive Long sharedCvId) { }
    /** cvId null removes the CV from the community profile. */
    public record FeatureCv(@Positive Long cvId) { }
    public record ReadInput(@PositiveOrZero long lastId) { }
    public record ReportInput(@Pattern(regexp="POST|COMMENT|PROFILE|MESSAGE|COHORT_MESSAGE|CHALLENGE_ENTRY") @NotBlank String kind,
            @Positive long targetId, @NotBlank @Size(max=1000) String reason) { }
    public record Decision(@NotBlank @Pattern(regexp="DISMISS|HIDE") String action) { }
    public record CompareInput(@NotBlank @Size(max=500) String goal, @Positive Long modelId) { }
    public record ApplyInput(@NotEmpty @Size(max=8) List<@NotNull @Min(0) @Max(7) Integer> selections) { }
    public record MentorRequestInput(@NotBlank @Size(max=200) String topic, @NotBlank @Size(max=1500) String message) { }
    public record MentorSchedule(@NotNull java.time.OffsetDateTime scheduledAt, @Size(max=500) String meetingUrl, @Size(max=500) String note) { }
    public record MentorNote(@Size(max=500) String note) { }
    public record MentorComplete(@Min(1) @Max(5) int rating, @Size(max=1000) String feedback) { }
    public record AiInput(@Positive Long modelId) { }
    public record TagInput(@NotBlank @Size(max=6000) String content, @Positive Long modelId) { }
    public record EntryInput(@NotBlank @Size(max=3000) String content, @Size(max=500) String url) { }
    public record ChallengeInput(@NotBlank @Size(max=200) String title, @NotBlank @Size(max=3000) String description,
            @Size(max=300) String tags, @NotNull java.time.LocalDate startsOn, @NotNull java.time.LocalDate endsOn) { }
    public record Slice(List<Map<String,Object>> items, Long nextCursor) { }
}
