export default {
	// Header
	navLures: 'Lures',
	addLure: 'Add Lure',
	addSpot: 'Add Spot',
	addCatch: 'Add Catch',
	settingsBackupRestore: 'Backup & Restore',

	// Spots
	spotNameLabel: 'Name',
	spotLocationLabel: 'Location',
	spotNotesLabel: 'Notes',
	spotTagsLabel: 'Tags',
	spotPhotosLabel: 'Photos',
	spotSave: 'Save Spot',
	spotLocationRequired: 'A location is required — click the map to place a pin.',
	spotClickToPlace: 'Click on the map to pin the spot',
	spotLocating: 'Detecting your location…',
	spotUseMyLocation: 'Use my location',
	spotNoSpots: 'No spots yet',
	spotNoSpotsHint: 'Add your first fishing spot to get started.',
	spotGetDirections: 'Get Directions',
	spotCoords: 'Coordinates',
	spotPhotoCount: 'photos',
	spotNotesPlaceholder: 'Describe the spot, access notes, tips…',
	spotEditTitle: 'Edit Spot',
	spotSaveChanges: 'Save Changes',
	spotDelete: 'Delete Spot',
	spotDeleteConfirm: 'Delete this spot? This cannot be undone.',
	spotRemovePhoto: 'Remove photo',
	spotAddPhotos: 'Add Photos',
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
	lightConditions: 'Light Conditions',
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
	navSpots: 'Spots',
	navCatches: 'Catches',
	navQrCodes: 'QR Codes',
	navSettings: 'Settings',
	qrCodesTitle: 'Missing QR Labels',
	noUnlabeledLures: 'All lures have been labeled.',
	printQrCodes: 'Print QR Codes',
	placeLabel: 'Place Label',

	// Catches
	catchNoItems: 'No catches yet',
	catchNoItemsHint: 'Log your first fishing catch to get started.',
	catchDateLabel: 'Date & Time',
	catchSpeciesLabel: 'Species',
	catchWeightLabel: 'Weight (g)',
	catchLengthLabel: 'Length (cm)',
	catchSpotLabel: 'Spot',
	catchLureLabel: 'Lure',
	catchNotesPlaceholder: 'Conditions, bait used, notes…',
	catchSave: 'Log Catch',
	catchEditTitle: 'Edit Catch',
	catchDelete: 'Delete Catch',
	catchDeleteConfirm: 'Delete this catch record? This cannot be undone.',
	catchSaveChanges: 'Save Changes',
	catchAddPhotos: 'Add Photos',
	catchNoSpot: 'No spot',
	catchNoLure: 'No lure',
	catchFilterLast30: 'Last 30 days',
	catchFilterLast365: 'Last year',
	catchFilterCustom: 'Custom range',

	// Errors
	nameRequired: 'Name is required',
	photoRequired: 'A photo is required',
	speciesRequired: 'Species is required',
	locationRequired: 'A location is required — click the map to place a pin.',

	// Predefined lure types
	lureTypes: [
		'Crankbait', 'Jerkbait', 'Popper', 'Stickbait', 'Swimbait', 'Twitchbait', 'Wobbler',
		'Creature Bait', 'Frog', 'Rubber Fish', 'Insect', 'Crawfish', 'Soft Jerk', 'Tube', 'Twister / Grub',
		'Spinnerbait', 'Spoon', 'Buzzbait', 'Chatterbait', 'Jig Spinner', 'Spinner'
	],
} as const;
