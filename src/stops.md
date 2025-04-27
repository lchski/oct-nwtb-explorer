---
title: Stops
theme: [light, wide]
toc: false
---

```js
import {to_pct, ch_incr_decr} from './lib/helpers.js'
import {service_period_desc, level_of_detail_input, selected_service_windows, selected_service_ids} from './lib/controls.js'
import {wards} from './lib/maps.js'

const level_of_detail = Generators.input(level_of_detail_input)
```

# Stops

Explore the NWTB data by focusing on transit stops of interest to you.

## Choose service period

${service_period_desc}

<div class="grid grid-cols-2" style="grid-auto-rows: auto;">
	<div class="card">
		<h3>OC Transpo service details</h3>
		${level_of_detail_input}
	</div>
    <div class="card">
        <h3>Stop lookup</h3>
        ${stop_search_input}
        ${stop_table}
    </div>
</div>

```js
const stop_search_input = Inputs.search(stops, {placeholder: "Search stops"})
const stop_search = Generators.input(stop_search_input);
```

```js
const stop_table = Inputs.table(stop_search, {
    columns: [
        "stop_code",
        "stop_name_normalized",
        "ward_number"
    ],
    header: {
        stop_code: "Stop code",
        stop_name_normalized: "Stop name",
        ward_number: "Ward"
    },
    format: {
        ward_number: x => `${x} – ${ward_details.find(w => w.number == x).name}`
    },
    width: {
        stop_code: 80
    },
    select: false
})
```

```js
const stop_codes_oi_raw = view(Inputs.text({
    label: "Stop code(s) of interest",
    placeholder: "e.g., enter just “3011” for Tunney’s Pasture",
    submit: true
}))
```

```js
const stop_codes_oi = stop_codes_oi_raw.split(/[^A-Z0-9]+/).filter(sc => sc !== "")
const stops_oi = stops.filter(s => stop_codes_oi.includes(s.stop_code))
```

<div class="grid grid-cols-2" style="grid-auto-rows: auto;">
    <div class="note">
        <p>You’ll see information for the following ${stops_oi.length.toLocaleString()} stop(s):</p>
        ${html`
        <ul>
            ${
                stops_oi.map(
                    d => htl.html`<li>${d.stop_code} – ${d.stop_name_normalized}</li>`
                )
            }
        </ul>
        `}
    </div>

<div class="tip">The following numbers are affected by the schedule options you make above (e.g., weekday, Saturday, Sunday)—change those to see how your service changes!</div>
</div>

Buses currently stop ${stop_times_oi_summary.current.n.toLocaleString()} times at your ${stops_oi.length.toLocaleString()} selected stop(s). Under the new schedule, they’ll stop ${stop_times_oi_summary.new.n.toLocaleString()} times (${ch_incr_decr(stop_times_oi_summary.new.n_change, true)}${Math.abs(stop_times_oi_summary.new.n_change)}, a ${stop_times_oi_summary.new.pct_change}% change).

<!-- ## Data / loading -->

<!-- ### Database -->

```js
import {octdb, array_to_sql_qry_array} from './lib/octdb.js'
```

```js
const stops = [...await octdb.query(`
SELECT 
    stop_code,
    stop_name_normalized,
    ward_number::INTEGER AS ward_number
FROM stops
`)]
```

```js
const stop_times = [...await octdb.query(`
SELECT *
FROM stop_times
WHERE
  list_contains(${array_to_sql_qry_array(selected_service_windows(level_of_detail))}, service_window) AND
  list_contains(${array_to_sql_qry_array(selected_service_ids(level_of_detail))}, service_id)
`)]
```

```js
const stop_times_oi = [...await octdb.query(`
SELECT * EXCLUDE(stop_lat_normalized, stop_lon_normalized)
FROM stop_times
WHERE
  list_contains(${array_to_sql_qry_array(selected_service_windows(level_of_detail))}, service_window) AND
  list_contains(${array_to_sql_qry_array(selected_service_ids(level_of_detail))}, service_id) AND
  list_contains(${array_to_sql_qry_array(stop_codes_oi)}, stop_code)
`)]

let stop_times_oi_summary = {
    current: {
		n: stop_times_oi.filter(st => st.source === "current").length,
	},
	new: {
		n: stop_times_oi.filter(st => st.source === "new").length,
	},
}

stop_times_oi_summary = {
    current: {
		...stop_times_oi_summary.current,
	},
	new: {
		...stop_times_oi_summary.new,
		n_change: stop_times_oi_summary.new.n - stop_times_oi_summary.current.n,
	}
}

stop_times_oi_summary = {
    current: {
		...stop_times_oi_summary.current,
	},
	new: {
		...stop_times_oi_summary.new,
        pct_change: to_pct(stop_times_oi_summary.new.n_change / stop_times_oi_summary.current.n)
	}
}
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
