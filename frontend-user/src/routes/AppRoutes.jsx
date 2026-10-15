import NetworkFeedPage, { NetworkPostPage } from '@/pages/network/NetworkFeedPage';
import NetworkPeoplePage from '@/pages/network/NetworkPeoplePage';
import NetworkProfilePage from '@/pages/network/NetworkProfilePage';
import NetworkSettingsPage from '@/pages/network/NetworkSettingsPage';
import NetworkMessagesPage from '@/pages/network/NetworkMessagesPage';
import NetworkNotificationsPage from '@/pages/network/NetworkNotificationsPage';
import NetworkCohortsPage from '@/pages/network/NetworkCohortsPage';
import NetworkCohortPage from '@/pages/network/NetworkCohortPage';
import NetworkMentorsPage from '@/pages/network/NetworkMentorsPage';
import NetworkCvPage from '@/pages/network/NetworkCvPage';
import NetworkChallengesPage, { NetworkChallengePage } from '@/pages/network/NetworkChallengesPage';
import CareerRoadmapDetailPage from '@/pages/career/CareerRoadmapDetailPage';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/constants/routes';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import CoachPage from '@/pages/dashboard/CoachPage';
import ApplicationsPage from '@/pages/workspace/ApplicationsPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import ProfileDetailPage from '@/pages/profile/ProfileDetailPage';
import ProgressPage from '@/pages/profile/ProgressPage';
import MyCvPage from '@/pages/cv/MyCvPage';
import CvBuilderPage from '@/pages/cv/CvBuilderPage';
import CvEditorPage from '@/pages/cv/CvEditorPage';
import CvPreviewOnlyPage from '@/pages/cv/CvPreviewOnlyPage';
import SelfDiscoveryPage from '@/pages/self-discovery/SelfDiscoveryPage';
import CareerRoadmapPage from '@/pages/career/CareerRoadmapPage';
import JobMatchingPage from '@/pages/career/JobMatchingPage';
import JobMatchingDetailPage from '@/pages/career/JobMatchingDetailPage';
import CourseCatalogPage from '@/pages/courses/CourseCatalogPage';
import CourseDetailPage from '@/pages/courses/CourseDetailPage';

// Route bảo vệ - yêu cầu đăng nhập
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

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
        Đang tải LemoGuide...
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to={ROUTES.LOGIN} replace />;
};

// Route công khai - nếu đã đăng nhập thì chuyển vào Dashboard
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
      <Route path={ROUTES.COACH} element={<ProtectedRoute><CoachPage /></ProtectedRoute>} />
      <Route path={ROUTES.APPLICATIONS} element={<ProtectedRoute><ApplicationsPage /></ProtectedRoute>} />
      <Route path="/network" element={<ProtectedRoute><NetworkFeedPage /></ProtectedRoute>} />
      <Route path="/network/discover" element={<ProtectedRoute><NetworkPeoplePage /></ProtectedRoute>} />
      <Route path="/network/connections" element={<ProtectedRoute><NetworkPeoplePage /></ProtectedRoute>} />
      <Route path="/network/settings" element={<ProtectedRoute><NetworkSettingsPage /></ProtectedRoute>} />
      <Route path="/network/posts/:id" element={<ProtectedRoute><NetworkPostPage /></ProtectedRoute>} />
      <Route path="/network/messages" element={<ProtectedRoute><NetworkMessagesPage /></ProtectedRoute>} />
      <Route path="/network/messages/:id" element={<ProtectedRoute><NetworkMessagesPage /></ProtectedRoute>} />
      <Route path="/network/notifications" element={<ProtectedRoute><NetworkNotificationsPage /></ProtectedRoute>} />
      <Route path="/network/cohorts" element={<ProtectedRoute><NetworkCohortsPage /></ProtectedRoute>} />
      <Route path="/network/cohorts/:id" element={<ProtectedRoute><NetworkCohortPage /></ProtectedRoute>} />
      <Route path="/network/mentors" element={<ProtectedRoute><NetworkMentorsPage /></ProtectedRoute>} />
      <Route path="/network/cv/:id" element={<ProtectedRoute><NetworkCvPage /></ProtectedRoute>} />
      <Route path="/network/challenges" element={<ProtectedRoute><NetworkChallengesPage /></ProtectedRoute>} />
      <Route path="/network/challenges/:id" element={<ProtectedRoute><NetworkChallengePage /></ProtectedRoute>} />
      <Route path="/u/:handle" element={<ProtectedRoute><NetworkProfilePage /></ProtectedRoute>} />
      <Route path={ROUTES.CAREER_ROADMAP_DETAIL} element={<ProtectedRoute><CareerRoadmapDetailPage /></ProtectedRoute>} />
      <Route
        path={ROUTES.LOGIN}
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path={ROUTES.REGISTER}
        element={
          <PublicRoute>
            <RegisterPage />
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
        path={ROUTES.PROFILE}
        element={
          <ProtectedRoute>
            <ProfileDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.PROGRESS}
        element={
          <ProtectedRoute>
            <ProgressPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.MY_CV}
        element={
          <ProtectedRoute>
            <MyCvPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.CV_BUILDER}
        element={
          <ProtectedRoute>
            <CvBuilderPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.CV_EDITOR}
        element={
          <ProtectedRoute>
            <CvEditorPage />
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
        path={ROUTES.SELF_DISCOVERY}
        element={
          <ProtectedRoute>
            <SelfDiscoveryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.CAREER_ROADMAP}
        element={
          <ProtectedRoute>
            <CareerRoadmapPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.JOB_MATCHING}
        element={
          <ProtectedRoute>
            <JobMatchingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.JOB_MATCHING_DETAIL}
        element={
          <ProtectedRoute>
            <JobMatchingDetailPage />
          </ProtectedRoute>
        }
      />
      <Route path={ROUTES.COURSES} element={<ProtectedRoute><CourseCatalogPage /></ProtectedRoute>} />
      <Route path={ROUTES.COURSE_DETAIL} element={<ProtectedRoute><CourseDetailPage /></ProtectedRoute>} />
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
