# Security Policy

## Supported Versions

Only the latest released version of afpp is actively supported with security updates.

Security fixes are released as soon as reasonably possible once a vulnerability is confirmed.

---

## Reporting a Vulnerability

If you discover a security vulnerability, please do not open a public GitHub issue.

Instead, report it privately by one of the following means:

- Open a GitHub Security Advisory (preferred)
- Contact the maintainer directly via GitHub

Please include as much detail as possible:

- A clear description of the vulnerability
- Steps to reproduce the issue
- Affected versions
- Potential impact (e.g. DoS, memory exhaustion, data exposure)

Do not include sensitive or proprietary PDF files. If an example PDF is required, use a minimal synthetic sample.

---

## Disclosure Process

- You will receive an acknowledgement within a reasonable timeframe
- The issue will be investigated and validated
- A fix will be prepared and released
- A security advisory will be published if appropriate

The project follows a responsible disclosure model.

---

## Security Scope

The following are considered in scope:

- Crashes or hangs caused by malformed PDFs
- Memory leaks or unbounded memory growth
- Denial-of-service vectors via crafted input
- Incorrect handling of encrypted PDFs

The following are out of scope:

- Issues caused by unsupported Node.js versions
- Vulnerabilities in upstream PDF specifications themselves
- Misuse of the library outside documented behavior

---

## License

This project is licensed under the MIT License.
