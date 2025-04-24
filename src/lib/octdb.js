import {FileAttachment} from "observablehq:stdlib"
import {DuckDBClient} from "npm:@observablehq/duckdb"

export const octdb = DuckDBClient.of({
	stops: FileAttachment("../data/octranspo.com/stops_normalized.parquet"),
	stop_times_by_stop: FileAttachment("../data/octranspo.com/stop_times_by_stop.parquet"),
  stop_times: FileAttachment("../data/octranspo.com/stop_times.parquet"),
})

export const array_to_sql_qry_array = (arr) => `['${arr.join("','")}']`
