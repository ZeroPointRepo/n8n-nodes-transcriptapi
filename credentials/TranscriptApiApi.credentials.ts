import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class TranscriptApiApi implements ICredentialType {
	name = 'transcriptApiApi';

	displayName = 'TranscriptAPI API';

	documentationUrl = 'https://transcriptapi.com/docs';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'Your TranscriptAPI API key (starts with "sk_"). Create one at https://transcriptapi.com: 100 free credits, no card (one-time).',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	// Credential verification uses the FREE video-info endpoint; it validates the
	// key without consuming any credits.
	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://transcriptapi.com/api/v2',
			url: '/youtube/info',
			qs: {
				video_url: 'dQw4w9WgXcQ',
			},
		},
	};
}
