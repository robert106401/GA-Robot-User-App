#!/bin/zsh

set -u

SCRIPT_PATH="${0:A}"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STATE_DIR="$PROJECT_ROOT/.expo"
PID_FILE="$STATE_DIR/tunnel-supervisor.pid"
LOG_FILE="$STATE_DIR/tunnel.log"
URL_FILE="$STATE_DIR/tunnel-url"
NODE_BIN_DEFAULT="/Users/commando/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
RESTART_DELAY_SECONDS=5
HEALTH_CHECK_SECONDS=15
MAX_HEALTH_FAILURES=3
EXPO_PORT="${EXPO_PORT:-8081}"
CHILD_PID=""
LAST_HEALTHY_URL=""

resolve_node() {
  if [[ -x "${NODE_BIN:-}" ]]; then
    print -r -- "$NODE_BIN"
    return
  fi

  if [[ -x "$NODE_BIN_DEFAULT" ]]; then
    print -r -- "$NODE_BIN_DEFAULT"
    return
  fi

  command -v node
}

is_running() {
  [[ -f "$PID_FILE" ]] || return 1
  local pid
  pid="$(<"$PID_FILE")"
  [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null
}

current_tunnel_url() {
  local api_url
  api_url="$(/usr/bin/curl -sS --max-time 2 http://127.0.0.1:4040/api/tunnels 2>/dev/null |
    /usr/bin/grep -Eo 'https://[A-Za-z0-9._-]+\.exp\.direct' |
    /usr/bin/head -1 |
    /usr/bin/sed 's#https://#exp://#')"
  if [[ -n "$api_url" ]]; then
    print -r -- "$api_url"
    return
  fi
  return 1
}

latest_url() {
  local api_url
  api_url="$(current_tunnel_url 2>/dev/null || true)"
  if [[ -n "$api_url" ]]; then
    print -r -- "$api_url"
    return
  fi

  if [[ -f "$URL_FILE" ]]; then
    local saved_url
    saved_url="$(<"$URL_FILE")"
    if [[ -n "$saved_url" ]]; then
      print -r -- "$saved_url"
      return
    fi
  fi

  if [[ -f "$LOG_FILE" ]]; then
    local logged_url
    logged_url="$(grep -Eo 'exp://[A-Za-z0-9._-]+' "$LOG_FILE" | tail -1)"
    if [[ -n "$logged_url" ]]; then
      print -r -- "$logged_url"
      return
    fi
  fi

}

public_url_is_healthy() {
  local url
  url="$(current_tunnel_url 2>/dev/null || true)"
  [[ -n "$url" ]] || return 1

  local https_url="${url/exp:\/\//https://}"
  /usr/bin/curl -fsS -o /dev/null --max-time 8 "$https_url" || return 1
  print -r -- "$url" > "$URL_FILE"
  LAST_HEALTHY_URL="$url"
  refresh_qr_page "$url"
  return 0
}

local_server_is_healthy() {
  /usr/bin/curl -fsS -o /dev/null --max-time 5 "http://127.0.0.1:${EXPO_PORT}" || return 1
  return 0
}

port_listener_pids() {
  /usr/sbin/lsof -nP -t -iTCP:"${EXPO_PORT}" -sTCP:LISTEN 2>/dev/null | /usr/bin/sort -u
}

stop_conflicting_port_listeners() {
  local pids
  pids="$(port_listener_pids || true)"
  [[ -n "$pids" ]] || return

  local pid
  for pid in ${(f)pids}; do
    [[ "$pid" == "$$" ]] && continue
    [[ -n "$CHILD_PID" && "$pid" == "$CHILD_PID" ]] && continue
    print -r -- "[$(date '+%Y-%m-%d %H:%M:%S')] Stopping process $pid on port ${EXPO_PORT} before starting tunnel." >> "$LOG_FILE"
    kill "$pid" 2>/dev/null || true
  done

  local attempt
  for attempt in {1..10}; do
    sleep 1
    pids="$(port_listener_pids || true)"
    [[ -z "$pids" ]] && return
  done

  for pid in ${(f)pids}; do
    print -r -- "[$(date '+%Y-%m-%d %H:%M:%S')] Force stopping process $pid on port ${EXPO_PORT}." >> "$LOG_FILE"
    kill -9 "$pid" 2>/dev/null || true
  done
}

refresh_qr_page() {
  local url="$1"
  local node_bin
  node_bin="$(resolve_node 2>/dev/null || true)"
  [[ -n "$node_bin" ]] || return
  [[ -f "$PROJECT_ROOT/scripts/generate-expo-qr.js" ]] || return

  (
    cd "$PROJECT_ROOT" || exit 0
    "$node_bin" scripts/generate-expo-qr.js "$url" expo-qr.html expo-qr.svg >/dev/null 2>&1 || true
  )
}

