# OSP Master Documentation

*Version: 0.2 | Last Updated: 2025-03-30*

---

## 🔁 Update & Maintenance Policy

- **Update Format:** Add updates below relevant sections. Use versioning when structure changes (e.g., increment from 0.1 to 0.2 for significant updates).
- **CRUD Interface:** Future editing will be available via a Supabase-connected admin panel or CLI tool (planned for Q2 2025).
- **Sharing:** This file supports selective copying. Redact private sections (e.g., tokens, API keys, user data) before sharing with others or AI systems like ChatGPT, Gemini, or Grok.
- **Version History:**
  - **0.1 (2025-03-29):** Initial draft with basic vision, architecture, and roadmap.
  - **0.2 (2025-03-30):** Expanded with detailed status, challenges, progress logs, and schema details based on recent development work.

---

## 🧭 1. Vision & Mission

**The One Service Platform (OSP)** is an open, AI-driven platform that enables users to explore, create, share, and consume any type of digital service—whether horizontal or vertical, simple or complex—within a unified ecosystem. OSP aims to democratize service creation by leveraging Generative AI (GenAI) and a metadata-driven architecture.

### 🎯 Key Goals
- **Create Services in Days:** Reduce creation time from months to 48 hours or less by using AI to generate service models, schemas, and UI.
- **Universal Marketplace:** One platform to build, share, manage, consume, and monetize services, with a marketplace planned for Q3 2025.
- **Composable Services:** Enable new solutions by combining existing services through dynamic schema relationships.
- **Eliminate Tech Bottlenecks:** Allow non-technical users to build with GenAI; enable tech users to scale faster with reusable components.
- **Data & Metadata-First:** All services are defined, tracked, and managed via schemas and metadata stored in Supabase.

### 📜 Mission Statement
OSP aims to be the go-to platform for service innovation, empowering users to create, share, and monetize digital services with minimal technical barriers, while ensuring scalability, security, and composability.

### Key Comptetitive Positioning
OSP sits in a very unique place, somewhere among these competitors:

| Category           | Competitors                        | OSP Edge                                               |
|--------------------|------------------------------------|--------------------------------------------------------|
| Low-Code           | Bubble, Outsystems                 | Full-stack service generation + schema-backed API      |
| API Hubs           | RapidAPI, Kong                     | Schema + Lifecycle + Marketplace                      |
| Service Orchestrators | ServiceNow, Salesforce         | Open, composable, AI-native                            |
| Developer Tools    | Vercel, Supabase, Replit           | Combines all, adds metadata + AI + catalog             |

---

## 🧱 2. Platform Architecture

### 🗂️ Components

| Layer               | Description                                                                 |
|---------------------|-----------------------------------------------------------------------------|
| **Frontend (UI)**   | SvelteKit + Vercel – Simple forms and tables, dynamically generated based on schema. Currently using SvelteKit v2.20.2 and Vite v5.4.8. |
| **Backend (API)**   | SvelteKit server endpoints under `/routes/api/*`. Handles service generation, schema creation, and CRUD operations. |
| **Database**        | Supabase (PostgreSQL) with Row-Level Security (RLS). Dynamic schema creation per service (e.g., `smb_inventory`). Central metadata tables include `services`, `service_type_mappings`, `service_relationships`. |
| **AI Integration**  | OpenAI API (GPT) used for prompt-based generation of service models and metadata. Currently used for blending frameworks like TMForumSID and ARTS. |
| **Hosting**         | Vercel (frontend), Supabase (backend + DB), GitHub (code repo). Local dev at `http://localhost:5173/`. |
| **Authentication**  | Supabase Auth (email/password-based). Roles (`authenticated`, `service_role`) in use; advanced RBAC planned for Q2 2025. |

### 🔁 Code-Data Separation

- Each **Service** lives in its **own Supabase schema** (e.g., `smb_inventory` for the SMB Inventory Service).
- OSP metadata is stored in central tables in the `public` schema:
  - `services`: Tracks service metadata (e.g., problem, requirements, version).
  - `service_type_mappings`: Maps services to domains or types.
  - `service_relationships`: Defines relationships between services for composability.
- Code templates in SvelteKit reference these schemas to render UI and handle data flow dynamically.

