import Analytics from './pages/Analytics';
import Apply from './pages/Apply';
import FreelancerDetail from './pages/FreelancerDetail';
import FreelancerOnboarding from './pages/FreelancerOnboarding';
import Freelancers from './pages/Freelancers';
import GmailCallback from './pages/GmailCallback';
import Home from './pages/Home';
import ImportFreelancers from './pages/ImportFreelancers';
import Jobs from './pages/Jobs';
import MyApplication from './pages/MyApplication';
import OpenPositions from './pages/OpenPositions';
import Pipeline from './pages/Pipeline';
import UserManagement from './pages/UserManagement';
import Messages from './pages/Messages';
import NormalizeLanguages from './pages/NormalizeLanguages';
import Settings from './pages/Settings';
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
    "MyApplication": MyApplication,
    "OpenPositions": OpenPositions,
    "Pipeline": Pipeline,
    "UserManagement": UserManagement,
    "Messages": Messages,
    "NormalizeLanguages": NormalizeLanguages,
    "Settings": Settings,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};