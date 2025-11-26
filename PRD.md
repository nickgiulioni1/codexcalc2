# Off Leash Deal Analyzer – Master Product Requirements Document (PRD)

## 1. Product overview

Off Leash Deal Analyzer is a web application for analyzing residential real estate investments using three strategies:

- Buy & Hold
- BRRRR (Buy, Rehab, Rent, Refinance, Repeat)
- Flip (Value‑Add / Fix‑and‑Flip)

The app:

- Re‑implements the existing Off Leash Construction Excel/web calculators with formula‑level fidelity. :contentReference[oaicite:0]{index=0}  
- Adds a private property database with bulk import and address autocomplete.
- Supports saveable “scenarios” with versioning.
- Provides shareable, view‑only analysis links suitable for clients.
- (V2/V3) Adds an Agent Portal with branding and multi‑deal dashboards.
- (V3+) Adds AI helpers (photo‑based rehab estimation, comps → ARV, deal explanations, doc ingestion, portfolio insights).

The front‑end is deployed as a static or SPA bundle (e.g. on TiinyHost), with a separate backend and database for persistence and multi‑user features.

---

## 2. Goals, non‑goals, and success criteria

### 2.1 Primary goals

1. **Numerical fidelity**

   - For any given input set, the web app must reproduce the outputs of the legacy spreadsheets within rounding tolerance (≤ $1). :contentReference[oaicite:1]{index=1}  
   - All formulas for rent, expenses, appreciation, financing, and returns follow the reverse‑engineering spec.

2. **Fast, professional analysis creation**

   - An experienced user can produce a complete, shareable analysis for a single property (including rehab, rent, and financing) in ≈5 minutes or less.
   - Outputs (on‑screen + PDF) are client‑ready without manual editing.

3. **Shareable, read‑only analyses**

   - Users create view‑only links to send to clients.
   - Shared views are stable “snapshots,” not live‑linked to ongoing edits.
   - The analysis owner can duplicate and modify their own copy without affecting what the client sees.

4. **Property database with autocomplete**

   - The owner can maintain a private property database (addresses, beds, baths, size, etc.).
   - An address field in the calculator supports autocomplete; selecting a property pre‑fills relevant fields.

5. **Simple modeling of real‑world timelines**

   - Model current vs future conditions without overwhelming complexity:
     - Under‑market current rent.
     - Tenanted vs vacant status.
     - Rehab that begins only after a tenant vacates.
     - ARV realized only upon rehab completion.

6. **Extensibility**

   - V1 focuses on single‑user core calculators + sharing.
   - V2 adds multi‑agent portal + branding.
   - V3 adds AI assistance and portfolio‑level insights.

### 2.2 Non‑goals (V1)

- Full SaaS billing (Stripe, subscriptions).
- Deep MLS integration; V1 expects manual data or CSV/exports.
- Fine‑grained roles beyond Admin/Agent/Viewer.
- Automated tax/legal advice.

### 2.3 Success criteria

- For a test suite of deals, the web app matches spreadsheet outputs across strategies. :contentReference[oaicite:2]{index=2}  
- A new (non‑technical) user can:
  - Create an analysis, save it, and generate a share link without documentation.
- The owner can:
  - Bulk‑import properties.
  - Use autocomplete to find properties.
- Shared links are view‑only and cloning behaves as specified.

---

## 3. Users and personas

### 3.1 Admin (Owner)

- You, as the product owner.
- Capabilities:
  - Configure global defaults and advanced options.
  - Create/edit/delete any analysis.
  - Manage the property database.
  - Manage agents and their branding.
  - Access overall system metrics.

### 3.2 Agent (V2+)

- Real estate agents and investor‑focused professionals using the tool with their own clients.
- Capabilities:
  - Create and manage their own analyses.
  - Maintain a client list.
  - Generate branded, shareable deal decks.
  - See their own performance/portfolio stats.

### 3.3 Client (Viewer)

- End recipient of an analysis (e.g., an investor client).
- Capabilities:
  - View read‑only analyses via share links or client “deal decks”.
  - Optionally leave simple feedback (thumbs up/down, notes) in later phases.

