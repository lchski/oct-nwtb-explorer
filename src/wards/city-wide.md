---
theme: [light, wide]
---

```js
import {to_pct, ch_incr_decr, summ_diff, label_service_windows, label_wards, label_schedules} from '../lib/helpers.js'
import {service_period_desc, level_of_detail_input, selected_service_windows, selected_service_ids} from '../lib/controls.js'
// import {roads, ons_neighbourhoods, wards, city_limits, plot_basemap_components, get_map_domain} from '../lib/maps.js'
import {rewind} from "jsr:@nshiab/journalism/web"

const level_of_detail = Generators.input(level_of_detail_input)
```

```js
const service_windows = selected_service_windows(level_of_detail)
const service_ids = selected_service_ids(level_of_detail)
```

# Ward: City-wide

Learn more about the impacts of NWTB at the city level. Or, [return to the wards page to pick another ward](/wards).

_There’s a lot of data for this page, so it may load a bit slower._

## Choose service period

${service_period_desc}

<div class="grid grid-cols-2" style="grid-auto-rows: auto;">
	<div class="card">
		<h3>OC Transpo service period</h3>
		${level_of_detail_input}
	</div>
</div>

## Focus on the ward

During the service period you’ve selected above, ${ward_oi.name} has:
- ${stop_times_per_stop.filter(s => s.source === 'current').length.toLocaleString()} stops active in the previous schedule
- ${stop_times_per_stop.filter(s => s.source === 'new').length.toLocaleString()} stops active in the new schedule

Buses or trains arrive at these stops ${stop_times_oi_summary.new.n.toLocaleString()} times in the new schedule.

```js
Plot.plot({
    title: `How long do you have to wait for your next train / bus in ${ward_oi.name}?`,
    subtitle: `Distribution of wait times in five-minute increments (cuts off at waits longer than 45 minutes), previous schedule vs. NWTB`,
    width,
    x: {label: "Wait time (minutes)", transform: d => Math.round(d/60)},
    y: {label: "Percentage (%)", percent: true, grid: true},
    marks: [
        Plot.rectY(stop_times, Plot.binX({y: "proportion-facet"}, {
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

const stop_times_oi_per_stop_above_cutoff = stop_times_per_stop.filter(s => s.n_stop_times > stop_times_oi_cutoff)
```

```js
Plot.plot({
    title: `How often do buses or trains arrive at stops in ${ward_oi.name}?`,
    subtitle: `Histogram of how many times buses or trains arrive at each stop, previous schedule vs. NWTB (cut off at ${stop_times_oi_cutoff}, see below)`,
    width,
    x: {label: "Arrival frequency"},
    y: {label: "Number of stops", tickFormat: "s", grid: true},
    marks: [
        Plot.rectY(stop_times_per_stop.map(label_schedules), Plot.binX({y: "count"}, {
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



## Focus on another ward, or city-wide

Choose a different ward to focus on:

<ol class="grid grid-cols-2">
${
    ward_details.map(ward => {
        if (ward.number === ward_oi.number) {
            return html`
                <li>${ward.name}</li>
            `
        } else {
            return html`
                <li><a href="/wards/${ward.number}">${ward.name}</a></li>
            `
        }
    })
}
</ol>

Or, [see the same charts at the city-wide level](/wards/city-wide).

<!-- Loading -->

```js
const ward_oi = {
    id: "city",
    name: "Ottawa",
    number: "all wards"
}
```

<!-- ### Database -->

```js
import {octdb, array_to_sql_qry_array} from '../lib/octdb.js'
```

```js
const stop_times = [...await octdb.query(`
SELECT *
FROM stop_times
WHERE
  list_contains(${array_to_sql_qry_array(selected_service_windows(level_of_detail))}, service_window) AND
  list_contains(${array_to_sql_qry_array(selected_service_ids(level_of_detail))}, service_id)
`)]

const stop_times_per_stop = [...await octdb.query(`
SELECT
    source,
    stop_code,
    COUNT(*) as n_stop_times
FROM stop_times
WHERE
  list_contains(${array_to_sql_qry_array(selected_service_windows(level_of_detail))}, service_window) AND
  list_contains(${array_to_sql_qry_array(selected_service_ids(level_of_detail))}, service_id)
GROUP BY
    source,
    stop_code
`)]

const stop_times_oi_current = stop_times.filter(st => st.source === "current")
const stop_times_oi_new = stop_times.filter(st => st.source === "new")

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

const stop_times_oi_per_stop_summary = aq.from(stop_times_per_stop)
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

```js
const ward_details = FileAttachment('../data/generated/wards/ward_details.json').json()
```
