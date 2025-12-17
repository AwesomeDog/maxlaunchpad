# Configuration, Profiles & Storage

## Q: Do I need global variables to switch projects?

Some developers want to bind commands like `npm start` to keys while working across multiple projects. It is tempting to introduce a global "current project" variable that can be referenced in `filePath`, `arguments`, or `workingDirectory` so that switching projects only requires changing that single variable.

For now, MaxLaunchpad does **not** introduce a general-purpose global variable system for project switching.

Instead, the recommended alternatives are:

- Bind different commands directly to different keys.
- If you need more separation, bind different keys in different tabs.
- When those are not enough, use **multiple keyboard profiles** (for example: `work-project-a.yaml`, `work-project-b.yaml`, `personal.yaml`).

And hard-code the appropriate `filePath` / `arguments` / `workingDirectory` for that specific project.

This keeps the product simple and predictable, while still giving developers a clear way to have different setups per project.

**Rationale:**

- The product is intentionally minimal and focused on reliability, not on building a full scripting or templating layer.
- The configuration system already has keys, tabs, profiles which naturally map to different projects or contexts.
- Introducing custom global variables would add significant complexity: new schema, UI to manage variables, interpolation rules, and interactions with OS or shell environment variables.

If a strong, recurring user need emerges for "one keyboard layout, many projects" where only a base directory changes, we can revisit this and consider a very constrained feature (for example, a single `baseDirectory` per profile with limited interpolation). For now, profiles are the supported way to switch between projects.
