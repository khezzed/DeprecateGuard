# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json
from datetime import datetime

class ProbeFeatures(gl.Contract):
    last_dt_raw: str
    last_parsed_ts: u256
    last_transfer_amount: u256

    def __init__(self):
        self.last_dt_raw = ""
        self.last_parsed_ts = u256(0)
        self.last_transfer_amount = u256(0)

    def _get_trusted_timestamp(self) -> int:
        dt_str = gl.message_raw.get("datetime", "")
        if not dt_str:
            return 0
        cleaned = dt_str.replace("Z", "+00:00")
        dt = datetime.fromisoformat(cleaned)
        return int(dt.timestamp())

    @gl.public.write.payable
    def test_time_and_deposit(self) -> str:
        self.last_dt_raw = gl.message_raw.get("datetime", "")
        ts = self._get_trusted_timestamp()
        self.last_parsed_ts = u256(ts)
        val = int(gl.message.value)
        return f"TIME_OK:raw={self.last_dt_raw}|ts={ts}|val={val}"

    @gl.public.write
    def test_transfer(self, amount: int) -> str:
        caller = gl.message.sender_address
        gl.get_contract_at(caller).emit_transfer(value=u256(amount))
        self.last_transfer_amount = u256(amount)
        return f"TRANSFER_OK:caller={caller}|amount={amount}"

    @gl.public.view
    def get_info(self) -> str:
        return json.dumps({
            "last_dt_raw": self.last_dt_raw,
            "last_parsed_ts": int(self.last_parsed_ts),
            "last_transfer_amount": int(self.last_transfer_amount)
        })
