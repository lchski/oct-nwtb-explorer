import { DuckDBInstance } from '@duckdb/node-api'

const duckdb_instance = await DuckDBInstance.create()
const octdb = await duckdb_instance.connect()

await octdb.run(`CREATE TABLE stop_times AS SELECT * FROM read_parquet('./src/data/octranspo.com/stop_times.parquet')`)

for (const ward_number of Array.from({ length: 24 }, (_, i) => i + 1)) {
	await octdb.run(`
		COPY (
			SELECT
				*
			FROM stop_times
			WHERE ward_number = ${ward_number}
		) TO './src/data/generated/wards/stop_times/${ward_number}.parquet' (COMPRESSION gzip)
	`)
}
