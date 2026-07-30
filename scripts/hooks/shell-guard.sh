#!/bin/bash
# Shell Guard Hook — Codex PreToolUse
# 되돌리기 어려운 파괴적 커맨드를 차단한다.
#
# Codex는 훅 페이로드를 stdin JSON으로 준다 (Claude Code의 $CLAUDE_TOOL_INPUT 아님).
# 커맨드가 문자열로 오는 경우와 argv 배열로 오는 경우가 모두 있으므로
# tool_input 안의 모든 문자열을 이어붙여 검사한다.

set -u

DANGEROUS='rm[[:space:]]+-rf|git[[:space:]]+push[[:space:]]+--force|git[[:space:]]+reset[[:space:]]+--hard|DROP[[:space:]]+TABLE'

INPUT=$(cat)
if [ -z "${INPUT// /}" ]; then
  exit 0
fi

COMMAND=$(printf '%s' "$INPUT" \
  | jq -r '[(.tool_input // empty) | .. | strings] | join(" ")' 2>/dev/null)

if printf '%s' "$COMMAND" | grep -qE "$DANGEROUS"; then
  jq -n '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: "SHELL GUARD: 위험한 명령어가 감지되었습니다. 되돌리기 어려운 작업은 사용자에게 확인을 받으세요."
    }
  }'
fi

exit 0
