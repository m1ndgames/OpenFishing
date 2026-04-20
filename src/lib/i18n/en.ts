export default {
	// Header
	navLures: 'Lures',
	addLure: 'Add Lure',
	language: 'Language',

	// Home
	searchPlaceholder: 'Search…',
	search: 'Search',
	clear: 'Clear',
	filterAll: 'All',
	filterActive: 'filters',
	perPage: 'Per page',
	lure_singular: 'lure',
	lure_plural: 'lures',
	matching: 'matching',
	total: 'total',
	noLuresMatch: 'No lures match',
	noLuresYet: 'No lures yet',
	addFirstLure: 'Add your first lure',
	toGetStarted: 'to get started.',

	// Forms – shared
	back: '← Back',
	photo: 'Photo',
	uploadPhoto: 'Upload Photo',
	takePhoto: 'Take Photo',
	name: 'Name',
	brand: 'Brand',
	type: 'Type',
	color: 'Color',
	weightG: 'Weight (g)',
	size: 'Size',
	tags: 'Tags',
	fishSpecies: 'Fish Species',
	runningDepth: 'Running Depth',
	runningDepth_shallow: 'Shallow',
	runningDepth_medium: 'Medium',
	runningDepth_deep: 'Deep',
	waterType: 'Water Type',
	weather: 'Weather',
	notes: 'Notes',
	notesPlaceholder: 'Any extra details…',
	cancel: 'Cancel',

	// Water type options
	waterType_freshwater: 'Freshwater',
	waterType_saltwater: 'Saltwater',

	// Add lure
	addLureTitle: 'Add Lure',
	saveLure: 'Save Lure',

	// Edit lure
	editLureTitle: 'Edit Lure',
	saveChanges: 'Save Changes',
	deleteLure: 'Delete Lure',
	deleteConfirm: 'Delete this lure? This cannot be undone.',
	labeled: 'Labeled',
	labeledHint: '— label already placed on lure/box',

	// Detail page
	edit: 'Edit',
	labeledStatus: 'Labeled',
	notLabeledYet: 'Not labeled yet',
	scanToOpen: 'Scan to open this lure',

	// Detail
	lureId: 'Lure #',

	// QR codes page
	navQrCodes: 'QR Codes',
	navSettings: 'Settings',
	qrCodesTitle: 'Missing QR Labels',
	noUnlabeledLures: 'All lures have been labeled.',
	printQrCodes: 'Print QR Codes',
	placeLabel: 'Place Label',

	// Errors
	nameRequired: 'Name is required',
	photoRequired: 'A photo is required',

	// Predefined lure types
	lureTypes: [
		'Crankbait', 'Jerkbait', 'Popper', 'Stickbait', 'Swimbait', 'Twitchbait', 'Wobbler',
		'Creature Bait', 'Frog', 'Rubber Fish', 'Insect', 'Crawfish', 'Soft Jerk', 'Tube', 'Twister / Grub',
		'Spinnerbait', 'Spoon', 'Buzzbait', 'Chatterbait', 'Jig Spinner', 'Spinner'
	],
} as const;
