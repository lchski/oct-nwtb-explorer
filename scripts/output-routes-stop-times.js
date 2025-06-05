import { DuckDBInstance } from '@duckdb/node-api'

const duckdb_instance = await DuckDBInstance.create()
const octdb = await duckdb_instance.connect()

await octdb.run(`CREATE TABLE routes AS SELECT * FROM read_parquet('./src/data/octranspo.com/routes.parquet')`)
await octdb.run(`CREATE TABLE stop_times AS SELECT * FROM read_parquet('./src/data/octranspo.com/stop_times.parquet')`)

const route_ids = await octdb.runAndReadAll(`SELECT DISTINCT route_id FROM routes`)

for await (const {route_id} of route_ids.getRowObjects()) { // TODO: remove unused fields from this and other per-page exports
	await octdb.run(`
		COPY (
			SELECT
				*
			FROM stop_times
			WHERE route_id = '${route_id}'
		) TO './src/data/generated/routes/stop_times/${route_id}.parquet' (COMPRESSION gzip)
	`)
}
