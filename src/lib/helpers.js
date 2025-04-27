// NB: does one decimal
export const to_pct = (frac) => Number.isNaN(frac) ? 0 : Math.round(frac * 1000) / 10

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

export const summ_diff = (oldNum, newNum) => {
	const diff = newNum - oldNum
	
	return `${ch_incr_decr(diff, true)}${Math.abs(diff)}`
}

export const label_service_windows = (row) => {
	const newRow = { ...row };
	
	switch (newRow.service_window) {
		case 'off_peak_morning':
		newRow.service_window = '1 - Early morning';
		break;
		case 'peak_morning':
		newRow.service_window = '2 - Morning peak';
		break;
		case 'off_peak_midday':
		newRow.service_window = '3 - Mid-day';
		break;
		case 'peak_afternoon':
		newRow.service_window = '4 - Afternoon peak';
		break;
		case 'off_peak_evening':
		newRow.service_window = '5 - Evening';
		break;
		case 'off_peak_night':
		newRow.service_window = '6 - Late night';
		break;
	}
	
	return newRow;
};
