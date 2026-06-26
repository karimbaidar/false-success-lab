# Rename Repo Note

Current GitHub repository name:

```text
false-success-lab
```

Previous repository name:

```text
agent-consistency-refund-demo
```

## Rename Status

GitHub reported the repository move during push:

```text
https://github.com/karimbaidar/false-success-lab.git
```

Use the renamed repo and Pages links in public docs:

```text
https://github.com/karimbaidar/false-success-lab
https://karimbaidar.github.io/false-success-lab/
```

If you ever need to repeat the rename from an old checkout, the CLI equivalent
is:

```bash
gh repo rename false-success-lab --repo karimbaidar/agent-consistency-refund-demo
```

## Post-Rename Checks

- Confirm the new repo URL is
  `https://github.com/karimbaidar/false-success-lab`.
- Confirm GitHub Pages is available at
  `https://karimbaidar.github.io/false-success-lab/`.
- Keep README badges, project links, and Pages references on
  `false-success-lab`.
- Keep the migration wording: "Previously named `agent-consistency-refund-demo`."
- Update the `agent-consistency` README/docs so package links point to the new
  lab repo and live demo URL.
