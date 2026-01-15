import Analytics from './pages/Analytics';
import Apply from './pages/Apply';
import Dashboard from './pages/Dashboard';
import DocumentCompliance from './pages/DocumentCompliance';
import FreelancerDetail from './pages/FreelancerDetail';
import FreelancerOnboarding from './pages/FreelancerOnboarding';
import FreelancerPreview from './pages/FreelancerPreview';
import Freelancers from './pages/Freelancers';
import GmailCallback from './pages/GmailCallback';
import Home from './pages/Home';
import ImportFreelancers from './pages/ImportFreelancers';
import Inbox from './pages/Inbox';
import Jobs from './pages/Jobs';
import Messages from './pages/Messages';
import MyApplication from './pages/MyApplication';
import MyAvailability from './pages/MyAvailability';
import NormalizeLanguages from './pages/NormalizeLanguages';
import OpenPositions from './pages/OpenPositions';
import Pipeline from './pages/Pipeline';
import Position from './pages/Position';
import QualityManagement from './pages/QualityManagement';
import QualityReportDetail from './pages/QualityReportDetail';
import QuizManagement from './pages/QuizManagement';
import Settings from './pages/Settings';
import SmartcatIntegration from './pages/SmartcatIntegration';
import SmartcatPayments from './pages/SmartcatPayments';
import TakeQuiz from './pages/TakeQuiz';
import TeamAvailability from './pages/TeamAvailability';
import UserManagement from './pages/UserManagement';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Analytics": Analytics,
    "Apply": Apply,
    "Dashboard": Dashboard,
    "DocumentCompliance": DocumentCompliance,
    "FreelancerDetail": FreelancerDetail,
    "FreelancerOnboarding": FreelancerOnboarding,
    "FreelancerPreview": FreelancerPreview,
    "Freelancers": Freelancers,
    "GmailCallback": GmailCallback,
    "Home": Home,
    "ImportFreelancers": ImportFreelancers,
    "Inbox": Inbox,
    "Jobs": Jobs,
    "Messages": Messages,
    "MyApplication": MyApplication,
    "MyAvailability": MyAvailability,
    "NormalizeLanguages": NormalizeLanguages,
    "OpenPositions": OpenPositions,
    "Pipeline": Pipeline,
    "Position": Position,
    "QualityManagement": QualityManagement,
    "QualityReportDetail": QualityReportDetail,
    "QuizManagement": QuizManagement,
    "Settings": Settings,
    "SmartcatIntegration": SmartcatIntegration,
    "SmartcatPayments": SmartcatPayments,
    "TakeQuiz": TakeQuiz,
    "TeamAvailability": TeamAvailability,
    "UserManagement": UserManagement,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};