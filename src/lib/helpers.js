// NB: does one decimal
export const to_pct = (frac) => Math.round(frac * 1000) / 10

export const ch_incr_decr = (n, symbol = false) => {
	if (symbol) {
		if (n === 0) return '='

		if (n > 0) return '+'

		return '-'
	}

	if (n === 0) return 'change'

	if (n > 0) return 'increase'

	return 'decrease'
}