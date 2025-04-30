import {FileAttachment} from "observablehq:stdlib"
import {DuckDBClient} from "npm:@observablehq/duckdb"

export const octdb = DuckDBClient.of({
	stops: FileAttachment("../data/octranspo.com/stops_normalized.parquet").href + (navigator.userAgent.includes("Windows") ? `?t=${Date.now()}` : ""),
	stop_times_by_stop: FileAttachment("../data/octranspo.com/stop_times_by_stop.parquet").href + (navigator.userAgent.includes("Windows") ? `?t=${Date.now()}` : ""),
	stop_times: FileAttachment("../data/octranspo.com/stop_times.parquet").href + (navigator.userAgent.includes("Windows") ? `?t=${Date.now()}` : ""),
	routes: FileAttachment("../data/octranspo.com/routes.parquet").href + (navigator.userAgent.includes("Windows") ? `?t=${Date.now()}` : ""),
})

export const array_to_sql_qry_array = (arr) => `['${arr.join("','")}']`
