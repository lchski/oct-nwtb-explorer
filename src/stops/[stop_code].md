---
theme: [light, wide]
toc: false
---

```js
import {to_pct, ch_incr_decr, generateStatsTable, formatSecondsForStatsTable, md} from '../lib/helpers.js'
import {plot_wait_times, plot_arrival_frequencies} from '../lib/charts.js'
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


## Details for ${stop_name_pretty}

Buses or trains previously stopped ${st_p.length.toLocaleString()} times at ${stop_name_pretty}. Under the new schedule, they stop ${st_n.length.toLocaleString()} times (${ch_incr_decr(st_n.length - st_p.length, true)}${Math.abs(st_n.length - st_p.length)}, a ${to_pct((st_n.length - st_p.length) / st_p.length)}% change).

```js
plot_arrival_frequencies({
    stop_times,
    title: `How do arrival frequencies at ${stop_name_pretty} differ across service windows?`,
    subtitle_qualifier: "at the stop",
    width: Math.max(width, 550)
})
```

```js
plot_wait_times({
    stop_times,
    title: `How long do you have to wait for your next train / bus at ${stop_name_pretty}?`,
    width
})
```

Here are key measures for wait times at ${stop_name_pretty}:

${generateStatsTable(stop_times, 's_until_next_arrival', formatSecondsForStatsTable)}

This plot and table show _all_ the wait times at ${stop_name_pretty}. If multiple routes serve the stop, see below for details by route.


***


## Routes at ${stop_name_pretty}

<div class="grid grid-cols-2">
    <div class="card">
        <h3>Previous</h3>

```js
md`${routes_at_stop_summary
    .filter(d => d.source === "current")
    .select(aq.not('source'))
    .toMarkdown()}`
```


</div>
<div class="card">
    <h3>New</h3>


```js
md`${routes_at_stop_summary
    .filter(d => d.source === "new")
    .select(aq.not('source'))
    .toMarkdown()}`
```

</div>
</div>



## Select a route that stops at ${stop_name_pretty}

```js
const route_oi = view(Inputs.select(routes_at_stop, {// TODO add null options back to this, so we don't automatically render everything
    label: "Route",
    format: (r) => `${r.route_id}: ${r.direction}`
}))
```

At ${stop_name_pretty}, buses or trains from route ${route_id_oi} (direction: ${route_oi.direction}):
- previously stopped ${st_oi_p.length.toLocaleString()} times
- now stop ${st_oi_n.length.toLocaleString()} times (${ch_incr_decr(st_oi_n.length - st_oi_p.length, true)}${Math.abs(st_oi_n.length - st_oi_p.length)}, a ${to_pct((st_oi_n.length - st_oi_p.length) / st_oi_p.length)}% change)

```js
const route_oi_link = html.fragment`<a href="/routes/${route_oi.route_id}">explore route ${route_id_oi}</a>`
```

You can also ${route_oi_link} itself in more detail.

```js
plot_arrival_frequencies({
    stop_times: st_oi,
    title: `How do arrival frequencies for ${route_oi.route_id} (${route_oi.direction}) at ${stop_name_pretty} differ across service windows?`,
    subtitle_qualifier: "at the stop",
    width: Math.max(width, 550)
})
```

```js
plot_wait_times({
    stop_times: st_oi,
    title: `How long do you have to wait for the next ${route_oi.route_id} (${route_oi.direction}) at ${stop_name_pretty}?`,
    width
})
```

Here are key measures for wait times for the ${route_id_oi} (${route_oi.direction}) at ${stop_name_pretty}:

${generateStatsTable(st_oi, 's_until_next_arrival', formatSecondsForStatsTable)}


<!-- Loading -->

```js
const stop_times_raw = await FileAttachment(`../data/generated/stops/stop_times/${observable.params.stop_code}.parquet`).parquet()
const stop_times = stop_times_raw.toArray().filter(d => selected_service_windows(level_of_detail).includes(d.service_window) && selected_service_ids(level_of_detail).includes(d.service_id))

const st_p = stop_times.filter(st => st.source === "current")
const st_n = stop_times.filter(st => st.source === "new")
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
const routes_at_stop_summary = aq.from(stop_times)
    .groupby('source', 'route_id', 'direction_id', 'trip_headsign')
    .rollup({
        n_arrivals: d => aq.op.count(),
        wait_times: d => aq.op.array_agg(d.s_until_next_arrival)
    })
    .orderby('source', 'route_id', 'direction_id', aq.desc('n_arrivals'))
    .groupby('source', 'route_id', 'direction_id')
    .rollup({
        headsign_combined: d => aq.op.join(aq.op.array_agg_distinct(d.trip_headsign), ', '),
        n_arrivals: d => aq.op.sum(d.n_arrivals),
        wait_times: d => aq.op.array_agg(d.wait_times)
    })
    .derive({
        avg_wait_time: aq.escape(d => Math.round(d3.mean(d3.merge(d.wait_times)) / 60))
    })
    .derive({
        route_id_numeric: d => aq.op.parse_int(d.route_id)
    })
    .impute({
        avg_wait_time: () => '-',
        route_id_numeric: () => 99999 // sort non-numeric route IDs like "E1" to the end of the list
    })
    .orderby('source', 'route_id_numeric', 'direction_id')
    .select({
        source: 'source',
        route_id: 'Route',
        headsign_combined: 'Direction (combines route labels)',
        n_arrivals: 'Arrivals (#)',
        avg_wait_time: 'Wait (mins, avg)'
    })

const routes_at_stop = aq.from(stop_times)
    .groupby('route_id', 'direction_id', 'trip_headsign')
    .count()
    .orderby('route_id', aq.desc('count'))
    .groupby('route_id', 'direction_id')
    .rollup({
        direction: d => aq.op.join(aq.op.array_agg_distinct(d.trip_headsign), ', '),
        n_arrivals: d => aq.op.sum(d.count)
    })
    .derive({
        route_id_numeric: d => aq.op.parse_int(d.route_id)
    })
    .impute({
        route_id_numeric: () => 99999 // sort non-numeric route IDs like "E1" to the end of the list
    })
    .orderby('route_id_numeric')
    .objects()
```

```js
const route_id_oi = route_oi.route_id

const st_oi = stop_times.filter(st => st.route_id === route_id_oi && st.direction_id === route_oi.direction_id)

const st_oi_p = st_oi.filter(st => st.source === "current")
const st_oi_n = st_oi.filter(st => st.source === "new")
```
