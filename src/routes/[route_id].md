---
theme: [light, wide]
---

```js
import {label_schedules, generateStatsTable, formatSecondsForStatsTable, source_domain} from '../lib/helpers.js'
import {service_period_desc, level_of_detail_input, selected_service_windows, selected_service_ids} from '../lib/controls.js'
import {plot_wait_times, plot_arrival_frequencies} from '../lib/charts.js'
import {map_stop_times, get_basemap_components} from '../lib/maps.js' // TODO: verify which, if any, of these is necessary

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
map_stop_times({
    title: `How often does the ${route_id_oi} stop across its route?`,
    width,
    map_control_stub: {
        ward: {
            id: 'city'
        },
        roads: 4
    },
    stop_times,
    stops,
    orientation_input: flip_map_orientation,
    basemap_components: await get_basemap_components()
})
```

```js
plot_wait_times({
    stop_times,
    title: `How long do you have to wait for the ${route_id_oi}?`,
    width
})
```

Here are key measures for wait times for the ${route_id_oi}:

${generateStatsTable(stop_times, 's_until_next_arrival', formatSecondsForStatsTable)}


```js
plot_arrival_frequencies({
    stop_times,
    title: `How do arrival frequencies for the ${route_id_oi} differ across service windows?`,
    subtitle_qualifier: "on this route",
    width: Math.max(width, 550)
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
