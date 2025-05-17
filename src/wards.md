---
title: Wards
theme: [light, wide]
---

```js
import {to_pct, ch_incr_decr, summ_diff, label_service_windows, label_wards, label_schedules, source_domain} from './lib/helpers.js'
import {service_period_desc, level_of_detail_input, selected_service_windows, selected_service_ids} from './lib/controls.js'

const level_of_detail = Generators.input(level_of_detail_input)
```

# Wards

Learn about how the schedule changes affect different wards. Compare wards, or focus on one at a time.

## Choose service period

${service_period_desc}

<div class="grid grid-cols-2" style="grid-auto-rows: auto;">
	<div class="card">
		<h3>OC Transpo service period</h3>
		${level_of_detail_input}
	</div>
</div>


## Compare wards

<div class="grid grid-cols-2">
    <div class="card">${stops_by_ward_plot}</div>
    <div class="card">${arrivals_by_ward_plot}</div>
</div>

```js
const stops_by_ward_plot = Plot.plot({
    title: `How many stops are there by ward?`,
    subtitle: "Counts how many stops are active during selected service windows, previous schedule vs. NWTB",
    marginLeft: 250,
    marginBottom: 40,
    y: {axis: null, label: "Schedule"},
    fy: {label: "Ward"},
    x: {label: "Number of stops", grid: true},
    color: {legend: true, domain: source_domain},
    style: {
        fontSize: '1em',
    },
    marks: [
        Plot.rectX(stop_times,
            {
                x: "n_stops",
                y: "source",
                fy: "ward",
                fill: "source",
                tip: {
                    pointer: "y",
                    format: {
                        fx: false,
                        fill: false,
                    }
                }
            }
        )
    ]
})
```

```js
const arrivals_by_ward_plot = Plot.plot({
    title: `How many arrivals, by ward?`,
    subtitle: "Counts how many times buses or trains arrive during selected service windows, previous schedule vs. NWTB",
    marginLeft: 250,
    marginBottom: 40,
    y: {axis: null, label: "Schedule"},
    fy: {label: "Ward"},
    x: {label: "Arrival frequency", tickFormat: "s", grid: true},
    color: {legend: true, domain: source_domain},
    style: {
        fontSize: '1em',
    },
    marks: [
        Plot.rectX(stop_times,
            {
                x: "n_stop_times",
                y: "source",
                fy: "ward",
                fill: "source",
                tip: {
                    pointer: "y",
                    format: {
                        fx: false,
                        fill: false,
                    }
                }
            }
        )
    ]
})
```


## Focus on a ward, or city-wide

Explore the NWTB data by focusing on a ward at a time. See charts, summary statistics, maps comparing the old schedule to the new one. Choose a ward to focus on:

<ol class="grid grid-cols-2">
${
    ward_details.map(ward => html`
        <li><a href="/wards/${ward.number}">${ward.name}</a></li>
    `)
}
</ol>

Or, [see the same charts at the city-wide level](/wards/city-wide).




<!-- ## Data / loading -->

```js
const stop_times_raw = await FileAttachment(`./data/generated/wards/all.parquet`).parquet()
const stop_times = aq.from(
        stop_times_raw
            .toArray()
            .filter(d => selected_service_windows(level_of_detail).includes(d.service_window) && selected_service_ids(level_of_detail).includes(d.service_id))
            .filter(d => d.stop_code !== null)
    )
    .groupby('source', 'ward_number')
    .rollup({
        n_stops: d => aq.op.distinct(d.stop_code),
        n_stop_times: d => aq.op.sum(d.n_stop_times)
    })
    .objects()
    .map(label_wards)
    .map(label_schedules)
```

<!-- ### Other -->

```js
const ward_details = FileAttachment('data/generated/wards/ward_details.json').json()
```
