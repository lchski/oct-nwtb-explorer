---
title: Wards
theme: [light, wide]
---

```js
import {to_pct, ch_incr_decr, summ_diff, label_service_windows, label_wards, label_schedules} from './lib/helpers.js'
import {service_period_desc, level_of_detail_input, selected_service_windows, selected_service_ids} from './lib/controls.js'
import {roads, ons_neighbourhoods, wards, city_limits, plot_basemap_components, get_map_domain} from './lib/maps.js'
import {rewind} from "jsr:@nshiab/journalism/web"

const level_of_detail = Generators.input(level_of_detail_input)
```

# Wards

Explore the NWTB data by focusing on a ward at a time. See charts, summary statistics, maps comparing the old schedule to the new one. Instead of focusing on one ward, you can choose to see the same analysis city-wide.

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
    color: {legend: true},
    style: {
        fontSize: '1em',
    },
    marks: [
        Plot.barX(stops_by_ward.map(label_wards).map(label_schedules), Plot.group(
            {x: "count"},
            {
                x: "ward",
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
        ))
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
    color: {legend: true},
    style: {
        fontSize: '1em',
    },
    marks: [
        Plot.barX(arrivals_by_ward.map(label_wards).map(label_schedules), Plot.group(
            {x: "count"},
            {
                x: "ward",
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
        ))
    ]
})
```


## Focus on a ward

Choose a ward to focus on:

<ol class="grid grid-cols-2">
${
    ward_details.map(ward => html`
        <li><a href="/wards/${ward.number}">${ward.name}</a></li>
    `)
}
</ol>




<!-- ## Data / loading -->

<!-- ### Database -->

```js
import {octdb, array_to_sql_qry_array} from './lib/octdb.js'
```

```js
const stops_by_ward = [...await octdb.query(`
SELECT
    source, ward_number, stop_code, SUM(n_stop_times) AS n_stop_times
FROM stop_times_by_stop
WHERE 
    list_contains(${array_to_sql_qry_array(selected_service_windows(level_of_detail))}, service_window) AND
    list_contains(${array_to_sql_qry_array(selected_service_ids(level_of_detail))}, service_id)
GROUP BY
    source, ward_number, stop_code
`)]
```

```js
const arrivals_by_ward = [...await octdb.query(`
SELECT
    ward_number,
    source
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
    number: Number(ward.properties.WARD)
  }))
  .sort((wardA, wardB) => wardB.number < wardA.number)
```
