export const formatBytes = (sizeBytes: number | null): string => {
	if (sizeBytes === null) {
		return "-";
	}

	if (sizeBytes >= 1024 * 1024) {
		return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	if (sizeBytes >= 1024) {
		return `${Math.round(sizeBytes / 1024)} KB`;
	}

	return `${sizeBytes} B`;
};
