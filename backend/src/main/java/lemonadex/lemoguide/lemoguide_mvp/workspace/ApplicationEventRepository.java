package lemonadex.lemoguide.lemoguide_mvp.workspace;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
public interface ApplicationEventRepository extends JpaRepository<ApplicationEvent, Long> {
    List<ApplicationEvent> findByApplicationIdOrderByOccurredAtDescIdDesc(Long applicationId);
    void deleteByApplicationId(Long applicationId);
}
