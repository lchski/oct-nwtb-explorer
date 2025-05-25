import {FileAttachment} from "observablehq:stdlib"
import * as shapefile from "npm:shapefile"
import * as Plot from "npm:@observablehq/plot";
import * as d3 from "npm:d3";
import {rewind} from "jsr:@nshiab/journalism/web"; // NB: rewind the four imports below if you want to use conic-conformal projection

import {source_domain, label_schedules} from "./helpers.js"

export const roads = shapefile.read(
	...(await Promise.all([
		FileAttachment("../data/ottawa.ca/Road_Centrelines_simplify_25.shp").stream(),
		FileAttachment("../data/ottawa.ca/Road_Centrelines_simplify_25.dbf").stream()
	]))
)

export const ons_neighbourhoods = shapefile.read(
	...(await Promise.all([
		FileAttachment("../data/ottawa.ca/ons_boundaries.shp").stream()
	]))
)

// export const wards = shapefile.read( // TODO: fix this, breaks certain ward pages
// 	...(await Promise.all([
// 		FileAttachment("../data/ottawa.ca/wards_2022_to_2026.shp").stream(),
// 		FileAttachment("../data/ottawa.ca/wards_2022_to_2026.dbf").stream()
// 	])),
// 	{
// 		encoding: "utf-8"
// 	}
// )

export const wards = FileAttachment("../data/ottawa.ca/wards_2022_to_2026-optim.geojson").json()

// Generated with mapshaper, merging 24 wards into one
// ref: https://helpcenter.flourish.studio/hc/en-us/articles/8827921931919-How-to-merge-regions-with-Mapshaper
export const city_limits = shapefile.read(
	...(await Promise.all([
		FileAttachment("../data/ottawa.ca/city-limits.shp").stream()
	]))
)



export const plot_basemap_components = ({
	wards,
	ons_neighbourhoods,
	roads,
	map_control
}) => {
	return [
		Plot.geo(
			wards,
			{
				strokeWidth: 0.3
			}
		),
		(map_control.ward.id === "city" || map_control.ward.id === "manual") ? null : Plot.geo(
			map_control.ward.geometry,
			{
				fill: "currentColor",
				fillOpacity: 0.02
			}
		),
		Plot.geo(
			ons_neighbourhoods,
			{
				strokeWidth: 0.2
			}
		),
		Plot.geo(
			({
				type: roads.type,
				crs: roads.crs,
				features: roads.features.filter((road) => road.properties.MAINTCLASS <= map_control.roads) // adjust on this or other criteria to control how many roads get rendered
			}),
			{
				strokeWidth: 0.15
			}
		),
	]
}

export async function get_basemap_components() {
	return {
		roads: await roads,
		ons_neighbourhoods: await ons_neighbourhoods,
		wards: await wards
	}
}

export const map_stop_times = ({
	title = "TKTK?",
	subtitle = null,
	width,
	domain = null,
	map_control_stub = {
		ward: {
			id: 'city'
		},
		roads: 4
	},
	stop_times,
	stops,
	orientation_input = false,
	basemap_components
}) => Plot.plot({
	title,
	subtitle,
	width,
	projection: {
		type: "mercator",
		domain: (domain === null) ? stops_to_geojson(stops) : rewind(domain),
		inset: get_map_inset(width)
	},
	color: {
		legend: true,
		scheme: "Observable10",
		domain: source_domain
	},
	[get_map_orientation(orientation_input, stops)]: { // fx or fy
		label: "Schedule"
	},
	marks: [
		...plot_basemap_components({ ...basemap_components, map_control: map_control_stub }),
		Plot.dot(stop_times.map(label_schedules), Plot.group(
			{r: "count"},
			{
				x: "stop_lon_normalized",
				y: "stop_lat_normalized",
				color: "source",
				fill: "source",
				title: d => `#${d.stop_code}: ${stops.find(s => s.stop_code === d.stop_code).stop_name_normalized}`,
				tip: true,
				[get_map_orientation(orientation_input, stops)]: "source", // fx or fy
				opacity: 0.7
			}
		))
	]
})

const get_map_orientation = (orientation_input, stops) => {
    const domain_ratio = (d3.max(stops, d => d.stop_lon_normalized) - d3.min(stops, d => d.stop_lon_normalized)) / (d3.max(stops, d => d.stop_lat_normalized) - d3.min(stops, d => d.stop_lat_normalized)) // aspect ratio of rendered stops
    const ratio_breakpoint = 1.5

    if (orientation_input)
        return (domain_ratio >= ratio_breakpoint) ? 'fx' : 'fy'

    return (domain_ratio >= ratio_breakpoint) ? 'fy' : 'fx'
}

const get_map_inset = (width) => {
    if (width < 400)
        return 5

    if (width < 550)
        return 10

    return 25
}

export const get_map_domain = ({ map_control, manual_map_control, city_limits }) => {
	if (map_control.ward.id === "city") {
		return rewind(city_limits)
	}
	
	if (map_control.ward.id === "manual") {
		return d3.geoCircle().center([-75.689515 + manual_map_control.scroll_horizontal, 45.383611 + manual_map_control.scroll_vertical]).radius(manual_map_control.zoom)()
	}
	
	return rewind(map_control.ward.geometry)
}

export const stops_to_geojson = (stops_to_convert) => {
	const stops_geojson = {
		type: "FeatureCollection",
		features: []
	}
	
	stops_to_convert.forEach(stop => {
		const feature = {
			type: "Feature",
			geometry: {
				type: "Point",
				coordinates: [stop.stop_lon_normalized, stop.stop_lat_normalized]
			},
			properties: {
				stop_code: stop.stop_code
			}
		}
		
		stops_geojson.features.push(feature)
	})
	
	return stops_geojson;
}
