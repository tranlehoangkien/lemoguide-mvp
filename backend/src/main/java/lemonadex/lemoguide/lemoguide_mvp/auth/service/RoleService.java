package lemonadex.lemoguide.lemoguide_mvp.auth.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lemonadex.lemoguide.lemoguide_mvp.auth.dto.RoleView;
import lemonadex.lemoguide.lemoguide_mvp.auth.repository.AccountRepository;
import lemonadex.lemoguide.lemoguide_mvp.auth.repository.RoleRepository;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;

/** Read-only view of the fixed role catalogue with per-role account counts. */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;
    private final AccountRepository accountRepository;

    public List<RoleView> list() {
        return roleRepository.findAll().stream()
                .map(role -> RoleView.of(role, accountRepository.countByRole_Name(role.getName())))
                .toList();
    }

    public RoleView get(Long id) {
        return roleRepository.findById(id)
                .map(role -> RoleView.of(role, accountRepository.countByRole_Name(role.getName())))
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Role not found"));
    }
}
