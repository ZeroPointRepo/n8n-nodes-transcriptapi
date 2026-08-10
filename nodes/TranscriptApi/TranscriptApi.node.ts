import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestOptions,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

const BASE_URL = 'https://transcriptapi.com/api/v2';

/**
 * Compose the "Markdown with metadata" transcript output: a small front-matter
 * style header from the metadata block followed by the plain transcript text.
 */
function toMarkdown(response: IDataObject): string {
	const metadata = (response.metadata ?? {}) as IDataObject;
	const lines: string[] = [];
	const title = metadata.title ?? response.title;
	if (title) lines.push(`# ${String(title)}`);
	const fields: Array<[string, unknown]> = [
		['Channel', metadata.author ?? metadata.channelTitle],
		['Video ID', response.video_id ?? metadata.videoId],
		['Length', response.lengthText ?? metadata.lengthText],
		['Language', response.language ?? (response.main_language as IDataObject | undefined)?.language_code],
	];
	const meta = fields
		.filter(([, v]) => v !== undefined && v !== null && v !== '')
		.map(([k, v]) => `- **${k}:** ${String(v)}`);
	if (meta.length > 0) {
		lines.push('', ...meta, '');
	}
	const transcript = response.transcript;
	if (typeof transcript === 'string') {
		lines.push(transcript);
	} else if (Array.isArray(transcript)) {
		lines.push(
			transcript
				.map((segment) => (typeof segment === 'string' ? segment : String((segment as IDataObject).text ?? '')))
				.join(' '),
		);
	}
	return lines.join('\n');
}

