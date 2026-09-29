import ipaddress
import re
import socket
from urllib.parse import urlparse

_BLOCKED_HOSTS = frozenset(
    {
        "localhost",
        "localhost.localdomain",
        "metadata.google.internal",
        "metadata",
    }
)
_BLOCKED_HOST_SUFFIXES = (".local", ".internal", ".localhost")


class JobUrlSecurityError(Exception):
    pass


def _is_blocked_hostname(host: str) -> bool:
    lowered = host.lower().rstrip(".")
    if lowered in _BLOCKED_HOSTS:
        return True
    if re.fullmatch(r"\d+\.\d+\.\d+\.\d+", lowered):
        return False
    return any(lowered.endswith(suffix) for suffix in _BLOCKED_HOST_SUFFIXES)


def _is_disallowed_ip(ip: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    return bool(
        ip.is_private
        or ip.is_loopback
        or ip.is_link_local
        or ip.is_multicast
        or ip.is_reserved
        or ip.is_unspecified
    )


def validate_public_http_url(url: str) -> str:
    parsed = urlparse(url.strip())
    if parsed.scheme not in {"http", "https"}:
        raise JobUrlSecurityError("Only http and https URLs are allowed.")
    if not parsed.hostname:
        raise JobUrlSecurityError("URL must include a hostname.")
    if parsed.username or parsed.password:
        raise JobUrlSecurityError("URL must not include credentials.")

    host = parsed.hostname.lower()
    if _is_blocked_hostname(host):
        raise JobUrlSecurityError("URL hostname is not allowed.")

    try:
        ip = ipaddress.ip_address(host)
    except ValueError:
        ip = None

    if ip is not None:
        if _is_disallowed_ip(ip):
            raise JobUrlSecurityError("URL resolves to a disallowed address.")
        return url.strip()

    try:
        infos = socket.getaddrinfo(host, None, type=socket.SOCK_STREAM)
    except socket.gaierror as exc:
        raise JobUrlSecurityError("Unable to resolve URL hostname.") from exc

    if not infos:
        raise JobUrlSecurityError("Unable to resolve URL hostname.")

    for info in infos:
        addr = info[4][0]
        try:
            resolved = ipaddress.ip_address(addr)
        except ValueError:
            continue
        if _is_disallowed_ip(resolved):
            raise JobUrlSecurityError("URL resolves to a disallowed address.")

    return url.strip()
