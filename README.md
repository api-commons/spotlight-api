<p align="center"><a href="https://spotlight-rules.com"><img src="https://raw.githubusercontent.com/api-commons/spotlight-api/main/spotlight-rules-logo.png" alt="Spotlight Rules" height="90"></a></p>

# Spotlight API

A small, **OpenAPI-first HTTP API** for [Spotlight](https://spotlight-rules.com) — lint
API artifacts, list the built-in rulesets and supported formats, and validate a
ruleset, all over HTTP. It runs the same `@spotlight-rules/*` engine as
[spotlight-cli](https://github.com/api-commons/spotlight-cli), so the API, CLI, VS
Code extension, and browser validator all agree.

The API **defines itself with OpenAPI** ([`openapi.yaml`](./openapi.yaml)) and serves
it at `GET /openapi.yaml` — so it's lintable by Spotlight, too.

## Run

```bash
npm install
npm start              # http://localhost:8080  (PORT to override)
```

With Docker:

```bash
docker build -t spotlight-api .
docker run -p 8080:8080 spotlight-api
```

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/lint` | Lint an artifact (`{ content, format?, ruleset? }`) → diagnostics + counts |
| `GET` | `/rulesets` | The built-in rulesets (`spotlight:oas`, `:asyncapi`, `:arazzo`) and their rules |
| `POST` | `/rulesets/validate` | Structurally validate a ruleset (alias, object, or YAML/JSON string) |
| `GET` | `/formats` | Supported artifact formats |
| `GET` | `/openapi.yaml` | This API's OpenAPI definition |
| `GET` | `/health` | Health check |

### Example

```bash
curl -s -X POST http://localhost:8080/lint \
  -H 'content-type: application/json' \
  -d '{"format":"openapi","content":"openapi: \"3.0.3\"\ninfo: {title: T, version: \"1\"}\npaths: {}\n"}'
```

```json
{ "total": 6, "counts": { "error": 0, "warn": 6, "info": 0, "hint": 0 },
  "diagnostics": [ { "code": "oas3-api-servers", "severity": "warn", "message": "..." } ] }
```

`ruleset` accepts a built-in alias (`"spotlight:oas"`), or a full ruleset definition
object (data form) that may `extends` the built-ins — the [spotlight-spec](https://github.com/api-commons/spotlight-spec)
ruleset format.

## Part of the Spotlight suite

The Spotlight governance suite shares one engine (the CLI) and one vocabulary (the
spec + its rule tags): **spec** (format) · **cli** (engine) · **api** (HTTP, this repo)
· **mcp** (AI) · **vscode** (editor) · **validator** (playground). This API is the HTTP
surface other tools can build on.

---

Part of [Spotlight Rules](https://spotlight-rules.com) — a project of [API Evangelist](https://apievangelist.com), maintained openly under [API Commons](https://apicommons.org). Apache-2.0.
