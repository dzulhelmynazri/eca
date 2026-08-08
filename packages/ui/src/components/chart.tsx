"use client";

import { cn } from "@use-forever/ui/lib/utils";
import {
	type ComponentProps,
	type ComponentType,
	type CSSProperties,
	createContext,
	type ReactNode,
	useContext,
	useId,
	useMemo,
} from "react";
import {
	Legend,
	ResponsiveContainer,
	Tooltip,
	type TooltipContentProps,
	type TooltipValueType,
} from "recharts";

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { dark: ".dark", light: "" } as const;

const INITIAL_DIMENSION = { height: 200, width: 320 } as const;
type TooltipNameType = number | string;

export type ChartConfig = Record<
	string,
	{
		label?: ReactNode;
		icon?: ComponentType;
	} & (
		| { color?: string; theme?: never }
		| { color?: never; theme: Record<keyof typeof THEMES, string> }
	)
>;

interface ChartContextProps {
	config: ChartConfig;
}

const ChartContext = createContext<ChartContextProps | null>(null);

function useChart() {
	const context = useContext(ChartContext);

	if (!context) {
		throw new Error("useChart must be used within a <ChartContainer />");
	}

	return context;
}

function ChartContainer({
	id,
	className,
	children,
	config,
	initialDimension = INITIAL_DIMENSION,
	...props
}: ComponentProps<"div"> & {
	config: ChartConfig;
	children: ComponentProps<typeof ResponsiveContainer>["children"];
	initialDimension?: {
		width: number;
		height: number;
	};
}) {
	const uniqueId = useId();
	const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`;

	return (
		<ChartContext.Provider value={{ config }}>
			<div
				className={cn(
					"flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-hidden [&_.recharts-surface]:outline-hidden",
					className,
				)}
				data-chart={chartId}
				data-slot="chart"
				{...props}
			>
				<ChartStyle config={config} id={chartId} />
				<ResponsiveContainer initialDimension={initialDimension}>{children}</ResponsiveContainer>
			</div>
		</ChartContext.Provider>
	);
}

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
	const colorConfig = Object.entries(config).filter(
		([, entryConfig]) => entryConfig.theme ?? entryConfig.color,
	);

	if (!colorConfig.length) {
		return null;
	}

	const cssText = Object.entries(THEMES)
		.map(
			([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
	.map(([key, itemConfig]) => {
		const color = itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ?? itemConfig.color;
		return color ? `  --color-${key}: ${color};` : null;
	})
	.join("\n")}
}
`,
		)
		.join("\n");

	return <style>{cssText}</style>;
};

const ChartTooltip = Tooltip;

type TooltipPayloadItem = NonNullable<
	TooltipContentProps<TooltipValueType, TooltipNameType>["payload"]
>[number];

interface TooltipItemContentProps {
	color?: string;
	config: ChartConfig;
	formatter: TooltipContentProps<TooltipValueType, TooltipNameType>["formatter"];
	hideIndicator: boolean;
	index: number;
	indicator: "line" | "dot" | "dashed";
	item: TooltipPayloadItem;
	nameKey?: string;
	nestLabel: boolean;
	tooltipLabel: ReactNode;
}

function TooltipIndicator({
	hideIndicator,
	indicator,
	indicatorColor,
	nestLabel,
}: {
	hideIndicator: boolean;
	indicator: "line" | "dot" | "dashed";
	indicatorColor: string | undefined;
	nestLabel: boolean;
}) {
	if (hideIndicator) {
		return null;
	}

	return (
		<div
			className={cn("shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)", {
				"h-2.5 w-2.5": indicator === "dot",
				"my-0.5": nestLabel && indicator === "dashed",
				"w-0 border-[1.5px] border-dashed bg-transparent": indicator === "dashed",
				"w-1": indicator === "line",
			})}
			style={
				{
					"--color-bg": indicatorColor,
					"--color-border": indicatorColor,
				} as CSSProperties
			}
		/>
	);
}

function TooltipItemContent({
	color,
	config,
	formatter,
	hideIndicator,
	indicator,
	index,
	item,
	nameKey,
	nestLabel,
	tooltipLabel,
}: TooltipItemContentProps) {
	const itemKey = `${nameKey ?? item.name ?? item.dataKey ?? "value"}`;
	const itemConfig = getPayloadConfigFromPayload(config, item, itemKey);
	const indicatorColor = color ?? item.payload?.fill ?? item.color;
	let valueText: string | null = null;
	if (item.value !== null && item.value !== undefined) {
		valueText = typeof item.value === "number" ? item.value.toLocaleString() : String(item.value);
	}

	if (formatter && item?.value !== undefined && item.name) {
		return (
			<div
				className={cn(
					"flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
					indicator === "dot" ? "items-center" : null,
				)}
			>
				{formatter(item.value, item.name, item, index, item.payload)}
			</div>
		);
	}

	return (
		<div
			className={cn(
				"flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
				indicator === "dot" ? "items-center" : null,
			)}
		>
			{itemConfig?.icon ? (
				<itemConfig.icon />
			) : (
				<TooltipIndicator
					hideIndicator={hideIndicator}
					indicator={indicator}
					indicatorColor={indicatorColor}
					nestLabel={nestLabel}
				/>
			)}
			<div
				className={cn(
					"flex flex-1 justify-between leading-none",
					nestLabel ? "items-end" : "items-center",
				)}
			>
				<div className="grid gap-1.5">
					{nestLabel ? tooltipLabel : null}
					<span className="text-muted-foreground">{itemConfig?.label ?? item.name}</span>
				</div>
				{valueText ? (
					<span className="font-medium font-mono text-foreground tabular-nums">{valueText}</span>
				) : null}
			</div>
		</div>
	);
}

