---
title: Stops (multi-select)
theme: [light, wide]
toc: false
---

```js
import {to_pct, ch_incr_decr, label_route_ids} from '../lib/helpers.js'
import {service_period_desc, level_of_detail_input, selected_service_windows, selected_service_ids} from '../lib/controls.js'
import {plot_wait_times, plot_arrival_frequencies} from '../lib/charts.js'
import {wards} from '../lib/maps.js'

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
        "stop_name_normalized"
    ],
    header: {
        stop_code: "Code",
        stop_name_normalized: "Stop name"
    },
    width: {
        stop_code: 50
    },
    select: false
})
```

## Choose stop(s)

```js
const stop_codes_oi_raw = view(Inputs.text({
    label: "Stop code(s) of interest (put a space between to enter multiple)",
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

Buses or trains previously stopped ${stop_times_oi_summary.current.n.toLocaleString()} times at your ${stops_oi.length.toLocaleString()} selected stop(s). Under the new schedule, they stop ${stop_times_oi_summary.new.n.toLocaleString()} times (${ch_incr_decr(stop_times_oi_summary.new.n_change, true)}${Math.abs(stop_times_oi_summary.new.n_change)}, a ${stop_times_oi_summary.new.pct_change}% change).

```js
plot_arrival_frequencies({
    stop_times: stop_times_oi,
    title: `How do arrival frequencies at your selected stop(s) differ across service windows?`,
    subtitle_qualifier: "at the stop(s)",
    width: Math.max(width, 550)
})
```

```js
plot_wait_times({
    stop_times: stop_times_oi,
    title: `How long do you have to wait for your next train / bus at your selected stop(s)?`,
    width
})
```

This plot shows _all_ the wait times at your stop(s). If multiple routes serve the stop(s), see the tables below for average wait times by route.

<!-- For each stop...
    For each source...
        For each route...
            For each direction_id...
                label: headsigns
                What are the n_arrivals?
                    TODO: ...across service windows?
                TODO: What is the average wait between arrivals?
                    ...across service windows? -->

```js
const route_at_stop_output = (routes_at_this_stop, route_direction_ids) => {
    return html.fragment`
        ${route_direction_ids.map(this_route_direction_id => {
            const route_details = routes_at_this_stop.filter(d => d.route_direction_id === this_route_direction_id).map(label_route_ids)
            const s_avg_wait = route_waittimes_at_stops.find(d => d.route_direction_id === this_route_direction_id && d.source === route_details[0].source && d.stop_code === route_details[0].stop_code).s_avg_wait

            return html.fragment`
                <tr>
                    <td>${route_details[0].route_id}</td>
                    <td>${[... new Set(route_details.sort((a, b) => a.n_arrivals <= b.n_arrivals).map(d => d.trip_headsign))].join(' // ')}</td>
                    <td>${d3.sum(route_details, d => d.n_arrivals)}</td>
                    <td>${(null === s_avg_wait) ? '-' : Math.round(s_avg_wait / 60)}</td>
                </tr>
            `
        })}
    `
}

