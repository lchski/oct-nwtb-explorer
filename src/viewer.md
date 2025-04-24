---
title: Viewer
theme: dashboard
toc: false
---

```js
import {to_pct, ch_incr_decr} from './lib/helpers.js'
import {level_of_detail_input, selected_service_windows, selected_service_ids} from './lib/controls.js'
import {roads, ons_neighbourhoods, wards, city_limits, plot_basemap_components, get_map_domain} from './lib/maps.js'
```

<div class="grid grid-cols-2" style="grid-auto-rows: auto;">
	<h2 class="grid-colspan-2">Controls</h2>
	<div class="card">
		<h3>OC Transpo service details</h3>
		${level_of_detail_input}
	</div>
	<div class="card">
		<h3>Map controls</h3>
		${map_control_input}
    <h3>Manual scroll / zoom ${map_control.ward.id !== "manual" ? '(set “ward” to “Manual” to enable)' : ''}</h3>
    ${manual_map_control_input}
	</div>
</div>

For the selected options:
- the current schedule services ${stops_summary.current.n.toLocaleString()} stops
- the new schedule will service ${stops_summary.new.n.toLocaleString()} (${ch_incr_decr(stops_summary.new.change, true)}${Math.abs(stops_summary.new.change).toLocaleString()})

```js
let stops_summary = {
	total: {
		n: stops.length
	},
	current: {
		n: stops.filter(stop => stop.n_stops_current > 0).length,
		n_dropped: stops.filter(stop => stop.n_stops_current > 0 && stop.n_stops_new == 0).length,
	},
	new: {
		n: stops.filter(stop => stop.n_stops_new > 0).length,
		n_added: stops.filter(stop => stop.n_stops_current == 0 && stop.n_stops_new > 0).length,
	},
}

stops_summary = {
	total: stops_summary.total,
	current: {
		...stops_summary.current,
		pct_dropped: to_pct(stops_summary.current.n_dropped / stops_summary.current.n)
	},
	new: {
		...stops_summary.new,
		pct_added: to_pct(stops_summary.new.n_added / stops_summary.new.n),
		change: stops_summary.new.n - stops_summary.current.n
	}
}
```

```js
const map_control_input = Inputs.form({
  ward: Inputs.select([
      {
        id: "city",
        name: "All",
        number: "full city view"
      },
      {
        id: "manual",
        name: "Manual",
        number: "use zoom and scroll settings"
      },
      ...ward_details
    ], {
    label: "ward",
    format: (ward) => `${ward.name} (${ward.number})`
  }),
  
  roads: Inputs.range([0, 5], {value: 3, label: "Roads (level of maintenance)", step: 1})
})
const map_control = Generators.input(map_control_input)
```

```js
const manual_map_control_input = Inputs.form({
  // D3 and Plot expect coordinates to be specified as [longitude, latitude], so if you're setting your center point by grabbing coordinates from Google Maps, you'll need to reverse them.
  zoom: Inputs.range([0.025, 0.3], {
    value: 0.1,
    step: 0.025,
    label: "zoom",
    disabled: map_control.ward.id !== "manual"
  }),
  scroll_horizontal: Inputs.range([-0.4, 0.4], {
    value: 0,
    step: 0.025,
    label: "horizontal scroll (lat)",
    disabled: map_control.ward.id !== "manual"
  }),
  scroll_vertical: Inputs.range([-0.25, 0.2], {
    value: 0,
    step: 0.025,
    label: "vertical scroll (lon)",
    disabled: map_control.ward.id !== "manual"
  })
})
const manual_map_control = Generators.input(manual_map_control_input)
```

```js
const level_of_detail = Generators.input(level_of_detail_input)
```

```js
const viewer_plot = Plot.plot({
  width: Math.max(width, 550),
  title: "Transit stops in Ottawa",
  projection: {
    type: "reflect-y",
    domain: get_map_domain({ map_control, manual_map_control, city_limits }),
    inset: 10
  },
  color: {
    type: "diverging",
    scheme: "RdBu",
    legend: true
  },
  marks: [
    ...plot_basemap_components({ wards, ons_neighbourhoods, roads, map_control }),
    Plot.dot(// combines new and existing stops to provide the pointer details
      (level_of_detail.only_new_stops) ? stops.filter(stop => stop.is_entirely_new_stop) : stops, Plot.pointer({
        x: "stop_lon_normalized",
        y: "stop_lat_normalized",
        r: (d) => d.n_stops_new,
        stroke: "currentColor",
        fill: "black",
        strokeWidth: (manual_map_control.zoom <= 0.05) ? 0.2 : 0.01,
        strokeOpacity: (manual_map_control.zoom <= 0.05) ? 1 : 0.5,
        channels: {
          Name: d => d.stop_name_normalized,
          "Stop code": d => d.stop_code,
          "Stop frequency (current)": d => d.n_stops_current,
          "Stop frequency (new)": d => d.n_stops_new,
          "Difference (new vs current)": d => d.n_stops_difference,
          "% change": d => d.is_new_stop ? "n/a (new stop)" : Math.round(d.pct_stops_difference * 1000) / 10,
          "Change rank": d => d.ranking
        },
        tip: {format: {
          x: false,
          y: false,
          r: false,
          stroke: false,
          fill: false
        }}
      })
    ),
    (level_of_detail.only_new_stops) ? null : Plot.dot(
      stops.filter(stop => ! stop.is_entirely_new_stop), {
        x: "stop_lon_normalized",
        y: "stop_lat_normalized",
        r: (d) => d.n_stops_new,
        stroke: "currentColor",
        // fill: d => Math.round(d.pct_stops_difference * 1000) / 10,
        fill: "ranking",
        fillOpacity: 0.9,
        strokeWidth: (manual_map_control.zoom <= 0.05) ? 0.2 : 0.01,
        strokeOpacity: (manual_map_control.zoom <= 0.05) ? 1 : 0.5
      }
    ),
    Plot.dot(
      stops.filter(stop => stop.is_entirely_new_stop), {
        x: "stop_lon_normalized",
        y: "stop_lat_normalized",
        r: (d) => d.n_stops_new,
        stroke: "currentColor",
        symbol: "cross",
        // fill: "n_stops_difference",
        fill: "ranking",
        fillOpacity: 0.9,
        strokeWidth: (manual_map_control.zoom <= 0.05) ? 0.2 : 0.01,
        strokeOpacity: (manual_map_control.zoom <= 0.05) ? 1 : 0.5
      }
    )
  ]
})
```

