# Security Policy

## Reporting a Vulnerability

**Do not** report security vulnerabilities through public GitHub issues.

Instead, please report them to [roodrigoprogrammer@gmail.com].

You should receive a response within 48 hours. If you do not receive a response, please follow up via email.

---

## What to Include

Please include the following information in your report:

- Type of vulnerability (e.g., buffer overflow, SQL injection, cross-site scripting)
- Full paths of source file(s) related to the vulnerability
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

This will help us triage and address the issue more quickly.

---

## Scope

### In Scope

- RAXION Protocol core code (Rust)
- Neural SVM implementation
- zk-ML integration
- Solana programs (Anchor)
- Smart contracts
- Official documentation (this repository)

### Out of Scope

- Third-party dependencies (report to maintainers directly)
- Theoretical vulnerabilities without proof of concept
- Social engineering attacks
- Physical security
- Denial of service attacks
- Spam or rate limiting issues

---

## Disclosure Policy

We follow a **Coordinated Disclosure** process:

1. **Report received**: We acknowledge receipt within 48 hours
2. **Triage**: We assess severity and validity
3. **Fix development**: We develop and test a fix
4. **Release**: We release the fix
5. **Disclosure**: We publish a security advisory

### Timeline

| Stage | Target Timeframe |
|-------|-----------------|
| Initial response | 48 hours |
| Triage complete | 5 business days |
| Fix for critical | 7 days |
| Fix for high | 14 days |
| Fix for medium/low | 30 days |
| Public disclosure | After fix is released |

---

## Security Best Practices

When working with RAXION:

- **Never commit secrets** to the repository
- **Use environment variables** for sensitive configuration
- **Review code** for security issues before submitting PRs
- **Keep dependencies updated** to avoid known vulnerabilities
- **Report suspicious activity** immediately

---

## Recognition

We value the security research community and will publicly acknowledge responsible disclosures in our security advisories (with your permission).

---

## Contact

- **Security Email**: [roodrigoprogrammer@gmail.com]
- **PGP Key**: Available upon request
- **Response Time**: 48 hours maximum

---

## Security Advisories

Security advisories will be published on:

- GitHub Security Advisories
- raxion.network/blog
- Discord announcements

---

Thank you for helping keep RAXION and our users safe!
