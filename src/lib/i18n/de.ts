export default {
	// Header
	addLure: '+ Köder hinzufügen',
	language: 'Sprache',

	// Home
	searchPlaceholder: 'Nach Name, Marke, Typ, Farbe suchen…',
	search: 'Suchen',
	clear: 'Zurücksetzen',
	filterAll: 'Alle',
	filterActive: 'Filter',
	perPage: 'Pro Seite',
	lure_singular: 'Köder',
	lure_plural: 'Köder',
	matching: 'passend zu',
	total: 'gesamt',
	noLuresMatch: 'Keine Köder gefunden für',
	noLuresYet: 'Noch keine Köder',
	addFirstLure: 'Ersten Köder hinzufügen',
	toGetStarted: 'um loszulegen.',

	// Forms – shared
	back: '← Zurück',
	photo: 'Foto',
	uploadPhoto: 'Foto hochladen',
	takePhoto: 'Foto aufnehmen',
	name: 'Name',
	brand: 'Marke',
	type: 'Typ',
	color: 'Farbe',
	weightG: 'Gewicht (g)',
	size: 'Größe',
	tags: 'Tags',
	fishSpecies: 'Zielfisch',
	runningDepth: 'Lauftiefe',
	runningDepth_shallow: 'Flach',
	runningDepth_medium: 'Mittel',
	runningDepth_deep: 'Tief',
	waterType: 'Gewässertyp',
	weather: 'Wetter',
	notes: 'Notizen',
	notesPlaceholder: 'Weitere Details…',
	cancel: 'Abbrechen',

	// Water type options
	waterType_freshwater: 'Süßwasser',
	waterType_saltwater: 'Salzwasser',

	// Add lure
	addLureTitle: 'Köder hinzufügen',
	saveLure: 'Köder speichern',

	// Edit lure
	editLureTitle: 'Köder bearbeiten',
	saveChanges: 'Änderungen speichern',
	deleteLure: 'Köder löschen',
	deleteConfirm: 'Diesen Köder löschen? Dies kann nicht rückgängig gemacht werden.',
	labeled: 'Beschriftet',
	labeledHint: '— Etikett bereits auf Köder/Box angebracht',

	// Detail page
	edit: 'Bearbeiten',
	labeledStatus: 'Beschriftet',
	notLabeledYet: 'Noch kein Etikett',
	scanToOpen: 'Scannen zum Öffnen',

	// Detail
	lureId: 'Köder-Nr.',

	// QR-Codes Seite
	navQrCodes: 'QR-Codes',
	qrCodesTitle: 'Unbeschriftete QR-Codes',
	noUnlabeledLures: 'Alle Köder wurden bereits beschriftet.',
	printQrCodes: 'QR-Codes drucken',
	placeLabel: 'Etikett angebracht',

	// Errors
	nameRequired: 'Name ist erforderlich',

	// Vordefinierte Ködertypen
	lureTypes: [
		'Crankbait', 'Jerkbait', 'Popper', 'Stickbait', 'Swimbait', 'Twitchbait', 'Wobbler',
		'Creature Bait', 'Frosch', 'Gummifisch', 'Insekt', 'Krebs', 'Softjerk', 'Tube', 'Twister / Grub',
		'Spinnerbait', 'Blinker', 'Buzzbait', 'Chatterbait', 'Jig Spinner', 'Spinner', 'Spoon'
	],
} as const;
