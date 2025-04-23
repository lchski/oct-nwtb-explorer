---
title: Explorer
toc: false
---

```js
viewof map_control_form = Inputs.form({
  // D3 and Plot expect coordinates to be specified as [longitude, latitude], so if you're setting your center point by grabbing coordinates from Google Maps, you'll need to reverse them.
  zoom: Inputs.range([0.025, 0.3], {
    value: 0.1,
    step: 0.025,
    label: "zoom"
  }),
  scroll_horizontal: Inputs.range([-0.4, 0.4], {
    value: 0,
    step: 0.025,
    label: "horizontal scroll (lat)"
  }),
  scroll_vertical: Inputs.range([-0.25, 0.2], {
    value: 0,
    step: 0.025,
    label: "vertical scroll (lon)"
  }),
  ward: Inputs.select([
      {
        id: "city",
        name: "All",
        number: "full city view"
      },
      ...ward_details
    ], {
    label: "ward",
    format: (ward) => `${ward.name} (${ward.number})`
  })
})
```

```js
viewof level_of_detail_form = Inputs.form({
  roads: Inputs.range([0, 5], {value: 3, label: "Roads (level of maintenance)", step: 1}),
  // schedule: Inputs.select(["current", "new"], {label: "schedule version"}),
  service_windows: Inputs.select(service_windows, {
    multiple: true,
    label: "service window(s) (blank for all)"
  }),
  service_ids: Inputs.select(service_ids, {
    multiple: true,
    label: "service date(s) (blank for all)"
  }),
  only_new_stops: Inputs.toggle({
    value: false,
    label: "Only show new stops"
  })
})
```

TODOs / things to track:
- `is_entirely_new_stop` vs `is_new_stop` are subtly but importantly different: the first considers stop frequencies in the entire context (i.e., stops that are currently entirely unserviced by OC Transpo, at least regularly), while the second looks at stops in the current context (with the service date and window filters)—we filter the stops to render based on `is_entirely_new_stop`, but the ranking occurs based on `is_new_stop` (which I think has to work that way, to make sure we always have something sensible to rank against)
- the `ward` “city” option implies it’ll zoom out to the whole city, but it actually just defaults to the janky scroll / zoom manual controls we have set up—add a true whole city ward option, and make clearer when / how to use the manual controls
- Saturday and Sunday data makes no sense, unless OC Transpo is dramatically increasing service those days
- what about stops that go out of service? how might we mark those? (essentially, the opposite of a “new” stop, whether entirely or for a particular selected context)

