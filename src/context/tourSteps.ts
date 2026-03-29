import type { TourStep } from './GuidanceContext';

export const TOUR_STEPS: TourStep[] = [
  {
    route: '/',
    target: 'home-start',
    title: 'Start on home',
    body: 'This is your launchpad. When you are new, start here before you make a move.',
    whyItMatters: 'A good first session should answer one question: learn first, ask Alpha, or try a small practice trade.',
  },
  {
    route: '/',
    target: 'home-xp',
    title: 'XP tracks judgment',
    body: 'Your level is not about trading more. It is about reasoning more clearly.',
    whyItMatters: 'AlphaMove rewards thoughtful moves, not speed. Good thinking is the skill you are building.',
  },
  {
    route: '/',
    target: 'home-brief',
    title: 'Morning Brief gives context',
    body: 'This section turns market news into plain English and connects it to your position.',
    whyItMatters: 'Beginners usually drown in headlines. The brief tells you what actually matters and why.',
  },
  {
    route: '/trade',
    target: 'trade-search',
    title: 'Trade starts with analysis',
    body: 'Search a company or use a starter idea. You do not need a perfect pick to practice thinking.',
    whyItMatters: 'A paper trade here is a rehearsal: notice the business, your thesis, and the risk before you act.',
  },
  {
    route: '/mentor',
    target: 'mentor-prompts',
    title: 'Alpha is your coach',
    body: 'Use Mentor when you do not know what to search, what a concept means, or how to frame a thesis.',
    whyItMatters: 'The goal is not to outsource the decision. It is to get sharper questions before you trade.',
  },
  {
    route: '/profile',
    target: 'profile-guidance',
    title: 'Replay this anytime',
    body: 'Profile is where you can replay the tour and choose how much guidance you want.',
    whyItMatters: 'As you get more comfortable, you can keep the app calm or switch Beginner Mode back on whenever you need it.',
  },
];
