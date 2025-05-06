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
        stop_code: "Code",
        stop_name_normalized: "Stop name",
        ward_number: "Ward"
    },
    format: {
        ward_number: x => `${x} – ${ward_details.find(w => w.number == x).name}`
    },
    width: {
        stop_code: 50,
        ward_number: 100
    },
    select: false
})
```

## Focus on a ward

Choose a ward to learn more about:

```js
const ward_oi = view(Inputs.select([
        {
        id: "city",
        name: "Ottawa",
        number: "all wards",
        geometry: city_limits
        },
        ...ward_details
    ], {
        format: (ward) => `${ward.name} (${ward.number})`
}))
```

<div class="grid grid-cols-2" style="grid-auto-rows: auto;">
<div>

During the service period you’ve selected above, ${ward_oi.name} has:
- ${stops_oi.length.toLocaleString()} total stops (combining the previous and new schedule)
- ${stop_times_oi_per_stop.filter(s => s.source === 'new').length.toLocaleString()} (${to_pct(stop_times_oi_per_stop.filter(s => s.source === 'new').length / stops_oi.length)}%) of these stops active in the new schedule

Buses or trains arrive at these stops ${stop_times_oi_summary.new.n.toLocaleString()} times in the new schedule.

</div>
<div class="card">
        <h3>Stop lookup within your selected ward (or the whole city, if that’s what you choose!)</h3>
        ${stop_search_input}
        ${stop_table}
</div>
</div>

```js
Plot.plot({
    title: `How long do you have to wait for your next train / bus in ${ward_oi.name}?`,
    subtitle: `Distribution of wait times in five-minute increments (cuts off at waits longer than 45 minutes), previous schedule vs. NWTB`,
    width,
    x: {label: "Wait time (minutes)", transform: d => Math.round(d/60)},
    y: {label: "Percentage (%)", percent: true, grid: true},
    marks: [
        Plot.rectY(stop_times_oi.map(label_schedules), Plot.binX({y: "proportion-facet"}, {
            x: "s_until_next_arrival",
            fill: "source",
            fx: "source",
            interval: 5 * 60, // we format from seconds to minutes, so do the equivalent here
            domain: [0, 45 * 60],
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

```js
const wait_time_summary = {
    current: {
        min: Math.round(d3.min(stop_times_oi_current, d => d.s_until_next_arrival) / 60),
        max: Math.round(d3.max(stop_times_oi_current, d => d.s_until_next_arrival) / 60),
        mean: Math.round(d3.mean(stop_times_oi_current, d => d.s_until_next_arrival) / 60),
        median: Math.round(d3.median(stop_times_oi_current, d => d.s_until_next_arrival / 60))
    },
    new: {
        min: Math.round(d3.min(stop_times_oi_new, d => d.s_until_next_arrival) / 60),
        max: Math.round(d3.max(stop_times_oi_new, d => d.s_until_next_arrival) / 60),
        mean: Math.round(d3.mean(stop_times_oi_new, d => d.s_until_next_arrival) / 60),
        median: Math.round(d3.median(stop_times_oi_new, d => d.s_until_next_arrival / 60))
    }
}
```

<div class="grid grid-cols-2">
    <div>

Here are key measures for wait times in ${ward_oi.name} (in minutes):

Measure   | Previous     | New
---------- | ------------ | ----------
Range   | ${wait_time_summary.current.min} to ${wait_time_summary.current.max} | ${wait_time_summary.new.min} to ${wait_time_summary.new.max}
Mean   | ${wait_time_summary.current.mean} | ${wait_time_summary.new.mean} (${summ_diff(wait_time_summary.current.mean, wait_time_summary.new.mean)})
Median   | ${wait_time_summary.current.median} | ${wait_time_summary.new.median} (${summ_diff(wait_time_summary.current.median, wait_time_summary.new.median)})

</div>
    <div class="tip" style="height: fit-content">These numbers are affected by the service options you make above (e.g., weekday, Saturday, Sunday)—change those to see how your service numbers change!</div>
</div>

```js
const stop_times_oi_cutoff = 300

const stop_times_oi_per_stop_above_cutoff = stop_times_oi_per_stop.filter(s => s.n_stop_times > stop_times_oi_cutoff)
```

```js
Plot.plot({
    title: `How often do buses or trains arrive at stops in ${ward_oi.name}?`,
    subtitle: `Histogram of how many times buses or trains arrive at each stop, previous schedule vs. NWTB (cut off at ${stop_times_oi_cutoff}, see below)`,
    width,
    x: {label: "Arrival frequency"},
    y: {label: "Number of stops", tickFormat: "s", grid: true},
    marks: [
        Plot.rectY(stop_times_oi_per_stop.map(label_schedules), Plot.binX({y: "count"}, {
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

_The histogram cuts off ${stop_times_oi_per_stop_above_cutoff.filter(s => s.source === 'current').length} stop(s) in the previous schedule and ${stop_times_oi_per_stop_above_cutoff.filter(s => s.source === 'new').length} stop(s) in the new schedule where buses or trains arrive more than ${stop_times_oi_cutoff} times during the selected timeframe._

Here are key measures for arrival frequency at stops in ${ward_oi.name}:

Measure   | Previous     | New
---------- | ------------ | ----------
Range   | ${stop_times_oi_per_stop_summary_current.min} to ${stop_times_oi_per_stop_summary_current.max} | ${stop_times_oi_per_stop_summary_new.min} to ${stop_times_oi_per_stop_summary_new.max}
Mean   | ${stop_times_oi_per_stop_summary_current.mean} | ${stop_times_oi_per_stop_summary_new.mean} (${summ_diff(stop_times_oi_per_stop_summary_current.mean, stop_times_oi_per_stop_summary_new.mean)})
Median   | ${stop_times_oi_per_stop_summary_current.median} | ${stop_times_oi_per_stop_summary_new.median} (${summ_diff(stop_times_oi_per_stop_summary_current.median, stop_times_oi_per_stop_summary_new.median)})

_A mean value of ${stop_times_oi_per_stop_summary_new.mean} indicates that the average stop in ${ward_oi.name} has ${stop_times_oi_per_stop_summary_new.mean} arrivals during the service period you’ve selected above. Some stops will have more frequent arrivals, and others less frequent, as indicated by the range value._

```js
Plot.plot({
    title: `How do arrival frequencies in ${ward_oi.name} differ across service windows?`,
    subtitle: "Counts how many times buses arrive at stops during the selected service windows, previous schedule vs. NWTB",
    width: Math.max(width, 550),
    x: {axis: null, label: "Schedule"},
    fx: {label: "Schedule"},
    y: {label: "Arrival frequency", tickFormat: "s", grid: true},
    color: {legend: true},
    marks: [
        Plot.barY(stop_times_oi.map(label_service_windows).map(label_schedules), Plot.group(
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

```js
// manually define what `map_control` expects
const map_control_stub = {
    ward: ward_oi,
    roads: (ward_oi.id == 'city') ? 4 : 5
}

const stop_times_plot = (ward_oi.id === 'city') ? '' : Plot.plot({
  width: width,
  title: `Transit stops in ${ward_oi.name}`,
  projection: {
    type: "mercator",
    domain: rewind(ward_oi.geometry),
    inset: 10
  },
  color: {
    legend: true,
    scheme: "Observable10"
    },
  marks: [
    ...plot_basemap_components({ wards, ons_neighbourhoods, roads, map_control: map_control_stub }),
    Plot.dot(stop_times_oi.map(label_schedules), Plot.group(
        {r: "count"},
        {
            x: "stop_lon_normalized",
            y: "stop_lat_normalized",
            color: "source",
            fill: "source",
            title: d => `#${d.stop_code}: ${stops_oi.find(s => s.stop_code === d.stop_code).stop_name_normalized}`,
            tip: true,
            fx: "source",
            opacity: 0.7
        }
    ))
  ]
})
```

```js
(ward_oi.id !== 'city') ? stop_times_plot : htl.html`<figure><h2>Transit stops in Ottawa</h2><p><em>To see a map of stops, pick a specific ward.</em></p></figure>`
```

<!-- TKTK TODO: can we do just a _diff_ dot plot, i.e., plot dots where service doesn’t change in a neutral colour, stops where there’s an increase in a positive colour, and stops where there’s a decrease in a negative colour—and size all the dots by the amount of service in the new schedule -->




## Compare wards

This section isn’t affected by the ward you choose. Instead, it compares service across all wards.

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
    x: {label: "Number of stops", tickFormat: "s", grid: true},
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




<!-- ## Data / loading -->

<!-- ### Database -->

```js
import {octdb, array_to_sql_qry_array} from './lib/octdb.js'
```

```js
const stops_by_ward = [...await octdb.query(`
SELECT
    *
FROM stop_times_by_stop
WHERE 
    list_contains(${array_to_sql_qry_array(selected_service_windows(level_of_detail))}, service_window) AND
    list_contains(${array_to_sql_qry_array(selected_service_ids(level_of_detail))}, service_id)
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

```js
const stops_raw = await FileAttachment('./data/octranspo.com/stops_normalized.parquet').parquet()
const stops = stops_raw.toArray()
const stops_oi = (ward_oi.id !== 'city') ? stops.filter(d => d.ward_number == ward_oi.number) : stops
```

```js
const stop_times_oi = [...await octdb.query(`
SELECT *
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

const stop_times_oi_current = stop_times_oi.filter(st => st.source === "current")
const stop_times_oi_new = stop_times_oi.filter(st => st.source === "new")

let stop_times_oi_summary = {
    current: {
		n: stop_times_oi_current.length,
	},
	new: {
		n: stop_times_oi_new.length,
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