### 📊 Current Schema Example: SMB Inventory Service
- **Schema Name:** `smb_inventory`
- **Tables:**
  - **inventory**:
    - `id` (text, PRIMARY KEY)
    - `inventoryid` (text)
    - `storeid` (text)
    - `partid` (text)
    - `quantity` (numeric)
    - `lastupdated` (text)
    - `haspart` (text, foreign key to `part(id)`)
    - `locatedin` (text, foreign key to `store(id)`)
  - **part**:
    - `id` (text, PRIMARY KEY)
    - `partid` (text)
    - `name` (text)
    - `description` (text)
    - `category` (text)
    - `price` (numeric)
    - `trackedin` (text, foreign key to `inventory(id)`)
  - **store**:
    - `id` (text, PRIMARY KEY)
    - `storeid` (text)
    - `storename` (text)
    - `location` (text)
    - `contactinfo` (text)
    - `holdsinventory` (text, foreign key to `inventory(id)`)
- **Permissions:**
  - RLS policies: `service_role_bypass` for `service_role`, `Allow all on [table] for authenticated` for `authenticated` role.
  - Table permissions: `authenticated` role has `SELECT`, `INSERT`, `UPDATE`, `DELETE` on all tables.
  - Schema permissions: `USAGE` granted to `authenticated`, but not reflected in logs (see Challenges).

---

## 👤 3. User Roles & Governance

### 🔑 Core Roles

| Role               | Description                                                                 |
|--------------------|-----------------------------------------------------------------------------|
| **OSP Master**     | Owner/admin of the platform (currently `tlofrisco@gmail.com`). Manages platform, services, and users. |
| **Service Provider** | Builds and publishes services (individuals or orgs). Can create services via the UI or future CLI. |
| **Service Consumer** | Explores and purchases services via the marketplace (planned for Q3 2025). |

### 🔐 Privacy & Exposure

- **Current State:**
  - Providers can expose basic metadata to list their service (e.g., service name, description).
  - Providers **cannot** expose code (code is server-side in SvelteKit routes).
  - Consumers **cannot** alter a provider's service (no configuration options yet).
- **Future Plans:**
  - Fine-grained privacy controls to be implemented in Q2 2025.
  - Providers will be able to mark services as public/private and control metadata visibility.
  - Consumers will have read-only access to service metadata unless explicitly allowed to configure.

---

## 🧰 4. Developer Setup

### 🔧 Tooling

- **IDE:** VS Code for development.
- **Version Control:** GitHub for code storage (push only so far; pull requests not yet implemented).
- **API Testing:** Postman for testing APIs (e.g., `/api/services/smb_inventory/part`).
- **Frameworks:**
  - **SvelteKit v2.20.2**
  - **Vite v5.4.8**
  - **Supabase JS v2.45.4**
  - **@supabase/ssr v0.6.1**
- **AI Integration:** OpenAI API for generation of service models.
- **Runtime:** Node.js v18+.
- **Local Dev:** `npm run dev --logLevel info` runs the app at `http://localhost:5173/`.

### 📁 Folder Structure
osp/
├── src/
│   ├── app.d.ts, app.html, hooks.server.ts (authentication and session handling)
│   ├── lib/
│   │   ├── supabase.ts (Supabase client for frontend)
│   │   ├── supabaseAdmin.ts (Supabase admin client for server-side operations)
│   ├── routes/
│   │   ├── +page.svelte (main UI for service generation and CRUD)
│   │   └── api/
│   │       ├── debug/ (debug endpoints, e.g., /api/debug/tables)
│   │       ├── osp/service/ (service generation endpoints)
│   │       ├── services/smb_inventory/ (dynamic service endpoints)
│   │       │   ├── model/ (fetches service model)
│   │       │   └── [entity]/ (CRUD operations for entities like part, store)
│   │       └── tables/ (fetches available tables)
│   └── types/
│       └── supabase.ts (TypeScript types for Supabase)
├── package.json (dependencies and scripts)
└── vite.config.ts (Vite configuration)


### 🚀 Setup Instructions
1. Clone the repository from GitHub (if public; currently private to `tlofrisco@gmail.com`).
2. Install dependencies: `npm install`.
3. Set up environment variables in `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`
4. Run the development server: `npm run dev --logLevel info`.
5. Access the app at `http://localhost:5173/`.
6. Sign in with `tlofrisco@gmail.com` (Supabase Auth).

