---
sql:
  routes: ../data/octranspo.com/routes.parquet
  stop_times: ../data/octranspo.com/stop_times.parquet
---

# Route: ${observable.params.route_id}

```sql id=route_details
SELECT * FROM routes WHERE route_id = ${observable.params.route_id}
```

```js
[...route_details]
```

${[...route_details][0].most_common_headsign}

```sql
SELECT * FROM stop_times WHERE route_id = ${observable.params.route_id}
```