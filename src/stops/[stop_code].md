---
theme: [light, wide]
---

```js
import {to_pct, ch_incr_decr, label_service_windows, label_schedules, label_route_ids} from '../lib/helpers.js'
import {service_period_desc, level_of_detail_input, selected_service_windows, selected_service_ids} from '../lib/controls.js'

const level_of_detail = Generators.input(level_of_detail_input)
```


# Stop: ${stop_name_pretty}

```js
document.title = `Stop: ${stop_name_pretty} | NWTB Explorer`;
```

Learn more about the impacts of NWTB for ${stop_name_pretty}. Or, [return to the stops page to pick another stop](/stops).

## Choose service period

${service_period_desc}

<div class="grid grid-cols-2" style="grid-auto-rows: auto;">
	<div class="card">
		<h3>OC Transpo service details</h3>
		${level_of_detail_input}
	</div>
</div>


## Details for stop ${stop_name_pretty}

```js
Plot.plot({
    title: `How do arrival frequencies at ${stop_name_pretty} differ across service windows?`,
    subtitle: "Counts how many times buses or trains arrive at the stop during the selected service windows, previous schedule vs. NWTB",
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


TODO... dropdown to select route at stop, to see more specific details, e.g., wait times across windows


<!-- Loading -->

```js
const stop_times_raw = await FileAttachment(`../data/generated/stops/stop_times/${observable.params.stop_code}.parquet`).parquet()
const stop_times = stop_times_raw.toArray().filter(d => selected_service_windows(level_of_detail).includes(d.service_window) && selected_service_ids(level_of_detail).includes(d.service_id))
```

```js
const stops_raw = await FileAttachment(`../data/octranspo.com/stops_normalized.parquet`).parquet()
const stops = stops_raw.toArray()
```

```js
const stop_code_oi = observable.params.stop_code
const stop_name_oi = stops.find(d => d.stop_code === stop_code_oi).stop_name_normalized
const stop_name_pretty = `${stop_name_oi} (${stop_code_oi})`
```

```js
stop_times
```
