export default {
	// Header
	navLures: 'Köderbox',
	addLure: 'Köder hinzufügen',
	addSpot: 'Stelle hinzufügen',
	addCatch: 'Fang hinzufügen',
	settingsBackupRestore: 'Backup & Wiederherstellen',

	// Spots
	spotNameLabel: 'Name',
	spotLocationLabel: 'Standort',
	spotNotesLabel: 'Notizen',
	spotTagsLabel: 'Tags',
	spotPhotosLabel: 'Fotos',
	spotSave: 'Stelle speichern',
	spotLocationRequired: 'Standort erforderlich — klicke auf die Karte um einen Pin zu setzen.',
	spotClickToPlace: 'Klicke auf die Karte um die Stelle zu markieren',
	spotLocating: 'Standort wird ermittelt…',
	spotUseMyLocation: 'Meinen Standort verwenden',
	spotNoSpots: 'Noch keine Stellen',
	spotNoSpotsHint: 'Füge deine erste Angelstelle hinzu.',
	spotGetDirections: 'Route starten',
	spotCoords: 'Koordinaten',
	spotPhotoCount: 'Fotos',
	spotNotesPlaceholder: 'Stelle beschreiben, Zugang, Tipps…',
	spotEditTitle: 'Stelle bearbeiten',
	spotSaveChanges: 'Änderungen speichern',
	spotDelete: 'Stelle löschen',
	spotDeleteConfirm: 'Diese Stelle löschen? Dies kann nicht rückgängig gemacht werden.',
	spotRemovePhoto: 'Foto entfernen',
	spotAddPhotos: 'Fotos hinzufügen',
	language: 'Sprache',

	// Home
	searchPlaceholder: 'Suche…',
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
	lightConditions: 'Lichtverhältnisse',
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
	navSpots: 'Angelkarte',
	navCatches: 'Fangbuch',
	navQrCodes: 'QR-Codes',
	navSettings: 'Einstellungen',
	qrCodesTitle: 'Fehlende QR-Label',
	noUnlabeledLures: 'Alle Köder wurden bereits beschriftet.',
	printQrCodes: 'QR-Codes drucken',
	placeLabel: 'Etikett angebracht',

	// Catches
	catchNoItems: 'Noch keine Fänge',
	catchNoItemsHint: 'Trage deinen ersten Fang ein.',
	catchDateLabel: 'Datum & Uhrzeit',
	catchSpeciesLabel: 'Fischart',
	catchWeightLabel: 'Gewicht (g)',
	catchLengthLabel: 'Länge (cm)',
	catchSpotLabel: 'Angelstelle',
	catchLureLabel: 'Köder',
	catchNotesPlaceholder: 'Bedingungen, Köder, Notizen…',
	catchSave: 'Fang eintragen',
	catchEditTitle: 'Fang bearbeiten',
	catchDelete: 'Fang löschen',
	catchDeleteConfirm: 'Diesen Fang löschen? Dies kann nicht rückgängig gemacht werden.',
	catchSaveChanges: 'Änderungen speichern',
	catchAddPhotos: 'Fotos hinzufügen',
	catchNoSpot: 'Keine Stelle',
	catchNoLure: 'Kein Köder',
	catchFilterLast30: 'Letzte 30 Tage',
	catchFilterLast365: 'Letztes Jahr',
	catchFilterCustom: 'Eigener Zeitraum',

	// Errors
	nameRequired: 'Name ist erforderlich',
	photoRequired: 'Ein Foto ist erforderlich',
	speciesRequired: 'Fischart ist erforderlich',
	locationRequired: 'Standort erforderlich — klicke auf die Karte um einen Pin zu setzen.',

	// Vordefinierte Ködertypen
	lureTypes: [
		'Crankbait', 'Jerkbait', 'Popper', 'Stickbait', 'Swimbait', 'Twitchbait', 'Wobbler',
		'Creature Bait', 'Frosch', 'Gummifisch', 'Insekt', 'Krebs', 'Softjerk', 'Tube', 'Twister / Grub',
		'Spinnerbait', 'Blinker', 'Buzzbait', 'Chatterbait', 'Jig Spinner', 'Spinner', 'Spoon'
	],
} as const;
