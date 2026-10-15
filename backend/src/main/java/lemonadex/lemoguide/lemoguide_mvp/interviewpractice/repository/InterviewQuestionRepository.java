package lemonadex.lemoguide.lemoguide_mvp.interviewpractice.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import lemonadex.lemoguide.lemoguide_mvp.interviewpractice.entity.InterviewQuestion;

public interface InterviewQuestionRepository extends JpaRepository<InterviewQuestion, Long> {

    List<InterviewQuestion> findBySessionIdOrderBySeqAsc(Long sessionId);

    Optional<InterviewQuestion> findByIdAndSessionId(Long id, Long sessionId);

    void deleteBySessionId(Long sessionId);

    /** How many questions of each given session have been answered, as {@code [sessionId, count]} rows. */
    @Query("select q.sessionId, count(q) from InterviewQuestion q "
            + "where q.sessionId in :sessionIds and q.status = 'answered' group by q.sessionId")
    List<Object[]> countAnsweredBySession(Collection<Long> sessionIds);
}
