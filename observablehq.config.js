import MarkdownItFootnote from "markdown-it-footnote";
import { DuckDBInstance } from '@duckdb/node-api';

const duckdb_instance = await DuckDBInstance.create()
const octdb = await duckdb_instance.connect()

await octdb.run(`CREATE TABLE routes AS SELECT * FROM read_parquet('./src/data/octranspo.com/routes.parquet')`)
await octdb.run(`CREATE TABLE stops AS SELECT * FROM read_parquet('./src/data/octranspo.com/stops_normalized.parquet')`)

// See https://observablehq.com/framework/config for documentation.
export default {
  // The app’s title; used in the sidebar and webpage titles.
  title: "NWTB Explorer",

  // The pages and sections in the sidebar. If you don’t specify this option,
  // all pages will be listed in alphabetical order. Listing pages explicitly
  // lets you organize them into sections and have unlisted pages.
  // pages: [
  //   {
  //     name: "Examples",
  //     pages: [
  //       {name: "Dashboard", path: "/example-dashboard"},
  //       {name: "Report", path: "/example-report"}
  //     ]
  //   }
  // ],
  pages: [
    {
      name: "Explore by…",
      pages: [
        {name: "Wards (including city-wide)", path: "/wards"},
        {name: "Routes", path: "/routes"},
        {name: "Stops", path: "/stops"},
      ]
    },
    {
      name: "Learn more about…",
      pages: [
        {name: "Methodology", path: "/about/methodology"},
        {name: "Data", path: "/about/data"},
        {name: "Author", path: "/about/author"}
      ]
    }
  ],
  async *dynamicPaths() {
    const route_ids = await octdb.runAndReadAll(`SELECT DISTINCT route_id FROM routes`)

    for await (const {route_id} of route_ids.getRowObjects()) {
      yield `/routes/${route_id}`;
    }

    const stop_codes = await octdb.runAndReadAll(`SELECT DISTINCT stop_code FROM stops`)

    for await (const {stop_code} of stop_codes.getRowObjects()) {
      yield `/stops/${stop_code}`;
    }

    for (const ward_number of Array.from({ length: 24 }, (_, i) => i + 1)) {
      yield `/wards/${ward_number}`
    }
  },

  // Content to add to the head of the page, e.g. for a favicon:
  // head: '<link rel="icon" href="observable.png" type="image/png" sizes="32x32">',

  // The path to the source root.
  root: "src",

  // Some additional configuration options and their defaults:
  theme: "light", // try "light", "dark", "slate", etc.
  // header: "", // what to show in the header (HTML)
  // footer: "Built with Observable.", // what to show in the footer (HTML)
  // sidebar: true, // whether to show the sidebar
  // toc: true, // whether to show the table of contents
  // pager: true, // whether to show previous & next links in the footer
  // output: "dist", // path to the output root for build
  // search: true, // activate search
  // linkify: true, // convert URLs in Markdown to links
  // typographer: false, // smart quotes and other typographic improvements
  // preserveExtension: false, // drop .html from URLs
  // preserveIndex: false, // drop /index from URLs
  markdownIt: (md) => md.use(MarkdownItFootnote),
};
