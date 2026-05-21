# Report 1: Project Analysis and Implementation Detail
## Project: Cloud-Based Student Assignment Submission System (SyncLink)

**Course:** Cloud Computing  
**Program:** BS Software Engineering – 8th Semester  

---

### 1. Project Introduction
The "SyncLink: Cloud-Based Student Assignment Submission System" is a modern, enterprise-grade web application designed to digitize and optimize the academic assignment workflow. By utilizing cloud-based infrastructure (Backend-as-a-Service), it provides a centralized platform for assignment distribution, submission, evaluation, and real-time feedback, ensuring that academic records are securely stored, instantly synchronized, and easily accessible.

### 2. Problem Statement
Traditional and manual assignment management leads to several bottlenecks:
- **Disorganization:** Handling physical files or disparate email threads is tedious for instructors.
- **Feedback & Sync Delay:** Students often wait a long time to receive marks. Furthermore, manual page refreshes are required to see new tasks or updates.
- **Data Integrity:** Local storage risk of hardware failure can result in loss of student work.
- **Tracking & Analytics:** Difficult to monitor deadlines, calculate class averages, and track pending reviews across large classes without visual aids.

### 3. Objectives
The primary objectives successfully achieved in this project are:
- **Centralized Platform:** A dedicated portal for Teachers to post tasks and Students to submit work.
- **Cloud Integration:** Utilizing Supabase for Authentication, PostgreSQL Database, and Storage.
- **Real-Time Synergy:** Implementing WebSockets (Supabase Realtime) for instant notifications and data syncing without manual page refreshes.
- **Automated Evaluation:** A built-in system for grading and providing feedback.
- **Advanced Analytics:** Providing instructors with live, data-driven insights (Donut charts, progress bars) into class performance.

### 4. Scope of the System
The system has been fully implemented with the following premium features:

**Student Features:**
- **Task View:** View all published assignments with deadlines.
- **Secure Submission:** Drag-and-drop uploader with strict PDF/Word validation and cloud bucket storage.
- **Real-Time Alerts:** Instant toast notifications and dashboard updates when a teacher posts a new task or grades a submission.
- **Evaluation History:** View marks and teacher feedback for every submission.
- **Dynamic Analytics:** Visual representation of personal progress and pending tasks.

**Teacher Features:**
- **Assignment Management:** Create tasks with specific titles, descriptions, marks, and Date/Time deadlines.
- **Live Class Overview:** A dynamic analytics dashboard featuring a real-time Donut Chart for "Submission Status" (Graded vs Pending) and a class average mastery progress bar.
- **Grading Suite:** Integrated interface to download files, assign marks, and give feedback.
- **Live Feed (WebSockets):** Instant notification and auto-refresh of the Review Queue when any student submits a file.

### 5. Requirement Analysis

#### **Functional Requirements:**
1. **Authentication & Authorization:** Secure, role-based access for Students and Teachers with cached session handling for instant initial load times.
2. **Database Management:** Relational SQL schema linking `assignments` to `submissions` with cascading deletes and foreign keys.
3. **Storage Management:** Secure cloud storage (Supabase Buckets) for documents with dynamic file URL generation.
4. **Real-Time Pub/Sub:** WebSocket subscriptions to PostgreSQL tables (`INSERT`, `UPDATE`, `DELETE` events) for instant UI updates.
5. **Data Visualization:** Analytical charts (Pie/Donut and Bar charts) dynamically rendering database statistics (Unique students, Total tasks, Graded ratio).

#### **Non-Functional Requirements:**
1. **Premium UI/UX:** High-end SaaS aesthetic using "Teal and Blue" dark gradients, frosted glassmorphism (glass-cards), and modern typography (Plus Jakarta Sans).
2. **Performance (Optimistic Updates):** The system uses optimistic UI updates (e.g., instant logout feedback, local array mapping) to eliminate loading spinners and reduce database queries.
3. **Reliability & Scalability:** 99.9% uptime guaranteed by Supabase cloud infrastructure, capable of handling concurrent student submissions.
4. **Responsiveness:** Fluid and fully functional on both mobile and desktop screens using Tailwind CSS.
5. **Dark Mode Support:** Seamless transition between Light and Dark themes without visual breakages.