export class TranscriptApi implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'TranscriptAPI',
		name: 'transcriptApi',
		icon: 'file:transcriptapi.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description:
			'Fetch YouTube transcripts and discover videos, channels, and playlists via TranscriptAPI',
		defaults: {
			name: 'TranscriptAPI',
		},
		inputs: ['main'],
		outputs: ['main'],
		usableAsTool: true,
		credentials: [
			{
				name: 'transcriptApiApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Video', value: 'video' },
					{ name: 'Search', value: 'search' },
					{ name: 'Channel', value: 'channel' },
					{ name: 'Playlist', value: 'playlist' },
				],
				default: 'video',
			},

			// ── Video ────────────────────────────────────────────────────────────
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['video'] } },
				options: [
					{
						name: 'Get Transcript',
						value: 'getTranscript',
						description: 'Fetch the transcript of a YouTube video (1 credit)',
						action: 'Get a video transcript',
					},
				],
				default: 'getTranscript',
			},
			{
				displayName: 'Video URL or ID',
				name: 'videoUrl',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['video'] } },
				default: '',
				placeholder: 'https://www.youtube.com/watch?v=VV_JW4iCni0 or VV_JW4iCni0',
				description:
					'Full YouTube URL (watch, youtu.be, embed, or Shorts) or the bare 11-character video ID',
			},
			{
				displayName: 'Output Format',
				name: 'outputFormat',
				type: 'options',
				displayOptions: { show: { resource: ['video'] } },
				options: [
					{
						name: 'Markdown With Metadata',
						value: 'markdown',
						description: 'Transcript as Markdown with title/channel/length header',
					},
					{
						name: 'Structured JSON',
						value: 'json',
						description: 'Timestamped segments plus metadata as structured JSON',
					},
				],
				default: 'markdown',
			},
			{
				displayName: 'Language',
				name: 'language',
				type: 'string',
				displayOptions: { show: { resource: ['video'] } },
				default: '',
				placeholder: 'en',
				description:
					'Preferred transcript language code (e.g. "en", "de"). Leave empty for the default. Tip: the free video-info endpoint lists available languages.',
			},

			// ── Search ───────────────────────────────────────────────────────────
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['search'] } },
				options: [
					{
						name: 'Search YouTube',
						value: 'searchYoutube',
						description: 'Search YouTube for videos or channels (1 credit/page)',
						action: 'Search you tube',
					},
				],
				default: 'searchYoutube',
			},
			{
				displayName: 'Query',
				name: 'query',
				placeholder: 'machine learning tutorials',
				type: 'string',
				displayOptions: { show: { resource: ['search'], continuation: [''] } },
				default: '',
				description: 'Search query (1-200 characters). Required for the first page.',
			},
			{
				displayName: 'Result Type',
				name: 'searchType',
				type: 'options',
				displayOptions: { show: { resource: ['search'], continuation: [''] } },
				options: [
					{ name: 'Videos', value: 'video' },
					{ name: 'Channels', value: 'channel' },
				],
				default: 'video',
				description: 'What to search for (first page only)',
			},
			{
				displayName: 'Continuation Token',
				name: 'continuation',
				type: 'string',
				displayOptions: { show: { resource: ['search'] } },
				default: '',
				description:
					'Continuation token from a previous response to fetch the next page. When set, Query and Result Type are ignored.',
			},

			// ── Channel ──────────────────────────────────────────────────────────
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['channel'] } },
				options: [
					{
						name: 'Get Latest Videos',
						value: 'channelLatest',
						description: 'The ~15 newest videos of a channel via RSS: FREE, no credits',
						action: 'Get the latest channel videos',
					},
					{
						name: 'Search Channel Videos',
						value: 'channelSearch',
						description: 'Search within one channel (1 credit/page)',
						action: 'Search within a channel',
					},
					{
						name: 'List Channel Videos',
						value: 'channelVideos',
						description: 'Paginated channel uploads, ~100 per page (1 credit/page)',
						action: 'List channel videos',
					},
				],
				default: 'channelLatest',
			},
			{
				displayName: 'Channel',
				name: 'channel',
				type: 'string',
				displayOptions: { show: { resource: ['channel'] } },
				default: '',
				placeholder: '@handle, channel URL, or UC channel ID',
				description:
					'The channel as an @handle, full channel URL, or UC channel ID. Required for the first page.',
			},
			{
				displayName: 'Query',
				name: 'channelQuery',
				placeholder: 'artificial intelligence',
				type: 'string',
				displayOptions: { show: { resource: ['channel'], operation: ['channelSearch'] } },
				default: '',
				description: 'Search query within the channel (1-200 characters, first page)',
			},
			{
				displayName: 'Continuation Token',
				name: 'channelContinuation',
				type: 'string',
				displayOptions: {
					show: { resource: ['channel'], operation: ['channelSearch', 'channelVideos'] },
				},
				default: '',
				description:
					'Continuation token from a previous response to fetch the next page. When set, the other parameters are ignored.',
			},

			// ── Playlist ─────────────────────────────────────────────────────────
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['playlist'] } },
				options: [
					{
						name: 'List Playlist Videos',
						value: 'playlistVideos',
						description: 'Paginated playlist videos: PL, UU, LL, FL, and OL lists (1 credit/page)',
						action: 'List playlist videos',
					},
				],
				default: 'playlistVideos',
			},
			{
				displayName: 'Playlist',
				name: 'playlist',
				type: 'string',
				displayOptions: { show: { resource: ['playlist'] } },
				default: '',
				placeholder: 'Playlist URL or ID (PL, UU, LL, FL, or OL prefix)',
				description: 'The playlist as a full URL or a playlist ID. Required for the first page.',
			},
			{
				displayName: 'Continuation Token',
				name: 'playlistContinuation',
				type: 'string',
				displayOptions: { show: { resource: ['playlist'] } },
				default: '',
				description:
					'Continuation token from a previous response to fetch the next page. When set, Playlist is ignored.',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				let url = '';
				const qs: IDataObject = {};

				if (resource === 'video' && operation === 'getTranscript') {
					const outputFormat = this.getNodeParameter('outputFormat', i) as string;
					url = '/youtube/transcript';
					qs.video_url = this.getNodeParameter('videoUrl', i) as string;
					qs.send_metadata = 'true';
					qs.format = outputFormat === 'markdown' ? 'text' : 'json';
					const language = this.getNodeParameter('language', i, '') as string;
					if (language) qs.language = language;
				} else if (resource === 'search' && operation === 'searchYoutube') {
					url = '/youtube/search';
					const continuation = this.getNodeParameter('continuation', i, '') as string;
					if (continuation) {
						qs.continuation = continuation;
					} else {
						qs.q = this.getNodeParameter('query', i) as string;
						qs.type = this.getNodeParameter('searchType', i) as string;
					}
				} else if (resource === 'channel') {
					if (operation === 'channelLatest') {
						url = '/youtube/channel/latest';
						qs.channel = this.getNodeParameter('channel', i) as string;
					} else if (operation === 'channelSearch') {
						url = '/youtube/channel/search';
						const continuation = this.getNodeParameter('channelContinuation', i, '') as string;
						if (continuation) {
							qs.continuation = continuation;
						} else {
							qs.channel = this.getNodeParameter('channel', i) as string;
							qs.q = this.getNodeParameter('channelQuery', i) as string;
						}
					} else if (operation === 'channelVideos') {
						url = '/youtube/channel/videos';
						const continuation = this.getNodeParameter('channelContinuation', i, '') as string;
						if (continuation) {
							qs.continuation = continuation;
						} else {
							qs.channel = this.getNodeParameter('channel', i) as string;
						}
					}
				} else if (resource === 'playlist' && operation === 'playlistVideos') {
					url = '/youtube/playlist/videos';
					const continuation = this.getNodeParameter('playlistContinuation', i, '') as string;
					if (continuation) {
						qs.continuation = continuation;
					} else {
						qs.playlist = this.getNodeParameter('playlist', i) as string;
					}
				}

				if (url === '') {
					throw new NodeOperationError(
						this.getNode(),
						`Unsupported operation "${operation}" for resource "${resource}"`,
						{ itemIndex: i },
					);
				}

				const options: IHttpRequestOptions = {
					method: 'GET',
					baseURL: BASE_URL,
					url,
					qs,
					json: true,
				};

				const response = (await this.helpers.httpRequestWithAuthentication.call(
					this,
					'transcriptApiApi',
					options,
				)) as IDataObject;

				if (resource === 'video') {
					const outputFormat = this.getNodeParameter('outputFormat', i) as string;
					if (outputFormat === 'markdown') {
						returnData.push({
							json: {
								markdown: toMarkdown(response),
								video_id: response.video_id ?? null,
								metadata: response.metadata ?? null,
							},
							pairedItem: { item: i },
						});
						continue;
					}
				}

				returnData.push({ json: response, pairedItem: { item: i } });
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
