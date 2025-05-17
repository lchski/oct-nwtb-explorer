import { DuckDBInstance } from '@duckdb/node-api'

const duckdb_instance = await DuckDBInstance.create()
const octdb = await duckdb_instance.connect()

await octdb.run(`CREATE TABLE stops AS SELECT * FROM read_parquet('./src/data/octranspo.com/stops_normalized.parquet')`)
await octdb.run(`CREATE TABLE stop_times AS SELECT * FROM read_parquet('./src/data/octranspo.com/stop_times.parquet')`)

const stop_codes = await octdb.runAndReadAll(`SELECT DISTINCT stop_code FROM stops`)

for await (const {stop_code} of stop_codes.getRowObjects()) {
	await octdb.run(`
		COPY (
			SELECT
				*
			FROM stop_times
			WHERE stop_code = '${stop_code}'
		) TO './src/data/generated/stops/stop_times/${stop_code}.parquet' (COMPRESSION gzip)
	`)
}