### 6. System Architecture & Tech Stack
The system follows a **Serverless Cloud Architecture (BaaS)**:

1. **Frontend (Client):** 
   - **React.js (Vite):** Core framework for fast rendering.
   - **Tailwind CSS:** For premium styling, gradients, and responsiveness.
   - **Framer Motion:** For micro-interactions and smooth page transitions.
   - **Recharts:** For rendering data-driven analytical charts.
2. **Cloud Backend (Supabase):**
   - **Authentication:** Manages user sessions, JWT tokens, and role-based routing.
   - **PostgreSQL Database:** Stores structured data with Row Level Security (RLS) policies.
   - **Real-Time Engine:** Broadcasts database changes to connected clients instantly.
   - **Cloud Storage:** High-performance storage buckets for binary files.

---

### 7. Proposed Diagrams for University Report
*Note for the user: You should include the following 3 diagrams in your final project documentation. Below are the rough structures (Mermaid JS format) which you can copy-paste into [Mermaid Live Editor](https://mermaid.live/) to generate the images.*

#### A. System Architecture Diagram
**Purpose:** Shows how the React frontend communicates with the Supabase Cloud Backend.
```mermaid
graph TD
    Client[React Frontend - Vite]
    Auth[Supabase Auth]
    DB[(Supabase PostgreSQL)]
    Storage[Supabase Storage Buckets]
    Realtime((Supabase Realtime WebSockets))

    Client <-->|1. Email/Password JWT| Auth
    Client <-->|2. CRUD Operations REST API| DB
    Client <-->|3. Upload/Download Files| Storage
    DB -->|4. Database Triggers & Changes| Realtime
    Realtime -->|5. Instant UI Sync & Notifications| Client
```

#### B. Entity Relationship Diagram (ERD)
**Purpose:** Shows the relationship between your primary database tables including the new Attendance and Enrollment modules.
```mermaid
erDiagram
    CLASSES {
        uuid id PK
        string name
        string teacher_email
    }
    ASSIGNMENTS {
        uuid id PK
        uuid class_id FK
        string title
        string description
        timestamp deadline
        int total_marks
    }
    SUBMISSIONS {
        uuid id PK
        uuid assignment_id FK
        string student_email
        string status "submitted, graded"
        numeric grade
    }
    ENROLLMENTS {
        uuid id PK
        uuid class_id FK
        string student_email
        string status "pending, approved, rejected"
    }
    ATTENDANCE {
        uuid id PK
        uuid class_id FK
        string student_email
        string status "present, absent"
        date date
    }

    CLASSES ||--o{ ASSIGNMENTS : "contains"
    CLASSES ||--o{ ENROLLMENTS : "has"
    CLASSES ||--o{ ATTENDANCE : "tracks"
    ASSIGNMENTS ||--o{ SUBMISSIONS : "receives"
```

#### C. Sequence Diagrams (Realtime Interactions)
**1. Realtime Submission Flow:**
```mermaid
sequenceDiagram
    participant Student as Student UI
    participant Storage as Supabase Storage
    participant DB as Supabase DB
    participant Socket as Realtime Engine
    participant Teacher as Teacher UI

    Teacher->>Socket: Subscribes to 'submissions' table
    Student->>Storage: Uploads PDF File
    Student->>DB: INSERT into submissions
    DB-->>Socket: Triggers 'INSERT' Event
    Socket-->>Teacher: Pushes Data instantly
    Teacher-->>Teacher: UI Updates & Toast Notification
```

**2. Realtime Attendance Marking:**
```mermaid
sequenceDiagram
    participant Teacher as Teacher UI
    participant DB as Supabase DB
    participant Socket as Realtime Engine
    participant Student as Student UI

    Student->>Socket: Subscribes to 'attendance' table
    Teacher->>DB: UPSERT into attendance (Status: Present)
    DB-->>Socket: Triggers 'UPSERT' Event
    Socket-->>Student: Pushes Attendance Update
    Student-->>Student: Percentage Gauge Updates instantly
```

### 8. Recent Updates & New Modules (Implemented in Final Phase)
The following advanced modules have been added to the system to ensure a complete, enterprise-grade academic management experience:

#### **A. Class Hub & Isolation Model**
- **Scoped Dashboard:** Both Student and Teacher dashboards now follow a "Class Hub" model. Teachers manage specific subjects independently, with isolated Review Queues and Assignment lists.
- **Improved Data Privacy:** Data is filtered at the database level using `class_id`, ensuring no overlap between different subjects.

#### **B. Real-Time Attendance System**
- **Daily Attendance Marking:** Teachers can mark students as 'Present' or 'Absent' with a single click.
- **Smart-Lock Logic:** Once marked, attendance buttons are disabled to prevent accidental changes. A dedicated "Edit Status" button allows the teacher to unlock and modify records if needed.
- **Student Analytics:** Students receive real-time updates on their attendance. The dashboard calculates:
    - **Classes Conducted:** Total sessions recorded for the student.
    - **Attendance Rate:** Dynamic percentage gauge (e.g., 95% Present).
    - **Present/Absent Count:** Visual breakdown of their attendance history.

#### **C. Professional Enrollment Workflow**
- **Request & Approval:** Students must request to join a class by providing their full name and University Roll Number.
- **Real-Time Notification:** When an instructor approves or rejects a request, students receive an instant **Bell Notification** and **Toast Alert** via WebSockets.
- **Duplicate Prevention:** Strict database constraints prevent duplicate enrollment requests for the same class.

#### **D. Advanced Grading & Performance Tracking**
- **Dynamic Scoring:** The grading modal now shows total marks and calculates percentages on the fly.
- **Color-Coded Feedback:** Grades below 50% are automatically highlighted in **Red**, while passing grades (50%+) are shown in **Green**.
- **Submission Locking:** Once an assignment is graded, it is strictly locked. Students cannot edit or delete graded work, ensuring academic integrity.

#### E. UI/UX & Dark Mode Optimization
- **Teacher Notification Panel:** Added an X (close) button inside the dropdown header, allowing instant dismissal of notifications.
- **Student Notification Panel:** Mirrored the teacher’s close button, providing a consistent UI for both roles.
- **Icon Styling Utility:** Introduced `.icon-primary` class in `index.css` to enforce theme‑aware icon colors, improving contrast in both light and dark modes.
- **Responsive Layout Fixes:** Adjusted dropdown widths to `w‑72` for a compact, premium look.
- **Micro‑Animations:** Integrated `framer-motion` transitions for smooth opening/closing of notification panels.
- **Teacher Notification Panel:** Added an X (close) button inside the dropdown header, allowing instant dismissal of notifications.
- **Student Notification Panel:** Mirrored the teacher’s close button, providing a consistent UI for both roles.
- **Icon Styling Utility:** Introduced `.icon-primary` class in `index.css` to enforce theme‑aware icon colors, improving contrast in both light and dark modes.
- **Responsive Layout Fixes:** Adjusted dropdown widths to `w‑72` for a compact, premium look.
- **Micro‑Animations:** Integrated `framer-motion` transitions for smooth opening/closing of notification panels.
- **Total Theme Sync:** The entire application (including charts, inputs, and dropdowns) has been optimized for a seamless Dark Mode experience.
- **Modular Dashboard States:** Implementation of `framer-motion` for smooth transitions between Overview, Subjects, and Progress tabs.

### 9. Conclusion & Final Implementation Status
The "SyncLink" system is now a comprehensive, production-ready solution for academic assignment management. With the addition of the **Attendance Module**, **Class Hub**, and **Real-time Notifications**, it covers the entire lifecycle of student-teacher interaction. The project successfully meets all functional requirements of the 8th-semester Software Engineering curriculum, delivering a premium, high-performance cloud application.

---
**Report Updated on:** April 26, 2026  
**Status:** All modules fully implemented and verified.
