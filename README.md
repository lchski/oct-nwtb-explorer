# NWTB Explorer

## Running the code

This is an [Observable Framework](https://observablehq.com/framework/) app. To install the required dependencies, run:

```
npm install
```

Then, to start the local preview server, run:

```
npm run dev
```

Then visit <http://localhost:3000> to preview the app.

To build, run:

```
npm run clean && npm run build
```

For more, see <https://observablehq.com/framework>.

## Data

To reproduce the build, you’ll need data. I haven’t fully written up how to pull that together yet—see #22 for an outline.

## Project structure

Key files for the site:

```ini
.
├─ src
│  ├─ data
│  │  ├─ generated/            # data files output (see scripts/)
│  │  └─ octranspo.com/        # for-web output files (see https://github.com/lchski/octranspo-new-ways-to-bus-data/)
│  │  └─ ottawa.ca/            # GIS files (see src/about/data.md)
│  ├─ lib/                     # JS files reused across the site
│  └─ **/*.md                  # pages of the site
├─ scripts/                    # outputs additional data for wards, routes, and stops
└─ observablehq.config.js      # notably, controls parameterized routes used for much of the site (see https://observablehq.com/framework/params)
```
