---
title: Wards
theme: [light, wide]
toc: false
---

```js
import {to_pct, ch_incr_decr, summ_diff} from './lib/helpers.js'
import {level_of_detail_input, selected_service_windows, selected_service_ids} from './lib/controls.js'
import {wards} from './lib/maps.js'

const level_of_detail = Generators.input(level_of_detail_input)
```

<div class="grid grid-cols-2" style="grid-auto-rows: auto;">
	<h2 class="grid-colspan-2">Controls</h2>
	<div class="card">
		<h3>OC Transpo service period</h3>
		${level_of_detail_input}
	</div>
    <div class="card">
        <h3>Stop lookup within your selected ward (or the whole city, if that’s what you choose!)</h3>
        ${stop_search_input}
        ${stop_table}
    </div>
</div>

```js
const stop_search_input = Inputs.search(stops_oi, {placeholder: "Search stops"})
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
const ward_oi = view(Inputs.select([
        {
        id: "city",
        name: "Ottawa",
        number: "full city view"
        },
        ...ward_details
    ], {
        label: "ward",
        format: (ward) => `${ward.name} (${ward.number})`
}))
```

You’ve selected ${ward_oi.name}. ${ward_oi.name} has ${stops_oi.length} total stops (combining the existing and new schedule), with ${stop_times_oi_per_stop.filter(s => s.source === 'new').length} (${to_pct(stop_times_oi_per_stop.filter(s => s.source === 'new').length / stops_oi.length)}%) active in the new schedule during the service period you’ve selected above.

```js
const stop_times_oi_cutoff = 300

const stop_times_oi_per_stop_above_cutoff = stop_times_oi_per_stop.filter(s => s.n_stop_times > stop_times_oi_cutoff)
```

```js
Plot.plot({
    title: `How often do buses arrive at stops in ${ward_oi.name}?`,
    subtitle: `Histogram of how many times buses arrive at each stop, current schedule vs. NWTB (cut off at ${stop_times_oi_cutoff}, see below)`,
    width,
    x: {label: "Arrival frequency"},
    y: {label: "Number of stops"},
    marks: [
        Plot.rectY(stop_times_oi_per_stop, Plot.binX({y: "count"}, {
            x: "n_stop_times",
            fill: "source",
            fx: "source",
            // thresholds: [...Array(300 / 20 + 1)].map((_, index) => index * 20),
            interval: 20,
            domain: [0, stop_times_oi_cutoff],
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
})
```

<div class="grid grid-cols-2">
    <div>

_The histogram cuts off ${stop_times_oi_per_stop_above_cutoff.filter(s => s.source === 'current').length} stop(s) in the current schedule and ${stop_times_oi_per_stop_above_cutoff.filter(s => s.source === 'new').length} stop(s) in the new schedule where buses arrive more than ${stop_times_oi_cutoff} times during the selected timeframe._

Here are key measures for bus arrival frequency in ${ward_oi.name}:

Measure   | Current     | New
---------- | ------------ | ----------
Range   | ${stop_times_oi_per_stop_summary_current.min} to ${stop_times_oi_per_stop_summary_current.max} | ${stop_times_oi_per_stop_summary_new.min} to ${stop_times_oi_per_stop_summary_new.max}
Mean   | ${stop_times_oi_per_stop_summary_current.mean} | ${stop_times_oi_per_stop_summary_new.mean} (${summ_diff(stop_times_oi_per_stop_summary_current.mean, stop_times_oi_per_stop_summary_new.mean)})
Median   | ${stop_times_oi_per_stop_summary_current.median} | ${stop_times_oi_per_stop_summary_new.median} (${summ_diff(stop_times_oi_per_stop_summary_current.median, stop_times_oi_per_stop_summary_new.median)})

_A mean value of ${stop_times_oi_per_stop_summary_new.mean} indicates that the average stop in ${ward_oi.name} has ${stop_times_oi_per_stop_summary_new.mean} arrivals during the service period you’ve selected above. Some stops will have more frequent arrivals, and others less frequent, as indicated by the range value._

</div>
    <div class="tip" style="height: fit-content">These numbers are affected by the service options you make above (e.g., weekday, Saturday, Sunday)—change those to see how your service numbers change!</div>
</div>

<!-- ## Data / loading -->

<!-- ### Database -->

```js
import {octdb, array_to_sql_qry_array} from './lib/octdb.js'
```

```js
const stops_oi = [...await octdb.query(`
SELECT 
    stop_code,
    stop_name_normalized,
    ward_number::INTEGER AS ward_number
FROM stops
WHERE
    ${(ward_oi.id !== 'city') ? `ward_number = '${ward_oi.number}'` : 'TRUE'}
`)]
```

```js
const stop_times_oi = [...await octdb.query(`
SELECT * EXCLUDE(stop_lat_normalized, stop_lon_normalized)
FROM stop_times
WHERE
  list_contains(${array_to_sql_qry_array(selected_service_windows(level_of_detail))}, service_window) AND
  list_contains(${array_to_sql_qry_array(selected_service_ids(level_of_detail))}, service_id) AND
  list_contains(${array_to_sql_qry_array(stops_oi.map(s => s.stop_code))}, stop_code)
`)]

const stop_times_oi_per_stop = [...await octdb.query(`
SELECT
    source,
    stop_code,
    COUNT(*) as n_stop_times
FROM stop_times
WHERE
  list_contains(${array_to_sql_qry_array(selected_service_windows(level_of_detail))}, service_window) AND
  list_contains(${array_to_sql_qry_array(selected_service_ids(level_of_detail))}, service_id) AND
  list_contains(${array_to_sql_qry_array(stops_oi.map(s => s.stop_code))}, stop_code)
GROUP BY
    source,
    stop_code
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

const stop_times_oi_per_stop_summary = aq.from(stop_times_oi_per_stop)
    .groupby('source')
    .rollup({
        min: d => aq.op.min(d.n_stop_times),
        max: d => aq.op.max(d.n_stop_times),
        mean: d => Math.round(aq.op.mean(d.n_stop_times)),
        median: d => Math.round(aq.op.median(d.n_stop_times)),
    })
    .objects()

const stop_times_oi_per_stop_summary_current = stop_times_oi_per_stop_summary.find(d => d.source === 'current')
const stop_times_oi_per_stop_summary_new = stop_times_oi_per_stop_summary.find(d => d.source === 'new')
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
