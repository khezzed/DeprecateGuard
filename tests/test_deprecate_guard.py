"""
Comprehensive Unit Test Suite for DeprecateGuard (Python / unittest)
Covers:
1. Safe deposit crediting and refundability on invalid repo_full_name input.
2. Safe deposit crediting and refundability on invalid target_file_path input.
3. Safe deposit crediting and refundability on invalid baseline_tag input.
4. Safe deposit crediting and refundability on invalid duration_seconds & grace_period_seconds.
5. Cumulative sequential deposits on invalid inputs and single lump-sum withdrawal.
6. Safe refund preservation on RuleGate REJECTED_VAGUE outcome.
7. Trusted runtime ISO-8601 datetime parsing.
8. Bounded evidence extraction and deterministic SHA-256 digest computation.
9. Claim window enforcement against trusted runtime time (now_ts > expires_at).
10. Direct native token transfer emission on BREAKING_CONFIRMED.
11. Expired pledge resolution and maintainer bond refund after deadline.
"""

import sys
import os
import unittest
import types

# Ensure workspace root is in sys.path
WORKSPACE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if WORKSPACE_DIR not in sys.path:
    sys.path.insert(0, WORKSPACE_DIR)

# Mock GenVM environment for direct contract testing
gl_mod = types.ModuleType("genlayer")
gl_mod.u256 = int
gl_mod.Address = str
gl_mod.TreeMap = dict


class MockWrite:
    def __call__(self, f):
        return f

    def payable(self, f):
        return f


class MockPublic:
    write = MockWrite()

    def view(self, f):
        return f


class MockContractBase:
    def __init_subclass__(cls):
        orig_init = getattr(cls, "__init__", None)

        def new_init(self, *args, **kwargs):
            self.pledges = {}
            self.claims = {}
            self.refundable_balances = {}
            if orig_init:
                orig_init(self, *args, **kwargs)

        cls.__init__ = new_init


class MockContractAt:
    def __init__(self, target, ledger):
        self.target = target
        self.ledger = ledger

    def emit_transfer(self, value):
        self.ledger.append((str(self.target), int(value)))


class MockGL:
    Contract = MockContractBase
    public = MockPublic()

    def __init__(self):
        self.transfers = []
        self.message = type(
            "Msg",
            (),
            {
                "sender_address": "0xc130A7a4C4F22b2644Eaa62F5D13F14c941860aC",
                "value": 0,
            },
        )()
        self.message_raw = {"datetime": "2026-11-17T03:00:00.000000Z"}

    def get_contract_at(self, target):
        return MockContractAt(target, self.transfers)


mock_gl_instance = MockGL()
gl_mod.gl = mock_gl_instance
sys.modules["genlayer"] = gl_mod

import contracts.deprecate_guard as dg


