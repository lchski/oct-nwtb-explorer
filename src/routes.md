---
theme: [light, wide]
toc: false
---

```js
import {to_pct, ch_incr_decr, label_service_windows, label_schedules, label_route_ids, label_route_url} from './lib/helpers.js'
```

# Routes

Explore the NWTB data by focusing on a route of interest to you.

## Choose a route

```js
const route_id_oi_raw = view(Inputs.text({
    label: "Route ID of interest",
    placeholder: "e.g., enter just “98” for the 98",
    submit: true
}))
```

```js
const route_id_oi = route_id_oi_raw

const route_id_oi_pretty = [{route_id: route_id_oi}].map(label_route_ids)[0].route_id
```

<p>${describe_route_id_oi_sources()}</p>


```js
view(Inputs.table(routes.map(label_schedules).map(label_route_ids), {
    columns: [
        "source",
        "route_id",
        "most_common_headsign",
        "total_trips",
        "route_url"
    ],
    header: {
        source: "Schedule",
        route_id: "Route #",
        most_common_headsign: "Direction",
        total_trips: "Trips (total all days / times)",
        route_url: "Link"
    },
    format: {
        route_url: x => html`<a href="${x}">Explore</a>`
    },
    sort: "route_id",
    select: false
}))
```

```js
const get_route_id_oi_sources = () => {
    const unique_sources = [...new Set(routes.filter(d => d.route_id === route_id_oi).map(st => st.source))]

    console.log(unique_sources)

    if (unique_sources.length === 2) {
        return 'both'
    }

    if (unique_sources.length === 0) {
        return 'neither'
    }

    return unique_sources[0]
}

const describe_route_id_oi_sources = () => {
    const route_id_oi_sources = get_route_id_oi_sources()

    if (route_id_oi === "") {
        return html`Pick a route to see whether it was active in the previous schedule, current schedule, or both schedules.`
    }

    if (route_id_oi_sources === "neither") {
        return html`There is <strong>no route ${route_id_oi_pretty} in either the previous or current schedule</strong>. Pick another route to see whether it was active in the previous schedule, current schedule, or both schedules.`
    }

    const route_link = html.fragment`To learn more, <strong><a href="/routes/${route_id_oi}">check out the ${route_id_oi_pretty}’s route page</a></strong>.`

    if (route_id_oi_sources === "both") {
        return html`Route ${route_id_oi_pretty} is active in <strong>both schedules</strong>. ${route_link}`
    }

    if (route_id_oi_sources === "current") {
        return html`Route ${route_id_oi_pretty} was only active in <strong>the previous schedule</strong>. ${route_link}`
    }

    return html`Route ${route_id_oi_pretty} is only active in <strong>the current schedule</strong>. ${route_link}`
}
```

<!-- ## Data / loading -->

<!-- ### Database -->

```js
const routes_raw = await FileAttachment(`./data/generated/routes/routes.parquet`).parquet()
const routes = routes_raw.toArray().map(label_route_url)
```
