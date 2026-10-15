import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/constants/routes';
import LoginPage from '@/pages/auth/LoginPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import UserManagementPage from '@/pages/users/UserManagementPage';
import UserDetailPage from '@/pages/users/UserDetailPage';
import AdminManagementPage from '@/pages/admins/AdminManagementPage';
import RoleManagementPage from '@/pages/roles/RoleManagementPage';
import MajorManagementPage from '@/pages/master-data/MajorManagementPage';
import TechnologyManagementPage from '@/pages/master-data/TechnologyManagementPage';
import SkillManagementPage from '@/pages/master-data/SkillManagementPage';
import CvOverviewPage from '@/pages/cv/CvOverviewPage';
import CvManagementPage from '@/pages/cv/CvManagementPage';
import CvPreviewOnlyPage from '@/pages/cv/CvPreviewOnlyPage';
import CvTemplateManagementPage from '@/pages/cv/CvTemplateManagementPage';
import AiModelManagementPage from '@/pages/ai/AiModelManagementPage';
import AiGenerationLogManagementPage from '@/pages/ai/AiGenerationLogManagementPage';
import AiPromptTemplateManagementPage from '@/pages/ai/AiPromptTemplateManagementPage';
import PlanManagementPage from '@/pages/ai/PlanManagementPage';
import JobPostingManagementPage from '@/pages/career/JobPostingManagementPage';
import CourseManagementPage from '@/pages/career/CourseManagementPage';
import NetworkReportsPage from '@/pages/network/NetworkReportsPage';
import NetworkChallengeManagementPage from '@/pages/network/NetworkChallengeManagementPage';
import NetworkOverviewPage from '@/pages/network/NetworkOverviewPage';
import NetworkMembersPage from '@/pages/network/NetworkMembersPage';
import NetworkPostsPage from '@/pages/network/NetworkPostsPage';
import NetworkCohortsPage from '@/pages/network/NetworkCohortsPage';
import NetworkMentoringPage from '@/pages/network/NetworkMentoringPage';
import TopTechnologiesPage from '@/pages/reports/TopTechnologiesPage';
import TopSkillsPage from '@/pages/reports/TopSkillsPage';
import TargetModeRatioPage from '@/pages/reports/TargetModeRatioPage';
import TopPublicCvsPage from '@/pages/reports/TopPublicCvsPage';
import PermissionManagementPage from '@/pages/system/PermissionManagementPage';
import PublishModeSettingsPage from '@/pages/system/PublishModeSettingsPage';
import ActivityLogPage from '@/pages/system/ActivityLogPage';
import AdminLayout from '@/components/layout/AdminLayout';
import { Page, Card, EmptyState } from '@/components/ui';
import { useAdminPermissions, permissionForPath, PERMISSION_LABELS } from '@/services/adminPermissions';

/** Shown instead of a page whose module the admin was not granted (the backend would answer 403 anyway). */
const NoAccess = ({ permission }) => (
  <AdminLayout><Page><Card>
    <EmptyState icon={ShieldOff} title="Bạn chưa được cấp quyền truy cập trang này"
      hint={`Trang thuộc phân hệ “${PERMISSION_LABELS[permission] || permission}”. Hãy liên hệ quản trị viên có quyền Cài đặt hệ thống để được cấp quyền.`} />
  </Card></Page></AdminLayout>
);

// Route bảo vệ - yêu cầu đăng nhập và quyền của phân hệ
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const { pathname } = useLocation();
  const permissions = useAdminPermissions(isAuthenticated);
  const required = permissionForPath(pathname);
  if (isAuthenticated && !loading && required && permissions.ready && !permissions.has(required)) return <NoAccess permission={required} />;

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--color-bg-page)',
          color: 'var(--color-text-secondary)',
        }}
      >
        Đang tải hệ thống...
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to={ROUTES.LOGIN} replace />;
};

