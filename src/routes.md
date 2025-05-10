---
theme: [light, wide]
toc: false
---

```js
import {to_pct, ch_incr_decr, label_service_windows, label_schedules, label_route_ids} from './lib/helpers.js'
import {service_period_desc, level_of_detail_input, selected_service_windows, selected_service_ids} from './lib/controls.js'
import {roads, ons_neighbourhoods, wards, city_limits, plot_basemap_components, get_map_domain} from './lib/maps.js'
import {rewind} from "jsr:@nshiab/journalism/web"

const level_of_detail = Generators.input(level_of_detail_input)
```

# Routes

Explore the NWTB data by focusing on a route of interest to you.

## Choose service period

${service_period_desc}

<div class="grid grid-cols-2" style="grid-auto-rows: auto;">
	<div class="card">
		<h3>OC Transpo service details</h3>
		${level_of_detail_input}
	</div>
</div>

## Choose a route

```js
const route_id_oi_raw = view(Inputs.text({
    label: "Route ID of interest",
    placeholder: "e.g., enter just “98” for the 98",
    submit: true
}))
```

```js
// remap input value to the underlying values for the trains (inverse of `label_route_ids`, basically)
const get_route_id_oi = () => {
    switch(route_id_oi_raw) {
        case '1':
            return '1-350'
        case '2':
            return '2-354'
        case '4':
            return '4-354'
        default:
            return route_id_oi_raw
    }
}

const route_id_oi = get_route_id_oi()

const route_id_oi_pretty = [{route_id: route_id_oi}].map(label_route_ids)[0].route_id
```


```js
view(Inputs.table(routes.map(label_schedules).map(label_route_ids), {
    columns: [
        "source",
        "route_id",
        "most_common_headsign",
        "total_trips"
    ],
    header: {
        source: "Schedule",
        route_id: "Route #",
        most_common_headsign: "Direction",
        total_trips: "Trips (total all days / times)"
    },
    width: {
        source: 150
    },
    sort: "route_id",
    select: false
}))
```


## Details for route ${route_id_oi_pretty}

```js
const get_route_id_oi_sources = () => {
    const unique_sources = [...new Set(stop_times_oi.map(st => st.source))]

    if (unique_sources.length === 2) {
        return 'both'
    }

    return unique_sources[0]
}

const describe_route_id_oi_sources = () => {
    const route_id_oi_sources = get_route_id_oi_sources()

    if (route_id_oi_sources === "both") {
        return html`Route ${route_id_oi_pretty} is active in <strong>both schedules</strong>.`
    }

    if (route_id_oi_sources === "current") {
        return html`Route ${route_id_oi_pretty} was only active in <strong>the previous schedule</strong>.`
    }

    return html`Route ${route_id_oi_pretty} is only active in <strong>the current schedule</strong>.`
}
```

<div class="caution">
    <p>Most routes have changed with NWTB. Some routes only exist in the previous schedule, others only in the new one. For routes that exist in both, the routing and stops may have changed. Because of this, direct comparisons may not always be useful, or may only show one of the two schedules.</p>
    <p>${describe_route_id_oi_sources()}</p>
</div>

```js
// manually define what `map_control` expects
const map_control_stub = {
    ward: {
        id: 'city'
    },
    roads: 4
}

const stop_times_plot = Plot.plot({
  width: width,
  title: `How often does the #${route_id_oi_pretty} stop across its route?`,
  projection: {
    type: "mercator",
    domain: stops_to_geojson(stops_oi),
    inset: 25
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
            title: d => `Stop #${d.stop_code}: ${stops_oi.find(s => s.stop_code === d.stop_code).stop_name_normalized}`,
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

```js
Plot.plot({
    title: `How long do you have to wait for the #${route_id_oi_pretty}?`,
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
Plot.plot({
    title: `How do arrival frequencies for the #${route_id_oi_pretty} differ across service windows?`,
    subtitle: "Counts how many times buses or trains arrive on this route during the selected service windows, previous schedule vs. NWTB",
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

<!-- ## Data / loading -->

<!-- ### Database -->

```js
import {octdb, array_to_sql_qry_array} from './lib/octdb.js'
```

```js
const routes_raw = await FileAttachment(`./data/generated/routes/routes.parquet`).parquet()
const routes = routes_raw.toArray()
```

```js
const stop_times_oi = [...await octdb.query(`
SELECT *
FROM stop_times
WHERE
  list_contains(${array_to_sql_qry_array(selected_service_windows(level_of_detail))}, service_window) AND
  list_contains(${array_to_sql_qry_array(selected_service_ids(level_of_detail))}, service_id) AND
  route_id = '${route_id_oi}'
`)]
```

```js
const stops_oi = [...await octdb.query(`
SELECT 
    stop_code,
    stop_name_normalized,
    stop_lat_normalized,
    stop_lon_normalized
FROM stops
WHERE
    list_contains(${array_to_sql_qry_array([...new Set(stop_times_oi.map(st => st.stop_code))])}, stop_code)
`)]
```

```js
const stops_to_geojson = (stops_to_convert) => {
  const stops_geojson = {
    type: "FeatureCollection",
    features: []
  }
  
  stops_to_convert.forEach(stop => {
    const feature = {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [stop.stop_lon_normalized, stop.stop_lat_normalized]
      },
      properties: {
        stop_code: stop.stop_code
      }
    }

    stops_geojson.features.push(feature)
  })
  
  return stops_geojson;
}
```