---

## 4. Key use cases

### 4.1 Core (V1)

1. **Run a Buy & Hold analysis**

   - Admin enters property details, rehab costs (if any), rents, and long‑term financing.
   - The app produces month‑by‑month and year‑by‑year projections, including:
     - Cash flow, equity, total returns, DSCR, etc. :contentReference[oaicite:3]{index=3}  

2. **Run a BRRRR analysis**

   - Admin models purchase + rehab with short‑term financing, then a refinance.
   - The app shows:
     - Total cash into the deal.
     - Cash left in the deal after refi.
     - Post‑refi cash flow and returns.

3. **Run a Flip analysis**

   - Admin models purchase, rehab, carry, and sale.
   - Outputs:
     - Gross/net profit.
     - After‑tax profit.
     - Total cash required.
     - ROI. :contentReference[oaicite:4]{index=4}  

4. **Use Rehab Estimator**

   - Admin toggles line items (flooring, kitchens, baths, etc.) with quantities and unit prices.
   - Total rehab cost feeds directly into the chosen strategy.

5. **Save and revisit analyses**

   - Admin saves analyses as “scenarios” with names.
   - Later loads, duplicates, updates, and re‑shares them.

6. **Share an analysis**

   - Admin clicks “Share.”
   - App creates a view‑only snapshot and URL.
   - Client can view the snapshot; admin can clone and edit a new version without breaking the original link.

### 4.2 Expanded (V2+)

1. **Property database with autocomplete**

   - Admin imports a list of properties (CSV).
   - When starting an analysis, the Address field autocompletes from this DB.
   - Selecting a property pre‑fills beds, baths, sq ft, etc.

2. **Current vs future conditions with tenant + rehab timeline**

   - Admin marks that a property is:
     - Currently tenanted at under‑market rent.
     - Rehab is planned only after tenant moves out.
   - The model:
     - Uses current rent for a defined period.
     - Models a vacancy/rehab period.
     - Applies new rent and ARV only after rehab completion.

3. **Agent Portal + branding**

   - Agent logs in.
   - Sees a dashboard of their deals, grouped by client or status.
   - Shares branded deal decks with clients.

### 4.3 AI‑based (V3+)

1. **Photo‑based rehab suggestions**

   - User uploads property photos (and optionally “target” comps).
   - AI proposes a rehab scope mapped to rehab estimator items and cost ranges.

2. **Comps‑based ARV and rent suggestions**

   - User uploads comps (CSV or screenshot‑like text).
   - AI selects best comps, adjusts for differences, and proposes ARV and rent ranges.

3. **Deal explanation and risk coaching**

   - AI reads a completed analysis and:
     - Generates a client‑friendly narrative summary.
     - Flags risks and sensitivities.

4. **Natural‑language input**

   - User types “I’m buying a 3/2 in Cleveland for 145k, 35k rehab, 20% down at 7.25%, $1600 rent.”
   - AI parses this into structured calculator inputs.

5. **Document ingestion**

   - User uploads inspection reports or appraisals.
   - AI extracts issues, potential rehab items, and comments on ARV reasonableness.

6. **Portfolio / agent “brain”**

   - AI reviews an agent’s historical deals to:
     - Identify patterns in risk/return.
     - Flag underperforming deals.
     - Suggest leads for refinance or disposition.

---

## 5. Scope and phasing

### 5.1 Phase 1 (MVP)

- Single Admin user.
- Core calculators:
  - Buy & Hold, BRRRR, Flip. :contentReference[oaicite:5]{index=5}  
- Manual data entry only (no property DB).
- Basic Rehab Estimator.
- Scenario save/load.
- Simple print/“export to PDF” (client‑side or styled print).

### 5.2 Phase 2

- Property database + autocomplete.
- Enhanced PDF export layout.
- Formal share links (snapshot semantics).
- Admin login, settings, and defaults.
- Current vs future condition timeline (advanced toggle).

### 5.3 Phase 3

