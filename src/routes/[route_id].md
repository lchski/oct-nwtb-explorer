---
theme: [light, wide]
---

```js
import {to_pct, ch_incr_decr, label_service_windows, label_schedules, label_route_ids, generateStatsTable, formatSecondsForStatsTable} from '../lib/helpers.js'
import {service_period_desc, level_of_detail_input, selected_service_windows, selected_service_ids} from '../lib/controls.js'
import {roads, ons_neighbourhoods, wards, plot_basemap_components, get_map_domain, stops_to_geojson} from '../lib/maps.js' // TODO: verify which, if any, of these is necessary
import {rewind} from "jsr:@nshiab/journalism/web"

const level_of_detail = Generators.input(level_of_detail_input)
```

# Route: ${route_id_oi}

```js
document.title = `Route: ${route_id_oi} | NWTB Explorer`;
```

Learn more about the impacts of NWTB for route ${route_id_oi}. Or, [return to the routes page to pick another route](/routes).

## Choose service period

${service_period_desc}

<div class="grid grid-cols-2" style="grid-auto-rows: auto;">
	<div class="card">
		<h3>OC Transpo service details</h3>
		${level_of_detail_input}
	</div>
</div>


## Details for route ${route_id_oi}

```js
const get_route_id_oi_sources = () => {
    const unique_sources = [...new Set(stop_times.map(st => st.source))]

    if (unique_sources.length === 2) {
        return 'both'
    }

    return unique_sources[0]
}

const describe_route_id_oi_sources = () => {
    const route_id_oi_sources = get_route_id_oi_sources()

    if (route_id_oi_sources === "both") {
        return html`Route ${route_id_oi} is active in <strong>both schedules</strong>.`
    }

    if (route_id_oi_sources === "current") {
        return html`Route ${route_id_oi} was only active in <strong>the previous schedule</strong>.`
    }

    return html`Route ${route_id_oi} is only active in <strong>the current schedule</strong>.`
}
```

<div class="caution">
    <p>Most routes have changed with NWTB. Some routes only exist in the previous schedule, others only in the new one. For routes that exist in both, the routing and stops may have changed. Because of this, direct comparisons may not always be useful, or may only show one of the two schedules.</p>
    <p>${describe_route_id_oi_sources()}</p>
</div>

```js
const flip_map_orientation = view(Inputs.toggle({label: "Flip map orientation (can help with wide / long routes)"}))
```

```js
// manually define what `map_control` expects
const map_control_stub = {
    ward: {
        id: 'city'
    },
    roads: 4
}

const get_map_inset = (width) => {
    if (width < 400)
        return 5

    if (width < 550)
        return 10

    return 25
}

const get_map_orientation = (orientation) => {
    const domain_ratio = (d3.max(stops, d => d.stop_lon_normalized) - d3.min(stops, d => d.stop_lon_normalized)) / (d3.max(stops, d => d.stop_lat_normalized) - d3.min(stops, d => d.stop_lat_normalized)) // aspect ratio of rendered stops
    const ratio_breakpoint = 1.5

    if (orientation)
        return (domain_ratio >= ratio_breakpoint) ? 'fx' : 'fy'

    return (domain_ratio >= ratio_breakpoint) ? 'fy' : 'fx'
}

const stop_times_plot = Plot.plot({
  width: width,
  title: `How often does the #${route_id_oi} stop across its route?`,
  projection: {
    type: "mercator",
    domain: stops_to_geojson(stops),
    inset: get_map_inset(width)
  },
  color: {
    legend: true,
    scheme: "Observable10"
    },
  marks: [
    ...plot_basemap_components({ wards, ons_neighbourhoods, roads, map_control: map_control_stub }),
    Plot.dot(stop_times.map(label_schedules), Plot.group(
        {r: "count"},
        {
            x: "stop_lon_normalized",
            y: "stop_lat_normalized",
            color: "source",
            fill: "source",
            title: d => `Stop #${d.stop_code}: ${stops.find(s => s.stop_code === d.stop_code).stop_name_normalized}`,
            tip: true,
            [get_map_orientation(flip_map_orientation)]: "source",
            opacity: 0.7
        }
    ))
  ]
})
```

```js
stop_times_plot
```

```js
const wait_times_cutoff_min = 45

const wait_times_plot = (stop_times.filter(d => d.s_until_next_arrival !== null && (d.s_until_next_arrival / 60) < wait_times_cutoff_min).length > 0) ? Plot.plot({
    title: `How long do you have to wait for the #${route_id_oi}?`,
    subtitle: `Distribution of wait times in five-minute increments (cuts off at waits longer than ${wait_times_cutoff_min} minutes), previous schedule vs. NWTB`,
    width,
    x: {label: "Wait time (minutes)", transform: d => Math.round(d/60)},
    y: {label: "Percentage (%)", percent: true, grid: true},
    marks: [
        Plot.rectY(stop_times.map(label_schedules), Plot.binX({y: "proportion-facet"}, {
            x: "s_until_next_arrival",
            fill: "source",
            fx: "source",
            interval: 5 * 60, // we format from seconds to minutes, so do the equivalent here
            domain: [0, wait_times_cutoff_min * 60],
            tip: {
                pointer: "x",
                format: {
                    fx: false,
                    fill: false,
                }
            }
        })),
        Plot.axisFx({label: "Schedule"})
    ]
}) : html`<figure><h2>How long do you have to wait for the #${route_id_oi}?</h2><em>All wait times are longer than ${wait_times_cutoff_min} minutes. (Otherwise, there’d be a chart here.)</em></figure>`
```

```js
wait_times_plot
```

Here are key measures for wait times for the #${route_id_oi}:

${generateStatsTable(stop_times, 's_until_next_arrival', formatSecondsForStatsTable)}


```js
Plot.plot({
    title: `How do arrival frequencies for the #${route_id_oi} differ across service windows?`,
    subtitle: "Counts how many times buses or trains arrive on this route during the selected service windows, previous schedule vs. NWTB",
    width: Math.max(width, 550),
    x: {axis: null, label: "Schedule"},
    fx: {label: "Schedule"},
    y: {label: "Arrival frequency", tickFormat: "s", grid: true},
    color: {legend: true},
    marks: [
        Plot.barY(stop_times.map(label_service_windows).map(label_schedules), Plot.group(
            {y: "count"},
            {
                y: "service_window",
                x: "source",
                fx: "service_window",
                fill: "source",
                tip: {
                    pointer: "x",
                    format: {
                        fx: false,
                        fill: false,
                    }
                }
            }
        ))
    ]
})
```


<!-- Loading -->


```js
const stop_times_raw = await FileAttachment(`../data/generated/routes/stop_times/${observable.params.route_id}.parquet`).parquet()
const stop_times = stop_times_raw.toArray().filter(d => selected_service_windows(level_of_detail).includes(d.service_window) && selected_service_ids(level_of_detail).includes(d.service_id))
```

```js
const stop_codes_oi = [...new Set(stop_times.map(d => d.stop_code))]
const stops_raw = await FileAttachment(`../data/octranspo.com/stops_normalized.parquet`).parquet()
const stops = stops_raw.toArray().filter(d => stop_codes_oi.includes(d.stop_code))
```

```js
const route_id_oi = observable.params.route_id
```
