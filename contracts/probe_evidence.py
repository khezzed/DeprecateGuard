# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import hashlib

class ProbeEvidence(gl.Contract):
    last_url: str
    last_status: str
    last_digest: str

    def __init__(self):
        self.last_url = ""
        self.last_status = "INITIALIZED"
        self.last_digest = ""

    @gl.public.write
    def probe_url(self, target_url: str) -> str:
        self.last_url = target_url

        def get_and_check():
            text = gl.nondet.web.render(target_url, mode='text')
            # Extract bounded sample and compute SHA-256
            sample = text[:500]
            digest = hashlib.sha256(sample.encode('utf-8')).hexdigest()
            return f"FETCHED_OK:{digest}"

        result = gl.eq_principle.strict_eq(get_and_check)
        self.last_status = "SUCCESS"
        self.last_digest = result
        return result

    @gl.public.view
    def get_probe_result(self) -> str:
        return f"{self.last_status}|{self.last_digest}|{self.last_url}"
