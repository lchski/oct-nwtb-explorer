---
title: Stops
theme: dashboard
---

```js
import {to_pct, ch_incr_decr} from './lib/helpers.js'
import {level_of_detail_input, selected_service_windows, selected_service_ids} from './lib/controls.js'
import {wards} from './lib/maps.js'

const level_of_detail = Generators.input(level_of_detail_input)
```

<div class="grid grid-cols-2" style="grid-auto-rows: auto;">
	<h2 class="grid-colspan-2">Controls</h2>
	<div class="card">
		<h3>OC Transpo service details</h3>
		${level_of_detail_input}
	</div>
</div>

```js
const search = view(Inputs.search(stops, {placeholder: "Search stops"}));
```

```js
Inputs.table(search)
```

<!-- ## Data / loading -->

<!-- ### Database -->

```js
import {octdb, array_to_sql_qry_array} from './lib/octdb.js'
```

```js
const stops = [...await octdb.query(`
SELECT *
FROM stops
`)]
```

```js
const stop_times = [...await octdb.query(`
SELECT *
FROM stop_times
WHERE
  list_contains(${array_to_sql_qry_array(selected_service_windows(level_of_detail))}, service_window) AND
  list_contains(${array_to_sql_qry_array(selected_service_ids(level_of_detail))}, service_id)
`)]
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