---

## ⚙️ 5. Service Model & Generator

### 📦 Core Concepts

- **Service = Data Model + Business Logic + Metadata**
- **Service Creation Workflow:**
  1. **Prompt:** User provides a problem, requirements, and frameworks (e.g., "An SMB inventory service", "Track bike parts across stores", `TMForumSID`, `ARTS`).
  2. **AI Generation:** OpenAI API blends the frameworks to create a model (e.g., entities like `Inventory`, `Part`, `Store`).
  3. **Schema Creation:** Supabase dynamically creates a schema (e.g., `smb_inventory`) and tables based on the model.
  4. **UI/CRUD Generation:** SvelteKit renders a UI with forms and tables based on the schema.
- **Metadata Storage:** Service metadata is stored in the `services` table in the `public` schema.

### 📍 Example: SMB Inventory Service
- **Prompt:** Problem: "An SMB inventory service", Requirements: "Track bike parts across stores", Frameworks: `TMForumSID`, `ARTS`.
- **Generated Model:**
  ```json
  {
    "service_type": "SMB Inventory Service",
    "entities": {
      "Inventory": {
        "provider": "Provider",
        "attributes": {
          "inventory_id": "string",
          "store_id": "string",
          "part_id": "string",
          "quantity": "integer",
          "last_updated": "string"
        },
        "relationships": {
          "hasPart": { "type": "one-to-many", "target": "Part" },
          "locatedIn": { "type": "many-to-one", "target": "Store" }
        }
      },
      "Part": {
        "provider": "Provider",
        "attributes": {
          "part_id": "string",
          "name": "string",
          "description": "string",
          "category": "string",
          "price": "number"
        },
        "relationships": {
          "trackedIn": { "type": "many-to-many", "target": "Inventory" }
        }
      },
      "Store": {
        "provider": "Provider",
        "attributes": {
          "store_id": "string",
          "store_name": "string",
          "location": "string",
          "contact_info": "string"
        },
        "relationships": {
          "holdsInventory": { "type": "one-to-many", "target": "Inventory" }
        }
      }
    }
  }

  - **Schema:** `smb_inventory` with tables `inventory`, `part`, `store` (see Section 2 for schema details).
- **UI:** Dynamic form for adding/editing parts, tables for displaying parts and stores.

### 🛠️ Service Generation Status
- **Current Version:** 30 (as of last service generation on 2025-03-30).
- **Progress:**
  - Service generation works: AI model blending, schema creation, and table setup are functional.
  - RLS policies and table permissions are applied correctly for `authenticated` users.
- **Challenges:**
  - Schema `USAGE` permissions for `authenticated` role are not reflected in logs despite `GRANT USAGE` (see Section 10).

---

## 🔌 6. Integration Points

| Component         | Connected Tools                    | Status                                   |
|-------------------|------------------------------------|------------------------------------------|
| **Auth**          | Supabase Auth                     | Fully functional (email/password login). |
| **AI Generation** | OpenAI API                        | Fully functional for model blending.     |
| **Hosting**       | Vercel (frontend), Supabase (backend + DB) | Local dev at `http://localhost:5173/`. Vercel deployment planned. |
| **Data Storage**  | Supabase DB                       | Fully functional with dynamic schemas.   |
| **Git Tracking**  | GitHub                            | Code pushed; pull requests not yet implemented. |
| **Future CLI**    | `osp-cli` (planned)               | Planned for Q2 2025.                     |

---

## 🌐 7. Domains, Privacy, and Visibility

### 🧭 Domain Strategy

- **Current State:**
  - Each service belongs to a domain (e.g., SMB Inventory Service is in the "Retail" domain).
  - Domains are inferred from the prompt but not explicitly stored yet.
- **Future Plans:**
  - Domains will be categorized as **vertical** (e.g., Retail, Fintech, Healthcare) or **horizontal** (e.g., billing, CRM, ticketing).
  - Domain metadata will be stored in Supabase (`service_type_mappings`) and linked to services by Q2 2025.

### 🔒 Privacy Model

| Scope                  | OSP Master | Provider | Consumer |
|------------------------|------------|----------|----------|
| View Service Metadata  | ✅         | ✅       | ✅       |
| View Provider Code     | ❌         | ✅       | ❌       |
| Modify Service Logic   | ❌         | ✅       | ❌       |
| View Usage Analytics   | ✅         | ✅       | 🔐(if allowed) |

