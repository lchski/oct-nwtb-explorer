---
theme: [light, wide]
toc: false
---

```js
import {label_stop_url} from './lib/helpers.js'
```

# Stops

Explore the NWTB data by focusing on a transit stop of interest to you.

## Choose a stop

```js
const stop_search_input = Inputs.search(stops, {placeholder: "Search stops"})
const stop_search = Generators.input(stop_search_input);
```

```js
const stop_table = Inputs.table(stop_search, {
    columns: [
        "stop_code",
        "stop_name_normalized",
        "stop_url"
    ],
    header: {
        stop_code: "Code",
        stop_name_normalized: "Stop name",
        stop_url: "Link"
    },
    format: {
        stop_url: x => html`<a href="${x}" title="Explore stop">↗</a>`
    },
    width: {
        stop_code: 40,
        stop_url: 30
    },
    sort: "stop_code",
    select: false
})
```

${stop_search_input}
${stop_table}



<!-- ## Data / loading -->

<!-- ### Database -->

```js
const stops_raw = await FileAttachment('./data/octranspo.com/stops_normalized.parquet').parquet()
const stops = stops_raw.toArray()
    .map(s => ({
        stop_code: s.stop_code,
        stop_name_normalized: s.stop_name_normalized
    }))
    .map(label_stop_url)
```
