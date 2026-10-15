package lemonadex.lemoguide.lemoguide_mvp.interviewpractice.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import lemonadex.lemoguide.lemoguide_mvp.interviewpractice.entity.InterviewSession;

public interface InterviewSessionRepository extends JpaRepository<InterviewSession, Long> {

    Optional<InterviewSession> findByIdAndAccountId(Long id, Long accountId);

    List<InterviewSession> findByAccountIdOrderByUpdatedAtDesc(Long accountId, Pageable pageable);
}
