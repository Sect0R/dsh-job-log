window.__ModuleLoader__.load({
  id: '@local/job-log',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useState, useEffect, useMemo, useRef, useCallback } = React

    /** Locale namespace owned by this plugin. */
    const NS = 'jobLog'
    /** Conversation view id and the focus target the tool cards address. */
    const VIEW_ID = 'job-log'
    /** Stable empty roster so a session with no jobs keeps one array identity. */
    const EMPTY = Object.freeze([])
    /** How long an armed stop waits for the confirming press. */
    const KILL_ARM_MS = 3000
    /** How long a failed stop keeps its hint. */
    const KILL_FAILED_MS = 4000
    /** Largest recorded result rendered inside a tool card (the tab carries the full stream). */
    const CARD_TEXT_LIMIT = 6000

    // ── Dictionaries ────────────────────────────────────────────────────────

    /** English dictionary (the key-set source of truth). */
    const en = {
      'view.job': 'Job',
      'page.title': 'Job output',
      'page.subtitle': 'Live terminal output for background jobs in this session.',
      'list.title': 'Jobs',
      'list.search': 'Search jobs',
      'list.searchAria': 'Search background jobs',
      'list.empty': 'No background jobs',
      'list.emptyHint': 'Jobs started from this session appear here.',
      'list.loading': 'Loading jobs…',
      'list.noMatches': 'No jobs match “{query}”.',
      'list.running': 'Running',
      'list.settled': 'Finished',
      'list.count': '{count} jobs',
      'list.liveCount': '{count} running',
      'list.open': 'Show {label}',
      'detail.emptyTitle': 'No background jobs',
      'detail.emptyBody': 'Start a long-running command in the background and its live output will appear here.',
      'detail.loadingTitle': 'Loading job…',
      'detail.loadingBody': 'Waiting for the job roster from the host.',
      'detail.notFoundTitle': 'Job not found',
      'detail.notFoundBody': 'Job {id} is not in this session’s job list. It may have finished before retention, or the host may have restarted.',
      'detail.showAll': 'Show all jobs',
      'detail.id': 'Job id',
      'detail.kind': 'Kind',
      'detail.status': 'Status',
      'detail.duration': 'Duration',
      'detail.started': 'Started',
      'detail.finished': 'Finished',
      'detail.exitCode': 'Exit code',
      'detail.detail': 'Detail',
      'detail.progress': 'Progress',
      'detail.command': 'Command',
      'detail.copyCommand': 'Copy command',
      'detail.copyOutput': 'Copy output',
      'detail.copyId': 'Copy job id',
      'detail.copied': 'Copied',
      'detail.copyFailed': 'Copy failed',
      'detail.retention': 'Earlier output is no longer retained by the host.',
      'status.running': 'Running',
      'status.stopping': 'Stopping',
      'status.completed': 'Completed',
      'status.killed': 'Stopped',
      'status.failed': 'Failed',
      'status.unknown': 'Unknown',
      'kill.stop': 'Stop',
      'kill.confirm': 'Confirm stop',
      'kill.pending': 'Stopping…',
      'kill.failed': 'Stop failed',
      'kill.aria': 'Stop job {label}',
      'kill.confirmAria': 'Confirm stopping job {label}',
      'kill.hint': 'Press again within 3 seconds to stop this job.',
      'output.title': 'Output',
      'output.empty': 'No output was retained.',
      'output.waiting': 'Waiting for output…',
      'output.gap': 'Some earlier output was dropped while streaming.',
      'output.error': 'The live output stream ended with an error: {error}',
      'output.jump': 'Jump to latest',
      'output.aria': 'Terminal output for job {id}',
      'output.lines': '{count} lines',
      'output.bytes': '{count} bytes',
      'duration.seconds': '{seconds}s',
      'duration.minutes': '{minutes}m {seconds}s',
      'duration.hours': '{hours}h {minutes}m',
      'card.readJob': 'Read job output',
      'card.listJobs': 'List background jobs',
      'card.killJob': 'Stop background job',
      'card.openJob': 'Open job {id} in the Job tab',
      'card.argument': 'Job id',
      'card.inspect': 'Inspect',
      'card.noResult': 'No result yet.',
      'card.waiting': 'Waiting for the tool result…',
      'card.openFailed': 'Open the Job tab and select this job.',
      'card.jobs': '{count} jobs',
      'card.noJobs': 'No background jobs.',
      'card.truncated': 'Result shortened in this card. Open the Job tab for the full output.',
      'card.raw': 'Recorded result',
      'hostRestart': 'If the host restarted, background jobs and their output may no longer be available.',
      'common.copy': 'Copy',
    }

    /** Russian dictionary, checked against the English keys. */
    const ru = {
      'view.job': 'Задание',
      'page.title': 'Вывод задания',
      'page.subtitle': 'Живой вывод фоновых заданий этой сессии.',
      'list.title': 'Задания',
      'list.search': 'Поиск заданий',
      'list.searchAria': 'Поиск фоновых заданий',
      'list.empty': 'Фоновых заданий нет',
      'list.emptyHint': 'Задания, запущенные из этой сессии, появятся здесь.',
      'list.loading': 'Загрузка заданий…',
      'list.noMatches': 'Нет заданий по запросу «{query}».',
      'list.running': 'Выполняются',
      'list.settled': 'Завершённые',
      'list.count': 'Заданий: {count}',
      'list.liveCount': 'Выполняется: {count}',
      'list.open': 'Показать {label}',
      'detail.emptyTitle': 'Фоновых заданий нет',
      'detail.emptyBody': 'Запустите длительную команду в фоне — её живой вывод появится здесь.',
      'detail.loadingTitle': 'Загрузка задания…',
      'detail.loadingBody': 'Ожидание списка заданий от хоста.',
      'detail.notFoundTitle': 'Задание не найдено',
      'detail.notFoundBody': 'Задания {id} нет в списке этой сессии. Возможно, оно завершилось до очистки вывода или хост перезапускался.',
      'detail.showAll': 'Показать все задания',
      'detail.id': 'Идентификатор',
      'detail.kind': 'Тип',
      'detail.status': 'Статус',
      'detail.duration': 'Длительность',
      'detail.started': 'Начато',
      'detail.finished': 'Завершено',
      'detail.exitCode': 'Код выхода',
      'detail.detail': 'Детали',
      'detail.progress': 'Прогресс',
      'detail.command': 'Команда',
      'detail.copyCommand': 'Копировать команду',
      'detail.copyOutput': 'Копировать вывод',
      'detail.copyId': 'Копировать идентификатор',
      'detail.copied': 'Скопировано',
      'detail.copyFailed': 'Не удалось скопировать',
      'detail.retention': 'Ранний вывод больше не хранится на хосте.',
      'status.running': 'Выполняется',
      'status.stopping': 'Останавливается',
      'status.completed': 'Завершено',
      'status.killed': 'Остановлено',
      'status.failed': 'Ошибка',
      'status.unknown': 'Неизвестно',
      'kill.stop': 'Остановить',
      'kill.confirm': 'Подтвердить остановку',
      'kill.pending': 'Останавливается…',
      'kill.failed': 'Не удалось остановить',
      'kill.aria': 'Остановить задание {label}',
      'kill.confirmAria': 'Подтвердить остановку задания {label}',
      'kill.hint': 'Нажмите ещё раз в течение 3 секунд, чтобы остановить задание.',
      'output.title': 'Вывод',
      'output.empty': 'Вывод не сохранился.',
      'output.waiting': 'Ожидание вывода…',
      'output.gap': 'Часть раннего вывода потеряна во время трансляции.',
      'output.error': 'Поток живого вывода завершился ошибкой: {error}',
      'output.jump': 'К последним строкам',
      'output.aria': 'Вывод задания {id}',
      'output.lines': 'Строк: {count}',
      'output.bytes': 'Байт: {count}',
      'duration.seconds': '{seconds} с',
      'duration.minutes': '{minutes} мин {seconds} с',
      'duration.hours': '{hours} ч {minutes} мин',
      'card.readJob': 'Чтение вывода задания',
      'card.listJobs': 'Список фоновых заданий',
      'card.killJob': 'Остановка фонового задания',
      'card.openJob': 'Открыть задание {id} на вкладке «Задание»',
      'card.argument': 'Идентификатор задания',
      'card.inspect': 'Просмотр',
      'card.noResult': 'Результата пока нет.',
      'card.waiting': 'Ожидание результата инструмента…',
      'card.openFailed': 'Откройте вкладку «Задание» и выберите это задание.',
      'card.jobs': 'Заданий: {count}',
      'card.noJobs': 'Фоновых заданий нет.',
      'card.truncated': 'Результат в карточке сокращён. Полный вывод — на вкладке «Задание».',
      'card.raw': 'Записанный результат',
      'hostRestart': 'Если хост перезапускался, фоновые задания и их вывод могли стать недоступны.',
      'common.copy': 'Копировать',
    }

    // ── Cross-mount focus memory ────────────────────────────────────────────

    /** Last job focused per session, shared by tool cards and the view. */
    const focusBySession = new Map()
    /** Live view listeners for focus changes while the Job tab is mounted. */
    const focusListeners = new Set()
    /** The shell's openView callback, captured whenever the Job view renders. */
    let shellOpenView = null
    /** Session the captured callback belongs to; keeps a stale view from steering another Session. */
    let shellOpenViewSession = null

    function rememberFocus(sessionId, jobId) {
      if (sessionId === undefined || sessionId === null) return
      const key = String(sessionId)
      if (jobId === undefined || jobId === null || jobId === '') focusBySession.delete(key)
      else focusBySession.set(key, String(jobId))
    }

    function rememberFocusAndNotify(sessionId, jobId) {
      rememberFocus(sessionId, jobId)
      for (const listener of [...focusListeners]) {
        try {
          listener(String(sessionId), jobId === undefined || jobId === null ? null : String(jobId))
        } catch (_error) {
          /* a focus listener must not break navigation */
        }
      }
    }

    // ── Job helpers ─────────────────────────────────────────────────────────

    function jobKey(id) {
      return String(id)
    }

    function isLive(job) {
      return job !== undefined && (job.status === 'running' || job.status === 'stopping')
    }

    function isRunning(job) {
      return job !== undefined && job.status === 'running'
    }

    function isObservable(job) {
      return job !== undefined && (isLive(job) || (job.output !== undefined && job.output.total > 0))
    }

    function statusLabel(status, t) {
      switch (status) {
        case 'running': return t('status.running')
        case 'stopping': return t('status.stopping')
        case 'completed': return t('status.completed')
        case 'killed': return t('status.killed')
        case 'failed': return t('status.failed')
        default: return t('status.unknown')
      }
    }

    function formatDuration(ms, t) {
      const total = Math.max(0, Math.floor(ms / 1000))
      const seconds = total % 60
      const minutes = Math.floor(total / 60) % 60
      const hours = Math.floor(total / 3600)
      if (hours > 0) return t('duration.hours', { hours, minutes })
      if (minutes > 0) return t('duration.minutes', { minutes, seconds })
      return t('duration.seconds', { seconds })
    }

    function jobDuration(job, now) {
      const end = job.finishedAt !== undefined ? job.finishedAt : (isLive(job) ? now : job.startedAt)
      return Math.max(0, end - job.startedAt)
    }

    function formatDateTime(ms) {
      if (typeof ms !== 'number' || !Number.isFinite(ms)) return ''
      try {
        return new Date(ms).toLocaleString()
      } catch (_error) {
        return ''
      }
    }

    function exitCodeOf(detail) {
      if (typeof detail !== 'string') return ''
      const match = /(?:^|;\s*)exit code:\s*(-?\d+)/i.exec(detail)
      return match === null ? '' : match[1]
    }

    function orderedJobs(jobs) {
      return [...jobs].sort((left, right) => {
        const liveLeft = isLive(left)
        const liveRight = isLive(right)
        if (liveLeft !== liveRight) return liveLeft ? -1 : 1
        if (liveLeft) return left.startedAt - right.startedAt
        const leftFinished = left.finishedAt !== undefined ? left.finishedAt : left.startedAt
        const rightFinished = right.finishedAt !== undefined ? right.finishedAt : right.startedAt
        const finished = rightFinished - leftFinished
        return finished !== 0 ? finished : left.startedAt - right.startedAt
      })
    }

    function flattenResult(block) {
      if (block === undefined || block === null) return ''
      const parts = []
      if (Array.isArray(block.content)) {
        for (const part of block.content) {
          if (part !== null && typeof part === 'object' && part.type === 'text' && typeof part.text === 'string') parts.push(part.text)
          else parts.push(JSON.stringify(part, null, 2))
        }
      }
      if (parts.length === 0 && block.error !== undefined && block.error !== null) {
        const name = typeof block.error.name === 'string' ? block.error.name : 'Error'
        const code = typeof block.error.code === 'string' ? block.error.code : ''
        parts.push(code === '' ? name : name + ': ' + code)
      }
      return parts.join('\n')
    }

    function safeArg(block, key) {
      try {
        if (block === undefined || block === null || block.args === undefined || block.args === null) return undefined
        return block.args[key]
      } catch (_error) {
        return undefined
      }
    }

    function stringArg(block, key) {
      const value = safeArg(block, key)
      return typeof value === 'string' ? value : ''
    }

    function jobIdFromBlock(block) {
      return stringArg(block, 'job_id')
    }

    function parseJobOutput(text) {
      const match = /(?:^|\n)\[status: ([^,\]\n]+)(?:,\s*([^\]\n]+))?\]$/u.exec(text)
      if (match === null || match[1] === undefined) return { output: text, status: '', detail: '' }
      return {
        output: text.slice(0, match.index),
        status: match[1].trim(),
        detail: match[2] === undefined ? '' : match[2].trim(),
      }
    }

    /** Strip terminal control sequences so the output reads as plain text in a pre block. */
    function cleanOutput(text) {
      if (typeof text !== 'string' || text === '') return ''
      return text
        .replace(/\u001b\][^\u0007]*(?:\u0007|\u001b\\)/gu, '')
        .replace(/\u001b\[[0-?]*[ -/]*[@-~]/gu, '')
        .replace(/\u001b[@-_]/gu, '')
    }

    function parseJobList(text) {
      if (text === '(no background jobs)') return []
      const items = []
      for (const line of text.split('\n')) {
        const match = /^(\S+) \[([^\]]+)\] (\S+) — (.*)$/u.exec(line)
        if (match === null || match[1] === undefined || match[2] === undefined || match[3] === undefined) continue
        items.push({ id: match[1], kind: match[2], status: match[3], label: match[4] === undefined ? '' : match[4] })
      }
      return items
    }

    function uniqueIds(ids) {
      return [...new Set(ids.filter((id) => typeof id === 'string' && id !== ''))]
    }

    function classNames(...values) {
      return values.filter(Boolean).join(' ')
    }

    // ── Clipboard ───────────────────────────────────────────────────────────

    async function copyText(text) {
      const value = String(text === undefined || text === null ? '' : text)
      if (value === '') return false
      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard !== undefined && typeof navigator.clipboard.writeText === 'function') {
          await navigator.clipboard.writeText(value)
          return true
        }
      } catch (_error) {
        /* fall through to the selection fallback */
      }
      try {
        const area = document.createElement('textarea')
        area.value = value
        area.setAttribute('readonly', '')
        area.style.position = 'fixed'
        area.style.top = '-1000px'
        area.style.opacity = '0'
        document.body.appendChild(area)
        area.select()
        const ok = document.execCommand('copy')
        area.remove()
        return ok
      } catch (_error) {
        return false
      }
    }

    function useCopyFeedback() {
      const [copied, setCopied] = useState('')
      const timer = useRef(null)
      const copy = useCallback(async (key, text) => {
        const ok = await copyText(text)
        if (!ok) return false
        setCopied(key)
        if (timer.current !== null) clearTimeout(timer.current)
        timer.current = setTimeout(() => {
          timer.current = null
          setCopied('')
        }, 1600)
        return true
      }, [])
      useEffect(() => () => {
        if (timer.current !== null) clearTimeout(timer.current)
      }, [])
      return [copied, copy]
    }

    function useNow(active) {
      const [now, setNow] = useState(() => Date.now())
      useEffect(() => {
        if (!active) return undefined
        setNow(Date.now())
        const timer = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(timer)
      }, [active])
      return now
    }

    // ── Opening the Job view ────────────────────────────────────────────────

    /**
     * Find the live Conversation store instance for one Session. The shell
     * registers a `conversation.session` slot with the per-session store handle;
     * the registry caches one instance per handle and scope key. Reading that
     * cached instance lets a tool card call the same `openView` action the shell
     * uses, so its focus request reaches the active View unchanged.
     */
    function findConversationStore(ctx, sessionId) {
      try {
        const slots = ctx.slots
        if (slots === undefined || slots === null || typeof slots.entries !== 'function') return undefined
        const stores = slots._stores
        if (stores === undefined || stores === null || typeof stores.get !== 'function') return undefined
        const entries = slots.entries('conversation.session')
        if (entries === undefined || entries === null) return undefined
        for (const entry of entries) {
          const handle = entry !== null && entry !== undefined ? entry.store : undefined
          if (handle === undefined || handle === null || typeof handle !== 'object' || typeof handle.create !== 'function') continue
          const record = stores.get(handle)
          if (record === undefined || record === null || record.instances === undefined || record.instances === null) continue
          const instance = record.instances.get(sessionId)
          if (instance !== undefined && instance !== null && instance.actions !== undefined && typeof instance.actions.openView === 'function') return instance
        }
      } catch (_error) {
        /* private registry access is a best-effort path */
      }
      return undefined
    }

    function currentViewLabel(ctx) {
      try {
        return ctx.locale.bind(NS)('view.job')
      } catch (_error) {
        return 'Job'
      }
    }

    function findViewTab(label) {
      try {
        const tabs = document.querySelectorAll('[role="tab"]')
        for (const tab of tabs) {
          if ((tab.textContent || '').trim() === label) return tab
        }
      } catch (_error) {
        /* DOM access is a fallback only */
      }
      return undefined
    }

    function openViaMoreMenu(label) {
      try {
        const tablist = document.querySelector('[role="tablist"]')
        const scope = tablist !== null && tablist.parentElement !== null ? tablist.parentElement : document
        const buttons = Array.from(scope.querySelectorAll('button[aria-haspopup="menu"]'))
        const more = buttons.find((button) => /more|ещ[её]|друг/iu.test(button.getAttribute('aria-label') || '')) || buttons[0]
        if (more === undefined || more === null) return false
        more.click()
        setTimeout(() => {
          try {
            const rows = Array.from(document.querySelectorAll('[role="menuitem"], button'))
            const item = rows.find((row) => (row.textContent || '').trim() === label && !more.contains(row))
            if (item !== undefined) item.click()
            else more.click()
          } catch (_error) {
            /* the menu may already be closed; leaving it closed is fine */
          }
        }, 30)
        return true
      } catch (_error) {
        return false
      }
    }

    /**
     * Select one job in the Job tab. Three paths, best first:
     * 1. the live per-session Conversation store action (the shell's own
     *    openView implementation, read through its cached store instance);
     * 2. the shell's openView callback captured from an earlier Job render;
     * 3. a tab-button click after recording the pending focus.
     * @returns whether a navigation path was started.
     */
    function openJobView(ctx, sessionId, jobId) {
      if (sessionId === undefined || sessionId === null || jobId === undefined || jobId === null || jobId === '') return false
      const id = String(jobId)
      rememberFocusAndNotify(sessionId, id)
      const store = findConversationStore(ctx, sessionId)
      if (store !== undefined) {
        try {
          store.actions.openView(VIEW_ID, id)
          try {
            ctx.uiConversation.binding(sessionId).activate(VIEW_ID)
          } catch (_error) {
            /* activation is an assembly detail; the view still renders */
          }
          return true
        } catch (_error) {
          /* fall through to the captured shell callback */
        }
      }
      if (typeof shellOpenView === 'function' && shellOpenViewSession === String(sessionId)) {
        try {
          shellOpenView(VIEW_ID, id)
          return true
        } catch (_error) {
          /* fall through to the tab button */
        }
      }
      const label = currentViewLabel(ctx)
      const tab = findViewTab(label)
      if (tab !== undefined) {
        tab.click()
        return true
      }
      return openViaMoreMenu(label)
    }

    // ── View: job list and detail ───────────────────────────────────────────

    function JobListPane(props) {
      const { rows, filtered, query, onQueryChange, selectedId, onSelect, now, loading, t } = props
      const running = filtered.filter(isLive)
      const settled = filtered.filter((job) => !isLive(job))
      const hasRows = rows.length > 0
      const hasFiltered = filtered.length > 0

      const row = (job) => {
        const selected = selectedId === jobKey(job.id)
        return h('button', {
          type: 'button',
          key: jobKey(job.id),
          className: classNames('dshJobLog_row', selected && 'dshJobLog_rowSelected'),
          'aria-current': selected ? 'true' : undefined,
          'aria-label': t('list.open', { label: job.label || jobKey(job.id) }),
          title: job.label,
          onClick: () => onSelect(jobKey(job.id)),
        },
          h('span', {
            className: 'dshJobLog_rowDot dshJobLog_statusColor',
            'data-status': job.status,
            'aria-hidden': 'true',
          }),
          h('span', { className: 'dshJobLog_rowMain' },
            h('span', { className: 'dshJobLog_rowLabel' }, job.label || jobKey(job.id)),
            h('span', { className: 'dshJobLog_rowMeta' },
              h('span', { className: 'dshJobLog_rowKind' }, job.kind),
              h('span', {
                className: 'dshJobLog_rowStatus dshJobLog_statusColor',
                'data-status': job.status,
              }, statusLabel(job.status, t)),
              h('span', { className: 'dshJobLog_rowDuration' }, formatDuration(jobDuration(job, now), t))
            )
          )
        )
      }

      return h('aside', { className: 'dshJobLog_listPane', 'aria-label': t('list.title') },
        h('div', { className: 'dshJobLog_searchRow' },
          h('input', {
            type: 'search',
            className: 'dshJobLog_search',
            value: query,
            placeholder: t('list.search'),
            'aria-label': t('list.searchAria'),
            onChange: (event) => onQueryChange(event.target.value),
          })
        ),
        h('div', { className: 'dshJobLog_listScroll' },
          !hasRows
            ? h('div', { className: 'dshJobLog_listEmpty' },
                h('div', { className: 'dshJobLog_listEmptyTitle' }, loading ? t('list.loading') : t('list.empty')),
                loading ? null : h('div', { className: 'dshJobLog_listEmptyHint' }, t('list.emptyHint'))
              )
            : !hasFiltered
              ? h('div', { className: 'dshJobLog_listEmpty' },
                  h('div', { className: 'dshJobLog_listEmptyHint' }, t('list.noMatches', { query }))
                )
              : h(React.Fragment, null,
                  running.length > 0
                    ? h(React.Fragment, null,
                        h('div', { className: 'dshJobLog_sectionLabel' }, t('list.running')),
                        running.map(row)
                      )
                    : null,
                  settled.length > 0
                    ? h(React.Fragment, null,
                        h('div', { className: 'dshJobLog_sectionLabel' }, t('list.settled')),
                        settled.map(row)
                      )
                    : null
                )
        )
      )
    }

    function JobOutput(props) {
      const { job, view, t, copied, onCopy } = props
      const outputRef = useRef(null)
      const [autoScroll, setAutoScroll] = useState(true)
      const [hasNew, setHasNew] = useState(false)
      const rawText = view !== undefined && view !== null && typeof view.text === 'string' ? view.text : ''
      const text = useMemo(() => cleanOutput(rawText), [rawText])
      const live = isLive(job)
      const gapBefore = view !== undefined && view !== null && view.gapBefore === true
      const retention = job.output !== undefined && job.output.earliest > 0
      const gapMessage = gapBefore ? t('output.gap') : retention ? t('detail.retention') : ''
      const error = view !== undefined && view !== null && typeof view.error === 'string' && view.error !== '' ? view.error : ''
      const hasText = text !== ''
      const lineCount = hasText ? text.split('\n').length : 0

      useEffect(() => {
        setAutoScroll(true)
        setHasNew(false)
      }, [job.id])

      useEffect(() => {
        const element = outputRef.current
        if (element === null) return
        if (autoScroll) {
          element.scrollTop = element.scrollHeight
          setHasNew(false)
        } else if (hasText) {
          setHasNew(true)
        }
      }, [text, autoScroll, hasText])

      const onScroll = () => {
        const element = outputRef.current
        if (element === null) return
        const atBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 28
        if (atBottom !== autoScroll) setAutoScroll(atBottom)
        if (atBottom) setHasNew(false)
      }

      const jump = () => {
        const element = outputRef.current
        if (element !== null) element.scrollTop = element.scrollHeight
        setAutoScroll(true)
        setHasNew(false)
      }

      return h('section', { className: 'dshJobLog_output' },
        h('div', { className: 'dshJobLog_outputHead' },
          h('span', { className: 'dshJobLog_outputTitle' }, t('output.title')),
          h('span', { className: 'dshJobLog_outputMeta' },
            hasText ? t('output.lines', { count: lineCount }) : null,
            job.output !== undefined && job.output.total > 0 ? h('span', { className: 'dshJobLog_outputBytes' }, t('output.bytes', { count: job.output.total })) : null
          ),
          h('span', { className: 'dshJobLog_outputActions' },
            !autoScroll && hasNew
              ? h('button', {
                  type: 'button',
                  className: 'dshJobLog_button',
                  onClick: jump,
                }, t('output.jump'))
              : null,
            h('button', {
              type: 'button',
              className: 'dshJobLog_button',
              disabled: !hasText,
              onClick: () => onCopy('output', text),
              'aria-label': t('detail.copyOutput'),
              title: t('detail.copyOutput'),
            }, copied === 'output' ? t('detail.copied') : t('common.copy'))
          )
        ),
        gapMessage !== ''
          ? h('div', { className: 'dshJobLog_notice dshJobLog_noticeWarn' }, gapMessage)
          : null,
        error !== ''
          ? h('div', { className: 'dshJobLog_notice dshJobLog_noticeError' }, t('output.error', { error }))
          : null,
        hasText
          ? h('pre', {
              ref: outputRef,
              className: 'dshJobLog_outputPre',
              tabIndex: 0,
              role: 'log',
              'aria-live': 'off',
              'aria-label': t('output.aria', { id: job.id }),
              onScroll,
            }, text)
          : h('div', { className: 'dshJobLog_outputPlaceholder', 'data-live': live ? 'true' : undefined },
              live ? t('output.waiting') : t('output.empty')
            )
      )
    }

    function JobDetail(props) {
      const { job, view, now, killState, onKill, t } = props
      const [copied, copy] = useCopyFeedback()
      const running = isRunning(job)
      const exitCode = exitCodeOf(job.detail)
      const command = job.label || jobKey(job.id)
      const duration = formatDuration(jobDuration(job, now), t)
      const killLabel = killState === 'armed' ? t('kill.confirm') : killState === 'pending' ? t('kill.pending') : killState === 'failed' ? t('kill.failed') : t('kill.stop')
      const killAria = killState === 'armed' ? t('kill.confirmAria', { label: command }) : t('kill.aria', { label: command })

      const meta = (label, value, key) => value === '' || value === undefined || value === null
        ? null
        : h('div', { className: 'dshJobLog_metaItem', key },
            h('span', { className: 'dshJobLog_metaLabel' }, label),
            h('span', { className: 'dshJobLog_metaValue' }, value)
          )

      return h('section', { className: 'dshJobLog_detail', 'aria-label': job.id },
        h('div', { className: 'dshJobLog_detailHead' },
          h('div', { className: 'dshJobLog_detailTitleRow' },
            h('h3', { className: 'dshJobLog_detailTitle', title: command }, command),
            h('span', {
              className: 'dshJobLog_statusBadge dshJobLog_statusColor',
              'data-status': job.status,
            },
              h('span', { className: 'dshJobLog_statusDot', 'data-status': job.status, 'aria-hidden': 'true' }),
              statusLabel(job.status, t)
            ),
            running
              ? h('button', {
                  type: 'button',
                  className: classNames('dshJobLog_kill', killState === 'armed' && 'dshJobLog_killArmed', killState === 'failed' && 'dshJobLog_killFailed'),
                  'data-kill-state': killState,
                  disabled: killState === 'pending',
                  'aria-label': killAria,
                  title: killAria,
                  onClick: onKill,
                }, killLabel)
              : null
          ),
          h('div', { className: 'dshJobLog_detailChips' },
            h('button', {
              type: 'button',
              className: 'dshJobLog_idChip',
              onClick: () => copy('id', jobKey(job.id)),
              'aria-label': t('detail.copyId'),
              title: t('detail.copyId'),
            }, copied === 'id' ? jobKey(job.id) + ' ✓' : jobKey(job.id)),
            h('span', { className: 'dshJobLog_chip' }, job.kind),
            h('span', { className: 'dshJobLog_chip' }, duration)
          ),
          killState === 'armed'
            ? h('div', { className: 'dshJobLog_killHint', role: 'status' }, t('kill.hint'))
            : null
        ),
        h('div', { className: 'dshJobLog_detailBody' },
          h('div', { className: 'dshJobLog_metaGrid' },
            meta(t('detail.status'), statusLabel(job.status, t), 'status'),
            meta(t('detail.kind'), job.kind, 'kind'),
            meta(t('detail.duration'), duration, 'duration'),
            meta(t('detail.started'), formatDateTime(job.startedAt), 'started'),
            meta(t('detail.finished'), job.finishedAt !== undefined ? formatDateTime(job.finishedAt) : '', 'finished'),
            meta(t('detail.exitCode'), exitCode, 'exitCode'),
            meta(t('detail.progress'), job.progress, 'progress'),
            meta(t('detail.detail'), job.detail, 'detail')
          ),
          h('div', { className: 'dshJobLog_commandBlock' },
            h('div', { className: 'dshJobLog_commandHead' },
              h('span', { className: 'dshJobLog_commandLabel' }, t('detail.command')),
              h('button', {
                type: 'button',
                className: 'dshJobLog_button',
                onClick: () => copy('command', command),
                'aria-label': t('detail.copyCommand'),
                title: t('detail.copyCommand'),
              }, copied === 'command' ? t('detail.copied') : t('common.copy'))
            ),
            h('pre', { className: 'dshJobLog_commandPre' }, command)
          ),
          h(JobOutput, {
            job,
            view,
            t,
            copied,
            onCopy: copy,
          }),
          h('span', { className: 'dshJobLog_visualHidden', role: 'status' }, copied !== '' ? t('detail.copied') : '')
        )
      )
    }

    function JobEmpty(props) {
      const { selectedId, onShowAll, loading, t } = props
      if (loading === true) {
        return h('section', { className: 'dshJobLog_empty' },
          h('h3', { className: 'dshJobLog_emptyTitle' }, t('detail.loadingTitle')),
          h('p', { className: 'dshJobLog_emptyBody' }, t('detail.loadingBody'))
        )
      }
      const notFound = selectedId !== null && selectedId !== undefined && selectedId !== ''
      return h('section', { className: 'dshJobLog_empty' },
        h('h3', { className: 'dshJobLog_emptyTitle' }, notFound ? t('detail.notFoundTitle') : t('detail.emptyTitle')),
        h('p', { className: 'dshJobLog_emptyBody' }, notFound ? t('detail.notFoundBody', { id: selectedId }) : t('detail.emptyBody')),
        h('p', { className: 'dshJobLog_emptyHint' }, t('hostRestart')),
        notFound
          ? h('button', {
              type: 'button',
              className: 'dshJobLog_button dshJobLog_buttonPrimary',
              onClick: onShowAll,
            }, t('detail.showAll'))
          : null
      )
    }

    function JobLogView(props) {
      const {
        sessionId,
        viewRequest,
        completeViewRequest,
        openView,
        useJobs,
        watchRows,
        observe,
        killJob,
        t,
      } = props

      const rowsRaw = useJobs((state) => (sessionId === undefined ? undefined : state.rows[sessionId]))
      const rows = rowsRaw === undefined || rowsRaw === null ? EMPTY : rowsRaw
      const observed = useJobs((state) => state.observed)
      const [selectedId, setSelectedId] = useState(() => (sessionId === undefined ? null : focusBySession.get(sessionId) || null))
      const [query, setQuery] = useState('')
      const [kill, setKill] = useState(null)
      const [rosterReady, setRosterReady] = useState(rowsRaw !== undefined)
      const now = useNow(rows.some(isLive))

      useEffect(() => {
        if (rowsRaw !== undefined) {
          setRosterReady(true)
          return undefined
        }
        if (rosterReady) return undefined
        const timer = setTimeout(() => setRosterReady(true), 700)
        return () => clearTimeout(timer)
      }, [rowsRaw, rosterReady])

      useEffect(() => {
        if (typeof openView !== 'function') return undefined
        shellOpenView = openView
        shellOpenViewSession = sessionId === undefined ? null : String(sessionId)
        return undefined
      }, [openView, sessionId])

      useEffect(() => {
        if (sessionId === undefined) return undefined
        try {
          return watchRows(sessionId)
        } catch (_error) {
          return undefined
        }
      }, [sessionId, watchRows])

      useEffect(() => {
        if (sessionId === undefined) return undefined
        const listener = (id, jobId) => {
          if (id !== String(sessionId)) return
          setSelectedId(jobId)
          setKill(null)
        }
        focusListeners.add(listener)
        return () => focusListeners.delete(listener)
      }, [sessionId])

      useEffect(() => {
        if (viewRequest === null || viewRequest === undefined || viewRequest.view !== VIEW_ID) return
        const focus = typeof viewRequest.focus === 'string' ? viewRequest.focus : ''
        if (focus !== '') {
          rememberFocus(sessionId, focus)
          setSelectedId(focus)
          setKill(null)
        }
        if (typeof completeViewRequest === 'function') completeViewRequest()
      }, [viewRequest, completeViewRequest, sessionId])

      useEffect(() => {
        if (selectedId !== null && selectedId !== '') return
        if (rows.length === 0) return
        const first = rows.find(isLive) || rows[0]
        if (first === undefined) return
        const id = jobKey(first.id)
        rememberFocus(sessionId, id)
        setSelectedId(id)
      }, [rows, selectedId, sessionId])

      const selectedJob = useMemo(
        () => rows.find((job) => jobKey(job.id) === selectedId),
        [rows, selectedId]
      )
      const selectedView = selectedJob !== undefined && selectedId !== null ? observed[selectedId] : undefined
      const observable = selectedJob !== undefined && isObservable(selectedJob)

      useEffect(() => {
        if (sessionId === undefined || selectedId === null || selectedId === '' || !observable) return undefined
        try {
          return observe(sessionId, selectedId)
        } catch (_error) {
          return undefined
        }
      }, [sessionId, selectedId, observable, observe])

      useEffect(() => {
        if (kill === null || kill.phase === 'pending') return undefined
        const timer = setTimeout(() => setKill(null), kill.phase === 'armed' ? KILL_ARM_MS : KILL_FAILED_MS)
        return () => clearTimeout(timer)
      }, [kill])

      useEffect(() => {
        if (kill === null) return
        if (selectedJob === undefined || !isLive(selectedJob) || jobKey(selectedJob.id) !== kill.id) setKill(null)
      }, [selectedJob, kill])

      const filtered = useMemo(() => {
        const ordered = orderedJobs(rows)
        const normalized = query.trim().toLowerCase()
        if (normalized === '') return ordered
        return ordered.filter((job) => {
          const haystack = [
            jobKey(job.id),
            job.label,
            job.kind,
            job.status,
            job.progress || '',
            job.detail || '',
          ].join(' ').toLowerCase()
          return haystack.includes(normalized)
        })
      }, [rows, query])

      const selectJob = useCallback((id) => {
        const key = id === null || id === undefined ? null : String(id)
        rememberFocus(sessionId, key)
        setSelectedId(key)
        setKill(null)
      }, [sessionId])

      const showAll = useCallback(() => {
        rememberFocus(sessionId, null)
        setSelectedId(null)
        setQuery('')
        setKill(null)
      }, [sessionId])

      const pressKill = useCallback(() => {
        if (selectedJob === undefined || !isRunning(selectedJob) || sessionId === undefined) return
        const id = jobKey(selectedJob.id)
        if (kill === null || kill.id !== id || kill.phase !== 'armed') {
          setKill({ id, phase: 'armed' })
          return
        }
        setKill({ id, phase: 'pending' })
        Promise.resolve()
          .then(() => killJob(sessionId, id))
          .then((ok) => {
            setKill((current) => (current !== null && current.id === id && !ok ? { id, phase: 'failed' } : current))
          })
          .catch(() => {
            setKill((current) => (current !== null && current.id === id ? { id, phase: 'failed' } : current))
          })
      }, [selectedJob, sessionId, kill, killJob])

      const killState = kill !== null && selectedJob !== undefined && jobKey(selectedJob.id) === kill.id ? kill.phase : 'idle'

      return h('div', { className: 'dshJobLog_root', 'data-session': sessionId === undefined ? '' : String(sessionId) },
        h('div', { className: 'dshJobLog_pageHead' },
          h('div', { className: 'dshJobLog_pageHeadText' },
            h('h2', { className: 'dshJobLog_pageTitle' }, t('page.title')),
            h('p', { className: 'dshJobLog_pageSubtitle' }, t('page.subtitle'))
          ),
          h('div', { className: 'dshJobLog_pageMeta' },
            h('span', null, t('list.count', { count: rows.length })),
            rows.some(isLive) ? h('span', { className: 'dshJobLog_pageMetaLive' }, t('list.liveCount', { count: rows.filter(isLive).length })) : null
          )
        ),
        h('div', { className: 'dshJobLog_grid' },
          h(JobListPane, {
            rows,
            filtered,
            query,
            onQueryChange: setQuery,
            selectedId,
            onSelect: selectJob,
            now,
            loading: !rosterReady,
            t,
          }),
          selectedJob !== undefined
            ? h(JobDetail, {
                job: selectedJob,
                view: selectedView,
                now,
                killState,
                onKill: pressKill,
                t,
              })
            : h(JobEmpty, {
                selectedId,
                onShowAll: showAll,
                loading: !rosterReady,
                t,
              })
        )
      )
    }

    // ── Tool cards: clickable job ids ───────────────────────────────────────

    function Chevron(props) {
      return h('svg', {
        width: 10,
        height: 10,
        viewBox: '0 0 16 16',
        'aria-hidden': 'true',
        className: classNames('dshJobLog_chevron', props.open && 'dshJobLog_chevronOpen'),
      },
        h('path', {
          d: 'M6 3.5 10.5 8 6 12.5',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.7,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        })
      )
    }

    function JobIdChip(props) {
      return h('button', {
        type: 'button',
        className: 'dshJobLog_idChip',
        'aria-label': props.t('card.openJob', { id: props.id }),
        title: props.t('card.openJob', { id: props.id }),
        onClick: (event) => {
          event.preventDefault()
          event.stopPropagation()
          props.onOpen(props.id)
        },
      }, props.id)
    }

    function JobToolCard(props) {
      const {
        t,
        sessionId,
        toolName,
        phase,
        block,
        inspect,
        useDisclosure,
        openJob,
      } = props
      const disclosure = useDisclosure()
      const [openFailed, setOpenFailed] = useState(false)

      const resultText = phase === 'result' ? flattenResult(block) : ''
      const jobId = jobIdFromBlock(block)
      const parsedOutput = useMemo(() => parseJobOutput(resultText), [resultText])
      const parsedList = useMemo(() => (toolName === 'job_list' ? parseJobList(resultText) : EMPTY), [toolName, resultText])
      const headerIds = useMemo(() => {
        if (toolName === 'job_list') return uniqueIds(parsedList.map((item) => item.id)).slice(0, 3)
        return uniqueIds([jobId])
      }, [toolName, parsedList, jobId])
      const status = toolName === 'job_output' ? parsedOutput.status : ''
      const wait = safeArg(block, 'wait')
      const timeout = safeArg(block, 'timeout_ms')
      const reason = safeArg(block, 'reason')
      const title = t(toolName === 'job_list' ? 'card.listJobs' : toolName === 'job_kill' ? 'card.killJob' : 'card.readJob')
      const open = (id) => {
        let ok = false
        try {
          ok = typeof openJob === 'function' ? openJob(sessionId, id) === true : false
        } catch (_error) {
          ok = false
        }
        setOpenFailed(!ok)
      }

      const argChips = []
      if (jobId !== '') {
        argChips.push(h('span', { key: 'job', className: 'dshJobLog_cardArg' },
          h('span', { className: 'dshJobLog_cardArgLabel' }, t('card.argument')),
          h(JobIdChip, { id: jobId, onOpen: open, t })
        ))
      }
      if (argsField(wait) !== '') argChips.push(h('span', { key: 'wait', className: 'dshJobLog_cardArg' }, 'wait=' + argsField(wait)))
      if (argsField(timeout) !== '') argChips.push(h('span', { key: 'timeout', className: 'dshJobLog_cardArg' }, 'timeout_ms=' + argsField(timeout)))
      if (argsField(reason) !== '') argChips.push(h('span', { key: 'reason', className: 'dshJobLog_cardArg' }, 'reason=' + argsField(reason)))

      const body = []
      if (argChips.length > 0) body.push(h('div', { className: 'dshJobLog_cardArgs', key: 'args' }, argChips))

      if (toolName === 'job_list') {
        if (parsedList.length > 0) {
          body.push(h('div', { className: 'dshJobLog_cardList', key: 'list' },
            h('div', { className: 'dshJobLog_cardNote' }, t('card.jobs', { count: parsedList.length })),
            parsedList.map((item) => h('div', { className: 'dshJobLog_cardListItem', key: item.id },
              h(JobIdChip, { id: item.id, onOpen: open, t }),
              h('span', { className: 'dshJobLog_cardListKind' }, '[' + item.kind + ']'),
              h('span', {
                className: 'dshJobLog_statusBadge dshJobLog_statusColor',
                'data-status': item.status,
              }, statusLabel(item.status, t)),
              h('span', { className: 'dshJobLog_cardListLabel', title: item.label }, item.label)
            ))
          ))
        } else if (resultText === '(no background jobs)') {
          body.push(h('div', { className: 'dshJobLog_cardNote', key: 'none' }, t('card.noJobs')))
        } else if (resultText !== '') {
          body.push(h('pre', { className: 'dshJobLog_cardPre', key: 'raw' }, limitCardText(cleanOutput(resultText))))
        } else {
          body.push(h('div', { className: 'dshJobLog_cardNote', key: 'wait' }, t('card.waiting')))
        }
      } else if (toolName === 'job_output') {
        const displayOutput = cleanOutput(parsedOutput.output)
        if (displayOutput !== '') {
          body.push(h('pre', { className: 'dshJobLog_cardPre', key: 'output' }, limitCardText(displayOutput)))
          if (displayOutput.length > CARD_TEXT_LIMIT) body.push(h('div', { className: 'dshJobLog_cardNote', key: 'truncated' }, t('card.truncated')))
        } else if (phase === 'result') {
          body.push(h('div', { className: 'dshJobLog_cardNote', key: 'empty' }, t('output.empty')))
        } else {
          body.push(h('div', { className: 'dshJobLog_cardNote', key: 'wait' }, t('card.waiting')))
        }
        if (parsedOutput.detail !== '') body.push(h('div', { className: 'dshJobLog_cardNote', key: 'detail' }, parsedOutput.detail))
      } else {
        if (resultText !== '') body.push(h('pre', { className: 'dshJobLog_cardPre', key: 'result' }, limitCardText(cleanOutput(resultText))))
        else if (phase === 'result') body.push(h('div', { className: 'dshJobLog_cardNote', key: 'no-result' }, t('card.noResult')))
        else body.push(h('div', { className: 'dshJobLog_cardNote', key: 'wait' }, t('card.waiting')))
      }

      return h('div', { className: 'dshJobLog_card', 'data-tool': toolName },
        h('div', { className: 'dshJobLog_cardHeader' },
          h('button', {
            type: 'button',
            className: 'dshJobLog_cardDisclosure',
            'aria-expanded': disclosure.expanded,
            onClick: disclosure.toggle,
          },
            h(Chevron, { open: disclosure.expanded }),
            h('span', { className: 'dshJobLog_cardTitle' }, title)
          ),
          headerIds.map((id) => h(JobIdChip, { key: id, id, onOpen: open, t })),
          status !== '' ? h('span', {
            className: 'dshJobLog_statusBadge dshJobLog_statusColor',
            'data-status': status,
          }, statusLabel(status, t)) : null,
          typeof inspect === 'function'
            ? h('button', {
                type: 'button',
                className: 'dshJobLog_cardInspect',
                onClick: inspect,
              }, t('card.inspect'))
            : null
        ),
        openFailed
          ? h('div', { className: 'dshJobLog_cardHint', role: 'status' }, t('card.openFailed'))
          : null,
        disclosure.expanded
          ? h('div', { className: 'dshJobLog_cardBody' }, ...body)
          : null
      )
    }

    function argsField(value) {
      if (typeof value === 'string') return value
      if (typeof value === 'number' || typeof value === 'boolean') return String(value)
      return ''
    }

    function limitCardText(text) {
      if (typeof text !== 'string') return ''
      if (text.length <= CARD_TEXT_LIMIT) return text
      return text.slice(0, CARD_TEXT_LIMIT)
    }

    // ── Styles ──────────────────────────────────────────────────────────────

    const CSS = `
.dshJobLog_root, .dshJobLog_card {
  --dsh-joblog-border: var(--dsw-alias-border-l1);
  --dsh-joblog-border-strong: var(--dsw-alias-border-l2);
  --dsh-joblog-text: var(--dsw-alias-label-primary);
  --dsh-joblog-muted: color-mix(in srgb, var(--dsw-alias-label-secondary) 76%, transparent);
  --dsh-joblog-faint: color-mix(in srgb, var(--dsw-alias-label-secondary) 55%, transparent);
  --dsh-joblog-fill: color-mix(in srgb, var(--dsw-alias-label-primary) 5%, transparent);
  --dsh-joblog-fill-hover: color-mix(in srgb, var(--dsw-alias-label-primary) 9%, transparent);
  --dsh-joblog-code-bg: var(--dsw-alias-bg-base);
  --dsh-joblog-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
}
.dshJobLog_root {
  box-sizing: border-box;
  width: 100%;
  max-width: 1120px;
  min-height: 420px;
  margin: 0 auto;
  padding: 20px 28px 40px;
  color: var(--dsh-joblog-text);
  font-size: 13px;
  line-height: 1.45;
}
.dshJobLog_pageHead {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px 16px;
  margin-bottom: 16px;
}
.dshJobLog_pageHeadText { min-width: 0; }
.dshJobLog_pageTitle {
  margin: 0;
  font-size: 16px;
  line-height: 24px;
  font-weight: 600;
  color: var(--dsh-joblog-text);
}
.dshJobLog_pageSubtitle {
  margin: 2px 0 0;
  font-size: 12px;
  line-height: 18px;
  color: var(--dsh-joblog-muted);
}
.dshJobLog_pageMeta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: none;
  padding-top: 3px;
  color: var(--dsh-joblog-faint);
  font-size: 11px;
  line-height: 16px;
  white-space: nowrap;
}
.dshJobLog_pageMetaLive { color: var(--dsw-alias-state-business-primary); }
.dshJobLog_grid {
  display: grid;
  grid-template-columns: minmax(228px, 300px) minmax(0, 1fr);
  align-items: start;
  gap: 16px;
}
.dshJobLog_listPane,
.dshJobLog_detail,
.dshJobLog_empty {
  box-sizing: border-box;
  border: 0.5px solid var(--dsh-joblog-border);
  border-radius: 10px;
  background: var(--dsw-alias-bg-layer-1);
  min-width: 0;
  overflow: hidden;
}
.dshJobLog_listPane { display: flex; flex-direction: column; }
.dshJobLog_searchRow { padding: 8px; border-bottom: 0.5px solid var(--dsh-joblog-border); }
.dshJobLog_search {
  box-sizing: border-box;
  width: 100%;
  height: 30px;
  padding: 4px 9px;
  border: 0.5px solid var(--dsh-joblog-border-strong);
  border-radius: 6px;
  background: var(--dsh-joblog-code-bg);
  color: var(--dsh-joblog-text);
  font: inherit;
  font-size: 12px;
  outline: none;
}
.dshJobLog_search:focus-visible {
  border-color: var(--dsw-alias-brand-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary) 24%, transparent);
}
.dshJobLog_listScroll {
  max-height: min(56vh, 520px);
  overflow-y: auto;
  padding: 4px;
  scrollbar-gutter: stable;
}
.dshJobLog_sectionLabel {
  padding: 7px 8px 3px;
  color: var(--dsh-joblog-faint);
  font-size: 10px;
  line-height: 14px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.dshJobLog_row {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 36px;
  padding: 5px 8px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--dsh-joblog-text);
  text-align: left;
  cursor: pointer;
  font: inherit;
}
.dshJobLog_row:hover { background: var(--dsh-joblog-fill); }
.dshJobLog_rowSelected {
  background: var(--dsh-joblog-fill);
  box-shadow: inset 2px 0 0 var(--dsw-alias-brand-primary);
}
.dshJobLog_row:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: -2px;
}
.dshJobLog_rowDot {
  flex: none;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}
.dshJobLog_rowMain {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  flex: 1;
}
.dshJobLog_rowLabel {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--dsh-joblog-text);
  font-family: var(--dsh-joblog-mono);
  font-size: 12px;
  line-height: 17px;
}
.dshJobLog_rowMeta {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
  color: var(--dsh-joblog-faint);
  font-size: 10px;
  line-height: 15px;
}
.dshJobLog_rowKind {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 7em;
}
.dshJobLog_rowStatus { flex: none; }
.dshJobLog_rowDuration {
  flex: none;
  margin-left: auto;
  font-variant-numeric: tabular-nums;
}
.dshJobLog_listEmpty { padding: 16px 10px; }
.dshJobLog_listEmptyTitle {
  color: var(--dsh-joblog-muted);
  font-size: 12px;
  line-height: 18px;
  font-weight: 500;
}
.dshJobLog_listEmptyHint {
  margin-top: 2px;
  color: var(--dsh-joblog-faint);
  font-size: 11px;
  line-height: 16px;
}
.dshJobLog_detail { display: flex; flex-direction: column; }
.dshJobLog_detailHead {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px 12px;
  border-bottom: 0.5px solid var(--dsh-joblog-border);
}
.dshJobLog_detailTitleRow {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}
.dshJobLog_detailTitle {
  flex: 1 1 220px;
  min-width: 0;
  margin: 0;
  color: var(--dsh-joblog-text);
  font-family: var(--dsh-joblog-mono);
  font-size: 13px;
  line-height: 19px;
  font-weight: 500;
  overflow-wrap: anywhere;
}
.dshJobLog_detailChips {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}
.dshJobLog_chip,
.dshJobLog_idChip {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  padding: 1px 7px;
  border: 0.5px solid var(--dsh-joblog-border-strong);
  border-radius: 999px;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsh-joblog-muted);
  font-family: var(--dsh-joblog-mono);
  font-size: 11px;
  line-height: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dshJobLog_idChip { cursor: pointer; font: inherit; font-family: var(--dsh-joblog-mono); font-size: 11px; }
.dshJobLog_idChip:hover {
  color: var(--dsh-joblog-text);
  border-color: var(--dsw-alias-brand-primary);
}
.dshJobLog_idChip:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: 2px;
}
.dshJobLog_statusColor[data-status="running"] { color: var(--dsw-alias-state-business-primary); }
.dshJobLog_statusColor[data-status="stopping"] { color: var(--dsw-alias-state-warn-primary); }
.dshJobLog_statusColor[data-status="completed"] { color: var(--dsw-alias-state-success-primary); }
.dshJobLog_statusColor[data-status="killed"] { color: var(--dsw-alias-state-warn-primary); }
.dshJobLog_statusColor[data-status="failed"] { color: var(--dsw-alias-state-error-primary); }
.dshJobLog_statusColor[data-status="unknown"] { color: var(--dsw-alias-state-idle-primary); }
.dshJobLog_statusBadge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex: none;
  font-size: 11px;
  line-height: 16px;
  white-space: nowrap;
}
.dshJobLog_statusDot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.dshJobLog_rowDot[data-status="running"],
.dshJobLog_statusDot[data-status="running"] {
  animation: dshJobLog_pulse 1.4s ease-in-out infinite;
}
@keyframes dshJobLog_pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}
.dshJobLog_kill,
.dshJobLog_button {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 3px 9px;
  border: 0.5px solid var(--dsh-joblog-border-strong);
  border-radius: 6px;
  background: transparent;
  color: var(--dsh-joblog-muted);
  font: inherit;
  font-size: 11px;
  line-height: 16px;
  cursor: pointer;
  white-space: nowrap;
}
.dshJobLog_kill:hover,
.dshJobLog_button:hover {
  background: var(--dsh-joblog-fill);
  color: var(--dsh-joblog-text);
}
.dshJobLog_button:disabled {
  opacity: 0.5;
  cursor: default;
}
.dshJobLog_button:focus-visible,
.dshJobLog_kill:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: 2px;
}
.dshJobLog_buttonPrimary {
  color: var(--dsh-joblog-text);
  border-color: var(--dsw-alias-brand-primary);
}
.dshJobLog_kill {
  flex: none;
  color: var(--dsw-alias-state-error-primary);
  border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 42%, transparent);
}
.dshJobLog_kill:hover {
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 10%, transparent);
  color: var(--dsw-alias-state-error-primary);
}
.dshJobLog_killArmed {
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 13%, transparent);
  color: var(--dsw-alias-state-error-primary);
}
.dshJobLog_killFailed {
  border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 42%, transparent);
  color: var(--dsw-alias-state-error-primary);
}
.dshJobLog_killHint {
  color: var(--dsw-alias-state-warn-primary);
  font-size: 11px;
  line-height: 16px;
}
.dshJobLog_detailBody {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px 16px 18px;
  min-width: 0;
}
.dshJobLog_metaGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
  gap: 8px 16px;
}
.dshJobLog_metaItem { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.dshJobLog_metaLabel {
  color: var(--dsh-joblog-faint);
  font-size: 10px;
  line-height: 14px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.dshJobLog_metaValue {
  color: var(--dsh-joblog-muted);
  font-size: 12px;
  line-height: 17px;
  overflow-wrap: anywhere;
}
.dshJobLog_commandBlock,
.dshJobLog_output {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.dshJobLog_commandHead,
.dshJobLog_outputHead {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}
.dshJobLog_commandLabel,
.dshJobLog_outputTitle {
  color: var(--dsh-joblog-muted);
  font-size: 11px;
  line-height: 16px;
  font-weight: 600;
}
.dshJobLog_commandHead .dshJobLog_button,
.dshJobLog_outputActions .dshJobLog_button { margin-left: auto; }
.dshJobLog_outputActions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
}
.dshJobLog_commandPre,
.dshJobLog_outputPre {
  box-sizing: border-box;
  margin: 0;
  padding: 10px 12px;
  border: 0.5px solid var(--dsh-joblog-border);
  border-radius: 8px;
  background: var(--dsh-joblog-code-bg);
  color: var(--dsh-joblog-text);
  font-family: var(--dsh-joblog-mono);
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
  tab-size: 4;
  overflow: auto;
  scrollbar-gutter: stable;
}
.dshJobLog_commandPre { max-height: 120px; }
.dshJobLog_outputPre {
  min-height: 120px;
  max-height: min(48vh, 480px);
  outline: none;
}
.dshJobLog_outputPre:focus-visible {
  border-color: var(--dsw-alias-brand-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary) 24%, transparent);
}
.dshJobLog_outputMeta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--dsh-joblog-faint);
  font-size: 10px;
  line-height: 15px;
}
.dshJobLog_outputPlaceholder {
  box-sizing: border-box;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px 12px;
  border: 0.5px dashed var(--dsh-joblog-border);
  border-radius: 8px;
  color: var(--dsh-joblog-faint);
  font-size: 12px;
  line-height: 18px;
}
.dshJobLog_outputPlaceholder[data-live="true"] { color: var(--dsw-alias-state-business-primary); }
.dshJobLog_notice {
  padding: 6px 10px;
  border-left: 2px solid var(--dsh-joblog-border-strong);
  border-radius: 4px;
  background: var(--dsh-joblog-fill);
  color: var(--dsh-joblog-muted);
  font-size: 11px;
  line-height: 16px;
}
.dshJobLog_noticeWarn {
  border-left-color: var(--dsw-alias-state-warn-primary);
  color: var(--dsw-alias-state-warn-primary);
}
.dshJobLog_noticeError {
  border-left-color: var(--dsw-alias-state-error-primary);
  color: var(--dsw-alias-state-error-primary);
}
.dshJobLog_empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: 32px 24px;
  text-align: center;
}
.dshJobLog_emptyTitle {
  margin: 0;
  color: var(--dsh-joblog-text);
  font-size: 14px;
  line-height: 20px;
  font-weight: 600;
}
.dshJobLog_emptyBody {
  max-width: 440px;
  margin: 6px 0 0;
  color: var(--dsh-joblog-muted);
  font-size: 12px;
  line-height: 18px;
}
.dshJobLog_emptyHint {
  max-width: 440px;
  margin: 8px 0 0;
  color: var(--dsh-joblog-faint);
  font-size: 11px;
  line-height: 16px;
}
.dshJobLog_empty .dshJobLog_button { margin-top: 14px; }
.dshJobLog_visualHidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
.dshJobLog_card {
  box-sizing: border-box;
  margin: 4px 0 4px 4px;
  border: 0.5px solid var(--dsh-joblog-border);
  border-radius: 10px;
  background: transparent;
  color: var(--dsh-joblog-text);
  overflow: hidden;
}
.dshJobLog_cardHeader {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  min-height: 28px;
  padding: 2px 8px;
}
.dshJobLog_cardDisclosure {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 2px;
  border: 0;
  background: transparent;
  color: var(--dsh-joblog-muted);
  font: inherit;
  font-size: 13px;
  line-height: 20px;
  cursor: pointer;
}
.dshJobLog_cardDisclosure:hover { color: var(--dsh-joblog-text); }
.dshJobLog_cardDisclosure:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: 2px;
  border-radius: 4px;
}
.dshJobLog_chevron { flex: none; transition: transform 0.12s ease; }
.dshJobLog_chevronOpen { transform: rotate(90deg); }
.dshJobLog_cardTitle {
  color: var(--dsh-joblog-text);
  font-size: 13px;
  line-height: 20px;
  font-weight: 400;
  white-space: nowrap;
}
.dshJobLog_cardInspect {
  margin-left: auto;
  padding: 2px 8px;
  border: 0.5px solid var(--dsh-joblog-border-strong);
  border-radius: 999px;
  background: transparent;
  color: var(--dsh-joblog-muted);
  font: inherit;
  font-size: 11px;
  line-height: 16px;
  cursor: pointer;
}
.dshJobLog_cardInspect:hover { background: var(--dsh-joblog-fill); color: var(--dsh-joblog-text); }
.dshJobLog_cardInspect:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: 2px;
}
.dshJobLog_cardHint {
  padding: 4px 10px 6px;
  color: var(--dsw-alias-state-warn-primary);
  font-size: 11px;
  line-height: 16px;
}
.dshJobLog_cardBody {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 10px 10px;
  border-top: 0.5px solid var(--dsh-joblog-border);
}
.dshJobLog_cardArgs {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 12px;
}
.dshJobLog_cardArg {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--dsh-joblog-muted);
  font-size: 11px;
  line-height: 16px;
}
.dshJobLog_cardArgLabel {
  color: var(--dsh-joblog-faint);
}
.dshJobLog_cardList {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 220px;
  overflow-y: auto;
  scrollbar-gutter: stable;
}
.dshJobLog_cardListItem {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 12px;
  line-height: 20px;
}
.dshJobLog_cardListKind {
  color: var(--dsh-joblog-faint);
  font-family: var(--dsh-joblog-mono);
  font-size: 11px;
  flex: none;
}
.dshJobLog_cardListLabel {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--dsh-joblog-muted);
}
.dshJobLog_cardPre {
  box-sizing: border-box;
  margin: 0;
  padding: 8px 10px;
  border: 0.5px solid var(--dsh-joblog-border);
  border-radius: 6px;
  background: var(--dsh-joblog-code-bg);
  color: var(--dsh-joblog-text);
  font-family: var(--dsh-joblog-mono);
  font-size: 11px;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
  max-height: 220px;
  overflow: auto;
}
.dshJobLog_cardNote {
  color: var(--dsh-joblog-faint);
  font-size: 11px;
  line-height: 16px;
}
@media (max-width: 860px) {
  .dshJobLog_root { padding: 16px 16px 32px; }
  .dshJobLog_grid { grid-template-columns: minmax(0, 1fr); }
  .dshJobLog_listScroll { max-height: 240px; }
  .dshJobLog_outputPre { max-height: 42vh; }
}
@media (prefers-reduced-motion: reduce) {
  .dshJobLog_rowDot,
  .dshJobLog_statusDot,
  .dshJobLog_chevron { animation: none !important; transition: none !important; }
}
`

    // ── Plugin body ─────────────────────────────────────────────────────────

    /** Required services: job state, the slot registry, dictionaries, and view activation. */
    const inject = ['jobs', 'slots', 'locale', 'uiConversation']

    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { en, ru }), 'job-log: dictionaries')

      ctx.effect(() => {
        const style = document.createElement('style')
        style.dataset.plugin = '@local/job-log'
        style.dataset.pluginCss = '@local/job-log/styles'
        style.textContent = CSS
        document.head.appendChild(style)
        return () => style.remove()
      }, 'job-log: styles')

      const t = ctx.locale.bind(NS)

      ctx.slots.inject('conversation.view', () => ctx.slots.register({
        name: 'conversation.view',
        id: VIEW_ID,
        order: 20,
        locale: NS,
        label: () => t('view.job'),
        inject: () => ({
          hooks: { jobs: ctx.jobs.state },
          watchRows: (sessionId) => ctx.jobs.watchRows(sessionId),
          observe: (sessionId, id) => ctx.jobs.observe(sessionId, id),
          killJob: async (sessionId, id) => {
            const result = await ctx.jobs.kill(sessionId, id)
            return result !== undefined && result !== null && result.ok === true
          },
        }),
      }, JobLogView))

      ctx.slots.inject('tool.call.toolview', () => {
        const openJob = (resolvedSessionId, jobId) => {
          try {
            return openJobView(ctx, resolvedSessionId, jobId)
          } catch (_error) {
            return false
          }
        }
        return [
          ctx.slots.register({
            name: 'tool.call.toolview',
            key: 'job_output',
            priority: -10,
            locale: NS,
            inject: (sessionId) => ({
              openJob: (resolvedSessionId, jobId) => openJob(resolvedSessionId === undefined ? sessionId : resolvedSessionId, jobId),
            }),
          }, JobToolCard),
          ctx.slots.register({
            name: 'tool.call.toolview',
            key: 'job_list',
            priority: -10,
            locale: NS,
            inject: (sessionId) => ({
              openJob: (resolvedSessionId, jobId) => openJob(resolvedSessionId === undefined ? sessionId : resolvedSessionId, jobId),
            }),
          }, JobToolCard),
          ctx.slots.register({
            name: 'tool.call.toolview',
            key: 'job_kill',
            priority: -10,
            locale: NS,
            inject: (sessionId) => ({
              openJob: (resolvedSessionId, jobId) => openJob(resolvedSessionId === undefined ? sessionId : resolvedSessionId, jobId),
            }),
          }, JobToolCard),
        ]
      })
    }

    return { inject, apply }
  },
})
