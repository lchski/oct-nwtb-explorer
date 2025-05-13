---
---

```js
import {to_pct, ch_incr_decr, label_service_windows, label_schedules, label_route_ids, generateStatsTable, formatSecondsForStatsTable} from '../lib/helpers.js'
import {service_period_desc, level_of_detail_input, selected_service_windows, selected_service_ids} from '../lib/controls.js'
import {roads, ons_neighbourhoods, wards, plot_basemap_components, get_map_domain} from '../lib/maps.js' // TODO: verify which, if any, of these is necessary
import {rewind} from "jsr:@nshiab/journalism/web"

const level_of_detail = Generators.input(level_of_detail_input)
```

# Route: ${route_oi}

Learn more about the impacts of NWTB for route #${route_oi}. Or, [return to the routes page to pick another route](/routes).

## Choose service period

${service_period_desc}

<div class="grid grid-cols-2" style="grid-auto-rows: auto;">
	<div class="card">
		<h3>OC Transpo service details</h3>
		${level_of_detail_input}
	</div>
</div>



<!-- Loading -->


```js
const stop_times_raw = await FileAttachment(`../data/generated/routes/stop_times/${observable.params.route_id}.parquet`).parquet()
const stop_times = stop_times_raw.toArray().filter(d => selected_service_windows(level_of_detail).includes(d.service_window) && selected_service_ids(level_of_detail).includes(d.service_id))
```

```js
const route_oi = observable.params.route_id
```
