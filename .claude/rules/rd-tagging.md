# Rule: R&D tagging (Australian R&DTI contemporaneous evidence)

- Prefix the commit subject with `[R&D] ` when the change contributes to
  R&D-eligible work: novel technical experimentation, new integrations,
  architectural development, performance/correctness research.
  Example: `[R&D] feat: add ChannelProvider abstraction`.
- Apply the GitHub `R&D` label to PRs containing any `[R&D]` commits.
- Untagged commits/PRs are BAU/non-R&D: routine bug fixes, dep bumps,
  formatting, copy changes, doc edits, config housekeeping.
- Mixed PRs: split into separate commits so the prefix is accurate per
  commit; label the PR if any commit is R&D.
- Do not retroactively tag historical commits.
- Excluded repos: `strabb-waitlist`.