function ChartTooltipContent({
	active,
	payload,
	className,
	indicator = "dot",
	hideLabel = false,
	hideIndicator = false,
	label,
	labelFormatter,
	labelClassName,
	formatter,
	color,
	nameKey,
	labelKey,
}: ComponentProps<typeof Tooltip> &
	ComponentProps<"div"> & {
		hideLabel?: boolean;
		hideIndicator?: boolean;
		indicator?: "line" | "dot" | "dashed";
		nameKey?: string;
		labelKey?: string;
	} & Omit<TooltipContentProps<TooltipValueType, TooltipNameType>, "accessibilityLayer">) {
	const { config } = useChart();

	const tooltipLabel = useMemo(() => {
		if (hideLabel || !payload?.length) {
			return null;
		}

		const [item] = payload;
		const key = `${labelKey ?? item?.dataKey ?? item?.name ?? "value"}`;
		const itemConfig = getPayloadConfigFromPayload(config, item, key);
		const value =
			!labelKey && typeof label === "string" ? (config[label]?.label ?? label) : itemConfig?.label;

		if (labelFormatter) {
			return (
				<div className={cn("font-medium", labelClassName)}>{labelFormatter(value, payload)}</div>
			);
		}

		if (!value) {
			return null;
		}

		return <div className={cn("font-medium", labelClassName)}>{value}</div>;
	}, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey]);

	if (!(active && payload?.length)) {
		return null;
	}

	const nestLabel = payload.length === 1 && indicator !== "dot";

	return (
		<div
			className={cn(
				"grid min-w-32 items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs/relaxed shadow-xl",
				className,
			)}
		>
			{nestLabel ? null : (tooltipLabel ?? null)}
			<div className="grid gap-1.5">
				{payload
					.filter((item) => item.type !== "none")
					.map((item, index) => (
						<TooltipItemContent
							color={color}
							config={config}
							formatter={formatter}
							hideIndicator={hideIndicator}
							index={index}
							indicator={indicator}
							item={item}
							key={`${nameKey ?? item.name ?? item.dataKey ?? "value"}`}
							nameKey={nameKey}
							nestLabel={nestLabel}
							tooltipLabel={tooltipLabel}
						/>
					))}
			</div>
		</div>
	);
}

const ChartLegend = Legend;

interface LegendPayloadItem {
	color?: string;
	dataKey?: string | number;
	type?: string;
	[key: string]: unknown;
}

function ChartLegendContent({
	className,
	hideIcon = false,
	payload,
	verticalAlign = "bottom",
	nameKey,
}: ComponentProps<"div"> & {
	hideIcon?: boolean;
	nameKey?: string;
	payload?: LegendPayloadItem[];
	verticalAlign?: "bottom" | "middle" | "top";
}) {
	const { config } = useChart();

	if (!payload?.length) {
		return null;
	}

	return (
		<div
			className={cn(
				"flex items-center justify-center gap-4",
				verticalAlign === "top" ? "pb-3" : "pt-3",
				className,
			)}
		>
			{payload
				.filter((item) => item.type !== "none")
				.map((item) => {
					const key = `${nameKey ?? item.dataKey ?? "value"}`;
					const itemConfig = getPayloadConfigFromPayload(config, item, key);

					return (
						<div
							className={cn(
								"flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground",
							)}
							key={key}
						>
							{itemConfig?.icon && !hideIcon ? (
								<itemConfig.icon />
							) : (
								<div
									className="h-2 w-2 shrink-0 rounded-[2px]"
									style={{
										backgroundColor: item.color,
									}}
								/>
							)}
							{itemConfig?.label}
						</div>
					);
				})}
		</div>
	);
}

function getPayloadConfigFromPayload(config: ChartConfig, payload: unknown, key: string) {
	if (typeof payload !== "object" || payload === null) {
		return;
	}

	const payloadPayload =
		"payload" in payload && typeof payload.payload === "object" && payload.payload !== null
			? payload.payload
			: undefined;

	let configLabelKey: string = key;

	if (key in payload && typeof payload[key as keyof typeof payload] === "string") {
		configLabelKey = payload[key as keyof typeof payload] as string;
	} else if (
		payloadPayload &&
		key in payloadPayload &&
		typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
	) {
		configLabelKey = payloadPayload[key as keyof typeof payloadPayload] as string;
	}

	return configLabelKey in config ? config[configLabelKey] : config[key];
}

export {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartStyle,
	ChartTooltip,
	ChartTooltipContent,
};
