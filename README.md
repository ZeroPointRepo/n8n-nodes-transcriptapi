# n8n-nodes-transcriptapi

**TranscriptAPI: hosted YouTube transcript + video-discovery API for AI agents.** Also available as an [MCP server](https://github.com/ZeroPointRepo/youtube-mcp) and [agent skills](https://github.com/ZeroPointRepo/youtube-skills).

This is an n8n community node for [TranscriptAPI](https://transcriptapi.com): YouTube transcripts and video discovery for n8n. Fetch transcripts as Markdown or structured JSON, search YouTube for videos and channels, and browse channel and playlist uploads, all from one node.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Installation

Follow the [installation guide for community nodes](https://docs.n8n.io/integrations/community-nodes/installation/):

1. In n8n, go to **Settings → Community Nodes**.
2. Select **Install**, enter `n8n-nodes-transcriptapi`, and confirm.

## Credentials

You need a TranscriptAPI API key (starts with `sk_`):

1. Create an account at [transcriptapi.com](https://transcriptapi.com): **100 free credits, no card (one-time)**; paid plans from **$5/mo (1,000 credits)**.
2. Create an API key on the dashboard.
3. In n8n, create a **TranscriptAPI API** credential and paste the key.

The credential test uses the free video-info endpoint and consumes no credits.

## Operations

One node, six operations:

| Operation | What it does | Credits |
|---|---|---|
| **Get Transcript** | Transcript of a video (full URL, youtu.be, Shorts, or bare ID) as **Markdown with metadata** or **structured JSON**; optional preferred language | 1 |
| **Search YouTube** | Search videos or channels; paginated via continuation token (~20 results/page) | 1/page |
| **Get Latest Videos** (Channel) | The ~15 newest videos of a channel via RSS: **free, no credits** | Free |
| **Search Channel Videos** | Search within one channel (@handle, URL, or UC channel ID) | 1/page |
| **List Channel Videos** | Paginated channel uploads, ~100 per page | 1/page |
| **List Playlist Videos** | Paginated playlist videos: PL, UU, LL, FL, and OL lists | 1/page |

### Pagination

Search, channel, and playlist listings return a `continuation_token` when more results exist. Feed it into the operation's **Continuation Token** field to fetch the next page; the other parameters are then ignored (the token encodes them).

### Get Transcript output formats

- **Markdown with metadata**: a Markdown document with a title/channel/length header followed by the transcript text. Ready to drop into LLM prompts, notes, or docs.
- **Structured JSON**: timestamped segments plus the metadata block, for downstream processing.

### Example workflows

- [TranscriptAPI workflow library](https://transcriptapi.com/workflows): ready-made YouTube transcript automations you can adapt to this node's operations.
- Summarize new channel uploads: Get Latest Videos (free) into Get Transcript (Markdown) into your LLM node of choice.
- Research sweep: Search YouTube into Get Transcript (JSON) per result, paginated with the continuation token.

> Note: installing from the n8n Cloud nodes panel becomes available only after n8n verification; self-hosted instances can install the package by name today.

## Compatibility

Requires n8n version 1.0 or later and Node.js 18.10+.

## Resources

- [TranscriptAPI documentation](https://transcriptapi.com/docs)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- Family: [MCP server](https://github.com/ZeroPointRepo/youtube-mcp) · [agent skills](https://github.com/ZeroPointRepo/youtube-skills)

## Disclosure

TranscriptAPI is an independent product and is not affiliated with or endorsed by YouTube or Google. Use of this node is subject to the [TranscriptAPI terms](https://transcriptapi.com/terms).

## License

[MIT](LICENSE)
