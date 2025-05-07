---
theme: [light, wide]
---

```js
import {to_pct, ch_incr_decr, summ_diff, label_service_windows, label_wards, label_schedules} from '../lib/helpers.js'
import {service_period_desc, level_of_detail_input, selected_service_windows, selected_service_ids} from '../lib/controls.js'
import {roads, ons_neighbourhoods, wards, city_limits, plot_basemap_components, get_map_domain} from '../lib/maps.js'
import {rewind} from "jsr:@nshiab/journalism/web"

const level_of_detail = Generators.input(level_of_detail_input)
```

# Ward: ${ward_details.name} (#${ward_details.number})

## Focus on the impacts of NWTB in ${ward_details.name}

## Choose service period

${service_period_desc}

<div class="grid grid-cols-2" style="grid-auto-rows: auto;">
	<div class="card">
		<h3>OC Transpo service period</h3>
		${level_of_detail_input}
	</div>
</div>

During the service period you’ve selected above, ${ward_details.name} has:
- ${stops_oi.length.toLocaleString()} total stops (combining the previous and new schedule)
- ${stop_times_oi_per_stop.filter(s => s.source === 'new').length.toLocaleString()} (${to_pct(stop_times_oi_per_stop.filter(s => s.source === 'new').length / stops_oi.length)}%) of these stops active in the new schedule

Buses or trains arrive at these stops ${stop_times_oi_summary.new.n.toLocaleString()} times in the new schedule.

```js
Plot.plot({
    title: `How long do you have to wait for your next train / bus in ${ward_details.name}?`,
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
const ward_details = FileAttachment(`./${observable.params.ward_id}/details.json`).json()
```

```js
ward_details
```

```js
const stop_times_raw = await FileAttachment(`../data/generated/wards/${observable.params.ward_id}.parquet`).parquet()
const stop_times = stop_times_raw.toArray().filter(d => selected_service_windows(level_of_detail).includes(d.service_window) && selected_service_ids(level_of_detail).includes(d.service_id))
```

```js
stop_times
```

```js
const stop_times_per_stop_raw = await FileAttachment(`./${observable.params.ward_id}/stop_times_per_stop.csv`).csv()
const stop_times_per_stop = stop_times_per_stop_raw.filter(d => selected_service_windows(level_of_detail).includes(d.service_window) && selected_service_ids(level_of_detail).includes(d.service_id))
```

```js
stop_times_per_stop
```