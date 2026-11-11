# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json

class ProbeGlAttrs(gl.Contract):
    def __init__(self):
        pass

    @gl.public.view
    def inspect_proxy(self) -> str:
        caller = gl.Address("0xc130A7a4C4F22b2644Eaa62F5D13F14c941860aC")
        proxy = gl.get_contract_at(caller)
        proxy_attrs = [k for k in dir(proxy) if not k.startswith('_')]
        import inspect
        doc = getattr(gl.get_contract_at, '__doc__', '') or ''
        return json.dumps({
            "proxy_type": str(type(proxy)),
            "proxy_attrs": proxy_attrs,
            "doc": doc
        })
