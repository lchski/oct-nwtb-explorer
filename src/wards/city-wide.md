---
theme: [light, wide]
---

```js
import {generateStatsTable, formatSecondsForStatsTable, ch_incr_decr, to_pct} from '../lib/helpers.js'
import {service_period_desc, level_of_detail_input, selected_service_windows, selected_service_ids} from '../lib/controls.js'
import {plot_wait_times, plot_arrival_frequencies, plot_st_per_stop_histogram} from '../lib/charts.js'

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

```js
const st_p = stop_times.filter(st => st.source === "current")
const st_n = stop_times.filter(st => st.source === "new")
```

During the service period you’ve selected above, ${ward_oi.name} has:
- ${stop_times_per_stop.filter(s => s.source === 'current').length.toLocaleString()} stops active in the previous schedule
- ${stop_times_per_stop.filter(s => s.source === 'new').length.toLocaleString()} stops active in the new schedule

During this period, buses and trains:

- previously arrived ${st_p.length.toLocaleString()} times
- now arrive ${st_n.length.toLocaleString()} times (${ch_incr_decr(st_n.length - st_p.length, true)}${Math.abs(st_n.length - st_p.length).toLocaleString()}, a ${to_pct((st_n.length - st_p.length) / st_p.length)}% change)

Buses or trains arrive at these stops  times in the new schedule.

```js
plot_wait_times({
    stop_times,
    title: `How long do you have to wait for your next train / bus in ${ward_oi.name}?`,
    width
})
```

<div class="grid grid-cols-2">
    <div>

Here are key measures for wait times in ${ward_oi.name} (in minutes, lower is better):

${generateStatsTable(stop_times, 's_until_next_arrival', formatSecondsForStatsTable)}

</div>
    <div class="tip" style="height: fit-content">These numbers are affected by the service options you make above (e.g., weekday, Saturday, Sunday)—change those to see how your service numbers change!</div>
</div>

```js
const stop_times_oi_cutoff = 300

const stop_times_oi_per_stop_above_cutoff = stop_times_per_stop.filter(s => s.n_stop_times > stop_times_oi_cutoff)
```

```js
plot_st_per_stop_histogram({
    stop_times_per_stop,
    title: `How busy are stops in ${ward_oi.name}?`,
    width,
    stop_times_cutoff: stop_times_oi_cutoff
})
```

_The histogram cuts off ${stop_times_oi_per_stop_above_cutoff.filter(s => s.source === 'current').length} stop(s) in the previous schedule and ${stop_times_oi_per_stop_above_cutoff.filter(s => s.source === 'new').length} stop(s) in the new schedule where buses or trains arrive more than ${stop_times_oi_cutoff} times during the selected timeframe._

Here are key measures for arrival frequency at stops in ${ward_oi.name} (higher means stops are served more frequently):

${generateStatsTable(stop_times_per_stop, 'n_stop_times', d => Math.round(d))}

```js
const st_per_stop_new_mean = Math.round(d3.mean(stop_times_per_stop.filter(st => st.source === 'new'), d => d.n_stop_times))
```

_A mean value of ${st_per_stop_new_mean} indicates that the average stop in ${ward_oi.name} has ${st_per_stop_new_mean} arrivals during the service period you’ve selected above. Some stops will have more frequent arrivals, and others less frequent, as indicated by the range value._

```js
plot_arrival_frequencies({
    stop_times,
    title: `How do arrival frequencies in ${ward_oi.name} differ across service windows?`,
    subtitle_qualifier: "at stops",
    width: Math.max(width, 550),
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
```

```js
const ward_details = FileAttachment('../data/generated/wards/ward_details.json').json()
```
