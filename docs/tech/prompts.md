# Workflow

**Development Pipeline:**

Brainstorm → PRD Design & Retrospection → UX Design → Test Design → Architecture Design & Retrospection → Sprint-based Development & Retrospection → Code Review

**Quality Assurance:** Each stage includes cross-validation using different LLMs to ensure consistency and quality.

# Prompts Used on the Project

## Global

- Do not make any Git commits unless I explicitly instruct to perform a Git Commit.
- Do not generate additional summary documents for each requirement implementation unless I specifically request them.
- Do not undo Git changes unless I explicitly ask to do so.
- Wait until 3 or more similar instances before abstracting.
- Good code is self-documenting. Comments should explain the "why", not the "what".
- MUST find the simplest possible solution, and only increase complexity when necessary.

## For Document Preparation (Project Kickoff)

**Task**: Generate Technical Documentation from Product Specification (Prod Doc → Tech Doc)

- Reference: ./docs/product-specification.md (prod doc, as the sole source of truth).
- Action: Convert the prod doc into a technical documentation set (3 core deliverables below), ensuring every technical
  detail aligns with prod-defined functions:
    - Technical Architecture Overview: Map prod features to system components (e.g., "User Login" → frontend auth
      module +
      backend API gateway + database table), include component interactions (data flow diagrams in text description) and
      tech stack choices (justify choices based on prod requirements like performance, scalability).
    - Module-Level Technical Specs: For each core module (e.g., "File Management", "User Profile"), define: (a)
      input/output parameters (data types, validation rules), (b) core logic (pseudocode for complex workflows like "
      Save
      As" file versioning), (c) dependencies (other modules, external APIs), (d) error handling (list possible errors,
      error codes, and recovery logic).
    - Integration & Deployment Notes: Outline how modules integrate (API endpoints, communication protocols like
      REST/IPC),
      specify environment requirements (OS, runtime, dependencies), and add deployment checklists (e.g., "Verify
      database
      schema matches user profile module specs").
- Output Requirement: Use technical documentation conventions (clear headings, bullet points for lists, code blocks for
  pseudocode), avoid ambiguous terms (replace "fast" with "response time < 500ms" per prod performance goals), and
  cross-reference prod doc sections (e.g., "Aligns with Prod Doc Section 3.2: User Data Security").
- Constraint: Do NOT add features not mentioned in the prod doc; if prod doc has ambiguous requirements (e.g., "support
  multiple file formats"), list 2–3 reasonable technical interpretations and prioritize the one that fits prod’s stated
  user needs.

**Task**: Audit two docs for inconsistencies.

- Scope: Only `./docs/product-specification.md` and `./docs/technical-architecture.md` (ignore all other files).
- Action: Identify and list: (1) direct content conflicts, logical inconsistency (2) terminology uniformity, format,
  unit, and symbol consistency (3) logical errors and other inconsistencies
- Constraint: Do NOT modify the documents—only output the issues found.

**Task**: Figure out File menu logic from docs.

- Scope: Only `./docs/product-specification.md` and `./docs/technical-architecture.md` (ignore all other files).
- Action: Systematically outline the functional logic for the `File` menu, including its sub-features: `New`, `Open`,
  and `Save As`.
- Output: A structured breakdown of each sub-feature’s logic (e.g., triggers, expected behavior, dependencies).

**Task**: Polish docs for sharing.

- Scope: All files in the `./docs` directory.
- Action: Fix readability issues (e.g., grammar errors, awkward phrasing, unclear structure) to prepare for external
  stakeholders.
- Constraint: Preserve all original content—only adjust for clarity.

## For Core Development (Skeleton Implementation)

**Task**: Build the Phase 1 Skeleton App.

- Reference: `./docs/product-specification.md` and `./docs/technical-architecture.md`. (use as the single source of
  truth).
- Action: Implement the requirements explicitly labeled **Phase 1: Skeleton App** in the docs.
- Output: Functional code that matches the skeleton app specs (no extra features beyond the docs).

## For Code Validation (Consistency & Correctness Check)

**Task**: Validate code against docs.

- Reference: `./docs/product-specification.md` and `./docs/technical-architecture.md`.
- Action: Compare the current codebase to the docs and flag any discrepancies.
- Rule: Prioritize the docs—any code that conflicts with doc specs is a discrepancy.

**Task**: Evaluate impact of removing `tools:getPaths`.

- Scope: The `tools:getPaths` utility.
- Action: Analyze and output: (1) where `tools:getPaths` is used in code, (2) potential breakages if removed, (3)
  alternatives if removal is necessary.

## For Code Optimization (Refactoring & Standardization)

**Task**: Streamline selectors in `selector.ts`.

- Reference: `./docs/product-specification.md`, `./docs/technical-architecture.md`, and `selector.ts`.
- Action: Identify selectors in `selector.ts` that: (1) are redundant, (2) can be merged without breaking
  functionality, (3) conflict with doc specs.

**Task**: Simplify `global.css` (doc-aligned).

- Reference: `./docs/product-specification.md`, `./docs/technical-architecture.md`, and `./styles/global.css`.
- Action: Identify parts of `global.css` that: (1) can be merged (e.g., duplicate rules), (2) can be simplified (e.g.,
  overly specific selectors), (3) conflict with doc-defined styling requirements.

**Task**: Extract repeated common logic.

- Scope: The entire codebase.
- Action: List all logic blocks that are repeated 3+ times (e.g., helper functions, conditionals) and note where they
  appear.
- Constraint: Do NOT refactor—only output the list of repeatable logic.

**Task**: Identify functions for extraction to shared modules.

- Scope: The entire project codebase.
- Action: Identify and list functions that can be extracted to a public/shared module (e.g., `normalizeProfile` →
  `shared/utils`). For each function:
    1. Name the function and its current location.
    2. Suggest the target shared module path (e.g., `shared/utils`, `shared/helpers`).
    3. Note any dependencies the function relies on (to ensure safe extraction).
- Constraint: Do NOT modify code—only output the list with recommendations.

**Task**: Audit code naming conventions.

- Scope: The entire codebase.
- Action: List issues like: (1) inconsistent casing (e.g., camelCase vs. snake_case), (2) ambiguous names (e.g., `func1`
  instead of `formatDate`), (3) names that conflict with doc terminology.

**Task**: Restructure file for readability.

- Scope: A specific file.
- Action: Reorganize code structure (e.g., reorder functions, group related logic) to improve human readability.
- Constraint: Preserve all functionality—no behavior changes.

**Task**: Reduce developer cognitive load via code restructuring.

- Scope: The entire codebase.
- Action: Refactor to simplify complexity, e.g.: (1) split monolithic functions into smaller ones, (2) reduce nested
  conditionals, (3) standardize error-handling patterns.
- Constraint: Preserve all functionality.

## For Feature & Experience Enhancement

**Task**: Implement native menu hover behavior.

- Context: Native system menus have this behavior: After clicking one menu, hovering over other menus auto-expands them.
- Action 1: Name this specific menu behavior.
- Action 2: Propose a simple implementation for the current project (code snippets or step-by-step logic).

**Task**: Add Key Features to README (from docs).

- Reference: `./docs/product-specification.md`.
- Action: Extract user pain points from the doc and rephrase them as "Key Features" for the `README`.
- Output: A list of Key Features aligned with doc-defined user needs.

**Task**: Polish README (minor adjustments).

- Scope: The project’s `README` file.
- Action: Fix grammar, reorder sections, or clarify phrasing.
- Constraint: Do NOT add new content—only refine existing text.

## For Quality Assurance

**Task**: Identify unit test opportunities.

- Scope: The entire codebase.
- Action: List specific locations where unit tests would add value (e.g., utility functions, IPC handlers, form
  validation logic) and note what to test (e.g., "Test `formatDate` with invalid inputs").
- Constraint: Do NOT write tests—only output the list.

**Task**: Implement unit tests.

- Scope: A specific module.
- Action: Write functional unit tests for the identified code areas, following these rules:
    1. Cover core functionality (happy paths) and edge cases (e.g., invalid inputs, empty values).
    2. Use the project’s existing test framework (if none, suggest a standard framework for the tech stack).
    3. Ensure tests are runnable and produce clear pass/fail results.
- Output: Complete, testable code for unit tests (include setup/teardown logic if needed).

**Task**: Propose user-modified file validation.

- Action 1: List all files the program reads that users can modify.
- Action 2: Suggest simple validation mechanisms (e.g., check file extension, validate JSON schema, verify checksum) for
  these files.
- Constraint: Do NOT modify code—only output the file list and validation proposals.

**Task**: Evaluate code quality from senior software engineer with 10+ years of experience in electron

- Action: Provide detailed, actionable feedback covering:
    - Code correctness: Check for logical errors, bugs, edge cases (e.g., null values, boundary conditions) and
      compliance
      with business requirements.
    - Readability & maintainability: Evaluate naming conventions (variables, functions, classes), code structure,
      comments/documentation.
    - Performance: Identify potential bottlenecks (e.g., inefficient loops, redundant computations, unoptimized database
      queries) and suggest optimizations.
    - Best practices: Point out deviations from industry best practices (e.g., hardcoded values, lack of error handling,
      tight coupling) and propose improvements.
    - Security: Flag security vulnerabilities (e.g., SQL injection, XSS, insecure authentication, missing input
      validation)
      if applicable.
- Output: Feedback clearly with sections (e.g., "Strengths", "Issues to Fix", "Suggestions for Improvement") and
  prioritize critical issues over minor nitpicks. If there are multiple ways to fix a problem, explain the tradeoffs of
  each approach.
