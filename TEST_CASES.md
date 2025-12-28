# OneValue Delivery Intelligence Console - Test Cases

**Version:** 1.0
**Created:** 2025-12-28
**Application:** OneValue Console (React + Supabase + n8n)

---

## Table of Contents

1. [Authentication & Authorization](#1-authentication--authorization)
2. [Dashboard (Overview)](#2-dashboard-overview)
3. [Project Detail](#3-project-detail)
4. [Action Queue](#4-action-queue)
5. [Renewals](#5-renewals)
6. [Alerts](#6-alerts)
7. [Admin / User Management](#7-admin--user-management)
8. [n8n Workflows](#8-n8n-workflows)
9. [Database & API](#9-database--api)
10. [UI/UX & Responsiveness](#10-uiux--responsiveness)
11. [Performance](#11-performance)
12. [Security](#12-security)

---

## 1. Authentication & Authorization

### TC-AUTH-001: Google OAuth Login Success
| Field | Value |
|-------|-------|
| **Priority** | Critical |
| **Precondition** | User email is in `user_allowlist` with `is_active=true` |
| **Steps** | 1. Navigate to `/login`<br>2. Click "Sign in with Google"<br>3. Select allowlisted Google account<br>4. Complete OAuth flow |
| **Expected Result** | User redirected to `/overview`, session created |

### TC-AUTH-002: Google OAuth Login - Non-Allowlisted User
| Field | Value |
|-------|-------|
| **Priority** | Critical |
| **Precondition** | User email NOT in `user_allowlist` |
| **Steps** | 1. Navigate to `/login`<br>2. Click "Sign in with Google"<br>3. Select non-allowlisted Google account |
| **Expected Result** | User sees "Access Denied" message, not redirected to dashboard |

### TC-AUTH-003: Google OAuth Login - Inactive User
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Precondition** | User email in `user_allowlist` with `is_active=false` |
| **Steps** | 1. Attempt Google OAuth login |
| **Expected Result** | Access denied, user cannot access application |

### TC-AUTH-004: Session Persistence
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Precondition** | User logged in |
| **Steps** | 1. Close browser tab<br>2. Reopen application URL |
| **Expected Result** | User remains logged in (session persisted) |

### TC-AUTH-005: Logout
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Precondition** | User logged in |
| **Steps** | 1. Click user avatar/menu<br>2. Click "Sign Out" |
| **Expected Result** | User logged out, redirected to `/login` |

### TC-AUTH-006: Role-Based Access - Admin Menu
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Precondition** | User logged in with Admin role |
| **Steps** | 1. Check navigation menu |
| **Expected Result** | Admin menu item visible in navigation |

### TC-AUTH-007: Role-Based Access - Non-Admin
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Precondition** | User logged in with PM or Viewer role |
| **Steps** | 1. Check navigation menu<br>2. Try navigating to `/admin` directly |
| **Expected Result** | Admin menu hidden, `/admin` route returns 403 or redirects |

### TC-AUTH-008: Domain Restriction
| Field | Value |
|-------|-------|
| **Priority** | Critical |
| **Precondition** | None |
| **Steps** | 1. Attempt login with non-oneorigin.us email |
| **Expected Result** | Login rejected, only @oneorigin.us emails allowed |

---

## 2. Dashboard (Overview)

### TC-DASH-001: Dashboard Load
| Field | Value |
|-------|-------|
| **Priority** | Critical |
| **Precondition** | User logged in |
| **Steps** | 1. Navigate to `/overview` |
| **Expected Result** | Dashboard loads with portfolio data, no console errors |

### TC-DASH-002: Portfolio Health Cards Display
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Precondition** | Projects exist in database |
| **Steps** | 1. View dashboard |
| **Expected Result** | Cards show Critical, At Risk, Healthy, Unknown counts |

### TC-DASH-003: Metric Cards Accuracy
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Precondition** | Known data in database |
| **Steps** | 1. Compare dashboard metrics with database values |
| **Expected Result** | Total Projects, Blockers, Overdue Actions match database |

### TC-DASH-004: Project Cards Display
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Precondition** | Projects exist |
| **Steps** | 1. Scroll through project sections |
| **Expected Result** | Projects grouped by health status (Critical → At Risk → Healthy) |

### TC-DASH-005: Project Card Click Navigation
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Precondition** | Projects exist |
| **Steps** | 1. Click on any project card |
| **Expected Result** | Navigates to `/project/:id` with correct project |

### TC-DASH-006: Critical Alert Banner
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Precondition** | At least one Critical project exists |
| **Steps** | 1. View dashboard |
| **Expected Result** | Intrusive alert banner displayed for critical projects |

### TC-DASH-007: Empty State
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Precondition** | No projects in database |
| **Steps** | 1. View dashboard |
| **Expected Result** | Appropriate empty state message displayed |

### TC-DASH-008: Loading State
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Precondition** | None |
| **Steps** | 1. Navigate to dashboard (observe initial load) |
| **Expected Result** | Loading spinner shown while data fetches |

### TC-DASH-009: Real-time Updates
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Precondition** | Dashboard open |
| **Steps** | 1. Update project health in database<br>2. Observe dashboard |
| **Expected Result** | Dashboard reflects changes (may require refresh or real-time subscription) |

---

## 3. Project Detail

### TC-PROJ-001: Project Detail Page Load
| Field | Value |
|-------|-------|
| **Priority** | Critical |
| **Precondition** | Project exists |
| **Steps** | 1. Navigate to `/project/:id` |
| **Expected Result** | Project details load correctly |

### TC-PROJ-002: Project Header Information
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Precondition** | Project exists |
| **Steps** | 1. View project detail header |
| **Expected Result** | Project name, client, health badge, owner displayed |

### TC-PROJ-003: SOW Document Panel
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Precondition** | Project has SOW linked |
| **Steps** | 1. View SOW panel on project detail |
| **Expected Result** | Contract dates, value, scope anchors displayed |

### TC-PROJ-004: Health Trend Chart
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Precondition** | Project has health history |
| **Steps** | 1. View health trend chart |
| **Expected Result** | 30-day health trend displayed correctly |

### TC-PROJ-005: Action Items List
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Precondition** | Project has action items |
| **Steps** | 1. View action items section |
| **Expected Result** | Action items displayed with priority, status, due date |

### TC-PROJ-006: Recent Communications
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Precondition** | Project has delivery intelligence records |
| **Steps** | 1. View communications section |
| **Expected Result** | Recent messages from Gmail/Chat displayed |

### TC-PROJ-007: Evidence Links
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Precondition** | Communications have evidence links |
| **Steps** | 1. Click evidence link |
| **Expected Result** | Opens source (Gmail/Chat) in new tab |

### TC-PROJ-008: Invalid Project ID
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Precondition** | None |
| **Steps** | 1. Navigate to `/project/invalid-uuid` |
| **Expected Result** | 404 or "Project not found" message |

### TC-PROJ-009: Back Navigation
| Field | Value |
|-------|-------|
| **Priority** | Low |
| **Precondition** | On project detail page |
| **Steps** | 1. Click back button/link |
| **Expected Result** | Returns to dashboard |

---

## 4. Action Queue

### TC-ACT-001: Action Queue Page Load
| Field | Value |
|-------|-------|
| **Priority** | Critical |
| **Precondition** | User logged in |
| **Steps** | 1. Navigate to `/actions` |
| **Expected Result** | Action queue loads with items |

### TC-ACT-002: Actions Sorted by Priority
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Precondition** | Actions with different priorities exist |
| **Steps** | 1. View action queue |
| **Expected Result** | Actions sorted: Critical → High → Medium → Low |

### TC-ACT-003: Action Item Details
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Precondition** | Actions exist |
| **Steps** | 1. View action item card |
| **Expected Result** | Title, description, owner, due date, status displayed |

### TC-ACT-004: Filter by Project
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Precondition** | Actions from multiple projects |
| **Steps** | 1. Select project filter<br>2. Choose specific project |
| **Expected Result** | Only actions from selected project shown |

### TC-ACT-005: Filter by Status
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Precondition** | Actions with different statuses |
| **Steps** | 1. Select status filter<br>2. Choose "In Progress" |
| **Expected Result** | Only "In Progress" actions shown |

### TC-ACT-006: Overdue Actions Highlighting
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Precondition** | Actions with past due dates |
| **Steps** | 1. View action queue |
| **Expected Result** | Overdue actions visually highlighted (red/warning) |

### TC-ACT-007: Create New Action
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Precondition** | User has PM or Admin role |
| **Steps** | 1. Click "Create Action"<br>2. Fill form fields<br>3. Submit |
| **Expected Result** | New action created, appears in queue |

### TC-ACT-008: Update Action Status
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Precondition** | Action exists |
| **Steps** | 1. Click action<br>2. Change status to "Completed"<br>3. Save |
| **Expected Result** | Action status updated, removed from active queue |

### TC-ACT-009: Metric Cards Accuracy
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Precondition** | Actions exist |
| **Steps** | 1. Compare metric cards with actual counts |
| **Expected Result** | Total, Overdue, Critical, In Progress counts accurate |

---

## 5. Renewals

### TC-REN-001: Renewals Page Load
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Precondition** | User logged in |
| **Steps** | 1. Navigate to `/renewals` |
| **Expected Result** | Renewals page loads with contract data |

### TC-REN-002: Renewal Risk Display
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Precondition** | Projects with renewal dates |
| **Steps** | 1. View renewals list |
| **Expected Result** | Projects sorted by renewal urgency |

### TC-REN-003: Days Until Renewal
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Precondition** | Projects with end dates |
| **Steps** | 1. Check "Days Remaining" column |
| **Expected Result** | Accurate calculation of days until contract end |

### TC-REN-004: Renewal Risk Score
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Precondition** | Projects with risk scores |
| **Steps** | 1. View risk score indicators |
| **Expected Result** | High/Medium/Low risk categorization displayed |

### TC-REN-005: Upcoming Renewals Filter
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Precondition** | Projects with various end dates |
| **Steps** | 1. Filter by "Next 90 days" |
| **Expected Result** | Only projects ending within 90 days shown |

---

## 6. Alerts

### TC-ALT-001: Alerts Page Load
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Precondition** | User logged in |
| **Steps** | 1. Navigate to `/alerts` |
| **Expected Result** | Alerts page loads with notifications |

### TC-ALT-002: Alert Severity Display
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Precondition** | Alerts with different severities |
| **Steps** | 1. View alerts list |
| **Expected Result** | Critical, High, Medium, Low alerts visually distinguished |

### TC-ALT-003: Alert Status - Unread
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Precondition** | Unread alerts exist |
| **Steps** | 1. View alerts |
| **Expected Result** | Unread alerts highlighted/badged |

### TC-ALT-004: Mark Alert as Read
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Precondition** | Unread alert exists |
| **Steps** | 1. Click on alert<br>2. Mark as read |
| **Expected Result** | Alert status changes to "read" |

### TC-ALT-005: Dismiss Alert
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Precondition** | Alert exists |
| **Steps** | 1. Click dismiss button on alert |
| **Expected Result** | Alert dismissed, removed from active list |

### TC-ALT-006: Alert Link to Project
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Precondition** | Alert linked to project |
| **Steps** | 1. Click project link in alert |
| **Expected Result** | Navigates to related project detail page |

### TC-ALT-007: Alert Badge in Navigation
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Precondition** | Unread critical alerts exist |
| **Steps** | 1. Check navigation menu |
| **Expected Result** | Alert badge shows count of unread alerts |

---

## 7. Admin / User Management

### TC-ADM-001: Admin Page Access - Admin User
| Field | Value |
|-------|-------|
| **Priority** | Critical |
| **Precondition** | User logged in with Admin role |
| **Steps** | 1. Navigate to `/admin` |
| **Expected Result** | Admin page loads with user management |

### TC-ADM-002: Admin Page Access - Non-Admin
| Field | Value |
|-------|-------|
| **Priority** | Critical |
| **Precondition** | User logged in with PM/Viewer role |
| **Steps** | 1. Navigate to `/admin` directly |
| **Expected Result** | Access denied, redirected or 403 error |

### TC-ADM-003: View User List
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Precondition** | Admin user, users in allowlist |
| **Steps** | 1. View user management section |
| **Expected Result** | All allowlisted users displayed with email, role, status |

### TC-ADM-004: Add New User
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Precondition** | Admin user |
| **Steps** | 1. Click "Add User"<br>2. Enter email, display name, role<br>3. Submit |
| **Expected Result** | New user added to allowlist |

### TC-ADM-005: Edit User Role
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Precondition** | Admin user, user exists |
| **Steps** | 1. Click edit on user<br>2. Change role from Viewer to PM<br>3. Save |
| **Expected Result** | User role updated |

### TC-ADM-006: Deactivate User
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Precondition** | Admin user, active user exists |
| **Steps** | 1. Click deactivate on user |
| **Expected Result** | User `is_active` set to false, can't login |

### TC-ADM-007: Reactivate User
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Precondition** | Admin user, inactive user exists |
| **Steps** | 1. Click activate on user |
| **Expected Result** | User `is_active` set to true, can login |

### TC-ADM-008: Delete User
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Precondition** | Admin user |
| **Steps** | 1. Click delete on user<br>2. Confirm deletion |
| **Expected Result** | User removed from allowlist |

### TC-ADM-009: Email Validation
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Precondition** | Admin adding new user |
| **Steps** | 1. Enter invalid email format<br>2. Submit |
| **Expected Result** | Validation error shown |

### TC-ADM-010: Duplicate Email Prevention
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Precondition** | User already exists |
| **Steps** | 1. Try adding user with existing email |
| **Expected Result** | Error: "User already exists" |

---

## 8. n8n Workflows

### TC-N8N-001: Historical Data Dump Execution
| Field | Value |
|-------|-------|
| **Priority** | Critical |
| **Precondition** | Gmail/Chat OAuth configured |
| **Steps** | 1. Trigger workflow manually in n8n |
| **Expected Result** | Emails and chat messages ingested into `delivery_intelligence` |

### TC-N8N-002: Daily Delivery Poller Schedule
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Precondition** | Workflow active |
| **Steps** | 1. Wait for 9 AM UTC<br>2. Check executions |
| **Expected Result** | Workflow executes automatically, new messages ingested |

### TC-N8N-003: AI Project Analyzer Execution
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Precondition** | Unprocessed records exist |
| **Steps** | 1. Trigger workflow or wait for schedule |
| **Expected Result** | Records updated with `ai_processed=true`, sentiment scores |

### TC-N8N-004: AI Analyzer - Sentiment Score
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Precondition** | AI analyzer completed |
| **Steps** | 1. Check processed record |
| **Expected Result** | `sentiment_score` between -1.0 and 1.0 |

### TC-N8N-005: AI Analyzer - Blocker Extraction
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Precondition** | Communication mentions blockers |
| **Steps** | 1. Run AI analyzer<br>2. Check `extracted_blockers` |
| **Expected Result** | Blockers extracted and stored in array |

### TC-N8N-006: AI Analyzer - Action Item Extraction
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Precondition** | Communication mentions action items |
| **Steps** | 1. Run AI analyzer<br>2. Check `extracted_action_items` |
| **Expected Result** | Action items with owner/priority extracted |

### TC-N8N-007: Critical Alerts Notifier
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Precondition** | Critical project exists |
| **Steps** | 1. Wait for 15-min schedule<br>2. Check Google Chat space |
| **Expected Result** | Alert notification sent to Chat |

### TC-N8N-008: Alert Manager - Error Handling
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Precondition** | Workflow fails |
| **Steps** | 1. Cause workflow error<br>2. Check alert manager |
| **Expected Result** | Error logged to `system_audit_logs`, Chat notification sent |

### TC-N8N-009: SOW PDF Ingestor
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Precondition** | Google Drive OAuth configured |
| **Steps** | 1. Upload SOW PDF to Drive<br>2. Trigger workflow |
| **Expected Result** | SOW parsed, contract created in `sow_contracts` |

### TC-N8N-010: Workflow Error Recovery
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Precondition** | Workflow with continueOnFail |
| **Steps** | 1. Cause partial failure<br>2. Check execution |
| **Expected Result** | Workflow continues, error logged |

---

## 9. Database & API

### TC-DB-001: RLS - Allowlisted User Can Read
| Field | Value |
|-------|-------|
| **Priority** | Critical |
| **Precondition** | User in allowlist |
| **Steps** | 1. Query `sow_contracts` as authenticated user |
| **Expected Result** | Data returned successfully |

### TC-DB-002: RLS - Non-Allowlisted User Blocked
| Field | Value |
|-------|-------|
| **Priority** | Critical |
| **Precondition** | User NOT in allowlist |
| **Steps** | 1. Query `sow_contracts` as authenticated user |
| **Expected Result** | Empty result or access denied |

### TC-DB-003: RLS - Service Role Bypass
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Precondition** | Service role key |
| **Steps** | 1. Query with service role key |
| **Expected Result** | Full access to data |

### TC-DB-004: Portfolio Overview View
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Precondition** | SOW and health metrics exist |
| **Steps** | 1. Query `portfolio_overview` view |
| **Expected Result** | Joined data with health status, days remaining |

### TC-DB-005: Action Queue Full View
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Precondition** | Actions exist |
| **Steps** | 1. Query `action_queue_full` view |
| **Expected Result** | Actions with project name, client info |

### TC-DB-006: Foreign Key Integrity
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Precondition** | None |
| **Steps** | 1. Try inserting action with invalid project_id |
| **Expected Result** | Foreign key constraint error |

### TC-DB-007: Unique Constraints
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Precondition** | None |
| **Steps** | 1. Insert duplicate message_id in delivery_intelligence |
| **Expected Result** | Unique constraint violation |

### TC-DB-008: Audit Log Insert
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Precondition** | None |
| **Steps** | 1. Workflow execution completes<br>2. Check `system_audit_logs` |
| **Expected Result** | Execution logged with timestamp, status |

---

## 10. UI/UX & Responsiveness

### TC-UI-001: Desktop Layout (1920x1080)
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Precondition** | None |
| **Steps** | 1. View app at 1920x1080 resolution |
| **Expected Result** | Full layout, 4-column project grid |

### TC-UI-002: Tablet Layout (768px)
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Precondition** | None |
| **Steps** | 1. View app at 768px width |
| **Expected Result** | Responsive layout, 2-column grid |

### TC-UI-003: Mobile Layout (375px)
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Precondition** | None |
| **Steps** | 1. View app at 375px width |
| **Expected Result** | Single column, hamburger menu |

### TC-UI-004: Dark Mode Toggle
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Precondition** | None |
| **Steps** | 1. Toggle dark mode |
| **Expected Result** | Theme switches, colors update correctly |

### TC-UI-005: Glass Morphism Effects
| Field | Value |
|-------|-------|
| **Priority** | Low |
| **Precondition** | None |
| **Steps** | 1. View cards with backdrop blur |
| **Expected Result** | Frosted glass effect visible |

### TC-UI-006: Navigation Active State
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Precondition** | None |
| **Steps** | 1. Navigate between pages |
| **Expected Result** | Active nav item highlighted |

### TC-UI-007: Loading Spinners
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Precondition** | None |
| **Steps** | 1. Throttle network<br>2. Navigate to page |
| **Expected Result** | Loading spinner shown during fetch |

### TC-UI-008: Error States
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Precondition** | None |
| **Steps** | 1. Disconnect network<br>2. Try loading page |
| **Expected Result** | User-friendly error message displayed |

### TC-UI-009: Toast Notifications
| Field | Value |
|-------|-------|
| **Priority** | Low |
| **Precondition** | None |
| **Steps** | 1. Perform action (create/update) |
| **Expected Result** | Success/error toast shown |

### TC-UI-010: Keyboard Navigation
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Precondition** | None |
| **Steps** | 1. Navigate using Tab key |
| **Expected Result** | Focus visible, logical tab order |

---

## 11. Performance

### TC-PERF-001: Dashboard Load Time
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Precondition** | ~15 projects |
| **Steps** | 1. Measure time to interactive |
| **Expected Result** | < 2 seconds |

### TC-PERF-002: Large Data Set (100+ projects)
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Precondition** | 100+ projects in database |
| **Steps** | 1. Load dashboard |
| **Expected Result** | Page loads without timeout, pagination if needed |

### TC-PERF-003: API Response Time
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Precondition** | None |
| **Steps** | 1. Measure Supabase query response |
| **Expected Result** | < 500ms for typical queries |

### TC-PERF-004: Image/Asset Optimization
| Field | Value |
|-------|-------|
| **Priority** | Low |
| **Precondition** | None |
| **Steps** | 1. Check network tab for asset sizes |
| **Expected Result** | Images compressed, JS/CSS minified |

### TC-PERF-005: Lighthouse Score
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Precondition** | None |
| **Steps** | 1. Run Lighthouse audit |
| **Expected Result** | Performance score > 80 |

---

## 12. Security

### TC-SEC-001: SQL Injection Prevention
| Field | Value |
|-------|-------|
| **Priority** | Critical |
| **Precondition** | None |
| **Steps** | 1. Enter SQL injection payload in search/filter |
| **Expected Result** | Input sanitized, no SQL execution |

### TC-SEC-002: XSS Prevention
| Field | Value |
|-------|-------|
| **Priority** | Critical |
| **Precondition** | None |
| **Steps** | 1. Enter `<script>alert('xss')</script>` in text field |
| **Expected Result** | Script not executed, escaped in display |

### TC-SEC-003: CSRF Protection
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Precondition** | None |
| **Steps** | 1. Attempt cross-site request |
| **Expected Result** | Request blocked |

### TC-SEC-004: API Key Not Exposed
| Field | Value |
|-------|-------|
| **Priority** | Critical |
| **Precondition** | None |
| **Steps** | 1. View page source<br>2. Check network requests |
| **Expected Result** | Service role key not visible, only anon key used |

### TC-SEC-005: HTTPS Enforcement
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Precondition** | Production deployment |
| **Steps** | 1. Access via HTTP |
| **Expected Result** | Redirected to HTTPS |

### TC-SEC-006: Session Token Security
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Precondition** | User logged in |
| **Steps** | 1. Check session storage |
| **Expected Result** | Token httpOnly, secure flags set |

### TC-SEC-007: Rate Limiting
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Precondition** | None |
| **Steps** | 1. Send 100+ rapid requests |
| **Expected Result** | Rate limited after threshold |

### TC-SEC-008: Input Validation
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Precondition** | None |
| **Steps** | 1. Submit form with invalid data types |
| **Expected Result** | Validation errors shown, no server error |

---

## Test Summary

| Category | Total Tests | Critical | High | Medium | Low |
|----------|-------------|----------|------|--------|-----|
| Authentication | 8 | 3 | 4 | 1 | 0 |
| Dashboard | 9 | 1 | 5 | 3 | 0 |
| Project Detail | 9 | 1 | 5 | 2 | 1 |
| Action Queue | 9 | 1 | 5 | 3 | 0 |
| Renewals | 5 | 0 | 3 | 2 | 0 |
| Alerts | 7 | 0 | 2 | 5 | 0 |
| Admin | 10 | 2 | 5 | 3 | 0 |
| n8n Workflows | 10 | 1 | 5 | 4 | 0 |
| Database & API | 8 | 2 | 4 | 2 | 0 |
| UI/UX | 10 | 0 | 2 | 6 | 2 |
| Performance | 5 | 0 | 2 | 2 | 1 |
| Security | 8 | 3 | 4 | 1 | 0 |
| **TOTAL** | **98** | **14** | **46** | **34** | **4** |

---

## Execution Notes

### Test Environment
- **Frontend URL:** http://localhost:3000 (dev) / http://localhost:3001 (Docker)
- **Supabase:** https://osmdiezkqgfrhhsgtomo.supabase.co
- **n8n:** https://airr-marketing.app.n8n.cloud

### Test Data Requirements
- Minimum 5 projects with varying health statuses
- At least 2 admin users and 1 non-admin user
- Sample delivery intelligence records
- Sample action items with different priorities

### Tools Recommended
- **E2E Testing:** Playwright
- **API Testing:** Postman / Insomnia
- **Performance:** Lighthouse, WebPageTest
- **Security:** OWASP ZAP

---

*Document generated: 2025-12-28*
*OneValue Delivery Intelligence Console v1.0*