// Route công khai - nếu đã đăng nhập thì chuyển vào trong
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  return !isAuthenticated ? children : <Navigate to={ROUTES.DASHBOARD} replace />;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path={ROUTES.NETWORK_REPORTS} element={<ProtectedRoute><NetworkReportsPage /></ProtectedRoute>} />
      <Route path={ROUTES.NETWORK_CHALLENGES} element={<ProtectedRoute><NetworkChallengeManagementPage /></ProtectedRoute>} />
      <Route path={ROUTES.NETWORK_OVERVIEW} element={<ProtectedRoute><NetworkOverviewPage /></ProtectedRoute>} />
      <Route path={ROUTES.NETWORK_MEMBERS} element={<ProtectedRoute><NetworkMembersPage /></ProtectedRoute>} />
      <Route path={ROUTES.NETWORK_POSTS} element={<ProtectedRoute><NetworkPostsPage /></ProtectedRoute>} />
      <Route path={ROUTES.NETWORK_COHORTS} element={<ProtectedRoute><NetworkCohortsPage /></ProtectedRoute>} />
      <Route path={ROUTES.NETWORK_MENTORING} element={<ProtectedRoute><NetworkMentoringPage /></ProtectedRoute>} />
      <Route path="/network" element={<Navigate to={ROUTES.NETWORK_OVERVIEW} replace />} />
      <Route path={ROUTES.REPORT_TECHNOLOGIES} element={<ProtectedRoute><TopTechnologiesPage /></ProtectedRoute>} />
      <Route path={ROUTES.REPORT_SKILLS} element={<ProtectedRoute><TopSkillsPage /></ProtectedRoute>} />
      <Route path={ROUTES.REPORT_TARGET_MODES} element={<ProtectedRoute><TargetModeRatioPage /></ProtectedRoute>} />
      <Route path={ROUTES.REPORT_PUBLIC_CVS} element={<ProtectedRoute><TopPublicCvsPage /></ProtectedRoute>} />
      <Route path={ROUTES.SETTINGS_PERMISSIONS} element={<ProtectedRoute><PermissionManagementPage /></ProtectedRoute>} />
      <Route path={ROUTES.SETTINGS_PUBLISH_MODE} element={<ProtectedRoute><PublishModeSettingsPage /></ProtectedRoute>} />
      <Route path={ROUTES.SETTINGS_ACTIVITY_LOG} element={<ProtectedRoute><ActivityLogPage /></ProtectedRoute>} />
      <Route
        path={ROUTES.LOGIN}
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path={ROUTES.DASHBOARD}
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.USERS}
        element={
          <ProtectedRoute>
            <UserManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.USER_DETAIL}
        element={
          <ProtectedRoute>
            <UserDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMINS}
        element={
          <ProtectedRoute>
            <AdminManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ROLES}
        element={
          <ProtectedRoute>
            <RoleManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.MAJORS}
        element={
          <ProtectedRoute>
            <MajorManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.TECHNOLOGIES}
        element={
          <ProtectedRoute>
            <TechnologyManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.SKILLS}
        element={
          <ProtectedRoute>
            <SkillManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.CV_OVERVIEW}
        element={
          <ProtectedRoute>
            <CvOverviewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.CV_USER_LIST}
        element={
          <ProtectedRoute>
            <CvManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.CV_PREVIEW}
        element={
          <ProtectedRoute>
            <CvPreviewOnlyPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.CV_TEMPLATES}
        element={
          <ProtectedRoute>
            <CvTemplateManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.AI_MODELS}
        element={
          <ProtectedRoute>
            <AiModelManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.AI_PROMPT_TEMPLATES}
        element={
          <ProtectedRoute>
            <AiPromptTemplateManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.AI_USAGE_LOGS}
        element={
          <ProtectedRoute>
            <AiGenerationLogManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.AI_PLANS}
        element={
          <ProtectedRoute>
            <PlanManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.JOB_POSTINGS}
        element={
          <ProtectedRoute>
            <JobPostingManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.COURSES}
        element={
          <ProtectedRoute>
            <CourseManagementPage />
          </ProtectedRoute>
        }
      />
      {/* Mặc định chuyển hướng về DASHBOARD nếu đã đăng nhập, ngược lại về LOGIN */}
      <Route
        path={ROUTES.HOME}
        element={
          <Navigate to={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.LOGIN} replace />
        }
      />
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
};

export default AppRoutes;
