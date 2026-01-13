import Analytics from './pages/Analytics';
import Apply from './pages/Apply';
import FreelancerDetail from './pages/FreelancerDetail';
import FreelancerOnboarding from './pages/FreelancerOnboarding';
import Freelancers from './pages/Freelancers';
import GmailCallback from './pages/GmailCallback';
import Home from './pages/Home';
import ImportFreelancers from './pages/ImportFreelancers';
import Jobs from './pages/Jobs';
import Messages from './pages/Messages';
import MyApplication from './pages/MyApplication';
import MyAvailability from './pages/MyAvailability';
import NormalizeLanguages from './pages/NormalizeLanguages';
import OpenPositions from './pages/OpenPositions';
import Pipeline from './pages/Pipeline';
import QuizManagement from './pages/QuizManagement';
import Settings from './pages/Settings';
import TakeQuiz from './pages/TakeQuiz';
import TeamAvailability from './pages/TeamAvailability';
import UserManagement from './pages/UserManagement';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Analytics": Analytics,
    "Apply": Apply,
    "FreelancerDetail": FreelancerDetail,
    "FreelancerOnboarding": FreelancerOnboarding,
    "Freelancers": Freelancers,
    "GmailCallback": GmailCallback,
    "Home": Home,
    "ImportFreelancers": ImportFreelancers,
    "Jobs": Jobs,
    "Messages": Messages,
    "MyApplication": MyApplication,
    "MyAvailability": MyAvailability,
    "NormalizeLanguages": NormalizeLanguages,
    "OpenPositions": OpenPositions,
    "Pipeline": Pipeline,
    "QuizManagement": QuizManagement,
    "Settings": Settings,
    "TakeQuiz": TakeQuiz,
    "TeamAvailability": TeamAvailability,
    "UserManagement": UserManagement,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};