- Agent accounts and basic portal.
- Agent‑branded share pages.
- Client “deal decks” (multi‑analysis hubs).
- Scenario versioning improvements (v1, v2, etc.).
- Basic analytics for agents & admin.

### 5.4 Phase 4 (AI / V3+)

- Photo → rehab scope.
- Comps → ARV/rent.
- Deal explanation & risk flags.
- Natural‑language input for deal setup.
- Document ingestion.
- Portfolio insights.

---

## 6. Functional requirements

### 6.1 Calculator engine (core math)

The engine must implement the logic described in the reverse‑engineering spec. :contentReference[oaicite:6]{index=6}  

#### 6.1.1 Shared inputs

Common fields for all strategies include (not exhaustive):

- Purchase Price
- Rehab Cost (or detailed Rehab Estimator)
- Purchase Closing Costs (default 1% of purchase)
- ARV (After Repair Value)
- Annual appreciation and rent increase rates
- Monthly Rent (market/stabilized)
- Vacancy, Repairs, CapEx, Property Management Fee
- Average Lease Length and Lease‑Up Fee
- Property Tax Rate
- Insurance (per month)
- Long‑term loan term and interest rate
- LTV / LTP, lender points, and closing costs

All default values and formula behaviors should match the Excel workbooks. :contentReference[oaicite:7]{index=7}  

#### 6.1.2 Buy & Hold

- Monthly schedule:
  - Loan amortization (principal, interest, balance).
  - Property value and equity (based on ARV and appreciation).
  - Rent and all rent‑dependent operating expenses.
  - Taxes and insurance (constant or rate‑based).
  - Monthly cash flow and cumulative cash flow.
  - Total cash invested and total return.

- Yearly “Investment Analysis” table:
  - Year, Value, Debt, Equity, Cash Invested, Total Cash Invested,
    Interest Paid, DSCR, Rent, Expenses, Cash Flow, Equity Growth,
    Total Return, Annual Return on Invested Cash. :contentReference[oaicite:8]{index=8}  

#### 6.1.3 BRRRR

- Short‑term (bridge) financing:
  - Finance purchase and optionally rehab per workbook logic.
  - Calculate bridge closing costs and interest across the financed period. :contentReference[oaicite:9]{index=9}  

- Rehab period:
  - No rent.
  - Taxes and insurance accrue.

- Refinance:
  - New loan amount = LTV × ARV.
  - Refi closing costs + lender points.
  - Bridge payoff and cash left in the deal.
  - Updated “initial cash” for post‑refi phase.

- Post‑refi rental phase:
  - Uses Buy & Hold logic with:
    - New loan terms.
    - Post‑refi rent.
    - Cash left in deal as basis for return metrics.

#### 6.1.4 Flip

- Bridge financing for purchase + rehab. :contentReference[oaicite:10]{index=10}  
- Rehab and marketing period (months financed).
- Selling price (usually ARV, overrideable) and selling costs.
- Taxes, insurance, and bridge interest over the entire hold.
- Profit before and after tax.
- ROI based on net cash in vs net cash out.

#### 6.1.5 Rehab Estimator

- Set of configurable rehab items:
  - Each item has:
    - Label, category, unit type (fixed/quantity), default unit price, optional default quantity.
  - Rehab cost = sum(selectedItemCost).
- Outputs:
  - Total rehab cost; feeds strategy inputs.
- Optional:
  - Rehab management fee % added to total.
  - Inline tooltips for calculator inputs to clarify expected values and defaults.
  - Rehab quality grades (A/B/C) that scale all estimator line items (budget ↔ premium).

### 6.2 Tenancy, rent phases, and delayed rehab / ARV

This is the “current vs future” modeling and tenant‑dependent rehab start.

#### 6.2.1 UX: simple vs advanced mode

On the Rental Details tab:

- Control:
  - `Rent & tenancy mode:`
    - (●) Simple – one rent from day 1
    - (○) Advanced – current vs future conditions

**Simple mode** (default):

- Only `Monthly Rent` and rent increase fields visible.
- Model behaves as in the legacy calculators (rent is stable from first rentable month). :contentReference[oaicite:11]{index=11}  

