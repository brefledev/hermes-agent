"""Refuse external network calls; permit asyncio's local self-pipe sockets."""
import sys


def _offline_audit(event, args):
    if event == "socket.connect":
        address = args[1]
        if isinstance(address, tuple) and address[0] in {"127.0.0.1", "::1"}:
            return
        raise RuntimeError("Workspace verification is offline; external network access refused")
    if event == "socket.getaddrinfo" and args[0] not in {"localhost", "127.0.0.1", "::1", None}:
        raise RuntimeError("Workspace verification is offline; external DNS access refused")


sys.addaudithook(_offline_audit)
