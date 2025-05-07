import { parseArgs } from "node:util"
import { csvFormat } from "d3-dsv"
import JSZip from "jszip"
// import { octdb } from '../data/octdb-builder.js'
import { DuckDBInstance } from '@duckdb/node-api'

const {
	values: { ward_id }
} = parseArgs({
	options: { ward_id: { type: "string" } }
})

// use group by rollup

const duckdb_instance = await DuckDBInstance.create()
const octdb = await duckdb_instance.connect()

await octdb.run(`CREATE TABLE stop_times AS SELECT * FROM read_parquet('./src/data/octranspo.com/stop_times.parquet') WHERE ward_number = ${ward_id}`)

const stop_times = await octdb.runAndReadAll(`SELECT source, service_window, stop_code, stop_lat_normalized, stop_lon_normalized, s_until_next_arrival FROM stop_times`)

const zip = new JSZip()
zip.file("details.json", JSON.stringify({ ward_number: ward_id, ward_name: "test!" }, null, 2))
zip.file("stop_times.csv", csvFormat(stop_times.getRowObjects()))
zip.generateNodeStream().pipe(process.stdout)