**Advanced mode** (when selected):

Show three conceptual phases:

1. **Phase 1 – Current condition**

   - `[ ] Property currently occupied`
     - If checked:
       - `Current monthly rent`
       - `Months until tenant leaves` (`M_tenant`)
     - If unchecked:
       - Property treated as vacant; `Current monthly rent` optional.

2. **Phase 2 – Turnover / rehab**

   - `[ ] There will be a vacancy / rehab period before stabilized rent`
     - If checked:
       - `Vacancy / rehab length (months)` (`M_rehab`)
       - Rental behavior dropdown:
         - (●) No rent during this period
         - (○) Temporary reduced rent: `Temporary monthly rent`
     - If unchecked:
       - `M_rehab = 0` (no explicit downtime; rent can simply step from current to future).

3. **Phase 3 – Stabilized condition**

   - `Stabilized monthly rent` (target rent after turnover/rehab).
   - `Apply annual rent increases from this point onward` (yes/no).

#### 6.2.2 Timeline semantics

Let:

- `M_tenant` = months until tenant leaves (0 if vacant).
- `M_rehab` = length of vacancy/rehab phase.
- `tenantOffsetMonths = M_tenant`.

Define:

- Rehab start month: `rehabStartMonth = tenantOffsetMonths + 1` (if rehab exists).
- Rehab end month: `rehabEndMonth = tenantOffsetMonths + M_rehab`.

Phases:

- Phase 1 (current):
  - Months 1 … `M_tenant`.
- Phase 2 (vacant/rehab):
  - Months `rehabStartMonth` … `rehabEndMonth` (may be zero length).
- Phase 3 (stabilized):
  - Months > `rehabEndMonth`.

#### 6.2.3 Rent behavior by phase

For each month `m`:

- **Phase 1 – Current condition**

  - If property occupied:
    - `rent[m] = currentMonthlyRent` (subject to current rent increase logic if desired).
  - If vacant:
    - `rent[m] = 0`.

  - All rent‑based expenses (vacancy, repairs, capex, PM, lease‑up) use `rent[m]`. :contentReference[oaicite:12]{index=12}  

- **Phase 2 – Turnover / rehab**

  - If “No rent during this period”:
    - `rent[m] = 0`.
  - If “Temporary reduced rent”:
    - `rent[m] = temporaryRent`.

  - Rehab costs (if any) and taxes/insurance accrue as usual.

- **Phase 3 – Stabilized**

  - `rent[m] = stabilizedMonthlyRent` (with standard annual increases).
  - All rent‑based expenses follow from `rent[m]`.

If no rehab is planned:

- Phase 2 may be zero months.
- Rent simply transitions from `currentMonthlyRent` to `stabilizedMonthlyRent` after `M_tenant`.

#### 6.2.4 Delayed rehab and ARV timing (tenanted properties)

For strategies with rehab and ARV (BRRRR, Flip, or Buy & Hold with rehab):

- Add optional input:
  - `As‑is value (current condition)` (default: Purchase Price if blank).

Property value:

- For months `m <= rehabEndMonth`:
  - `propertyValue[m] = asIsValue` growing at monthly appreciation rate. :contentReference[oaicite:13]{index=13}  
- At month `rehabEndMonth + 1`:
  - `propertyValue[rehabEndMonth + 1] = ARV`.
- For later months:
  - Property value appreciates from ARV at the standard monthly rate.

BRRRR specifics:

- Refi date:
  - Refinance occurs at `rehabEndMonth + 1` (end of rehab).
- Short‑term financing window:
  - `monthsFinanced = tenantOffsetMonths + M_rehab + monthsOnMarket` (monthsOnMarket=0 for BRRRR).
  - Bridge interest uses this extended period instead of only `M_rehab + monthsOnMarket`. :contentReference[oaicite:14]{index=14}  
- Cash left in deal and long‑term loan start align to that refi month.

Flip specifics:

- Sale occurs after rehab + marketing:
  - Holding period (for interest, taxes, insurance) includes:
    - Tenant offset months (if property is tenanted at purchase).
    - Rehab months.
    - Marketing months.
