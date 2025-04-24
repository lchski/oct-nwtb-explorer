import * as Inputs from "npm:@observablehq/inputs";

export const service_windows = [
	"off_peak_morning",
	"peak_morning",
	"off_peak_midday",
	"peak_afternoon",
	"off_peak_evening",
	"off_peak_night"
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
		label: "service window(s) (blank for all)"
	}),
	service_ids: Inputs.select(service_ids, {
		multiple: true,
		label: "service date(s) (blank for all)"
	}),
	only_new_stops: Inputs.toggle({
		value: false,
		label: "only show new stops"
	})
})

export const selected_service_windows = (level_of_detail) =>
	level_of_detail.service_windows.length === 0 ?
		service_windows :
		level_of_detail.service_windows;

export const selected_service_ids = (level_of_detail) =>
	level_of_detail.service_ids.length === 0 ?
		service_ids :
		level_of_detail.service_ids;
