import configs from "./fields.json";

export type FieldVariant =
	| "classic"
	| "mirror"
	| "highway"
	| "duet"
	| "colony"
	| "turmite"
	| "turmite2";

export interface FieldConfig {
	label: string;
	/** Number of cell states. */
	colors: number;
	/** One turn rule per ant; the rule string is indexed by cell state. */
	rules: string[];
	prewarm: number;
	/** Relative opacity so denser variants keep the same visual weight. */
	weight: number;
	layout: "single" | "duet" | "colony";
}

export const fieldConfigs = configs as Record<FieldVariant, FieldConfig>;