- Profit formulas remain as in the workbook, with the holding period generalized. :contentReference[oaicite:15]{index=15}  

Buy & Hold with delayed rehab:

- Long‑term loan can start at Month 1 (purchase).
- Rent follows phases; rehab cost is injected at rehab start or spread over rehab phase.
- Property value jumps from as‑is value to ARV on rehab completion if ARV > as‑is.

#### 6.2.5 Backward compatibility

- If user never selects “Advanced”:
  - Behavior matches legacy calculators (no multi‑phase timeline).
- Existing analyses without timeline data:
  - Interpret as:
    - `isOccupied = false`
    - `M_tenant = 0`
    - `M_rehab` from existing rehab fields.
    - Rehab assumed to start immediately.

### 6.3 Property database and autocomplete

#### 6.3.1 Data model

Property:

- `id` (UUID)
- `address_line_1`
- `address_line_2` (optional)
- `city`
- `state`
- `postal_code`
- `country` (optional)
- `latitude`, `longitude` (optional)
- `square_feet` (optional)
- `bedrooms`, `bathrooms` (optional)
- `year_built` (optional)
- `property_type` (enum: SFR, Condo, Townhouse, Multi, etc.)
- `default_property_tax_rate` (optional)
- `default_rent` (optional)
- `created_at`, `updated_at`

#### 6.3.2 Admin operations

- `/admin/properties` UI:
  - Searchable table.
  - Create, edit, delete property.
- Bulk import:
  - CSV upload.
  - Column mapping or strict template.
  - Validation report (imported vs failed rows with reasons).

#### 6.3.3 Autocomplete behavior

- Front‑end:
  - Address field with typeahead.
  - As user types, call:
    - `GET /api/properties/search?query=...`
- Returned suggestions:
  - id, formattedAddress, city, state, zip, sq ft, beds, baths.
- On selection:
  - Pre‑fill property fields (beds, baths, sq ft, etc.).
  - User can override for this scenario without editing the DB.

### 6.4 Scenario management and versioning

#### 6.4.1 Data model

Analysis (Scenario):

- `id` (UUID)
- `owner_id` (user id; Admin or Agent)
- `strategy` (enum: BUY_HOLD, BRRRR, FLIP)
- `property_id` (nullable)
- `name` (string)
- `input_payload` (JSON of all inputs, including tenancy/timeline settings)
- `summary_payload` (JSON of key metrics and often‑used tables)
- `version` (integer; start at 1; increment on “Save as new version”)
- `created_at`, `updated_at`
- `deleted_at` (optional for soft delete)

#### 6.4.2 Operations

- Create:
  - New scenario from scratch or from property.
- Save/update:
  - Overwrite `input_payload` and `summary_payload`.
- Duplicate:
  - Create new scenario with same payloads and version reset to 1.
- “Save as new version”:
  - Optionally track version semantics for major changes (v1, v2).
- List:
  - “My analyses” page with filters (strategy, property, client, etc.).

### 6.5 Sharing and export

#### 6.5.1 Share links (view‑only + snapshot)

Data model: AnalysisShareLink

- `id` (UUID)
- `analysis_id`
- `token` (unguessable URL token)
- `snapshot_payload` (JSON capture of inputs + summary at the time of sharing)
- `created_by` (user id)
- `created_at`
- `expires_at` (nullable)
- `is_revoked` (boolean)
- `label` (optional, e.g. “Sent to Client X on 2025‑02‑01”)

Behavior:

- When user clicks “Share” on an analysis:
  - System creates a snapshot of `input_payload` + `summary_payload` at that moment.
  - Stores it in `snapshot_payload`.
  - Generates a token and share URL `/s/{token}`.

- Shared view:
  - Always uses `snapshot_payload`, not the live scenario.
  - Is read‑only for all viewers.

- Owner behavior (logged in and owning the underlying analysis):
  - On `/s/{token}`, show:
    - “Open original analysis” (if still exists).
    - “Duplicate as new scenario”.
  - This duplication creates a new scenario with the snapshot inputs; edits affect only the new scenario, not the snapshot or original.

