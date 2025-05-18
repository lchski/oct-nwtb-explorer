import * as Plot from "npm:@observablehq/plot"
import {label_schedules, source_domain} from "./helpers.js"

/**
 * 
 * @param {Object[]} stop_times Array of Objects with properties: s_until_next_arrival, source
 * @param {String} title
 * @param {Numeric} width Observable width value
 * @returns 
 */
export const plot_wait_times = ({
    stop_times,
    title = "How long do you have to wait for your next train / bus",
    width,
    wait_times_cutoff_min = 45
}) => (stop_times.filter(d => d.s_until_next_arrival !== null && (d.s_until_next_arrival / 60) < wait_times_cutoff_min).length > 0) ? Plot.plot({
    title,
    subtitle: `Distribution of wait times in five-minute increments (cuts off at waits longer than ${wait_times_cutoff_min} minutes), previous schedule vs. NWTB`,
    width,
    x: {label: "Wait time (minutes)", transform: d => Math.round(d/60)},
    y: {label: "Percentage (%)", percent: true, grid: true},
    color: {domain: source_domain},
    marks: [
        Plot.rectY(stop_times.map(label_schedules), Plot.binX({y: "proportion-facet"}, {
            x: "s_until_next_arrival",
            fill: "source",
            fx: "source",
            interval: 5 * 60, // we format from seconds to minutes, so do the equivalent here
            domain: [0, wait_times_cutoff_min * 60],
            tip: {
                pointer: "x",
                format: {
                    fx: false,
                    fill: false,
                }
            }
        })),
        Plot.axisFx({label: "Schedule"})
    ]
}) : html`<figure><h2>${title}</h2><em>All wait times are longer than ${wait_times_cutoff_min} minutes. (Otherwise, there’d be a chart here.)</em></figure>`