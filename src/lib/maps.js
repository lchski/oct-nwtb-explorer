import {FileAttachment} from "observablehq:stdlib"
import * as Plot from "npm:@observablehq/plot";
import * as d3 from "npm:d3";
import {rewind} from "jsr:@nshiab/journalism/web"; // NB: rewind the four imports below if you want to use conic-conformal projection

export const roads = FileAttachment("../data/ottawa.ca/Road_Centrelines_simplify_25.geojson").json()

export const ons_neighbourhoods = FileAttachment("../data/ottawa.ca/ons_boundaries.geojson").json()

export const wards = FileAttachment("../data/ottawa.ca/wards_2022_to_2026.geojson").json()

// Generated with mapshaper, merging 24 wards into one
// ref: https://helpcenter.flourish.studio/hc/en-us/articles/8827921931919-How-to-merge-regions-with-Mapshaper
export const city_limits = FileAttachment("../data/ottawa.ca/city-limits.geojson").json()



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
		Plot.geo(
			ons_neighbourhoods,
			Plot.centroid({
				tip: false,
				channels: {
					"Neighbourhood": (d) => d.properties.Name,
					"Population (approx)": (d) => d.properties.POPEST.toLocaleString(),
					"ONS ID": (d) => d.properties.ONS_ID
				},
				strokeOpacity: 0
			})
		)
	]
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
