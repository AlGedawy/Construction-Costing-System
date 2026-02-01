(function(){
    window.PlanConfig = (function(){
        const STORAGE_KEY = 'user_plan';
        const PLANS = {
            free: { id: 'free', name: 'Free', maxProjects: 3, maxItemsPerProject: 50, benefits: ['Up to 3 projects', 'Up to 50 items per project'] },
            pro:  { id: 'pro', name: 'Pro',  maxProjects: Infinity, maxItemsPerProject: Infinity, benefits: ['Unlimited projects', 'Unlimited items', 'Export & Import'] }
        };

        function getPlan() {
            return localStorage.getItem(STORAGE_KEY) || 'free';
        }
        function setPlan(planId) {
            if (!PLANS[planId]) return false;
            localStorage.setItem(STORAGE_KEY, planId);
            // notify listeners
            window.dispatchEvent(new CustomEvent('planChanged', { detail: { plan: planId } }));
            return true;
        }
        function isPro() { return getPlan() === 'pro'; }
        function getPlanInfo() { return PLANS[getPlan()] || PLANS.free; }

        function canCreateProject(existingProjectsCount) {
            if (isPro()) return true;
            return existingProjectsCount < PLANS.free.maxProjects;
        }
        function canAddItemToProject(project) {
            if (isPro()) return true;
            const count = project.sections.reduce((s, sec) => s + (sec.rows ? sec.rows.length : 0), 0);
            return count < PLANS.free.maxItemsPerProject;
        }

        return { getPlan, setPlan, isPro, getPlanInfo, canCreateProject, canAddItemToProject, PLANS };
    })();
})();