- **Current State:** Basic privacy enforced via Supabase RLS. No analytics yet.
- **Future Plans:** Implement fine-grained privacy controls in Q2 2025, including public/private flags and configurable consumer access.

---

## 📈 8. Roadmap

### 🏁 Current Milestone: MVP (Q1 2025)
- **Goal:** Build a functional SMB Inventory Service with CRUD operations.
- **Status:**
  - ✅ **UI for Service Generation:** Users can input a problem, requirements, and frameworks to generate a service.
  - ✅ **Spec Generation:** AI generates a blended model and specification document.
  - ✅ **Schema Creation:** Supabase dynamically creates schemas and tables (e.g., `smb_inventory`).
  - 🔄 **CRUD Operations:** Form renders, but input fields are not accepting data (see Challenges).
  - 🔄 **Data Display:** Tables for "Parts" and "Stores" are not displaying due to fetch issues (see Challenges).
- **Next Steps:**
  - Fix form input issue (Section 10.1).
  - Fix data fetching issue (Section 10.2).
  - Add a dropdown for stores in the form (post-MVP).
  - Polish UI with loading states and error messages.

### 📅 Future Milestones
- **Q2 2025 (or faster):**
  - 🔄 **CRUD & Debug Flow Enhancements:** Fully functional CRUD with error handling and validation.
  - 📚 **Supabase-Based Documentation Storage:** Store generated specs in Supabase.
  - 🔐 **Role-Based Access Control (RBAC):** Implement advanced roles for providers and consumers.
  - 🧰 **CLI Tool (`osp-cli`):** Command-line interface for service generation and management.
- **Q3 2025 (or faster):**
  - 🔄 **Bi-directional Service Dependencies:** Enable services to depend on each other.
  - 🏪 **Service Marketplace & Billing Integration:** Launch a marketplace for service sharing and monetization.
- **Q4 2025 (or faster):**
  - 🧠 **Generative Feedback Agent:** AI agent to auto-fix/debug services based on logs and user feedback.

---

## 🧾 9. Metadata + Logging Plan

### 📊 Supabase Tables
- **Central Tables (in `public` schema):**
  - `services`: Stores service metadata (e.g., `id`, `problem`, `requirements`, `version`).
  - `service_type_mappings`: Maps services to domains/types (e.g., "SMB Inventory" → "Retail").
  - `service_relationships`: Defines relationships between services for composability.
- **Per-Service Schemas:** (e.g., `smb_inventory` with tables `inventory`, `part`, `store`).
- **Metadata Fields:**
  - `version`: Incremented per service update (e.g., SMB Inventory Service at version 30).
  - `owner_id`: Links to the creator (e.g., `tlofrisco@gmail.com` user ID).
  - `public`: Boolean flag for visibility (not yet implemented).
  - `created_at`, `updated_at`: Timestamps for tracking changes.

### 📜 Logging
- **Current Logging:**
  - Command output logs service generation, schema creation, and permissions (e.g., `Schema smb_inventory ensured`, `Table permissions granted`).
  - Browser console logs UI interactions (e.g., `Rendering form with formData`, `fetchParts: Fetching parts`).
- **Future Plans:**
  - Centralize logs in Supabase for debugging and analytics (Q2 2025).
  - Add user-facing logs for transparency (e.g., "Service generated successfully").

---

## 🛠️ 10. Current Status & Challenges

### 📍 10.1 Status Overview
- **Last Updated:** 2025-03-30
- **User:** `tlofrisco@gmail.com` (OSP Master)
- **Current Service:** SMB Inventory Service (version 30)
- **Progress:**
  - **Service Generation:** Fully functional. Users can generate a service by providing a problem, requirements, and frameworks.
  - **Schema Creation:** Supabase creates the `smb_inventory` schema with tables `inventory`, `part`, and `store`.
  - **UI Rendering:** Form for adding/editing parts and tables for displaying parts and stores are rendered.
- **Issues:**
  - **Form Input:** Unable to type into form fields (e.g., Item ID, Item Name). `on:input` events are not firing.
  - **Data Fetching:** "Parts" and "Stores" tables are not displaying because `fetchParts` and `fetchStores` are failing.
  - **Schema Permissions:** `authenticated` role does not have `USAGE` permission on `smb_inventory` schema despite `GRANT USAGE`.

