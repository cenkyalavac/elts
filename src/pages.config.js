import Apply from './pages/Apply';
import FreelancerDetail from './pages/FreelancerDetail';
import FreelancerOnboarding from './pages/FreelancerOnboarding';
import Freelancers from './pages/Freelancers';
import Jobs from './pages/Jobs';
import MyApplication from './pages/MyApplication';
import OpenPositions from './pages/OpenPositions';
import Pipeline from './pages/Pipeline';
import UserManagement from './pages/UserManagement';
import Analytics from './pages/Analytics';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Apply": Apply,
    "FreelancerDetail": FreelancerDetail,
    "FreelancerOnboarding": FreelancerOnboarding,
    "Freelancers": Freelancers,
    "Jobs": Jobs,
    "MyApplication": MyApplication,
    "OpenPositions": OpenPositions,
    "Pipeline": Pipeline,
    "UserManagement": UserManagement,
    "Analytics": Analytics,
}

export const pagesConfig = {
    mainPage: "Freelancers",
    Pages: PAGES,
    Layout: __Layout,
};