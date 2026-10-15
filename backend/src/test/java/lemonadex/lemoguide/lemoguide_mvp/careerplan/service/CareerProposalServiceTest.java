package lemonadex.lemoguide.lemoguide_mvp.careerplan.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import lemonadex.lemoguide.lemoguide_mvp.careerplan.dto.*;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import tools.jackson.databind.json.JsonMapper;

class CareerProposalServiceTest {
    private final JsonMapper mapper = JsonMapper.builder().build();

    private CareerPlanRequest request(Integer weeks, String id) {
        return new CareerPlanRequest("target", "Junior Backend", 6, weeks, true, null, "Java cơ bản", "", null, null, id);
    }

    private String reply(List<Number> weeks, int hours) {
        return mapper.writeValueAsString(Map.of("goal", "Junior Backend", "rationale", "Cần dự án và kiểm thử",
                "minimumHours", hours, "level", "JUNIOR",
                "options", weeks.stream().map(w -> Map.of("weeks", w, "reason", "Học và thực hành")).toList(),
                "outcomes", List.of(Map.of("skill", "Java", "achievement", "API có kiểm thử"),
                        Map.of("skill", "SQL", "achievement", "Thiết kế cơ sở dữ liệu"))));
    }

    @Test void acceptsLongRoadmapsWithThreeFeasibleChoices() {
        var proposal = CareerProposalService.parse(mapper, reply(List.of(24, 32, 40), 144), "server-id", request(null, null));
        assertEquals("server-id", proposal.id());
        assertEquals(40, proposal.options().getLast().weeks());
        assertEquals(2, proposal.outcomes().size());
    }

    @Test void rejectsThreeWeekJuniorAndInsufficientLearningBudget() {
        assertThrows(IllegalArgumentException.class, () -> CareerProposalService.parse(mapper, reply(List.of(3, 4, 8), 18), "id", request(null, null)));
        assertThrows(IllegalArgumentException.class, () -> CareerProposalService.parse(mapper, reply(List.of(12, 24, 36), 144), "id", request(null, null)));
    }

    @Test void rejectsDuplicateUnsortedFractionalAndIncompleteOptions() {
        for (List<Number> choices : List.<List<Number>>of(List.of(24, 24, 32), List.of(32, 24, 40), List.of(24.5, 32, 40), List.of(24, 32))) {
            assertThrows(IllegalArgumentException.class, () -> CareerProposalService.parse(mapper, reply(choices, 144), "id", request(null, null)));
        }
    }

    @Test void rejectsMissingAchievementAndFractionalEffort() {
        assertThrows(IllegalArgumentException.class, () -> CareerProposalService.parse(mapper,
                reply(List.of(24, 32, 40), 144).replace("API có kiểm thử", ""), "id", request(null, null)));
        assertThrows(IllegalArgumentException.class, () -> CareerProposalService.parse(mapper,
                reply(List.of(24, 32, 40), 144).replace("144", "144.5"), "id", request(null, null)));
    }

    @Test void rejectsCreateWithoutServerProposalBeforeQueryingDatabase() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        var service = new CareerProposalService(jdbc, mapper, null);
        assertThrows(AppException.class, () -> service.require(request(3, null), "profile"));
        assertThrows(AppException.class, () -> service.require(request(null, "id"), "profile"));
        verifyNoInteractions(jdbc);
    }

    @Test void rejectsStaleOrForeignProposalAndUnlistedWeeks() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("42", null));
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        var service = new CareerProposalService(jdbc, mapper, null);
        when(jdbc.query(anyString(), org.mockito.ArgumentMatchers.<RowMapper<CareerProposal>>any(), any(), any(), any(), any())).thenReturn(List.of());
        assertThrows(AppException.class, () -> service.require(request(24, "id"), "changed profile"));
        var proposal = CareerProposalService.parse(mapper, reply(List.of(24, 32, 40), 144), "id", request(null, null));
        when(jdbc.query(anyString(), org.mockito.ArgumentMatchers.<RowMapper<CareerProposal>>any(), any(), any(), any(), any())).thenReturn(List.of(proposal));
        assertThrows(AppException.class, () -> service.require(request(3, "id"), "profile"));
        assertEquals(proposal, service.require(request(24, "id"), "profile"));
        verify(jdbc, atLeastOnce()).query(contains("account_id = ?"), org.mockito.ArgumentMatchers.<RowMapper<CareerProposal>>any(), eq("id"), eq(42L), any(), any());
    }

    @AfterEach void clearSecurity() { SecurityContextHolder.clearContext(); }
}
