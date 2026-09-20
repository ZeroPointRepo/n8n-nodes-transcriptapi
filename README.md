# n8n-nodes-transcriptapi

**TranscriptAPI: hosted YouTube transcript + video-discovery API for AI agents.** Also available as an [MCP server](https://github.com/ZeroPointRepo/youtube-mcp) and [agent skills](https://github.com/ZeroPointRepo/youtube-skills).

Fetch YouTube transcripts and video metadata, search YouTube, and browse channels and playlists from one n8n node, via [TranscriptAPI](https://transcriptapi.com). For n8n users building content pipelines, research workflows, or channel-monitoring automations.

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

The credential test calls the video-info endpoint; it does not draw from your credit balance.

## Operations

One node, eleven operations:

| Operation | What it does | Credits |
|---|---|---|
| **Get Transcript** | Transcript of a video (full URL, youtu.be, Shorts, or bare ID) as **Markdown with metadata** or **structured JSON**; optional preferred language | 1 |
| **Get Video Metadata** | Rich video metadata: view/like counts, publish date, description, channel, optional `details` (duration, category, tags, caption tracks) and/or `related` videos | 1 |
| **Search YouTube** | Search videos, channels, playlists, or movies; optional sort/upload-date/duration/feature filters; paginated via continuation token (~20 results/page) | 1/page |
| **Get Latest Videos** (Channel) | The ~15 newest videos of a channel via RSS | Free |
| **Get Channel Info** | Channel profile: title, handle, verified flag, counts, description, tags, thumbnails, banners, available tabs | 1 |
| **Search Channel Videos** | Search within one channel (@handle, URL, or UC channel ID) | 1/page |
| **List Channel Videos** | Paginated channel feed: uploads ~100/page, Shorts and streams ~48/page (pick the Feed field) | 1/page |
| **List Channel Playlists** | Paginated list of a channel's playlists | 1/page |
| **List Channel Posts** | Paginated community (Posts tab) content: text, attachments, like counts | 1/page |
| **Get Channel Sections** | Curated channel sections (Home shelves, podcasts, or releases) | 1 |
| **List Playlist Videos** | Paginated playlist videos: PL, UU, LL, FL, and OL lists | 1/page |

## When to use what

**Transcript vs. metadata:** use **Get Transcript** when the job needs what was said in the video. Use **Get Video Metadata** when the job needs facts about the video (counts, publish date, description, duration, tags, related videos) without spending a call on captions.

**Picking a channel operation:**

| Job | Operation |
|---|---|
| Check a channel's size and which tabs it exposes before deciding what to fetch | **Get Channel Info** |
| Monitor a channel for new uploads on a schedule | **Get Latest Videos** |
| Find a specific topic inside one channel's back catalog | **Search Channel Videos** |
| Pull a channel's entire uploads, Shorts, or live-stream feed | **List Channel Videos** (set Feed) |
| List the playlists a channel has published | **List Channel Playlists** |
| Read a channel's community announcements | **List Channel Posts** |
| See how a channel curates its own homepage | **Get Channel Sections** |
| Process every video in one playlist | **List Playlist Videos** |

### Pagination

Search, channel, and playlist listings return a `continuation_token` when more results exist. Feed it into the operation's **Continuation Token** field to fetch the next page; the other parameters are then ignored (the token encodes them), except **List Channel Videos**, where you should repeat the same **Feed** value on every page.

## Use cases

- **Watch a Shorts feed and archive transcripts.** Schedule Trigger, then **List Channel Videos** (Feed: shorts), then **Get Transcript** per video, then store the result.
- **Morning digest of new uploads.** Schedule Trigger, then **Get Latest Videos**, then **Get Transcript** (Markdown), then your LLM node.
- **Screen before you transcribe.** **Search YouTube**, then **Get Video Metadata** to check view count and publish date, then **Get Transcript** only for the ones worth it.

## Costs

A successful call costs 1 credit, except **Get Latest Videos**, the only free operation in this node. Paginated operations (Search YouTube, Search Channel Videos, List Channel Videos, List Channel Playlists, List Channel Posts, List Playlist Videos) cost 1 credit per page. Failed calls and rate-limited (429) calls cost 0.

### Get Transcript output formats

- **Markdown with metadata**: a Markdown document with a title/channel/length header followed by the transcript text. Ready to drop into LLM prompts, notes, or docs.
- **Structured JSON**: timestamped segments plus the metadata block, for downstream processing.

> Note: installing from the n8n Cloud nodes panel becomes available only after n8n verification; self-hosted instances can install the package by name today.

## Compatibility

Requires n8n version 1.0 or later and Node.js 18.10+.

## Resources

- TranscriptAPI documentation: [https://transcriptapi.com/docs](https://transcriptapi.com/docs)
- REST API reference: [https://transcriptapi.com/docs/api](https://transcriptapi.com/docs/api)
- MCP reference: [https://transcriptapi.com/docs/mcp](https://transcriptapi.com/docs/mcp)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- Family: [MCP server](https://github.com/ZeroPointRepo/youtube-mcp) · [agent skills](https://github.com/ZeroPointRepo/youtube-skills) · [CrewAI tools](https://github.com/ZeroPointRepo/crewai-transcriptapi)

## Disclosure

TranscriptAPI is an independent product and is not affiliated with or endorsed by YouTube or Google. Use of this node is subject to the [TranscriptAPI terms](https://transcriptapi.com/terms).

## License

[MIT](LICENSE)
