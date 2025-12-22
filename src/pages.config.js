import Analytics from './pages/Analytics';
import Apply from './pages/Apply';
import FreelancerDetail from './pages/FreelancerDetail';
import FreelancerOnboarding from './pages/FreelancerOnboarding';
import Freelancers from './pages/Freelancers';
import Home from './pages/Home';
import ImportFreelancers from './pages/ImportFreelancers';
import Jobs from './pages/Jobs';
import MyApplication from './pages/MyApplication';
import OpenPositions from './pages/OpenPositions';
import Pipeline from './pages/Pipeline';
import UserManagement from './pages/UserManagement';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Analytics": Analytics,
    "Apply": Apply,
    "FreelancerDetail": FreelancerDetail,
    "FreelancerOnboarding": FreelancerOnboarding,
    "Freelancers": Freelancers,
    "Home": Home,
    "ImportFreelancers": ImportFreelancers,
    "Jobs": Jobs,
    "MyApplication": MyApplication,
    "OpenPositions": OpenPositions,
    "Pipeline": Pipeline,
    "UserManagement": UserManagement,
}

export const pagesConfig = {
    mainPage: "Freelancers",
    Pages: PAGES,
    Layout: __Layout,
};