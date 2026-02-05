/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Analytics from './pages/Analytics';
import Announcements from './pages/Announcements';
import Apply from './pages/Apply';
import Dashboard from './pages/Dashboard';
import DocumentCompliance from './pages/DocumentCompliance';
import FreelancerDetail from './pages/FreelancerDetail';
import FreelancerOnboarding from './pages/FreelancerOnboarding';
import FreelancerPreview from './pages/FreelancerPreview';
import Freelancers from './pages/Freelancers';
import GettingStarted from './pages/GettingStarted';
import GmailCallback from './pages/GmailCallback';
import Home from './pages/Home';
import ImportFreelancers from './pages/ImportFreelancers';
import Inbox from './pages/Inbox';
import Jobs from './pages/Jobs';
import Messages from './pages/Messages';
import MyApplication from './pages/MyApplication';
import MyAvailability from './pages/MyAvailability';
import NinjaApplicants from './pages/NinjaApplicants';
import NinjaPrograms from './pages/NinjaPrograms';
import NormalizeLanguages from './pages/NormalizeLanguages';
import OpenPositions from './pages/OpenPositions';
import PerformanceAnalytics from './pages/PerformanceAnalytics';
import Pipeline from './pages/Pipeline';
import Position from './pages/Position';
import QualityManagement from './pages/QualityManagement';
import QualityReportDetail from './pages/QualityReportDetail';
import QuizManagement from './pages/QuizManagement';
import Settings from './pages/Settings';
import SmartcatIntegration from './pages/SmartcatIntegration';
import SmartcatPayments from './pages/SmartcatPayments';
import Support from './pages/Support';
import SupportTickets from './pages/SupportTickets';
import TakeQuiz from './pages/TakeQuiz';
import TeamAvailability from './pages/TeamAvailability';
import UserManagement from './pages/UserManagement';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Analytics": Analytics,
    "Announcements": Announcements,
    "Apply": Apply,
    "Dashboard": Dashboard,
    "DocumentCompliance": DocumentCompliance,
    "FreelancerDetail": FreelancerDetail,
    "FreelancerOnboarding": FreelancerOnboarding,
    "FreelancerPreview": FreelancerPreview,
    "Freelancers": Freelancers,
    "GettingStarted": GettingStarted,
    "GmailCallback": GmailCallback,
    "Home": Home,
    "ImportFreelancers": ImportFreelancers,
    "Inbox": Inbox,
    "Jobs": Jobs,
    "Messages": Messages,
    "MyApplication": MyApplication,
    "MyAvailability": MyAvailability,
    "NinjaApplicants": NinjaApplicants,
    "NinjaPrograms": NinjaPrograms,
    "NormalizeLanguages": NormalizeLanguages,
    "OpenPositions": OpenPositions,
    "PerformanceAnalytics": PerformanceAnalytics,
    "Pipeline": Pipeline,
    "Position": Position,
    "QualityManagement": QualityManagement,
    "QualityReportDetail": QualityReportDetail,
    "QuizManagement": QuizManagement,
    "Settings": Settings,
    "SmartcatIntegration": SmartcatIntegration,
    "SmartcatPayments": SmartcatPayments,
    "Support": Support,
    "SupportTickets": SupportTickets,
    "TakeQuiz": TakeQuiz,
    "TeamAvailability": TeamAvailability,
    "UserManagement": UserManagement,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};