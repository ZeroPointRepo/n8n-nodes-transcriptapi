# n8n-nodes-transcriptapi

**TranscriptAPI: hosted YouTube transcript + video-discovery API for AI agents.** Also available as an [MCP server](https://github.com/ZeroPointRepo/youtube-mcp) and [agent skills](https://github.com/ZeroPointRepo/youtube-skills).

This is an n8n community node for [TranscriptAPI](https://transcriptapi.com): YouTube transcripts and video discovery for n8n. Fetch transcripts as Markdown or structured JSON, pull video metadata, search YouTube for videos/channels/playlists/movies, and browse channel profiles, uploads, Shorts, streams, playlists, community posts, and curated sections, all from one node.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Why this node

Most "YouTube for n8n" setups mean gluing together the Google YouTube Data API (quotas, OAuth, a separate console project) or an HTTP Request node hitting an undocumented scraper. This node wraps a single hosted backend, [TranscriptAPI](https://transcriptapi.com), behind one credential and eleven operations: transcripts, video metadata, search, and a full channel/playlist toolkit, all returning clean JSON your next node can consume directly.

## Installation

Follow the [installation guide for community nodes](https://docs.n8n.io/integrations/community-nodes/installation/):

1. In n8n, go to **Settings → Community Nodes**.
2. Select **Install**, enter `n8n-nodes-transcriptapi`, and confirm.

## Credentials

You need a TranscriptAPI API key (starts with `sk_`):

1. Create an account at [transcriptapi.com](https://transcriptapi.com): **100 free credits, no card (one-time)**; paid plans from **$5/mo (1,000 credits)**.
2. Create an API key on the dashboard.
3. In n8n, create a **TranscriptAPI API** credential and paste the key.

The credential test calls the free /youtube/info endpoint.

## Operations

One node, eleven operations:

| Operation | What it does | Credits |
|---|---|---|
| **Get Transcript** | Transcript of a video (full URL, youtu.be, Shorts, or bare ID) as **Markdown with metadata** or **structured JSON**; optional preferred language | 1 |
| **Get Video Metadata** | Video metadata: view/like counts, publish date, description, channel, optional `details` (duration, category, tags, caption tracks) and/or `related` videos | 1 |
| **Search YouTube** | Search videos, channels, playlists, or movies; optional sort/upload-date/duration/feature filters; paginated via continuation token (~20 results/page) | 1/page |
| **Get Latest Videos** (Channel) | The ~15 newest videos of a channel via RSS | Free |
| **Get Channel Info** | Channel profile: title, handle, verified flag, counts, description, tags, thumbnails, banners, available tabs | 1 |
| **Search Channel Videos** | Search within one channel (@handle, URL, or UC channel ID) | 1/page |
| **List Channel Videos** | Paginated channel feed: uploads ~100/page, Shorts and streams ~48/page (pick the Feed field); optional **Sort** (latest / popular / oldest) | 1/page |
| **List Channel Playlists** | Paginated list of a channel's playlists | 1/page |
| **List Channel Posts** | Paginated community (Posts tab) content: text, attachments, like counts | 1/page |
| **Get Channel Sections** | Curated channel sections (Home shelves, podcasts, or releases) | 1 |
| **List Playlist Videos** | Paginated playlist videos: PL, UU, LL, FL, and OL lists | 1/page |

## When to use what

**Transcript vs. metadata:** use **Get Transcript** when the job needs what was said in the video. Use **Get Video Metadata** when the job needs facts about the video (counts, publish date, description, duration, tags, related videos) without pulling its transcript.

| Job | Operation(s) |
|---|---|
| Get the words spoken in a video: summarize, translate, quote, index for search | **Get Transcript** |
| A video's likes, description links, publish date, and related videos, without pulling its transcript | **Get Video Metadata** |
| Find videos, channels, playlists, or movies about a topic before pulling anything else | **Search YouTube** |
| Monitor a channel for new uploads on a schedule, free | **Get Latest Videos** |
| Check a channel's size and which tabs it exposes before deciding what to fetch | **Get Channel Info** |
| Find a specific topic inside one channel's back catalog | **Search Channel Videos** |
| Pull a channel's entire catalog: uploads, Shorts, or live streams | **List Channel Videos** (set Feed) |
| Rank a channel's back catalog by views, or walk it oldest-first | **List Channel Videos** (set Sort) |
| Build a transcription queue from a channel's playlists | **List Channel Playlists** then **List Playlist Videos** |
| Read a channel's community announcements | **List Channel Posts** |
| See how a channel curates its own homepage (featured shelves, podcasts, releases) | **Get Channel Sections** |
| Process every video in one playlist: a course, a lecture series, a collection | **List Playlist Videos** |

### Pagination

Search, channel, and playlist listings return a `continuation_token` when more results exist. Feed it into the operation's **Continuation Token** field to fetch the next page; the other parameters are then ignored (the token encodes them), except **List Channel Videos**, where you should repeat the same **Feed** and **Sort** values on every page.

### Sorting channel videos

**Sorting.** Add sort=latest, popular, or oldest to channel/videos to get a channel's videos in the order you want, for example its most-popular uploads first. A sorted page returns about 30 videos (an unsorted page returns about 100), and every page costs the same 1 credit.

When paging, send the same Sort value on each request.

Every item in the response carries `members_only`. It is `false` unless YouTube badges the video "Members only", and members-only items have no `viewCountText`, because YouTube does not publish view counts for membership content. On the uploads feed and on playlists it is always `false`.

Items from **Feed: Streams** also carry `publishedTimeText` (for example `Streamed 2 years ago`) and `lengthText`. **Feed: Shorts** returns `null` for both: YouTube's Shorts grid publishes neither a duration nor a publish date.

### Get Transcript output formats

- **Markdown with metadata**: a Markdown document with a title/channel/length header followed by the transcript text. Ready to drop into LLM prompts, notes, or docs.
- **Structured JSON**: timestamped segments plus the metadata block, for downstream processing.

## Use cases

| Use case | Node setup |
|---|---|
| **Summarize new uploads every morning** | Schedule Trigger -> **Get Latest Videos** -> **Get Transcript** (Markdown) -> your LLM node |
| **Research sweep on a topic** | **Search YouTube** -> Split In Batches -> **Get Transcript** (JSON) per result, paginate with the continuation token |
| **Screen before transcribing** | **Search YouTube** -> **Get Video Metadata** (check view count / publish date) -> IF node -> **Get Transcript** only for the ones worth it |
| **Archive a channel's full catalog** | **Get Channel Info** (confirm tabs) -> **List Channel Videos** (Feed: videos) -> loop pages with the continuation token -> **Get Transcript** per video |
| **Find a channel's greatest hits** | **List Channel Videos** (Feed: videos, Sort: Popular) -> Limit to the top N -> **Get Transcript** per video -> your LLM node |
| **Build a playlist-based course index** | **List Channel Playlists** -> **List Playlist Videos** per playlist -> **Get Transcript** per video |
| **Track a channel's community posts** | Schedule Trigger -> **List Channel Posts** -> filter for new `postId`s -> notify (Slack/email node) |
| **Competitor / topic watch inside one channel** | **Search Channel Videos** with your keyword -> **Get Transcript** on matches |

### Example workflows

- [TranscriptAPI workflow library](https://transcriptapi.com/workflows): ready-made YouTube transcript automations you can adapt to this node's operations.

## Costs

A successful call costs 1 credit, except **Get Latest Videos**, the only free operation in this node. Paginated operations (Search YouTube, Search Channel Videos, List Channel Videos, List Channel Playlists, List Channel Posts, List Playlist Videos) cost 1 credit per page. Failed calls and rate-limited (429) calls cost 0.

> Note: installing from the n8n Cloud nodes panel becomes available only after n8n verification; self-hosted instances can install the package by name today.

## Compatibility

Requires n8n version 1.0 or later and Node.js 18.10+.

## Resources

- [TranscriptAPI documentation](https://transcriptapi.com/docs)
- [REST API reference](https://transcriptapi.com/docs/api)
- [MCP reference](https://transcriptapi.com/docs/mcp)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- Family: [MCP server](https://github.com/ZeroPointRepo/youtube-mcp) · [agent skills](https://github.com/ZeroPointRepo/youtube-skills) · [CrewAI tools](https://github.com/ZeroPointRepo/crewai-transcriptapi)

## Disclosure

TranscriptAPI is an independent product and is not affiliated with or endorsed by YouTube or Google. Use of this node is subject to the [TranscriptAPI terms](https://transcriptapi.com/terms).

## License

[MIT](LICENSE)
