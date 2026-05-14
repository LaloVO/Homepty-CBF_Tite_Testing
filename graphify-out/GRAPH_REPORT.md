# Graph Report - .  (2026-05-14)

## Corpus Check
- Corpus is ~7,894 words - fits in a single context window. You may not need a graph.

## Summary
- 161 nodes · 214 edges · 26 communities (13 shown, 13 thin omitted)
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 24 edges (avg confidence: 0.87)
- Token cost: 100,320 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_UI Component Files|UI Component Files]]
- [[_COMMUNITY_Architecture & Documentation|Architecture & Documentation]]
- [[_COMMUNITY_CBF REST API Routes|CBF REST API Routes]]
- [[_COMMUNITY_API Route AST Functions|API Route AST Functions]]
- [[_COMMUNITY_Multi-Tenant Middleware|Multi-Tenant Middleware]]
- [[_COMMUNITY_Brain Client Integration|Brain Client Integration]]
- [[_COMMUNITY_Page & UI Components|Page & UI Components]]
- [[_COMMUNITY_Root Layout & Fonts|Root Layout & Fonts]]
- [[_COMMUNITY_Brain API Stubs (MVP)|Brain API Stubs (MVP)]]
- [[_COMMUNITY_Static UI Assets|Static UI Assets]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_CSS Tooling Config|CSS Tooling Config]]
- [[_COMMUNITY_ESLint Config Node|ESLint Config Node]]
- [[_COMMUNITY_Next Config Node|Next Config Node]]
- [[_COMMUNITY_Root Layout Node|Root Layout Node]]
- [[_COMMUNITY_PropertyValuation Type|PropertyValuation Type]]
- [[_COMMUNITY_MarketAnalysis Type|MarketAnalysis Type]]
- [[_COMMUNITY_PropertyRecommendation Type|PropertyRecommendation Type]]
- [[_COMMUNITY_Property Type|Property Type]]
- [[_COMMUNITY_PropertyImage Type|PropertyImage Type]]
- [[_COMMUNITY_User Type|User Type]]
- [[_COMMUNITY_Next.js Docs|Next.js Docs]]

