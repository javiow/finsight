"""
tdd-guard.sh (Codex PreToolUse 훅) 동작 검증.

Codex는 파일을 `apply_patch` 패치 텍스트나 `shell` heredoc으로 쓴다.
훅이 그 페이로드에서 대상 경로를 뽑아내지 못하면 가드가 조용히 무력화되므로,
페이로드 형태별로 deny/allow가 실제로 갈리는지 확인한다.
"""

import json
import subprocess
from pathlib import Path

import pytest

GUARD = Path(__file__).parent / "hooks" / "tdd-guard.sh"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def run_hook(payload: dict) -> dict:
    """훅에 페이로드를 stdin으로 넘기고 (exit_code, decision, reason)을 돌려준다."""
    proc = subprocess.run(
        ["bash", str(GUARD)],
        input=json.dumps(payload),
        capture_output=True, text=True, encoding="utf-8", errors="replace",
    )
    decision, reason = None, ""
    if proc.stdout.strip():
        out = json.loads(proc.stdout)
        specific = out["hookSpecificOutput"]
        decision = specific["permissionDecision"]
        reason = specific["permissionDecisionReason"]
    return {"exit_code": proc.returncode, "decision": decision, "reason": reason}


def apply_patch_payload(cwd: Path, *, verb: str = "Add", path: str = "src/lib/csv.ts") -> dict:
    patch = f"*** Begin Patch\n*** {verb} File: {path}\n+export const x = 1\n*** End Patch\n"
    return {
        "hook_event_name": "PreToolUse",
        "cwd": str(cwd),
        "tool_name": "apply_patch",
        "tool_input": {"input": patch},
    }


def shell_payload(cwd: Path, command: str) -> dict:
    return {
        "hook_event_name": "PreToolUse",
        "cwd": str(cwd),
        "tool_name": "shell",
        "tool_input": {"command": ["bash", "-lc", command]},
    }


def write_test_for(cwd: Path, rel_impl: str, suffix: str = ".test.ts"):
    """구현 파일에 대응하는 테스트 파일을 같은 폴더에 만든다."""
    impl = cwd / rel_impl
    impl.parent.mkdir(parents=True, exist_ok=True)
    (impl.parent / (impl.stem + suffix)).write_text("test", encoding="utf-8")


# ---------------------------------------------------------------------------
# apply_patch 툴 페이로드
# ---------------------------------------------------------------------------

class TestApplyPatchTool:
    def test_new_impl_without_test_is_denied(self, tmp_path):
        result = run_hook(apply_patch_payload(tmp_path))
        assert result["decision"] == "deny"
        assert "csv" in result["reason"]

    def test_new_impl_with_test_is_allowed(self, tmp_path):
        write_test_for(tmp_path, "src/lib/csv.ts")
        result = run_hook(apply_patch_payload(tmp_path))
        assert result["decision"] is None

    def test_update_verb_also_checked(self, tmp_path):
        result = run_hook(apply_patch_payload(tmp_path, verb="Update"))
        assert result["decision"] == "deny"

    def test_delete_verb_is_ignored(self, tmp_path):
        payload = apply_patch_payload(tmp_path)
        payload["tool_input"]["input"] = (
            "*** Begin Patch\n*** Delete File: src/lib/csv.ts\n*** End Patch\n"
        )
        result = run_hook(payload)
        assert result["decision"] is None

    def test_spec_file_counts_as_test(self, tmp_path):
        write_test_for(tmp_path, "src/lib/csv.ts", suffix=".spec.ts")
        result = run_hook(apply_patch_payload(tmp_path))
        assert result["decision"] is None

    def test_tests_folder_counts_as_test(self, tmp_path):
        (tmp_path / "src" / "lib" / "__tests__").mkdir(parents=True)
        (tmp_path / "src" / "lib" / "__tests__" / "csv.test.ts").write_text("t", encoding="utf-8")
        result = run_hook(apply_patch_payload(tmp_path))
        assert result["decision"] is None

    def test_multiple_files_denied_by_the_untested_one(self, tmp_path):
        write_test_for(tmp_path, "src/lib/csv.ts")
        payload = apply_patch_payload(tmp_path)
        payload["tool_input"]["input"] = (
            "*** Begin Patch\n"
            "*** Update File: src/lib/csv.ts\n+ok\n"
            "*** Add File: src/lib/plan.ts\n+nope\n"
            "*** End Patch\n"
        )
        result = run_hook(payload)
        assert result["decision"] == "deny"
        assert "plan" in result["reason"]


