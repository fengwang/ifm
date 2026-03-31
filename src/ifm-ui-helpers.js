(function(root, factory) {
	if( typeof module === 'object' && module.exports ) {
		module.exports = factory();
	}

	root.IFMUiHelpers = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
	const ARCHIVE_EXTENSIONS = ['zip', 'tar', 'tgz', 'tar.gz', 'tar.xz', 'tar.bz2'];

	function inArray(needle, haystack) {
		for( let i = 0; i < haystack.length; i++ ) {
			if( haystack[i] === needle ) {
				return true;
			}
		}

		return false;
	}

	function customStrftime(date, format, locale) {
		const resolvedLocale = locale || 'en-US';
		const pad = function(num, size) {
			return String(num).padStart(size || 2, '0');
		};

		const replacements = {
			'%Y': date.getFullYear(),
			'%m': pad(date.getMonth() + 1),
			'%d': pad(date.getDate()),
			'%H': pad(date.getHours()),
			'%M': pad(date.getMinutes()),
			'%S': pad(date.getSeconds()),
			'%y': String(date.getFullYear()).slice(-2),
			'%b': date.toLocaleString(resolvedLocale, { month: 'short' }),
			'%B': date.toLocaleString(resolvedLocale, { month: 'long' }),
			'%a': date.toLocaleString(resolvedLocale, { weekday: 'short' }),
			'%A': date.toLocaleString(resolvedLocale, { weekday: 'long' })
		};

		return format.replace(/%[a-zA-Z]/g, function(match) {
			return replacements[match] || match;
		});
	}

	function isValidTimestamp(timestamp) {
		return Number.isFinite(Number(timestamp));
	}

	function formatExactDate(timestamp, options) {
		const settings = options || {};

		if( ! isValidTimestamp(timestamp) ) {
			return '';
		}

		const date = new Date(timestamp * 1000);
		const locale = settings.locale || 'en-US';

		if( settings.customDateFormat ) {
			return customStrftime(date, settings.customDateFormat, locale);
		}

		return date.toLocaleString(locale);
	}

	function formatExactDateParts(timestamp, options) {
		const settings = options || {};

		if( ! isValidTimestamp(timestamp) ) {
			return {
				primary: '',
				detail: ''
			};
		}

		const date = new Date(timestamp * 1000);
		const locale = settings.locale || 'en-US';

		if( settings.customDateFormat ) {
			return {
				primary: customStrftime(date, settings.customDateFormat, locale),
				detail: ''
			};
		}

		return {
			primary: date.toLocaleDateString(locale),
			detail: date.toLocaleTimeString(locale)
		};
	}

	function formatRelativeTime(timestamp, options) {
		const settings = options || {};

		if( ! isValidTimestamp(timestamp) ) {
			return '';
		}

		const nowMs = typeof settings.nowMs === 'number' ? settings.nowMs : Date.now();
		const locale = settings.locale || 'en-US';
		const diffSeconds = Math.round(((timestamp * 1000) - nowMs) / 1000);
		const absSeconds = Math.abs(diffSeconds);

		let value = diffSeconds;
		let unit = 'second';

		if( absSeconds >= 31556952 ) {
			value = Math.round(diffSeconds / 31556952);
			unit = 'year';
		} else if( absSeconds >= 2629746 ) {
			value = Math.round(diffSeconds / 2629746);
			unit = 'month';
		} else if( absSeconds >= 604800 ) {
			value = Math.round(diffSeconds / 604800);
			unit = 'week';
		} else if( absSeconds >= 86400 ) {
			value = Math.round(diffSeconds / 86400);
			unit = 'day';
		} else if( absSeconds >= 3600 ) {
			value = Math.round(diffSeconds / 3600);
			unit = 'hour';
		} else if( absSeconds >= 60 ) {
			value = Math.round(diffSeconds / 60);
			unit = 'minute';
		}

		if( typeof Intl === 'object' && typeof Intl.RelativeTimeFormat === 'function' ) {
			return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(value, unit);
		}

		if( value === 0 ) {
			return 'just now';
		}

		const absoluteValue = Math.abs(value);
		const suffix = absoluteValue === 1 ? unit : unit + 's';
		return value < 0 ? absoluteValue + ' ' + suffix + ' ago' : 'in ' + absoluteValue + ' ' + suffix;
	}

	function isEditableItem(item, config) {
		if( item.type !== 'file' || !config.edit ) {
			return false;
		}

		if( config.disable_mime_detection ) {
			return true;
		}

		if( typeof item.mime_type !== 'string' ) {
			return false;
		}

		return item.mime_type.substr(0, 4) === 'text'
			|| item.mime_type.indexOf('x-empty') !== -1
			|| item.mime_type.indexOf('xml') !== -1
			|| item.mime_type.indexOf('json') !== -1;
	}

	function getEntryAction(item, config) {
		if( item.type !== 'file' ) {
			return null;
		}

		if( config.extract && inArray(item.ext, ARCHIVE_EXTENSIONS) ) {
			return 'extract';
		}

		if( isEditableItem(item, config) ) {
			return 'edit';
		}

		return null;
	}

	function getDownloadButton(item, config) {
		if( !config.download || !item.downloadAction ) {
			return null;
		}

		return {
			action: 'download',
			icon: item.downloadAction === 'zipnload' ? 'icon icon-download-cloud' : 'icon icon-download',
			title: 'download'
		};
	}

	function buildRowButtons(item, config) {
		const buttons = [];
		const primaryAction = getEntryAction(item, config);
		const downloadButton = getDownloadButton(item, config);

		if( primaryAction === 'extract' ) {
			buttons.push({
				action: 'extract',
				icon: 'icon icon-archive',
				title: 'extract'
			});
		} else if( primaryAction === 'edit' ) {
			buttons.push({
				action: 'edit',
				icon: 'icon icon-pencil',
				title: 'edit'
			});
		}

		if( downloadButton ) {
			buttons.push(downloadButton);
		}

		if( !inArray(item.name, ['.', '..']) ) {
			if( config.copymove ) {
				buttons.push({
					action: 'copymove',
					icon: 'icon icon-folder-open-empty',
					title: 'copy/move'
				});
			}

			if( config.rename ) {
				buttons.push({
					action: 'rename',
					icon: 'icon icon-terminal',
					title: 'rename'
				});
			}

			if( config.delete ) {
				buttons.push({
					action: 'delete',
					icon: 'icon icon-trash',
					title: 'delete'
				});
			}
		}

		return buttons;
	}

	function getSortBucket(item) {
		if( item.name === '..' ) {
			return 2;
		}

		if( item.type === 'dir' ) {
			return 1;
		}

		return 0;
	}

	return {
		ARCHIVE_EXTENSIONS: ARCHIVE_EXTENSIONS,
		buildRowButtons: buildRowButtons,
		customStrftime: customStrftime,
		formatExactDate: formatExactDate,
		formatExactDateParts: formatExactDateParts,
		formatRelativeTime: formatRelativeTime,
		getEntryAction: getEntryAction,
		getSortBucket: getSortBucket,
		isEditableItem: isEditableItem
	};
});