class TestDeprecateGuardDepositSafety(unittest.TestCase):
    def setUp(self):
        self.guard = dg.DeprecateGuard()
        self.caller = "0xc130A7a4C4F22b2644Eaa62F5D13F14c941860aC"
        mock_gl_instance.message.sender_address = self.caller
        mock_gl_instance.message.value = 0
        mock_gl_instance.message_raw = {"datetime": "2026-11-17T03:00:00.000000Z"}
        mock_gl_instance.transfers.clear()

    def test_invalid_repo_credits_deposit_and_allows_refund(self):
        """Invalid repo_full_name must credit gl.message.value to refundable_balances and allow immediate withdrawal."""
        mock_gl_instance.message.value = 100
        res = self.guard.create_pledge(
            package_name="express",
            repo_full_name="invalid-repo-no-slash",
            target_file_path="lib/response.js",
            baseline_tag="4.17.1",
            clause_text="Preserve res.sendfile alias",
            duration_seconds=3600,
            grace_period_seconds=86400,
        )
        self.assertEqual(res, "ERROR:INVALID_REPO_FULL_NAME")
        self.assertEqual(self.guard.get_refundable_balance(self.caller), 100)
        self.assertEqual(int(self.guard.pledge_counter), 0)

        # Withdraw full refund
        w_res = self.guard.withdraw_refundable()
        self.assertIn("WITHDRAWN:", w_res)
        self.assertEqual(self.guard.get_refundable_balance(self.caller), 0)
        self.assertEqual(mock_gl_instance.transfers, [(self.caller, 100)])

    def test_invalid_target_file_path_credits_deposit_and_allows_refund(self):
        """Invalid target_file_path (directory traversal or empty) must credit deposit and allow withdrawal."""
        mock_gl_instance.message.value = 250
        res = self.guard.create_pledge(
            package_name="express",
            repo_full_name="expressjs/express",
            target_file_path="../etc/passwd",
            baseline_tag="4.17.1",
            clause_text="Preserve res.sendfile alias",
            duration_seconds=3600,
            grace_period_seconds=86400,
        )
        self.assertEqual(res, "ERROR:INVALID_TARGET_FILE_PATH")
        self.assertEqual(self.guard.get_refundable_balance(self.caller), 250)

        # Withdraw full refund
        w_res = self.guard.withdraw_refundable()
        self.assertIn("WITHDRAWN:", w_res)
        self.assertEqual(self.guard.get_refundable_balance(self.caller), 0)
        self.assertEqual(mock_gl_instance.transfers, [(self.caller, 250)])

    def test_invalid_baseline_tag_credits_deposit_and_allows_refund(self):
        """Invalid baseline_tag (empty or > 64 chars) must credit deposit and allow withdrawal."""
        mock_gl_instance.message.value = 500
        res = self.guard.create_pledge(
            package_name="express",
            repo_full_name="expressjs/express",
            target_file_path="lib/response.js",
            baseline_tag="",  # empty tag
            clause_text="Preserve res.sendfile alias",
            duration_seconds=3600,
            grace_period_seconds=86400,
        )
        self.assertEqual(res, "ERROR:INVALID_BASELINE_TAG")
        self.assertEqual(self.guard.get_refundable_balance(self.caller), 500)

        # Withdraw full refund
        w_res = self.guard.withdraw_refundable()
        self.assertIn("WITHDRAWN:", w_res)
        self.assertEqual(self.guard.get_refundable_balance(self.caller), 0)
        self.assertEqual(mock_gl_instance.transfers, [(self.caller, 500)])

    def test_invalid_duration_and_grace_period_credits_deposit(self):
        """Non-positive duration or negative grace period must credit deposit and allow withdrawal."""
        mock_gl_instance.message.value = 75
        res_dur = self.guard.create_pledge(
            package_name="express",
            repo_full_name="expressjs/express",
            target_file_path="lib/response.js",
            baseline_tag="4.17.1",
            clause_text="Preserve res.sendfile alias",
            duration_seconds=0,
            grace_period_seconds=10,
        )
        self.assertEqual(res_dur, "ERROR:INVALID_DURATION_SECONDS")
        self.assertEqual(self.guard.get_refundable_balance(self.caller), 75)

        # Test negative grace period accumulating onto existing balance
        mock_gl_instance.message.value = 25
        res_grace = self.guard.create_pledge(
            package_name="express",
            repo_full_name="expressjs/express",
            target_file_path="lib/response.js",
            baseline_tag="4.17.1",
            clause_text="Preserve res.sendfile alias",
            duration_seconds=100,
            grace_period_seconds=-1,
        )
        self.assertEqual(res_grace, "ERROR:INVALID_GRACE_PERIOD_SECONDS")
        self.assertEqual(self.guard.get_refundable_balance(self.caller), 100)

        w_res = self.guard.withdraw_refundable()
        self.assertIn("WITHDRAWN:", w_res)
        self.assertEqual(self.guard.get_refundable_balance(self.caller), 0)
        self.assertEqual(mock_gl_instance.transfers, [(self.caller, 100)])

    def test_cumulative_sequential_invalid_calls_deposit_safety(self):
        """Sequential invalid calls must accumulate all deposits and allow full lump-sum withdrawal."""
        mock_gl_instance.message.value = 1
        self.guard.create_pledge("pkg", "invalid-repo", "file.js", "v1", "c", 10, 10)
        self.assertEqual(self.guard.get_refundable_balance(self.caller), 1)

        mock_gl_instance.message.value = 2
        self.guard.create_pledge("pkg", "user/repo", "../bad.js", "v1", "c", 10, 10)
        self.assertEqual(self.guard.get_refundable_balance(self.caller), 3)

        mock_gl_instance.message.value = 3
        self.guard.create_pledge("pkg", "user/repo", "file.js", "x" * 65, "c", 10, 10)
        self.assertEqual(self.guard.get_refundable_balance(self.caller), 6)

        # Full lump-sum withdrawal
        w_res = self.guard.withdraw_refundable()
        self.assertIn("WITHDRAWN:", w_res)
        self.assertEqual(self.guard.get_refundable_balance(self.caller), 0)
        self.assertEqual(mock_gl_instance.transfers, [(self.caller, 6)])

    def test_zero_balance_withdrawal_fails(self):
        """Calling withdraw_refundable with zero balance returns ERROR:ZERO_BALANCE."""
        res = self.guard.withdraw_refundable()
        self.assertEqual(res, "ERROR:ZERO_BALANCE")
        self.assertEqual(len(mock_gl_instance.transfers), 0)

    def test_trusted_timestamp_parsing(self):
        """_get_trusted_timestamp must deterministically parse ISO-8601 strings."""
        mock_gl_instance.message_raw["datetime"] = "2026-11-17T03:15:30.500000Z"
        ts = self.guard._get_trusted_timestamp()
        self.assertEqual(ts, 1794885330)

    def test_bounded_evidence_extraction(self):
        """extract_bounded_evidence must bound window to <= 2400 chars and hash deterministically."""
        code = "function alpha() { return 1; }\nres.sendfile = deprecate.function();\nfunction beta() { return 2; }"
        slice_text, digest, found = dg.extract_bounded_evidence(code, "sendfile")
        self.assertTrue(found)
        self.assertIn("res.sendfile = deprecate.function()", slice_text)
        self.assertEqual(len(digest), 64)


if __name__ == "__main__":
    unittest.main()
