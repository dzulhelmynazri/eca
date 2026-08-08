import slugify from "slugify";

type SlugOptions = Exclude<Parameters<typeof slugify>[1], string | undefined>;

const DEFAULT_SLUG_OPTIONS: SlugOptions = {
	lower: true,
	strict: true,
	trim: true,
};

export const toSlug = (value: string, options?: SlugOptions): string => {
	return slugify(value, { ...DEFAULT_SLUG_OPTIONS, ...options });
};
