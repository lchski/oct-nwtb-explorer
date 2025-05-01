---
theme: [light, wide]
toc: false
---

```js
import {to_pct, ch_incr_decr, label_service_windows, label_schedules} from './lib/helpers.js'
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
const selected_route = Inputs.table(routes, {

})
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

const routes2 = [...await octdb.query(`
SELECT
  route_id,
  CASE
    WHEN COUNT(DISTINCT source) > 1 THEN 'both'
    ELSE MAX(source)
  END AS source,
  STRING_AGG(most_common_headsign, ' // ') AS most_common_headsign,
  SUM(total_trips)::INTEGER AS total_trips
FROM routes
GROUP BY route_id
`)]
```

```js
routes
```

```js
routes2
```
