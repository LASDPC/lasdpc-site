# Pages Guide (frontend/src/pages)

This file documents the purpose and main behaviors of each route-level page component.
Each section maps to a `*.tsx` file in this folder and summarizes what the page does,
which data it loads, and what key user interactions exist.

## AdminEditPage.tsx
- Admin-only create/edit surface for multiple resource types (blog, project, publication, people, docs, clusters).
- Reads route params (`resource`, optional `id`) to choose the correct form and mode (create vs edit).
- Uses the authenticated user's admin status to guard access; non-admins are redirected away.
- Loads resource data when `id` is present, then populates the corresponding admin form.
- Supports create and update flows via resource-specific hooks/mutations.
- Includes destructive actions (delete) with confirmation UX via the admin delete button.
- Provides navigation back to the relevant admin listing context after successful operations.

## BlogPage.tsx
- Public listing page for blog posts with skeleton loading while fetching.
- Uses `useBlog()` to load posts and renders them as a responsive card grid.
- Supports language switching by selecting localized fields based on the active i18n language.
- Admins see edit/create affordances (pencil + add new) to jump into `AdminEditPage`.
- Each post card links to its detail page via router navigation.
- Includes subtle motion/entrance animations for improved scanning and perceived performance.

## BlogPostPage.tsx
- Public blog post detail view driven by the `id` route param.
- Loads all blog posts and selects the matching post for rendering (with skeleton while loading).
- Renders post content using Markdown (`react-markdown` + `remark-gfm`) with safe URL transforms.
- Displays metadata like author/date/tags with iconography and consistent typography hierarchy.
- Includes a back link to the blog list and uses a large hero image with a fallback.
- Honors the active language to pick localized content fields when available.

## ComingSoonPage.tsx
- Simple placeholder page used when the site is in maintenance/coming-soon mode.
- Provides minimal messaging and visual structure consistent with the global layout.
- Acts as a safe default route target when gated features are not enabled.
- Avoids data loading; purely presentational and fast to render.
- Keeps UX consistent across themes and screen sizes.
- Intended to be replaced or removed once the full site is available.

## ContactPage.tsx
- Public contact information page with localized text and structured layout.
- Presents contact channels and any lab/organization details needed by visitors.
- Focuses on readability and quick access to links, rather than complex interaction.
- Uses global styling primitives (cards/typography) for consistent look-and-feel.
- Designed to work well on mobile with stacked sections and clear spacing.
- Does not require authentication and avoids heavy data fetching.

## DocsPage.tsx
- Documentation hub that lists available documents and allows users to open/download them.
- Uses hooks/services to fetch doc metadata from the backend and render a searchable/browsable list.
- Admins can create/edit docs via admin affordances that link into `AdminEditPage`.
- Supports language-aware fields where applicable, matching the site’s i18n behavior.
- Emphasizes clear hierarchy: categories/labels, titles, and short descriptions.
- Handles loading states and empty states without breaking layout.

## HomePage.tsx
- Public landing page showcasing the lab/site identity, highlights, and navigation entry points.
- Uses motion/visual sections to guide scanning (hero, feature blocks, calls-to-action).
- Pulls in localized strings and uses consistent typography for brand tone.
- Optimized for first impression: responsive layout and minimal blocking data loads.
- Provides links into People, Research, Blog, and other primary areas.
- Works across themes (light/dark/high-contrast) using shared CSS variables.

## Index.tsx
- Small re-export/entry convenience for the pages directory.
- Centralizes exports to simplify imports elsewhere in the app.
- Contains minimal logic and no runtime behavior by design.
- Keeps the pages folder organized for route registration.
- Helps reduce relative path noise across the codebase.
- Should remain lightweight to avoid unexpected bundling side effects.

## InfrastructurePage.tsx
- Authenticated reservation flow for infrastructure/cluster resources (separate from room booking).
- Fetches cluster data and renders forms or request flows based on user role/permissions.
- Enforces login requirements and displays a “login required” state when unauthenticated.
- Uses localized labels, helper text, and validation messaging.
- Provides a structured form UX with consistent components (inputs, selects, buttons).
- Integrates with backend endpoints for submitting and tracking infrastructure requests.

## LoginPage.tsx
- Authentication page for signing in with email/identifier and password.
- Submits credentials to the backend auth endpoint and stores the returned token/user context.
- Includes user-friendly validation and error toasts for failed attempts.
- Provides navigation links to registration and other relevant routes.
- Uses consistent “glass surface” card styling and works across themes.
- Designed to be mobile-friendly with a single-column form layout.