#### 6.5.2 Shared view UI

Route: `/s/[token]`

- Header:
  - Brand (or agent brand).
  - Property address and key stats.
- Content:
  - Basic deal summary cards.
  - Input summary (grouped by tabs).
  - Investment Analysis table.
  - Optional charts.
  - Optional notes (owner‑authored commentary).
- No editable fields; only labels and values.

#### 6.5.3 Client deal decks (V3 / Agent Portal)

- Agent can create “Clients” and attach multiple analyses to each.
- Each client has a “deck link” (e.g., `/c/{clientToken}`).
- Deck view shows:
  - List of cards (one per analysis).
  - Each card links to that analysis’s share URL.
- Optional: allow client to mark interest (keep/maybe/pass) and leave notes.

#### 6.5.4 PDF export

- Available on:
  - Main analysis view.
  - Shared view (if allowed).
- Contents:
  - Cover section: property, strategy, owner/agent branding, date.
  - Input summary.
  - Rehab summary.
  - Investment Analysis table.
  - Optional narrative “Deal Summary” (AI‑generated in V3).
- Implementation:
  - V1: client‑side print/PDF stylesheet or lightweight library.
  - Later: server‑side HTML→PDF for consistent rendering.

### 6.6 Agent Portal and branding (V2/V3)

#### 6.6.1 Agent accounts

User model:

- `id`
- `email`, `password_hash` (or external auth)
- `role` (ADMIN, AGENT)
- `name`
- `profile_photo_url`
- `brokerage`
- `phone`, `website`
- Branding:
  - `logo_url`
  - `primary_color`, `secondary_color`
  - `brand_tagline`

#### 6.6.2 Agent dashboard

Route: `/agent` (for agents).

- Sections:
  - “My deals” – list of analyses owned by agent.
  - Filters by strategy, client, status (draft, shared, closed, etc.).
  - Quick stats (e.g., total properties analyzed, number shared).

#### 6.6.3 Branded share views

- Shared view header uses:
  - Agent’s logo, name, contact info, brand colors.
- Admin baseline brand used if no agent brand.

### 6.7 AI features (V3+)

All AI features must:

- Suggest inputs and narratives only.
- Never directly alter core numeric formulas or outputs.
- Always show how/where suggested values are used.

#### 6.7.1 Photo‑based rehab estimator

- Flow:
  - On Rehab Estimator tab, user clicks “Analyze photos”.
  - Uploads a set of photos (interior/exterior).
  - Optional: upload “ideal” comps for target finish.

- AI output:
  - Proposed rehab scope:
    - Mapped directly onto defined rehab items.
    - Each item with:
      - On/off toggle suggestion.
      - Estimated quantity (e.g., sq ft for flooring).
      - Cost range (low/mid/high).
  - User can:
    - Accept a “mid” scenario.
    - Edit any line.
  - Accepted scope flows into rehab total.

#### 6.7.2 Comps‑based ARV and rent

- Flow:
  - On a “Comps & ARV” tab/modal:
    - User uploads CSV or structured text of comps (or uses a future integration).
  - AI:
    - Cleans and normalizes comp data.
    - Filters by distance, property type, date, etc.
    - Selects best comps (3–8).
    - Computes ARV range and recommended ARV.
    - Optionally estimates rent range if rental comps exist.

- Output:
  - Table of selected comps + similarity explanation.
  - `ARV_low`, `ARV_mid`, `ARV_high`, with “Use ARV_mid” button.
  - Optional rent suggestions that can populate stabilized rent fields.

#### 6.7.3 Deal explanation and coaching

- Flow:
  - On Results tab, user clicks “Explain this deal”.
  - AI reads full analysis snapshot.

- AI output:
  - Narrative summary:
    - 1–2 sentence overview.
    - 3–5 bullet key takeaways (cash needed, cash flow, main risk).
  - Risk flags:
    - Low DSCR in early years.
    - High leverage.
    - Sensitivity to rent or rehab overruns.
  - Suggested scenarios:
    - “Try 10% lower rent.”
    - “Try 20% higher rehab cost.”