```js
Plot.plot({
  width: Math.max(width, 550),
  title: "Transit stops in Ottawa",
  projection: {
    type: "reflect-y",
    // domain: d3.geoCircle().center([-75.689515 + map_control.scroll_horizontal, 45.383611 + map_control.scroll_vertical]).radius(map_control.zoom)(),
    // inset: 2
    domain: (map_control.ward.id === "city") 
      ? d3.geoCircle().center([-75.689515 + map_control.scroll_horizontal, 45.383611 + map_control.scroll_vertical]).radius(map_control.zoom)()
      : map_control.ward.geometry,
    inset: 10
  },
  color: {
    type: "diverging",
    scheme: "RdBu",
    legend: true
  },
  marks: [
    Plot.geo(
      wards,
      {
        strokeWidth: 0.3
      }
    ),
    (map_control.ward.id === "city") ? null : Plot.geo(
      map_control.ward.geometry,
      {
        fill: "currentColor",
        fillOpacity: 0.02
      }
    ),
    Plot.geo(
      ons_neighbourhoods,
      {
        strokeWidth: 0.2
      }
    ),
    Plot.geo(
      ({
        type: roads.type,
        crs: roads.crs,
        features: roads.features.filter((road) => road.properties.MAINTCLASS <= level_of_detail.roads) // adjust on this or other criteria to control how many roads get rendered
      }),
      {
        strokeWidth: 0.15
      }
    ),
    Plot.geo(
      ons_neighbourhoods,
      Plot.centroid({
        tip: false,
        channels: {
          "Neighbourhood": (d) => d.properties.Name,
          "Population (approx)": (d) => d.properties.POPEST.toLocaleString(),
          "ONS ID": (d) => d.properties.ONS_ID
        },
        strokeOpacity: 0
      })
    ),
    // Plot.density(
    //   stops_reranked, {
    //     color: {
    //       type: "diverging"
    //     },
    //     x: "stop_lon_normalized",
    //     y: "stop_lat_normalized",
    //     weight: (d) => d.ranking,
    //     bandwidth: 25,
    //     fill: "density",
    //     opacity: 0.5
    //   }
    // ),
    Plot.dot(// combines new and existing stops to provide the pointer details
      (level_of_detail.only_new_stops) ? stops_reranked.filter(stop => stop.is_entirely_new_stop) : stops_reranked, Plot.pointer({
        x: "stop_lon_normalized",
        y: "stop_lat_normalized",
        r: (d) => d.n_stops_new,
        stroke: "currentColor",
        fill: "black",
        strokeWidth: (map_control.zoom <= 0.05) ? 0.2 : 0.01,
        strokeOpacity: (map_control.zoom <= 0.05) ? 1 : 0.5,
        channels: {
          Name: d => d.stop_name_normalized,
          "Stop code": d => d.stop_code,
          "Stop frequency (current)": d => d.n_stops_current,
          "Stop frequency (new)": d => d.n_stops_new,
          "Difference (new vs current)": d => d.n_stops_difference,
          "% change": d => d.is_new_stop ? "n/a (new stop)" : Math.round(d.pct_stops_difference * 1000) / 10,
          "Change rank": d => d.ranking
        },
        tip: {format: {
          x: false,
          y: false,
          r: false,
          stroke: false,
          fill: false
        }}
      })
    ),
    (level_of_detail.only_new_stops) ? null : Plot.dot(
      stops_reranked.filter(stop => ! stop.is_entirely_new_stop), {
        x: "stop_lon_normalized",
        y: "stop_lat_normalized",
        r: (d) => d.n_stops_new,
        stroke: "currentColor",
        // fill: d => Math.round(d.pct_stops_difference * 1000) / 10,
        fill: "ranking",
        fillOpacity: 0.9,
        strokeWidth: (map_control.zoom <= 0.05) ? 0.2 : 0.01,
        strokeOpacity: (map_control.zoom <= 0.05) ? 1 : 0.5
      }
    ),
    Plot.dot(
      stops_reranked.filter(stop => stop.is_entirely_new_stop), {
        x: "stop_lon_normalized",
        y: "stop_lat_normalized",
        r: (d) => d.n_stops_new,
        stroke: "currentColor",
        symbol: "cross",
        // fill: "n_stops_difference",
        fill: "ranking",
        fillOpacity: 0.9,
        strokeWidth: (map_control.zoom <= 0.05) ? 0.2 : 0.01,
        strokeOpacity: (map_control.zoom <= 0.05) ? 1 : 0.5
      }
    )
  ]
})
```


## Data loading
You can ignore this, unless you’re into code!

### Specific

### Geo

```js
roads = FileAttachment("Road_Centrelines_simplify_25.geojson").json()

ons_neighbourhoods = FileAttachment("ons_boundaries.geojson").json()

ward_details = wards.features
  .map(ward => ({
    id: ward.id,
    name: ward.properties.NAME,
    number: Number(ward.properties.WARD),
    geometry: ward.geometry
  }))
  .sort((wardA, wardB) => wardB.number < wardA.number)

wards = FileAttachment("wards_2022_to_2026.geojson").json()
```

### Foundational

TODO: debounce the two inputs

```js
// map_control = debounce(viewof map_control_form, 750)

// level_of_detail = debounce(viewof level_of_detail_form, 100)
```

### Database

NB! We assume the following sets of service_ids and service_windows:

TKTK

```js
stops = octdb.query(`
WITH stop_frequencies AS (
  SELECT 
    stop_code,
    SUM(CASE WHEN source = 'current' THEN n_stop_times ELSE 0 END)::INTEGER AS current,
    SUM(CASE WHEN source = 'new' THEN n_stop_times ELSE 0 END)::INTEGER AS new
  FROM stop_times_by_stop
  WHERE 
    list_contains(${array_to_sql_qry_array(selected_service_windows)}, service_window) AND
    list_contains(${array_to_sql_qry_array(selected_service_ids)}, service_id)
  GROUP BY stop_code
)
SELECT 
  s.*,
  COALESCE(sf.current, 0) AS n_stops_current,
  COALESCE(sf.new, 0) AS n_stops_new,
  n_stops_new - n_stops_current AS n_stops_difference,
  n_stops_difference::FLOAT / n_stops_current::FLOAT AS pct_stops_difference,
  IF(n_stops_current = 0, TRUE, FALSE) AS is_new_stop
FROM stops s
LEFT JOIN stop_frequencies sf USING(stop_code);
`)
```

