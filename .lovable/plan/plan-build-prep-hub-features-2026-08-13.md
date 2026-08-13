# Plan: Build "Prep Hub" Features

Integrating the requested features into the existing platform, maintaining the "Parikshaa" branding but adding the "Prep Hub" dashboard and modules.

## User Experience

- **Onboarding**: A multi-step goal-setting flow after first login (Target Company, Role, Timeline).
- **Personalized Roadmap**: AI-generated weekly sprints and daily tasks based on onboarding data.
- **Tufy AI Mentor**: A Socratic chatbot in the code editor and dashboard that provides hints instead of solutions.
- **Modules**:
    - **Prep Hub Dashboard**: Central hub for progress, POTD, and quick access.
    - **Company Problems**: Specific company-tagged problems from the last 90 days.
    - **Aptitude Section**: 2000+ topic-wise problems with explainers.
    - **Interview Experiences**: A feed of community/curated writeups.
- **Revision & Quizzes**: Automated notes and retention quizzes after each sprint.
- **Enhanced Code Review**: AI-generated feedback on every submission.

## Technical Details

- **Database**:
    - `public.user_onboarding`: Store goals, target companies, and timelines.
    - `public.user_roadmaps`: Store the generated weekly/daily plans.
    - `public.aptitude_questions`: Store aptitude content.
    - `public.interview_experiences`: Store experience blogs/writeups.
    - `public.problem_submissions_reviews`: Store AI feedback for code submissions.
- **AI Integration (Lovable AI Gateway)**:
    - Roadmap generation via `gpt-4o`.
    - "Tufy AI" system prompt configuration for Socratic guidance.
    - Automated code review logic.
- **Frontend**:
    - `src/pages/prephub/Dashboard.tsx`: The new main entry point.
    - `src/pages/prephub/Onboarding.tsx`: Goal setting flow.
    - `src/pages/prephub/Aptitude.tsx`: Question bank UI.
    - `src/components/prephub/TufyChat.tsx`: Socratic assistant.

## Implementation Steps

1. **Database Schema**: Create tables for onboarding, roadmaps, aptitude, and interview experiences.
2. **Onboarding Flow**: Build the UI to capture user goals and trigger roadmap generation.
3. **Roadmap Engine**: Implement the logic to break goals into weekly sprints.
4. **Prep Hub Dashboard**: Create the central command center UI.
5. **Tufy AI**: Develop the Socratic chatbot component.
6. **Content Modules**: Scaffolding for Aptitude, Company Problems, and Interview Experiences.
7. **Code Review**: Hook into the existing code submission flow to add AI reviews.
8. **Navigation**: Add "Prep Hub" to the sidebar and main navigation.