#!/bin/bash
# TDD Guard Hook — Codex PreToolUse
# 구현 코드를 작성하려 할 때, 해당 모듈의 테스트 파일이 먼저 존재하는지 체크.
# 테스트 없이 구현 코드를 작성하려 하면 차단.
#
# 두 가지 모드로 동작한다:
#   1) 훅 모드  — stdin으로 PreToolUse 페이로드를 받아 deny JSON을 출력
#   2) CLI 모드 — 경로를 인자로 받아 위반 시 exit 1 (pre-commit 등에서 직접 호출)
#
# Codex는 파일을 `apply_patch` 패치 텍스트나 `shell` heredoc으로 쓴다.
# `file_path` 필드만 보면 아무것도 걸리지 않으므로 패치 헤더까지 파싱한다.

set -u

# 경로 정규화: Windows 역슬래시를 슬래시로 (dirname/-f 테스트가 인식하도록)
normalize() { printf '%s' "${1//\\//}"; }

abs_path() {
  case "$1" in
    /*|[A-Za-z]:/*) printf '%s' "$1" ;;
    *) printf '%s/%s' "$CWD" "$1" ;;
  esac
}

# 0 = 테스트가 필요한 구현 파일, 1 = 면제
needs_test() {
  # 테스트 파일 자체 — 경로 전체가 아니라 파일명으로 판정한다
  # (절대 경로에 "test"가 낀 상위 디렉토리 때문에 오면제되지 않도록)
  case "$(basename "$1")" in
    *.test.*|*.spec.*) return 1 ;;
  esac
  case "$1" in
    __tests__/*|*/__tests__/*|tests/*|*/tests/*) return 1 ;;
  esac
  case "$1" in
    *.json|*.css|*.scss|*.md|*.yml|*.yaml|*.env*|*.config.*|*tailwind*|*postcss*|*next.config*|*tsconfig*) return 1 ;;
  esac
  # design/ 프로토타입 산출물
  case "$1" in
    design/*|*/design/*) return 1 ;;
  esac
  # 타입 선언
  case "$1" in
    types/*|*/types/*|*/types.ts|*/types.d.ts) return 1 ;;
  esac
  # Next.js 프레임워크 파일 (route.ts는 면제 대상이 아니다)
  case "$1" in
    */layout.tsx|*/layout.ts|*/page.tsx|*/page.ts|*/loading.tsx|*/error.tsx|*/not-found.tsx|*/globals.css) return 1 ;;
  esac
  case "$1" in
    *.ts|*.tsx|*.js|*.jsx) return 0 ;;
  esac
  return 1
}

has_test() {
  local abs dir base parent ext
  abs=$(abs_path "$1")
  dir=$(dirname "$abs")
  parent=$(dirname "$dir")
  base=$(basename "$abs")
  base="${base%.*}"

  for ext in ts tsx js jsx; do
    if [ -f "${dir}/${base}.test.${ext}" ] || [ -f "${dir}/${base}.spec.${ext}" ] \
      || [ -f "${dir}/__tests__/${base}.test.${ext}" ] \
      || [ -f "${parent}/__tests__/${base}.test.${ext}" ] \
      || [ -f "${ROOT_DIR}/src/__tests__/${base}.test.${ext}" ]; then
      return 0
    fi
  done
  return 1
}

# 후보 경로들을 검사해 첫 위반 경로를 stdout으로 반환 (없으면 빈 문자열)
first_violation() {
  local p
  while IFS= read -r p; do
    p=$(normalize "$p")
    [ -z "$p" ] && continue
    needs_test "$p" || continue
    has_test "$p" && continue
    printf '%s' "$p"
    return 0
  done
  return 0
}

deny_message() {
  local base
  base=$(basename "$1")
  base="${base%.*}"
  printf "TDD GUARD: '%s'에 대한 테스트 파일이 존재하지 않습니다. 구현 코드를 작성하기 전에 테스트를 먼저 작성하세요. (테스트 파일 예: %s.test.ts)" \
    "$base" "$base"
}

# --- CLI 모드 ---

if [ "$#" -gt 0 ]; then
  CWD=$(normalize "$(pwd)")
  ROOT_DIR=$(normalize "$(git rev-parse --show-toplevel 2>/dev/null || pwd)")
  VIOLATION=$(printf '%s\n' "$@" | first_violation)
  if [ -n "$VIOLATION" ]; then
    deny_message "$VIOLATION" >&2
    echo >&2
    exit 1
  fi
  exit 0
fi

# --- 훅 모드 ---

INPUT=$(cat)
if [ -z "${INPUT// /}" ]; then
  exit 0
fi

CWD=$(normalize "$(printf '%s' "$INPUT" | jq -r '.cwd // empty')")
[ -z "$CWD" ] && CWD=$(normalize "$(pwd)")
ROOT_DIR=$(normalize "$(git -C "$CWD" rev-parse --show-toplevel 2>/dev/null || printf '%s' "$CWD")")

# 후보 1: file_path / path 필드 (MCP 툴, Claude Code 호환 페이로드)
DIRECT=$(printf '%s' "$INPUT" \
  | jq -r '(.tool_input // {}) | [(.file_path? // empty), (.path? // empty)] | .[]' 2>/dev/null)

# 후보 2: apply_patch 패치 헤더 — tool_input 안의 모든 문자열을 훑는다
# (apply_patch 툴의 patch 인자, shell 툴의 heredoc 커맨드 모두 여기서 걸린다)
PATCHED=$(printf '%s' "$INPUT" \
  | jq -r '[(.tool_input // empty) | .. | strings] | .[]' 2>/dev/null \
  | tr -d '\r' \
  | sed -nE 's/^\*\*\* (Add|Update) File: (.+)$/\2/p')

VIOLATION=$(printf '%s\n%s\n' "$DIRECT" "$PATCHED" | first_violation)

if [ -n "$VIOLATION" ]; then
  jq -n --arg reason "$(deny_message "$VIOLATION")" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $reason
    }
  }'
fi

exit 0