## God Nodes (most connected - your core abstractions)
1. `authMiddleware()` - 14 edges
2. `createClient()` - 9 edges
3. `supabase` - 7 edges
4. `authMiddleware (lib/auth)` - 6 edges
5. `CBF API Key Authentication Pattern` - 6 edges
6. `Supabase Client (lib/supabase.ts)` - 6 edges
7. `User Info Route` - 5 edges
8. `Component Registry` - 5 edges
9. `Supabase Client (lib/supabase)` - 5 edges
10. `getSiteByDomain Function` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Dynamic Component System` --rationale_for--> `HeroSearchV1 Component`  [INFERRED]
  README.md → app/components/HeroSections/HeroSearchV1.tsx
- `getSiteData Function` --semantically_similar_to--> `getSiteByDomain Function`  [INFERRED] [semantically similar]
  src/app/sites/[subdomain]/page.tsx → lib/db.ts
- `Homepty CBF README` --references--> `Supabase Client (lib/supabase.ts)`  [EXTRACTED]
  README.md → lib/supabase.ts
- `Multi-Tenant Satellite Site Architecture` --rationale_for--> `UserSite Interface`  [INFERRED]
  README.md → lib/supabase.ts
- `Homepty CBF README` --references--> `HeroSearchV1 Component`  [EXTRACTED]
  README.md → app/components/HeroSections/HeroSearchV1.tsx

## Hyperedges (group relationships)
- **CBF API Authentication Flow** — lib_auth_authMiddleware, cbf_api_key_pattern, db_user_sites [INFERRED 0.85]
- **Homepty Brain Proxy Endpoints** — api_market_route, api_recommendations_route, api_valuation_route, lib_brain_client [EXTRACTED 0.95]
- **Page Renderer Component System** — component_PageRenderer, component_registry, component_PropertyGridV2, component_LeadCaptureFormV2, component_PropertyDetailsV3, component_ValuationChartV1 [EXTRACTED 0.95]
- **Custom Domain Management Flow** — adminAddCustomDomain_route, adminVerifyDomain_route, libSupabaseServer_createClient, libSupabase_UserSite [INFERRED 0.90]
- **CBF API Key Authentication Flow** — libAuth_authMiddleware, libAuth_verifyApiKey, libSupabase_supabase, libSupabase_UserSite [EXTRACTED 0.95]
- **Site Data Resolution by Domain or Subdomain** — libDb_getSiteByDomain, subdomainPage_getSiteData, libSupabase_supabase, libSupabase_UserSite [INFERRED 0.85]

## Communities (26 total, 13 thin omitted)

### Community 0 - "UI Component Files"
Cohesion: 0.12
Nodes (8): HomePage(), PageRenderer(), PageRendererProps, PropertyGridV2(), PropertyGridV2Props, COMPONENT_REGISTRY, getPropertiesByUser(), getSiteByDomain()

### Community 1 - "Architecture & Documentation"
Cohesion: 0.11
Nodes (22): Admin Add Custom Domain Route, Admin Verify Domain Route, Brain Integration Documentation, CBF API Key Authentication, CBF as Proxy Pattern, Dynamic Component System, Multi-Tenant Satellite Site Architecture, HeroSearchV1 Component (+14 more)

### Community 2 - "CBF REST API Routes"
Cohesion: 0.17
Nodes (21): Admin Create Site Route, generateCBFApiKey Function, Market Analysis Route, Properties List Route, Property Detail Route, Recommendations Route, User Info Route, Valuation Route (+13 more)

### Community 3 - "API Route AST Functions"
Cohesion: 0.2
Nodes (13): generateCBFApiKey(), POST(), GET(), authMiddleware(), verifyApiKey(), Property, PropertyImage, PropertyWithImages (+5 more)

### Community 4 - "Multi-Tenant Middleware"
Cohesion: 0.21
Nodes (12): isValidDomain(), POST(), config, extractSubdomain(), getSubdomainFromCustomDomain(), middleware(), generateMetadata(), getSiteData() (+4 more)

### Community 5 - "Brain Client Integration"
Cohesion: 0.19
Nodes (10): brainClient, getMarketAnalysis(), getPropertyRecommendations(), getPropertyValuation(), MarketAnalysis, PropertyRecommendation, PropertyValuation, GET() (+2 more)

### Community 6 - "Page & UI Components"
Cohesion: 0.32
Nodes (8): Home Page, LeadCaptureFormV2 Component, PageRenderer Component, PropertyDetailsV3 Component, PropertyGridV2 Component, ValuationChartV1 Component, Component Registry, DB Helpers (lib/db)

### Community 7 - "Root Layout & Fonts"
Cohesion: 0.4
Nodes (3): geistMono, geistSans, metadata

### Community 8 - "Brain API Stubs (MVP)"
Cohesion: 0.4
Nodes (5): MVP Brain Integration Disabled, getMarketAnalysis Function, getPropertyRecommendations Function, getPropertyValuation Function, getROIAnalysis Function

### Community 9 - "Static UI Assets"
Cohesion: 0.5
Nodes (5): File Document Icon, Globe / World / Internet Icon, Next.js Wordmark Logo, Vercel Triangle Logo, Browser Window Icon

## Knowledge Gaps
- **46 isolated node(s):** `eslintConfig`, `config`, `nextConfig`, `geistSans`, `geistMono` (+41 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `supabase` connect `API Route AST Functions` to `UI Component Files`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `authMiddleware()` connect `API Route AST Functions` to `Brain Client Integration`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `CBF API Key Authentication Pattern` (e.g. with `Properties List Route` and `Property Detail Route`) actually correct?**
  _`CBF API Key Authentication Pattern` has 6 INFERRED edges - model-reasoned connections that need verification._
- **What connects `eslintConfig`, `config`, `nextConfig` to the rest of the system?**
  _46 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Component Files` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._
- **Should `Architecture & Documentation` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._