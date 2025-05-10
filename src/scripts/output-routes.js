import { DuckDBInstance } from '@duckdb/node-api'

const duckdb_instance = await DuckDBInstance.create()
const octdb = await duckdb_instance.connect()

await octdb.run(`CREATE TABLE stop_times AS SELECT * FROM read_parquet('./src/data/octranspo.com/stop_times.parquet')`)
await octdb.run(`CREATE TABLE routes AS SELECT * FROM read_parquet('./src/data/octranspo.com/routes.parquet')`)

await octdb.run(`
	COPY (
		SELECT
			source,
			route_id,
			STRING_AGG(most_common_headsign, ' // ') AS most_common_headsign,
			SUM(total_trips)::INTEGER AS total_trips
		FROM routes
		GROUP BY source, route_id
		ORDER BY route_id, source
	) TO './src/data/generated/routes/routes.parquet' (COMPRESSION gzip)
`)