## NotFound.tsx
- 404 page shown for unmatched routes.
- Provides clear messaging and a path back to a known page (e.g., Home).
- Keeps layout consistent with the rest of the app (spacing, typography).
- Avoids data loading and renders instantly.
- Useful for preventing dead ends during navigation or deep links.
- Supports i18n messaging for a localized user experience.

## PendingUsersPage.tsx
- Admin page to review, approve, or reject pending user registrations.
- Loads pending users and displays moderation actions with confirmation where appropriate.
- Requires admin privileges; non-admin users should not reach this page.
- Integrates with backend approval/rejection endpoints and updates UI after actions.
- Uses list/table-like layouts for quick scanning and bulk decision making.
- Ensures clear status messaging and minimizes accidental moderation mistakes.

## PeoplePage.tsx
- Public directory of lab members (faculty and students) with filtering and sections.
- Loads people data from the backend and renders profile cards/rows with localized fields.
- Supports navigation to individual profiles for more detailed information.
- Admins see editing affordances that link into `AdminEditPage`.
- Optimized for browsing: responsive grid, consistent card sizing, readable metadata.
- Handles loading states gracefully and avoids layout jumps.

## PrivacyPolicyPage.tsx
- Public legal/compliance page outlining privacy terms (LGPD/GDPR-style content as applicable).
- Static or lightly dynamic content with clear headings and readable typography.
- Designed for accessibility: contrast, spacing, and text hierarchy.
- No authentication required; should be linkable from footers and account screens.
- Avoids heavy dependencies and keeps rendering predictable.
- Localized where relevant to match the site’s language toggle.

## ProfilePage.tsx
- Authenticated user profile screen (view + edit of user details and avatar/photo).
- Loads user data by `userId` param and supports editing within permission rules.
- Uses consistent form components, inline help text, and validations.
- Includes media upload flows (photo/avatar) and persistence to backend endpoints.
- Accounts for admin vs self-edit permissions (admin fields restricted where needed).
- Provides feedback via toasts and updates UI state after successful changes.

## ProjectPage.tsx
- Research project detail page driven by a route param (`id`).
- Loads project data and renders summary, objectives, and any rich content sections.
- Supports language-aware fields and consistent typography for long-form reading.
- Provides navigation back to the main Research page.
- Admins can edit via admin affordances (linked into `AdminEditPage`).
- Handles loading states and missing-project cases without breaking the route.

## RegisterPage.tsx
- User registration page collecting identity and role information required by the system.
- Submits to backend registration endpoints and handles pending/approval flows.
- Includes form validation, error toasts, and clear next-step messaging.
- Honors i18n (labels, helper text, and error strings).
- Designed to be mobile-friendly and accessible with proper form structure.
- Links back to login for users who already have an account.

## ResearchPage.tsx
- Public research overview combining projects and publications.
- Loads projects/publications via hooks and renders them in distinct sections.
- Includes skeleton loading and motion for a polished scanning experience.
- Supports admin add/edit shortcuts for managing content.
- Uses i18n to show localized titles/summaries where available.
- Emphasizes readability and hierarchy for a mixed-content page.

## ReservaPage.tsx
- Authenticated “Reserva” hub page that routes users to booking subsystems.
- Requires login; shows a login-required message when unauthenticated.
- Presents two primary cards: Infrastructure reservations and Room scheduling.
- Uses clear iconography and large tap targets for quick navigation.
- Keeps layout responsive with a grid that scales from mobile to desktop.
- Acts as the entry point for all reservation-related functionality.

## RoomSchedulingPage.tsx (Room Booking)
- Authenticated room booking system with a Google Calendar-like weekly UX.
- Core navigation: sticky toolbar (Today, prev/next week, period label) + collapsible sidebar.
- Sidebar: Create button, mini month picker, and room selector for rooms `1-009` and `1-007`.
- Main view: week grid (08:00–22:00) with events positioned by time/duration and “today” highlighting.
- Create flow: click "+ New Event" or click on an empty grid slot to open the create modal (1h duration).
- Validation: frontend blocks invalid time ranges and too-old events (TTL policy), backend enforces overlaps.
- Event interaction: owner clicks an event to open a large edit modal; non-owners cannot edit.
- Edit flow: update title, participants, and same-day date/start/end time via PATCH; UI updates immediately.
- Delete flow: red trash icon triggers an in-app confirmation modal (no browser confirm).
- Participants: chips + typeahead suggestions (prefix match) backed by a users suggestion endpoint.