# ---------------------------------------------------------------------------
# shell 툴 (apply_patch heredoc / 리다이렉션)
# ---------------------------------------------------------------------------

class TestShellTool:
    def test_heredoc_apply_patch_is_denied(self, tmp_path):
        command = (
            "apply_patch <<'EOF'\n"
            "*** Begin Patch\n*** Add File: src/lib/plan.ts\n+x\n*** End Patch\nEOF"
        )
        result = run_hook(shell_payload(tmp_path, command))
        assert result["decision"] == "deny"
        assert "plan" in result["reason"]

    def test_read_only_command_is_allowed(self, tmp_path):
        result = run_hook(shell_payload(tmp_path, "ls -la src"))
        assert result["decision"] is None


# ---------------------------------------------------------------------------
# file_path 필드 (MCP 툴 · Claude Code 호환)
# ---------------------------------------------------------------------------

class TestFilePathField:
    def _payload(self, cwd: Path, path: str, key: str = "file_path") -> dict:
        return {
            "hook_event_name": "PreToolUse",
            "cwd": str(cwd),
            "tool_name": "Write",
            "tool_input": {key: path},
        }

    def test_file_path_without_test_is_denied(self, tmp_path):
        result = run_hook(self._payload(tmp_path, "src/lib/csv.ts"))
        assert result["decision"] == "deny"

    def test_path_key_also_works(self, tmp_path):
        result = run_hook(self._payload(tmp_path, "src/lib/csv.ts", key="path"))
        assert result["decision"] == "deny"

    def test_absolute_path_is_resolved(self, tmp_path):
        abs_path = str(tmp_path / "src" / "lib" / "csv.ts")
        result = run_hook(self._payload(tmp_path, abs_path))
        assert result["decision"] == "deny"


# ---------------------------------------------------------------------------
# 면제 규칙
# ---------------------------------------------------------------------------

class TestExemptions:
    @pytest.mark.parametrize("path", [
        "src/lib/csv.test.ts",
        "src/lib/csv.spec.ts",
        "src/__tests__/csv.ts",
        "src/types/api.ts",
        "design/prototype.tsx",
        "src/app/globals.css",
        "package.json",
        "README.md",
        "next.config.ts",
        "tailwind.config.ts",
        "src/app/dashboard/page.tsx",
        "src/app/layout.tsx",
        "src/app/loading.tsx",
        "src/app/error.tsx",
        "src/app/not-found.tsx",
    ])
    def test_exempt_paths_are_allowed(self, tmp_path, path):
        result = run_hook(apply_patch_payload(tmp_path, path=path))
        assert result["decision"] is None, f"{path} 는 면제 대상이어야 한다"

    def test_api_route_is_not_exempt(self, tmp_path):
        result = run_hook(apply_patch_payload(tmp_path, path="src/app/api/upload/route.ts"))
        assert result["decision"] == "deny"

    def test_non_source_extension_is_allowed(self, tmp_path):
        result = run_hook(apply_patch_payload(tmp_path, path="scripts/seed.py"))
        assert result["decision"] is None


# ---------------------------------------------------------------------------
# 페이로드 예외 상황
# ---------------------------------------------------------------------------

class TestMalformedPayload:
    def test_empty_stdin_is_allowed(self):
        proc = subprocess.run(
            ["bash", str(GUARD)], input="", capture_output=True, text=True,
        )
        assert proc.returncode == 0
        assert proc.stdout.strip() == ""

    def test_no_tool_input_is_allowed(self, tmp_path):
        result = run_hook({"hook_event_name": "PreToolUse", "cwd": str(tmp_path)})
        assert result["decision"] is None


# ---------------------------------------------------------------------------
# CLI 모드 (pre-commit 등에서 직접 호출)
# ---------------------------------------------------------------------------

class TestCliMode:
    def _run(self, cwd: Path, *paths: str) -> subprocess.CompletedProcess:
        return subprocess.run(
            ["bash", str(GUARD), *paths], cwd=cwd,
            capture_output=True, text=True, encoding="utf-8", errors="replace",
        )

    def test_untested_path_exits_1(self, tmp_path):
        proc = self._run(tmp_path, "src/lib/csv.ts")
        assert proc.returncode == 1
        assert "csv" in proc.stderr

    def test_tested_path_exits_0(self, tmp_path):
        write_test_for(tmp_path, "src/lib/csv.ts")
        proc = self._run(tmp_path, "src/lib/csv.ts")
        assert proc.returncode == 0
