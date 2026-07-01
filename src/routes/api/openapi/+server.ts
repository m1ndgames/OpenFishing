import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

const spec = {
	openapi: '3.0.3',
	info: {
		title: 'OpenFishing API',
		version: '1.0.0',
		description:
			"Read-only REST API for OpenFishing. When auth is enabled, all endpoints require a per-user `Bearer` token (the user's API token, found on their account page) and return only that user's data."
	},
	servers: [{ url: '/api/v1' }],
	security: [{ bearerAuth: [] }],
	components: {
		securitySchemes: {
			bearerAuth: {
				type: 'http',
				scheme: 'bearer',
				description: "The user's API token (shown on their account page)"
			}
		},
		schemas: {
			Lure: {
				type: 'object',
				properties: {
					id: { type: 'string', format: 'uuid' },
					lureNumber: { type: 'integer', nullable: true },
					name: { type: 'string' },
					brand: { type: 'string', nullable: true },
					type: { type: 'string', nullable: true },
					color: { type: 'string', nullable: true },
					weight: { type: 'number', nullable: true, description: 'Weight in grams' },
					size: { type: 'string', nullable: true },
					notes: { type: 'string', nullable: true },
					species: { type: 'string', nullable: true, description: 'Space-separated species list' },
					runningDepth: { type: 'string', nullable: true },
					waterType: { type: 'string', nullable: true },
					lightConditions: {
						type: 'integer',
						nullable: true,
						minimum: 0,
						maximum: 10,
						description: '0 = Night, 10 = Clear'
					},
					amount: { type: 'integer' },
					favourite: { type: 'boolean' },
					qrCoded: { type: 'boolean' },
					lost: { type: 'boolean' },
					shareToken: { type: 'string', format: 'uuid', nullable: true },
					createdAt: { type: 'string', format: 'date-time' },
					updatedAt: { type: 'string', format: 'date-time' },
					tags: { type: 'array', items: { type: 'string' } }
				}
			},
			Spot: {
				type: 'object',
				properties: {
					id: { type: 'string', format: 'uuid' },
					name: { type: 'string' },
					lat: { type: 'number' },
					lng: { type: 'number' },
					notes: { type: 'string', nullable: true },
					shareToken: { type: 'string', format: 'uuid', nullable: true },
					createdAt: { type: 'string', format: 'date-time' },
					updatedAt: { type: 'string', format: 'date-time' },
					tags: { type: 'array', items: { type: 'string' } }
				}
			},
			Catch: {
				type: 'object',
				properties: {
					id: { type: 'string', format: 'uuid' },
					caughtAt: { type: 'string', format: 'date-time' },
					species: { type: 'string', nullable: true },
					weightG: { type: 'number', nullable: true, description: 'Weight in grams' },
					lengthCm: { type: 'number', nullable: true, description: 'Length in centimetres' },
					lat: { type: 'number', nullable: true },
					lng: { type: 'number', nullable: true },
					notes: { type: 'string', nullable: true },
					catchAndRelease: { type: 'boolean' },
					presentation: { type: 'string', nullable: true },
					biteIndex: {
						type: 'number',
						nullable: true,
						minimum: 0,
						maximum: 10,
						description: 'Bite index at time of catch (0–10)'
					},
					lureId: { type: 'string', format: 'uuid', nullable: true },
					shareToken: { type: 'string', format: 'uuid', nullable: true },
					createdAt: { type: 'string', format: 'date-time' },
					updatedAt: { type: 'string', format: 'date-time' },
					lure: {
						nullable: true,
						type: 'object',
						properties: {
							id: { type: 'string', format: 'uuid' },
							name: { type: 'string' }
						}
					}
				}
			},
			Rod: {
				type: 'object',
				properties: {
					id: { type: 'string', format: 'uuid' },
					brand: { type: 'string', nullable: true },
					model: { type: 'string' },
					lengthM: { type: 'number', nullable: true, description: 'Length in metres' },
					castingWeight: { type: 'string', nullable: true, description: 'Casting weight range, e.g. "7–28g"' },
					type: { type: 'string', nullable: true },
					notes: { type: 'string', nullable: true },
					createdAt: { type: 'string', format: 'date-time' },
					updatedAt: { type: 'string', format: 'date-time' }
				}
			},
			Reel: {
				type: 'object',
				properties: {
					id: { type: 'string', format: 'uuid' },
					brand: { type: 'string', nullable: true },
					model: { type: 'string' },
					size: { type: 'string', nullable: true },
					notes: { type: 'string', nullable: true },
					createdAt: { type: 'string', format: 'date-time' },
					updatedAt: { type: 'string', format: 'date-time' },
					currentLine: {
						nullable: true,
						type: 'object',
						properties: {
							lineId: { type: 'string', format: 'uuid', nullable: true },
							brand: { type: 'string', nullable: true },
							model: { type: 'string', nullable: true },
							type: { type: 'string', nullable: true },
							spooledAt: { type: 'string', format: 'date-time' }
						}
					}
				}
			},
			Line: {
				type: 'object',
				properties: {
					id: { type: 'string', format: 'uuid' },
					brand: { type: 'string', nullable: true },
					model: { type: 'string' },
					type: { type: 'string', nullable: true, description: 'e.g. Mono, Braid, Fluoro' },
					diameterMm: { type: 'number', nullable: true, description: 'Diameter in millimetres' },
					strengthKg: { type: 'number', nullable: true, description: 'Break strength in kg' },
					notes: { type: 'string', nullable: true },
					createdAt: { type: 'string', format: 'date-time' },
					updatedAt: { type: 'string', format: 'date-time' }
				}
			},
			Combo: {
				type: 'object',
				properties: {
					id: { type: 'string', format: 'uuid' },
					name: { type: 'string' },
					terminalTackle: { type: 'string', nullable: true },
					notes: { type: 'string', nullable: true },
					createdAt: { type: 'string', format: 'date-time' },
					updatedAt: { type: 'string', format: 'date-time' },
					rod: {
						nullable: true,
						type: 'object',
						properties: {
							id: { type: 'string', format: 'uuid' },
							brand: { type: 'string', nullable: true },
							model: { type: 'string' },
							type: { type: 'string', nullable: true }
						}
					},
					reel: {
						nullable: true,
						type: 'object',
						properties: {
							id: { type: 'string', format: 'uuid' },
							brand: { type: 'string', nullable: true },
							model: { type: 'string' },
							size: { type: 'string', nullable: true }
						}
					},
					currentLine: {
						nullable: true,
						type: 'object',
						properties: {
							lineId: { type: 'string', format: 'uuid', nullable: true },
							brand: { type: 'string', nullable: true },
							model: { type: 'string', nullable: true },
							type: { type: 'string', nullable: true },
							spooledAt: { type: 'string', format: 'date-time' }
						}
					}
				}
			},
			Error: {
				type: 'object',
				properties: {
					error: { type: 'string' }
				}
			}
		}
	},
	paths: {
		'/lures': {
			get: {
				summary: 'List all lures',
				operationId: 'listLures',
				tags: ['Lures'],
				responses: {
					'200': {
						description: 'Array of lures',
						content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Lure' } } } }
					},
					'401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
				}
			}
		},
		'/lures/{id}': {
			get: {
				summary: 'Get a lure by ID',
				operationId: 'getLure',
				tags: ['Lures'],
				parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
				responses: {
					'200': { description: 'Lure', content: { 'application/json': { schema: { $ref: '#/components/schemas/Lure' } } } },
					'401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
					'404': { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
				}
			}
		},
		'/spots': {
			get: {
				summary: 'List all spots',
				operationId: 'listSpots',
				tags: ['Spots'],
				responses: {
					'200': {
						description: 'Array of spots',
						content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Spot' } } } }
					},
					'401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
				}
			}
		},
		'/spots/{id}': {
			get: {
				summary: 'Get a spot by ID',
				operationId: 'getSpot',
				tags: ['Spots'],
				parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
				responses: {
					'200': { description: 'Spot', content: { 'application/json': { schema: { $ref: '#/components/schemas/Spot' } } } },
					'401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
					'404': { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
				}
			}
		},
		'/catches': {
			get: {
				summary: 'List all catches',
				operationId: 'listCatches',
				tags: ['Catches'],
				responses: {
					'200': {
						description: 'Array of catches',
						content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Catch' } } } }
					},
					'401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
				}
			}
		},
		'/catches/{id}': {
			get: {
				summary: 'Get a catch by ID',
				operationId: 'getCatch',
				tags: ['Catches'],
				parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
				responses: {
					'200': { description: 'Catch', content: { 'application/json': { schema: { $ref: '#/components/schemas/Catch' } } } },
					'401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
					'404': { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
				}
			}
		},
		'/rods': {
			get: {
				summary: 'List all rods',
				operationId: 'listRods',
				tags: ['Tackle'],
				responses: {
					'200': { description: 'Array of rods', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Rod' } } } } },
					'401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
				}
			}
		},
		'/rods/{id}': {
			get: {
				summary: 'Get a rod by ID',
				operationId: 'getRod',
				tags: ['Tackle'],
				parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
				responses: {
					'200': { description: 'Rod', content: { 'application/json': { schema: { $ref: '#/components/schemas/Rod' } } } },
					'401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
					'404': { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
				}
			}
		},
		'/reels': {
			get: {
				summary: 'List all reels (includes current line)',
				operationId: 'listReels',
				tags: ['Tackle'],
				responses: {
					'200': { description: 'Array of reels', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Reel' } } } } },
					'401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
				}
			}
		},
		'/reels/{id}': {
			get: {
				summary: 'Get a reel by ID (includes current line)',
				operationId: 'getReel',
				tags: ['Tackle'],
				parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
				responses: {
					'200': { description: 'Reel', content: { 'application/json': { schema: { $ref: '#/components/schemas/Reel' } } } },
					'401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
					'404': { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
				}
			}
		},
		'/lines': {
			get: {
				summary: 'List all fishing lines',
				operationId: 'listLines',
				tags: ['Tackle'],
				responses: {
					'200': { description: 'Array of lines', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Line' } } } } },
					'401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
				}
			}
		},
		'/lines/{id}': {
			get: {
				summary: 'Get a fishing line by ID',
				operationId: 'getLine',
				tags: ['Tackle'],
				parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
				responses: {
					'200': { description: 'Line', content: { 'application/json': { schema: { $ref: '#/components/schemas/Line' } } } },
					'401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
					'404': { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
				}
			}
		},
		'/combos': {
			get: {
				summary: 'List all tackle combos (includes rod, reel, current line)',
				operationId: 'listCombos',
				tags: ['Tackle'],
				responses: {
					'200': { description: 'Array of combos', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Combo' } } } } },
					'401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
				}
			}
		},
		'/combos/{id}': {
			get: {
				summary: 'Get a combo by ID',
				operationId: 'getCombo',
				tags: ['Tackle'],
				parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
				responses: {
					'200': { description: 'Combo', content: { 'application/json': { schema: { $ref: '#/components/schemas/Combo' } } } },
					'401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
					'404': { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
				}
			}
		}
	}
};

export const GET: RequestHandler = async () => {
	return json(spec);
};
