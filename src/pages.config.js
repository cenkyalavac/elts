import FreelancerDetail from './pages/FreelancerDetail';
import FreelancerOnboarding from './pages/FreelancerOnboarding';
import Freelancers from './pages/Freelancers';
import Jobs from './pages/Jobs';
import Pipeline from './pages/Pipeline';
import Apply from './pages/Apply';
import OpenPositions from './pages/OpenPositions';


export const PAGES = {
    "FreelancerDetail": FreelancerDetail,
    "FreelancerOnboarding": FreelancerOnboarding,
    "Freelancers": Freelancers,
    "Jobs": Jobs,
    "Pipeline": Pipeline,
    "Apply": Apply,
    "OpenPositions": OpenPositions,
}

export const pagesConfig = {
    mainPage: "Freelancers",
    Pages: PAGES,
};