stop_child() {
  if [[ -n "$CHILD_PID" ]] && kill -0 "$CHILD_PID" 2>/dev/null; then
    kill "$CHILD_PID" 2>/dev/null || true
    wait "$CHILD_PID" 2>/dev/null || true
  fi
}

supervise() {
  mkdir -p "$STATE_DIR"
  print -r -- "$$" > "$PID_FILE"
  trap '' HUP
  trap 'stop_child; rm -f "$PID_FILE"; exit 0' INT TERM
  trap 'stop_child; rm -f "$PID_FILE"' EXIT

  local node_bin
  node_bin="$(resolve_node)" || {
    print -r -- "[$(date '+%Y-%m-%d %H:%M:%S')] Node.js executable not found." >> "$LOG_FILE"
    exit 1
  }

  while true; do
    rm -f "$URL_FILE"
    stop_conflicting_port_listeners
    print -r -- "[$(date '+%Y-%m-%d %H:%M:%S')] Starting Expo tunnel." >> "$LOG_FILE"
    (
      cd "$PROJECT_ROOT" || exit 1
      env \
        PATH="$(dirname "$node_bin"):/usr/bin:/bin:/usr/sbin:/sbin" \
        EXPO_NO_TELEMETRY=1 \
        EXPO_NO_INTERACTIVE=1 \
        "$node_bin" node_modules/expo/bin/cli start --tunnel --port "$EXPO_PORT" --clear
    ) >> "$LOG_FILE" 2>&1 &
    CHILD_PID=$!

    local health_failures=0
    local startup_checks=0
    while kill -0 "$CHILD_PID" 2>/dev/null; do
      sleep "$HEALTH_CHECK_SECONDS"
      startup_checks=$((startup_checks + 1))

      if local_server_is_healthy && public_url_is_healthy; then
        health_failures=0
        continue
      fi

      # Allow Metro and ngrok up to one minute for initial startup.
      if (( startup_checks <= 4 )); then
        continue
      fi

      health_failures=$((health_failures + 1))
      print -r -- "[$(date '+%Y-%m-%d %H:%M:%S')] Tunnel health check failed ($health_failures/$MAX_HEALTH_FAILURES)." >> "$LOG_FILE"
      if (( health_failures >= MAX_HEALTH_FAILURES )); then
        print -r -- "[$(date '+%Y-%m-%d %H:%M:%S')] Restarting unhealthy Expo tunnel." >> "$LOG_FILE"
        kill "$CHILD_PID" 2>/dev/null || true
        break
      fi
    done

    wait "$CHILD_PID" 2>/dev/null
    local exit_code=$?
    CHILD_PID=""
    print -r -- "[$(date '+%Y-%m-%d %H:%M:%S')] Tunnel exited with code $exit_code; restarting in ${RESTART_DELAY_SECONDS}s." >> "$LOG_FILE"
    sleep "$RESTART_DELAY_SECONDS"
  done
}

start_service() {
  mkdir -p "$STATE_DIR"
  if is_running; then
    print -r -- "Expo tunnel is already running (PID $(<"$PID_FILE"))."
    latest_url
    return
  fi

  rm -f "$PID_FILE"
  rm -f "$URL_FILE"
  nohup "$SCRIPT_PATH" supervise >/dev/null 2>&1 &

  local attempt
  local url=""
  for attempt in {1..60}; do
    sleep 1
    if is_running; then
      if local_server_is_healthy && public_url_is_healthy; then
        url="$(<"$URL_FILE")"
        print -r -- "Expo tunnel is running."
        print -r -- "$url"
        return
      fi
    fi
  done

  print -r -- "Expo tunnel supervisor started; the public URL is still connecting."
  print -r -- "Run: $SCRIPT_PATH status"
}

stop_service() {
  if ! is_running; then
    rm -f "$PID_FILE"
    print -r -- "Expo tunnel is not running."
    return
  fi

  local pid
  pid="$(<"$PID_FILE")"
  kill "$pid"

  local attempt
  for attempt in {1..10}; do
    sleep 1
    kill -0 "$pid" 2>/dev/null || break
  done

  rm -f "$PID_FILE"
  print -r -- "Expo tunnel stopped."
}

show_status() {
  if is_running; then
    print -r -- "Expo tunnel supervisor is running (PID $(<"$PID_FILE"))."
    local url
    url="$(latest_url)"
    if public_url_is_healthy; then
      print -r -- "Expo tunnel is healthy."
      print -r -- "$url"
      return
    fi
    print -r -- "Expo tunnel is restarting or unhealthy."
    [[ -n "$url" ]] && print -r -- "$url"
    return 1
  fi

  print -r -- "Expo tunnel is not running."
  return 1
}

case "${1:-status}" in
  start)
    start_service
    ;;
  stop)
    stop_service
    ;;
  restart)
    stop_service
    start_service
    ;;
  status)
    show_status
    ;;
  supervise)
    supervise
    ;;
  *)
    print -r -- "Usage: $SCRIPT_PATH {start|stop|restart|status}"
    exit 2
    ;;
esac
