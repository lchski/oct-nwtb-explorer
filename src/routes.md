---
theme: [light, wide]
toc: false
---

```js
import {to_pct, ch_incr_decr, label_service_windows, label_schedules, label_route_ids} from './lib/helpers.js'
import {service_period_desc, level_of_detail_input, selected_service_windows, selected_service_ids} from './lib/controls.js'
import {wards} from './lib/maps.js'

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
```


```js
const selected_route = view(Inputs.table(routes.map(label_schedules).map(label_route_ids), {
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
        total_trips: "Trips (#, total)"
    },
    width: {
        stop_code: 50,
        ward_number: 100
    },
    sort: "route_id",
    select: false
}))
```

<!-- ## Data / loading -->

<!-- ### Database -->

```js
import {octdb, array_to_sql_qry_array} from './lib/octdb.js'
```

```js
const routes = [...await octdb.query(`
SELECT
    source,
    route_id,
    STRING_AGG(most_common_headsign, ' // ') AS most_common_headsign,
    SUM(total_trips)::INTEGER AS total_trips
FROM routes
GROUP BY source, route_id
`)]
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