const routes_at_stops_output = stops_oi.map(stop_oi => {
    const routes_at_this_stop = routes_at_stops.filter(d => d.stop_code === stop_oi.stop_code).map(d => ({...d, route_direction_id: `${d.route_id}-${d.direction_id}`}))

    const routes_at_this_stop_vals = {
        current: {
            route_direction_ids: [...new Set(routes_at_this_stop.filter(d => d.source == "current").map(d => `${d.route_id}-${d.direction_id}`))]
        },
        new: {
            route_direction_ids: [...new Set(routes_at_this_stop.filter(d => d.source == "new").map(d => `${d.route_id}-${d.direction_id}`))]
        }
    }

    return html`
        <div>
            <h3>${stop_oi.stop_code} – ${stop_oi.stop_name_normalized}</h3>
            <div class="grid grid-cols-2">
                <div class="card">
                    <h4>Previous</h4>
                    <table>
                        <thead>
                            <tr>
                                <th>Route</th>
                                <th>Direction (combines route labels)</th>
                                <th>Arrivals (#)</th>
                                <th>Wait (mins, avg)</th>
                            </tr>
                        </thead>
                        <tbody>
                        ${route_at_stop_output(routes_at_this_stop.filter(d => d.source === "current"), routes_at_this_stop_vals.current.route_direction_ids)}
                        </tbody>
                    </table>
                </div>
                <div class="card">
                    <h4>NWTB</h4>
                    <table>
                        <thead>
                            <tr>
                                <th>Route</th>
                                <th>Direction (combines route labels)</th>
                                <th>Arrivals (#)</th>
                                <th>Wait (mins, avg)</th>
                            </tr>
                        </thead>
                        <tbody>
                        ${route_at_stop_output(routes_at_this_stop.filter(d => d.source === "new"), routes_at_this_stop_vals.new.route_direction_ids)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
`
})
```

<div>
${routes_at_stops_output}
</div>


```js
const routes_at_stops_vals = {
    current: {
        route_direction_ids: [...new Set(routes_at_stops.filter(d => d.source == "current").map(d => `${d.route_id}-${d.direction_id}`))]
    },
    new: {
        route_direction_ids: [...new Set(routes_at_stops.filter(d => d.source == "new").map(d => `${d.route_id}-${d.direction_id}`))]
    }
}
```

<!-- ## Data / loading -->

<!-- ### Database -->

```js
import {octdb, array_to_sql_qry_array} from '../lib/octdb.js'
```

```js
const stops_raw = await FileAttachment('../data/octranspo.com/stops_normalized.parquet').parquet()
const stops = stops_raw.toArray()
```

```js
const routes_at_stops = [...await octdb.query(`
SELECT
    stop_code,
    source,
    service_window,
    route_id,
    direction_id,
    trip_headsign,
    COUNT(*) AS n_arrivals
FROM stop_times
WHERE
  list_contains(${array_to_sql_qry_array(selected_service_windows(level_of_detail))}, service_window) AND
  list_contains(${array_to_sql_qry_array(selected_service_ids(level_of_detail))}, service_id) AND
  list_contains(${array_to_sql_qry_array(stop_codes_oi)}, stop_code)
GROUP BY
    stop_code,
    source,
    service_window,
    route_id,
    direction_id,
    trip_headsign
ORDER BY
    stop_code, source, route_id, direction_id, trip_headsign
`)]

const route_waittimes_at_stops = [...await octdb.query(`
SELECT
    stop_code,
    source,
    route_id,
    direction_id,
    concat(route_id, '-', direction_id) AS route_direction_id,
    avg(s_until_next_arrival) AS s_avg_wait
FROM stop_times
WHERE
  list_contains(${array_to_sql_qry_array(selected_service_windows(level_of_detail))}, service_window) AND
  list_contains(${array_to_sql_qry_array(selected_service_ids(level_of_detail))}, service_id) AND
  list_contains(${array_to_sql_qry_array(stop_codes_oi)}, stop_code)
GROUP BY
    stop_code,
    source,
    route_id,
    direction_id
ORDER BY
    stop_code, source, route_id, direction_id
`)]

const route_waittimes_at_stops_by_window = [...await octdb.query(`
SELECT
    stop_code,
    source,
    route_id,
    direction_id,
    service_window,
    concat(route_id, '-', direction_id) AS route_direction_id,
    avg(s_until_next_arrival) AS s_avg_wait
FROM stop_times
WHERE
  list_contains(${array_to_sql_qry_array(selected_service_windows(level_of_detail))}, service_window) AND
  list_contains(${array_to_sql_qry_array(selected_service_ids(level_of_detail))}, service_id) AND
  list_contains(${array_to_sql_qry_array(stop_codes_oi)}, stop_code)
GROUP BY
    stop_code,
    source,
    route_id,
    direction_id,
    service_window
ORDER BY
    stop_code, source, route_id, direction_id, service_window
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
  .sort((wardA, wardB) => wardA.number - wardB.number)
```
