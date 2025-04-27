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

export const label_wards = (row) => {
	const newRow = { ...row };
	
	switch (newRow.ward_number) {
		case '1':
			newRow.ward = '01 - Orléans East-Cumberland';
			break;
		case '2':
			newRow.ward = '02 - Orléans West-Innes';
			break;
		case '3':
			newRow.ward = '03 - Barrhaven West';
			break;
		case '4':
			newRow.ward = '04 - Kanata North';
			break;
		case '5':
			newRow.ward = '05 - West Carleton-March';
			break;
		case '6':
			newRow.ward = '06 - Stittsville';
			break;
		case '7':
			newRow.ward = '07 - Bay';
			break;
		case '8':
			newRow.ward = '08 - College';
			break;
		case '9':
			newRow.ward = '09 - Knoxdale-Merivale';
			break;
		case '10':
			newRow.ward = '10 - Gloucester-Southgate';
			break;
		case '11':
			newRow.ward = '11 - Beacon Hill-Cyrville';
			break;
		case '12':
			newRow.ward = '12 - Rideau-Vanier';
			break;
		case '13':
			newRow.ward = '13 - Rideau-Rockcliffe';
			break;
		case '14':
			newRow.ward = '14 - Somerset';
			break;
		case '15':
			newRow.ward = '15 - Kitchissippi';
			break;
		case '16':
			newRow.ward = '16 - River';
			break;
		case '17':
			newRow.ward = '17 - Capital';
			break;
		case '18':
			newRow.ward = '18 - Alta Vista';
			break;
		case '19':
			newRow.ward = '19 - Orléans South-Navan';
			break;
		case '20':
			newRow.ward = '20 - Osgoode';
			break;
		case '21':
			newRow.ward = '21 - Rideau-Jock';
			break;
		case '22':
			newRow.ward = '22 - Riverside South-Findlay Creek';
			break;
		case '23':
			newRow.ward = '23 - Kanata South';
			break;
		case '24':
			newRow.ward = '24 - Barrhaven East';
			break;
		default:
			newRow.ward = 'Unknown (likely Gatineau)';
			break;
	}
	
	return newRow;
};

