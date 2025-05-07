Ward #${observable.params.ward_id}

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
const stop_times = FileAttachment(`./${observable.params.ward_id}/stop_times.csv`).csv()
```

```js
stop_times
```
