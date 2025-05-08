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
Plot.plot({
    title: `How do arrival frequencies in ${ward_details.name} differ across service windows?`,
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

```js
// manually define what `map_control` expects
const map_control_stub = {
    ward: ward_oi,
    roads: (ward_oi.id == 'city') ? 4 : 5
}

const stop_times_plot = Plot.plot({
  width: width,
  title: `Transit stops in ${ward_details.name}`,
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
    Plot.dot(stop_times.map(label_schedules), Plot.group(
        {r: "count"},
        {
            x: "stop_lon_normalized",
            y: "stop_lat_normalized",
            color: "source",
            fill: "source",
            title: d => `#${d.stop_code}: ${stops.find(s => s.stop_code === d.stop_code).stop_name_normalized}`,
            tip: true,
            fx: "source",
            opacity: 0.7
        }
    ))
  ]
})
```

```js
stop_times_plot
```

<!-- Loading -->

```js
const ward_details = FileAttachment(`./${observable.params.ward_id}/details.json`).json()
```

```js
const get_ward_oi = () => {
    const ward_info = wards.features
        .find(ward => ward.properties.WARD == ward_details.number)

    return {
        id: ward_info.id,
        name: ward_info.properties.NAME,
        number: Number(ward_info.properties.WARD),
        geometry: ward_info.geometry
    }
}
const ward_oi = get_ward_oi()
```

```js
const stops_raw = await FileAttachment(`../data/octranspo.com/stops_normalized.parquet`).parquet()
const stops = stops_raw.toArray()
```

```js
stops
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