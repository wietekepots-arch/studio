# Notion Kanban connection

- Target board: [Tech Radar](https://www.notion.so/greenberry/Tech-Radar-2a77078e5514815a921ddefb47852685)

Status: manual sync workflow defined; API automation still open.

## Mapping

- Feature, bug, chore, and research work should have one Notion card.
- GitHub issue or pull request links should be added to the Notion card when work starts.
- Pull request review status should be reflected in the Notion status field.
- Preview links should be added to the Notion card for UI work.

## Status Flow

- Backlog: idea or unscoped work.
- Ready: scoped and ready to pick up.
- In progress: implementation started.
- Review: pull request opened.
- Done: merged or explicitly closed as complete.
- Blocked: waiting on external input, access, or decision.

## Ownership

- The person starting implementation is responsible for linking the branch or pull request.
- The pull request author is responsible for keeping status and preview links current during review.
- Automation can be added later, but manual updates are the source of truth until then.

## Follow-Up

- Decide whether Notion should sync from GitHub, GitHub should sync from Notion, or both.
- Add Notion API credentials and field mappings only after the target board schema is stable.