```js
stops_reranked = octdb.query(`
WITH stop_frequencies AS (
  SELECT 
    stop_code,
    SUM(CASE WHEN source = 'current' THEN n_stop_times ELSE 0 END)::INTEGER AS current,
    SUM(CASE WHEN source = 'new' THEN n_stop_times ELSE 0 END)::INTEGER AS new
  FROM stop_times_by_stop
  WHERE 
    list_contains(${array_to_sql_qry_array(selected_service_windows)}, service_window) AND
    list_contains(${array_to_sql_qry_array(selected_service_ids)}, service_id)
  GROUP BY stop_code
),
stop_frequencies_all AS (
  SELECT 
    stop_code,
    SUM(CASE WHEN source = 'current' THEN n_stop_times ELSE 0 END)::INTEGER AS current_all
  FROM stop_times_by_stop
  GROUP BY stop_code
),
base_query AS (
  SELECT 
    s.*,
    COALESCE(sf.current, 0) AS n_stops_current,
    COALESCE(sf.new, 0) AS n_stops_new,
    n_stops_new - n_stops_current AS n_stops_difference,
    n_stops_difference::FLOAT / NULLIF(n_stops_current::FLOAT, 0) AS pct_stops_difference,
    CASE WHEN n_stops_current = 0 THEN TRUE ELSE FALSE END AS is_new_stop,
    CASE WHEN COALESCE(sfa.current_all, 0) = 0 THEN TRUE ELSE FALSE END AS is_entirely_new_stop
  FROM stops s
  LEFT JOIN stop_frequencies sf USING(stop_code)
  LEFT JOIN stop_frequencies_all sfa USING(stop_code)
)
SELECT 
  *,
  CASE 
    WHEN is_new_stop THEN 
      DENSE_RANK() OVER (PARTITION BY is_new_stop ORDER BY n_stops_difference ASC)
    ELSE 
      CASE 
        WHEN pct_stops_difference > 0 THEN 
          DENSE_RANK() OVER (PARTITION BY is_new_stop, pct_stops_difference >= 0 ORDER BY pct_stops_difference ASC)
        WHEN pct_stops_difference = 0 THEN
          0
        ELSE 
          -DENSE_RANK() OVER (PARTITION BY is_new_stop, pct_stops_difference < 0 ORDER BY pct_stops_difference DESC)
      END
  END AS ranking
FROM base_query
ORDER BY ranking DESC;
`)
```

Two different scales, we want to reconcile into one:
- where `is_new_stop=true`, the scale should be `n_stops_difference` (in descending order: the one with the greatest `n_stops_difference` should have the highest value number)
- where `is_new_stop=false`, the scale should be `pct_stops_difference` (in descending order, with negatives accounted for: the greatest `pct_stops_difference` should have the highest value number, while the most negative `pct_stops_difference` should have the lowest value number _negative, increasing from 0_)

That was successfully (more or less) implemented in v353. Claude helped, though I had to tweak the partition orders, and chose `DENSE_RANK` instead of `RANK`.

One issue with this approach, is that new stops get kinda buried: the new O-Train stops are pretty significant additions, but they don’t stand out much as new stops. One way would be to normalize the ranking scale for new stops to correspond to the positive values of the existing stops ranks.

We get quite a colourful chart! But maybe it’s too colourful?

Another way to do it, maybe, to make things a bit easier to follow:
- bin the scales of interest (`n_stops_difference` for new stops, `pct_stops_difference` for existing ones) and base the ranking on those bins

```js
const selected_service_windows = level_of_detail.service_windows.length === 0 ?
  service_windows :
  level_of_detail.service_windows

const selected_service_ids = level_of_detail.service_ids.length === 0 ?
  service_ids :
  level_of_detail.service_ids

const service_windows = [
  "off_peak_morning",
  "peak_morning",
  "off_peak_midday",
  "peak_afternoon",
  "off_peak_evening",
  "off_peak_night"
]

const service_ids = [
  "weekday",
  "saturday",
  "sunday"
]

const octdb = DuckDBClient.of({
  stops: FileAttachment("stops_normalized@1.parquet"),
  stop_times_by_stop: FileAttachment("stop_times_by_stop@4.parquet"),
})

// if you want to interpolate an array into a query, use this helper function
// for example:
// gtfsdb.query(`SELECT DISTINCT(stop_id) FROM stop_times_extended WHERE list_contains(${array_to_sql_qry_array(level_of_detail.service_windows)}, service_window)`)
const array_to_sql_qry_array = (arr) => `['${arr.join("','")}']`
```

## Credits

- GTFS data, City of Ottawa
- ONS map, City of Ottawa https://open.ottawa.ca/datasets/ottawa-neighbourhood-study-ons-neighbourhood-boundaries-gen-2
- Wards 2022–2026, City of Ottawa https://open.ottawa.ca/datasets/ottawa::wards-2022-2026-1

```js
// import {debounce} from "@mbostock/debouncing-input"
```

## [ideas]
- do a before / after density map
- instead of manual zooming (but maybe make it an option if people want), offer ability to zoom to entire city, or specific wards (it'll focus on that ward, but show nearby, too)
