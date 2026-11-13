# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-11-13

### Added

- `conversation.view` entry `job-log` (order 20) with the labels `Job` /
  `Задание`.
- Live background-job output through `ctx.jobs.watchRows`, `observe`, and
  `kill`, without consuming the model's `job_output` cursor.
- Clickable `job_id` values in the `job_output`, `job_list`, and `job_kill`
  tool cards (`tool.call.toolview`, priority -10).
- Job list with search across running and settled jobs; running jobs first.
- Status, duration, command, exit code/detail, and a monospace output block.
- Autoscroll with pause on manual scroll and a **Jump to latest** action.
- Copy command and copy output.
- Two-step stop for running jobs (arm, then confirm within three seconds).
- Empty, loading, unknown-id, retention-gap, stream-error, and host-restart
  states.
- `ru` / `en` dictionaries and keyboard-focusable controls.
- Original logo, icon, and social preview artwork.
- Release workflow: a `v*` tag creates a GitHub Release with the packed bundle.

[1.0.0]: https://github.com/Sect0R/dsh-job-log/releases/tag/v1.0.0
