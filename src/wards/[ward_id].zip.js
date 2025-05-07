import { parseArgs } from "node:util"
import { csvFormat } from "d3-dsv"
import JSZip from "jszip"
import { DuckDBInstance } from '@duckdb/node-api'
import * as fs from 'fs';


const {
	values: { ward_id }
} = parseArgs({
	options: { ward_id: { type: "string" } }
})


// Ward details
const wards = JSON.parse(fs.readFileSync('./src/data/ottawa.ca/wards_2022_to_2026.geojson'))

const ward_details = wards.features
	.filter(ward => ward.properties.WARD == ward_id)
	.map(ward => ({
		id: ward.id,
		name: ward.properties.NAME,
		number: Number(ward.properties.WARD)
	}))
	[0]

// Stop times
// TODO: use group by rollup
const duckdb_instance = await DuckDBInstance.create()
const octdb = await duckdb_instance.connect()

await octdb.run(`CREATE TABLE stop_times AS SELECT * FROM read_parquet('./src/data/octranspo.com/stop_times.parquet') WHERE ward_number = ${ward_id}`)

const stop_times_raw = await octdb.runAndReadAll(`
	SELECT
		source,
		service_id,
		service_window,
		COUNT(*) as arrival_frequency
	FROM stop_times
	GROUP BY ROLLUP (source, service_id, service_window)
`)
const stop_times = await stop_times_raw.getRowObjects()

const zip = new JSZip()
zip.file("details.json", JSON.stringify(ward_details))
zip.file("stop_times.csv", csvFormat(stop_times))
zip.generateNodeStream().pipe(process.stdout)