### 🚧 10.2 Challenges & Resolutions

#### 🖥️ 10.2.1 Form Input Issue
- **Description:** Users cannot type into the form fields in `+page.svelte`. The form renders, and `formData` is logged, but `on:input` events are not firing.
- **Impact:** Prevents adding or editing inventory items, blocking a core MVP feature.
- **Attempts to Resolve:**
  - Added `on:input` handlers to log input events and ensure reactivity.
  - Added explicit assignments in `on:input` (e.g., `formData.itemid = e.target.value`).
  - Added a minimal test form to isolate the issue.
  - Added additional event listeners (`on:keydown`, `on:focus`, `on:blur`) to debug.
- **Current Hypothesis:**
  - Possible browser issue or conflicting event listener preventing `input` events.
  - Potential Svelte reactivity issue with `formData`.
- **Next Steps:**
  - Test the minimal form and check browser console logs for events.
  - Try a different browser (e.g., Firefox if using Chrome).
  - Disable browser extensions that might interfere.
  - Check for JavaScript errors in the browser console.

#### 📡 10.2.2 Data Fetching Issue
- **Description:** The "Parts" and "Stores" sections are not displaying because `fetchParts` and `fetchStores` are failing. No fetch logs appear in the browser console.
- **Impact:** Prevents users from viewing existing parts and stores, blocking a core MVP feature.
- **Attempts to Resolve:**
  - Added detailed logging to `fetchParts` and `fetchStores` (e.g., response status, headers, result).
  - Removed `fetchSuppliers` since the `supplier` table doesn’t exist in this service version.
  - Adjusted `onMount` to ensure fetch functions are called after service generation.
- **Current Hypothesis:**
  - Schema `USAGE` permissions issue: `authenticated` role cannot access `smb_inventory` schema.
  - Fetch requests might not be called due to `serviceGenerated` flag timing in `onMount`.
- **Next Steps:**
  - Fix schema permissions by re-running `GRANT USAGE` and verifying with SQL queries.
  - Test fetch endpoints manually with `curl` to debug server-side issues.
  - Ensure `serviceGenerated` flag is set correctly to trigger fetch requests.

#### 🔐 10.2.3 Schema Permissions Issue
- **Description:** `authenticated` role does not have `USAGE` permission on `smb_inventory` schema, despite `GRANT USAGE` command succeeding. `Schema USAGE permissions` log shows `[]`.
- **Impact:** Prevents `authenticated` users from accessing tables, causing fetch failures.
- **Attempts to Resolve:**
  - Ran `GRANT USAGE ON SCHEMA smb_inventory TO authenticated;` in Supabase SQL Editor.
  - Queried `information_schema.usage_privileges` to verify permissions (returned empty).
  - Granted `USAGE` to `public` role as a fallback.
- **Current Hypothesis:**
  - Possible Supabase bug or misconfiguration in role inheritance.
  - Permissions might not be applied correctly due to session or role context.
- **Next Steps:**
  - Run additional SQL queries to verify role membership and permissions.
  - Grant explicit `SELECT` permissions on tables as a workaround.
  - Restart the server and regenerate the service to check logs.

### 📜 10.3 Progress Log
- **2025-03-29:**
  - Set up initial SMB Inventory Service with tables `bikepart`, `supplier`, `store`.
  - Identified form input issue and started debugging.
- **2025-03-30:**
  - Updated service to version 30 with new model (`inventory`, `part`, `store`).
  - Removed `supplier` table from UI and fetch logic since it’s not in the current model.
  - Added detailed logging for form events and fetch requests.
  - Identified schema permissions issue and attempted to resolve with `GRANT USAGE`.

---

## 📄 11. Export + Copy Usage

### 📋 When Sharing with AI
- **Include:** Everything except tokens, API keys, or private config values (e.g., `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`).
- **Anchor:** Use `# OSP Master Documentation` as the anchor for AI to understand the context.
- **Indexing:** AI systems can scan section titles (e.g., `## ⚙️ 5. Service Model & Generator`) to index capabilities.
- **Redaction Example:**
  - Before: `Auth header: Bearer eyJhbGciOi...`
  - After: `Auth header: Bearer [REDACTED]`
