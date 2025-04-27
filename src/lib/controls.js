import * as Inputs from "npm:@observablehq/inputs";

export const service_period_desc = `The numbers and charts are affected by the “service period” you set. A service period combines service dates (weekday, Saturday, or Sunday) and service windows (the time of day). You can choose multiple service dates and windows.`

export const service_windows = [
	{window: "off_peak_morning", label: "Early morning (5 am to 6:30 am)"},
	{window: "peak_morning", label: "Morning peak (6:30 am to 9 am)"},
	{window: "off_peak_midday", label: "Mid-day (9 am to 3 pm)"},
	{window: "peak_afternoon", label: "Afternoon peak (3 pm to 6:30 pm)"},
	{window: "off_peak_evening", label: "Evening (6:30 pm to 11 pm)"},
	{window: "off_peak_night", label: "Late night (11 pm to 5 am)"}
]

export const service_ids = [
	"weekday",
	"saturday",
	"sunday"
]

export const level_of_detail_input = Inputs.form({
	// schedule: Inputs.select(["current", "new"], {label: "schedule version"}),
	service_windows: Inputs.select(service_windows, {
		multiple: true,
		format: (w) => w.label,
		label: "service window(s) (blank for all)"
	}),
	service_ids: Inputs.select(service_ids, {
		multiple: true,
		label: "service date(s) (blank for all)",
		value: ["weekday"]
	}),
})

export const selected_service_windows = (level_of_detail) =>
	level_of_detail.service_windows.length === 0 ?
		[...service_windows.map(w => w.window)] :
		[...level_of_detail.service_windows.map(w => w.window)];

export const selected_service_ids = (level_of_detail) =>
	level_of_detail.service_ids.length === 0 ?
		service_ids :
		level_of_detail.service_ids;