#### 6.7.4 Natural‑language input

- On Property or Deal Details tab:
  - Optional text box:
    - “Describe your deal in plain language.”
  - AI parses:
    - Purchase price, rehab cost, beds, baths, sq ft, rent, loan terms, etc.
  - User reviews a proposed mapping before applying.

#### 6.7.5 Document ingestion

- Supported docs (initially):
  - Inspection reports (PDF/text).
  - Appraisals.
  - Leases.

- AI:
  - Inspection:
    - Extracts issues and maps them to potential rehab items or risk tags.
  - Appraisal:
    - Extracts ARV, comp list, and commentary.
    - Comments on how your ARV compares to appraised expectations.
  - Lease:
    - Extracts rent, term, renewal terms, tenant vs landlord responsibilities.

#### 6.7.6 Portfolio insights / agent “brain”

- Aggregates an agent’s closed deals and/or analyses.
- AI analyses:
  - Typical target return ranges.
  - Risk tolerance patterns.
  - Underperformers flagged by:
    - Weak cash flow.
    - DSCR issues.
    - Flat or declining return on equity.
- Suggestions:
  - Deals that may benefit from refi or sale.
  - Client segments worth re‑contacting.

---

## 7. Technical and architecture assumptions

### 7.1 Front‑end

- Framework: React + TypeScript (likely Next.js).
- Must build to a static/SPA bundle deployable to TiinyHost.
- Component structure:
  - Layout.
  - Strategy selector.
  - Tabbed input forms.
  - Results and analysis views.
  - Admin and Agent dashboards.

### 7.2 Backend & DB

- Backend:
  - Node/Express, Next.js API routes, or BaaS (Supabase/Firebase) acceptable.
  - Exposes REST or GraphQL endpoints for:
    - Property search & CRUD.
    - Analysis CRUD.
    - Share links.
    - Auth.
    - (Later) AI endpoints.

- Database:
  - Relational (Postgres recommended).
  - Tables:
    - users
    - properties
    - analyses
    - analysis_share_links
    - clients (for agent portal)
    - client_analyses (junction)
    - settings/defaults

### 7.3 Calculator engine design

- Implemented as a pure TypeScript module(s) with no UI or framework dependencies.
- Main entry points:
  - `calculateBuyHold(inputs) -> { monthly[], annual[], metrics }`
  - `calculateBRRRR(inputs) -> { monthly[], annual[], metrics }`
  - `calculateFlip(inputs) -> { monthly[], metrics }`
- Uses spec formulas for:
  - Loan amortization, appreciation, rent escalation, expenses, bridge logic, refi, flip profit. :contentReference[oaicite:16]{index=16}  
- Unit tested against known spreadsheet cases.

---

## 8. Non‑functional requirements

- **Performance**
  - Recalculation for a single analysis < 300ms on typical hardware.
- **Reliability**
  - Regular DB backups.
  - No silent data loss in property DB or scenarios.
- **Security**
  - Secure password storage.
  - HTTPS for all endpoints.
  - Share tokens must be unguessable (≥128 bits entropy).
- **Compliance**
  - Clear disclaimers:
    - Educational only; not financial, legal, or tax advice.
- **Analytics**
  - Track key events:
    - Analyses created, updated, shared.
    - Share links opened.
    - Agents’ usage patterns.

---

## 9. Open questions

1. Which backend stack is preferred (Supabase vs custom Node/Postgres vs other)?
2. For BRRRR with delayed rehab, should rent be modeled during the tenant‑occupied pre‑rehab period (likely yes), and with what default assumptions?
3. How detailed should the first AI feature be (photos vs comps vs explanations) for an initial V3 experiment?
4. How deep should agent‑level permissions and client feedback go in Phase 3?
5. How many years/months of projections should be exposed in the UI vs PDF (e.g., 10 vs 30 years)?

---

This PRD is meant to be the “single source of truth” for the product vision, behavior, and constraints. The reverse‑engineering spec remains the canonical reference for calculator math and formulas. :contentReference[oaicite:17]{index=17}  
