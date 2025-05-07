import { DuckDBInstance } from '@duckdb/node-api';

const duckdb_instance = await DuckDBInstance.create()
export const octdb = await duckdb_instance.connect()