```js
viewer_plot
```

```js
const stop_times_plot = Plot.plot({
  width: Math.max(width, 550),
  title: "Transit stops in Ottawa",
  subtitle: "Hexagon size indicates how many times buses stop in a given area with the new schedule, based on all the stops in the area. Blurred colour indicates (roughly) the degree of change for that area, comparing the old schedule to the new one. (Blurred colour does an odd thing in the west end, due to outliers—sorry!)",
  projection: {
    type: "reflect-y",
    domain: get_map_domain({ map_control, manual_map_control, city_limits }),
    inset: 10
  },
  color: {
    // type: "quantile",
    // n: 6,
    type: "diverging",
    pivot: 0,
    scheme: "RdBu",
    legend: true
  },
  marks: [
    ...plot_basemap_components({ wards, ons_neighbourhoods, roads, map_control }),
    Plot.raster(stops, {x: "stop_lon_normalized", y: "stop_lat_normalized", fill: "ranking", interpolate: "barycentric", blur: 10, opacity: 0.5}),
    Plot.dot(stop_times.filter(d => d.source === 'new'), Plot.hexbin({r: "count"}, {x: "stop_lon_normalized", y: "stop_lat_normalized", opacity: 0.5}))
  ]
})
```

```js
stop_times_plot
```

<!-- ## Data / loading -->

<!-- ### Database -->

```js
import {octdb, array_to_sql_qry_array} from './lib/octdb.js'
```

```js
const stops = [...await octdb.query(`
WITH stop_frequencies AS (
	SELECT 
		stop_code,
		SUM(CASE WHEN source = 'current' THEN n_stop_times ELSE 0 END)::INTEGER AS current,
		SUM(CASE WHEN source = 'new' THEN n_stop_times ELSE 0 END)::INTEGER AS new
	FROM stop_times_by_stop
	WHERE 
		list_contains(${array_to_sql_qry_array(selected_service_windows(level_of_detail))}, service_window) AND
		list_contains(${array_to_sql_qry_array(selected_service_ids(level_of_detail))}, service_id)
	GROUP BY stop_code
),
stop_frequencies_all AS (
	SELECT 
		stop_code,
		SUM(CASE WHEN source = 'current' THEN n_stop_times ELSE 0 END)::INTEGER AS current_all
	FROM stop_times_by_stop
	GROUP BY stop_code
),
base_query AS (
	SELECT 
		s.*,
		COALESCE(sf.current, 0) AS n_stops_current,
		COALESCE(sf.new, 0) AS n_stops_new,
		n_stops_new - n_stops_current AS n_stops_difference,
		n_stops_difference::FLOAT / NULLIF(n_stops_current::FLOAT, 0) AS pct_stops_difference,
		CASE WHEN n_stops_current = 0 THEN TRUE ELSE FALSE END AS is_new_stop,
		CASE WHEN COALESCE(sfa.current_all, 0) = 0 THEN TRUE ELSE FALSE END AS is_entirely_new_stop
	FROM stops s
	LEFT JOIN stop_frequencies sf USING(stop_code)
	LEFT JOIN stop_frequencies_all sfa USING(stop_code)
)
SELECT 
	*,
	CASE 
		WHEN is_new_stop THEN 
			DENSE_RANK() OVER (PARTITION BY is_new_stop ORDER BY n_stops_difference ASC)
		ELSE
			CASE
			WHEN pct_stops_difference > 0 THEN 
				DENSE_RANK() OVER (PARTITION BY is_new_stop, pct_stops_difference >= 0 ORDER BY pct_stops_difference ASC)
			WHEN pct_stops_difference = 0 THEN
				0
			ELSE 
				-DENSE_RANK() OVER (PARTITION BY is_new_stop, pct_stops_difference < 0 ORDER BY pct_stops_difference DESC)
			END
	END AS ranking
FROM base_query
ORDER BY ranking DESC`)]

const stop_times = [...await octdb.query(`
SELECT *
FROM stop_times
WHERE
  list_contains(${array_to_sql_qry_array(selected_service_windows(level_of_detail))}, service_window) AND
  list_contains(${array_to_sql_qry_array(selected_service_ids(level_of_detail))}, service_id)
`)]
```

<!-- ### Other -->

```js
const ward_details = wards.features
  .map(ward => ({
    id: ward.id,
    name: ward.properties.NAME,
    number: Number(ward.properties.WARD),
    geometry: ward.geometry
  }))
  .sort((wardA, wardB) => wardB.number < wardA.number)
```
