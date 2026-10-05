<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- Knowledge search runs as Postgres RPCs (full-text + pg_trgm) so per-query search is free; no AI/API call at query time.
- Book ingestion happens offline (see ANTIGRAVITY_PROMPT.md) and is loaded via the in-app Import page as knowledge.json; embeddings are 384-dim (MiniLM) to match book_chunks.embedding.
- All doctor pages live under src/routes/_authenticated (client-only auth gate); patient data is RLS-scoped to doctor_id = auth.uid().
