# Methodology

If you’re just interested in the code:

- [data repo](https://github.com/lchski/octranspo-new-ways-to-bus-data)
- [explorer repo](https://github.com/lchski/oct-nwtb-explorer)

If you’d like more detail, including on the definition of key metrics and the data’s limitations, read on!

## How it’s made

This site relies on a processed version of [OC Transpo’s GTFS data](https://www.octranspo.com/en/plan-your-trip/travel-tools/developers/). The version of the GTFS data available on April 18, 2025 included both the previous schedule and the (now-)current schedule (the NWTB schedule). This GTFS data [undergoes some transformation](https://github.com/lchski/octranspo-new-ways-to-bus-data) to create the data used for this site.

Briefly, that data transformation:

1. Filters the data to focus on trips scheduled to occur on six “representative days”, one for each of “Weekday”, “Saturday”, and “Sunday” for each of the two schedules
    - 2019–2025 (previous): April 11, 12, and 13, 2025
    - NWTB: May 9, 10, and 11, 2025
    - (These days were chosen to avoid holidays and other changes to service, and shopper routes that only occur on other days of the week were manually added to the “weekday” schedules, so they should be reasonably representative.)
2. Adds some information to each “stop time”, including the “service window” during which it occurs (one of six, based on the [O-Train’s service frequency windows](https://www.octranspo.com/en/our-services/o-train-network/line-1#frequency-1))
3. Normalizes stop information, reducing multi-platform stops (like [Tunney’s Pasture](/stops/3011) and others on the Transitway) to a single item, based on the stop’s code.

(_This leads to a few important limitations—[see below](#limitations)!_)

From there, [the site‘s own code](https://github.com/lchski/oct-nwtb-explorer) takes over. It does a few things:

1. [Generates subsets of the data](https://github.com/lchski/oct-nwtb-explorer/tree/main/src/scripts) for each ward, route, and stop (this dramatically increases the number of files enabling the site, but decreases the amount of data and computed per page, making it much speedier on mobile).
2. Uses [Observable Framework](https://observablehq.com/framework/) (and [Plot](https://observablehq.com/plot/)) to generate the pages you can browse here.

It’s all served by [Netlify](https://www.netlify.com/).

## Key metrics

The site reports a few key metrics:

- Wait times (in minutes): For a particular geography, how long do you have to wait for the next bus / train on the same route, heading in the same direction?[^wait-times]
- Arrival frequency: How many times does a bus / train make a stop, for a particular geography?
- Arrival frequency at stops: How busy or well-served are stops, for a particular geography?[^arrival-freq-stops]

[^wait-times]: This treats all trips for a given route / direction as equivalent, even if they’re not really—if, say, some trips for a route end at Tunney’s, while others go further, they’ll be treated as equivalent for wait time purposes.

[^arrival-freq-stops]: This can be helpful to contrast with overall arrival frequency: maybe overall frequency is down, but the average arrival frequency at stops is up, implying that the average stop is “busier”, or better served, than it was previously.

“A particular geography”, depending on the context, could mean “anywhere within a ward”, “across an entire route”, or “at a single stop”. The specific meaning is (hopefully!) always clearly indicated in the chart or table where the metric is reported.

## Limitations

Ah, now for the most important part of any data project: what are the limitations of what’s presented here?

- This site can only be as accurate as the GTFS data produced by OC Transpo. I’ve done occasional manual validation, comparing the data for a given stop or route to that available in [OC Transpo’s trip planner](https://plan.octranspo.com/plan), and no issues have come up.
- It’s entirely possible that the [main data transformation code](https://github.com/lchski/octranspo-new-ways-to-bus-data/blob/main/load.sql) inadvertently omitted or modified some data. Again, I’ve worked the data pretty thoroughly at this point, and don’t _think_ there are any oversights in that code, but it’s always possible. If you see any, please [open an issue on the data project](https://github.com/lchski/octranspo-new-ways-to-bus-data/issues).
- It’s also possible that the [data visualization code](https://github.com/lchski/oct-nwtb-explorer/tree/main/src) has issues of its own. Here, too, if you find any, please [open an issue on the explorer project](https://github.com/lchski/oct-nwtb-explorer/issues).

Can you use this site or its data to make categorical statements about the change to OC Transpo service levels? Maybe!

I’d encourage you to validate any high-level figures you produce against material OC Transpo itself has put out, certainly for high-level numbers. (See, e.g., Transit Commission meetings from [2024](https://pub-ottawa.escribemeetings.com/?Year=2024&Expanded=Transit%20Commission) or [2025](https://pub-ottawa.escribemeetings.com/?Year=2025&Expanded=Transit%20Committee). Check the minutes page for each meeting to find the documents used or referenced during those sessions by clicking on the little paperclip beside each item.)

That said, transit providers sometimes use metrics that don’t quite make sense for your day-to-day life, like service hours. This site’s humble contribution is to offer some additional metrics, to broaden our understanding of these changes.
