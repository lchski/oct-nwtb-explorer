Ward #${observable.params.ward_id}

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
