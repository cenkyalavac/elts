import FreelancerDetail from './pages/FreelancerDetail';
import FreelancerOnboarding from './pages/FreelancerOnboarding';
import Freelancers from './pages/Freelancers';
import Jobs from './pages/Jobs';
import Pipeline from './pages/Pipeline';
import Apply from './pages/Apply';
import OpenPositions from './pages/OpenPositions';
import MyApplication from './pages/MyApplication';
import UserManagement from './pages/UserManagement';
import __Layout from './Layout.jsx';


export const PAGES = {
    "FreelancerDetail": FreelancerDetail,
    "FreelancerOnboarding": FreelancerOnboarding,
    "Freelancers": Freelancers,
    "Jobs": Jobs,
    "Pipeline": Pipeline,
    "Apply": Apply,
    "OpenPositions": OpenPositions,
    "MyApplication": MyApplication,
    "UserManagement": UserManagement,
}

export const pagesConfig = {
    mainPage: "Freelancers",
    Pages: PAGES,
    Layout: __Layout,
};