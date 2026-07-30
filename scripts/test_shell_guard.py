"""
shell-guard.sh (Codex PreToolUse 훅) 동작 검증.

Claude Code 판은 `$CLAUDE_TOOL_INPUT` 환경변수를 grep했다.
Codex는 stdin JSON으로 페이로드를 주므로, 커맨드 문자열이 어떤 모양으로
들어와도(문자열 / argv 배열) 위험 패턴이 걸리는지 확인한다.
"""

import json
import subprocess
from pathlib import Path

import pytest

GUARD = Path(__file__).parent / "hooks" / "shell-guard.sh"


def run_hook(tool_input, tool_name: str = "shell") -> dict:
    proc = subprocess.run(
        ["bash", str(GUARD)],
        input=json.dumps({
            "hook_event_name": "PreToolUse",
            "tool_name": tool_name,
            "tool_input": tool_input,
        }),
        capture_output=True, text=True, encoding="utf-8", errors="replace",
    )
    decision = None
    if proc.stdout.strip():
        decision = json.loads(proc.stdout)["hookSpecificOutput"]["permissionDecision"]
    return {"exit_code": proc.returncode, "decision": decision}


class TestDangerousCommands:
    @pytest.mark.parametrize("command", [
        "rm -rf /",
        "rm  -rf node_modules",
        "git push --force origin master",
        "git reset --hard HEAD~3",
        "psql -c 'DROP TABLE transactions'",
    ])
    def test_dangerous_command_is_denied(self, command):
        assert run_hook({"command": ["bash", "-lc", command]})["decision"] == "deny"

    def test_plain_string_command_is_also_checked(self):
        assert run_hook({"command": "rm -rf .next"})["decision"] == "deny"


class TestSafeCommands:
    @pytest.mark.parametrize("command", [
        "npm run build",
        "git push origin feat-mvp",
        "git reset HEAD -- file.ts",
        "rm dist/bundle.js",
        "npx supabase migration new add_transactions",
    ])
    def test_safe_command_is_allowed(self, command):
        result = run_hook({"command": ["bash", "-lc", command]})
        assert result["decision"] is None
        assert result["exit_code"] == 0


class TestMalformedPayload:
    def test_empty_stdin_is_allowed(self):
        proc = subprocess.run(["bash", str(GUARD)], input="", capture_output=True, text=True)
        assert proc.returncode == 0
        assert proc.stdout.strip() == ""

    def test_non_shell_tool_is_allowed(self):
        assert run_hook({"input": "*** Begin Patch"}, tool_name="apply_patch")["decision"] is None
