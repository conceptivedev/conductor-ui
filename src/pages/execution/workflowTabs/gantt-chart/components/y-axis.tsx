import { defaultFormatter, idAccessor, yAccessor } from "../utils";
import { rowsAtom, yScaleAtom, graphOffset, canvasHeightAtom } from "../atoms";
import { useAtom, useAtomValue } from "jotai";
import React, { useEffect } from "react";
import type { PropsWithChildren } from "react";
import type { Series } from "../types";
import { grayLight6 } from "../../../../../theme/colors";
import { TaskCoordinate } from "../../../../../types/workflowDef";

export interface YAxisProps {
  rows: Pick<Series, "id" | "label" | "labelSvgIcon" | "styles">[];
  marginRight?: number;
  onLabelClick?: (arg0: Pick<Series, "id" | "label">) => void;
  labelFormatter?: (label: string | number) => string | number;
  font?: string;
  collapsibleRows: Set<string>;
  toggleRow: (arg0: string) => void;
  taskExpanded: Map<string, boolean>;
  selectedTask: TaskCoordinate;
  barHeight?: number;
  alignmentRatioAlongYBandwidth?: number;
}
export function YAxis({
  collapsibleRows,
  toggleRow,
  rows: inputRows,
  onLabelClick,
  marginRight = 8,
  labelFormatter = defaultFormatter,
  taskExpanded,
  selectedTask,
  barHeight = 22,
  alignmentRatioAlongYBandwidth = 0.3,
  // TODO connect this with the y-axis labels
  // font: inputFont = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
  children,
}: PropsWithChildren<YAxisProps>) {
  const [currRows, setRows] = useAtom(rowsAtom);
  const yAxisLabelPadding = 20;
  const yAxisWidth = 250;
  const marginLeft = yAxisWidth + yAxisLabelPadding;
  const yScale = useAtomValue(yScaleAtom);
  const canvasHeight = useAtomValue(canvasHeightAtom);

  useEffect(() => {
    const newRows = inputRows.map((row) => ({
      ...row,
      label: labelFormatter(yAccessor(row)) as string,
    }));
    setRows([...newRows]);
  }, [inputRows]);

  useEffect(() => {
    if (selectedTask?.id) {
      let element = document.getElementById(selectedTask?.id);
      let rect = element?.getBoundingClientRect();
      if (
        rect &&
        !(
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <=
            (window.innerHeight || document.documentElement.clientHeight) &&
          rect.right <=
            (window.innerWidth || document.documentElement.clientWidth)
        )
      ) {
        element?.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [selectedTask?.id, canvasHeight]);

  const currRowsMap = currRows.reduce((agg, row) => {
    agg.set(idAccessor(row), yAccessor(row));
    return agg;
  }, new Map<string, string>());

  const getRow = (band: string) => inputRows.find(({ id }) => id === band);
  const bandwidth = yScale.bandwidth();
  return (
    <g transform={`translate(0, ${graphOffset})`}>
      {/* offset to prevent axis overlap with x-axis*/}
      <svg x="0" y="0" height="100%" width="270px">
        <rect x="0" y="0" height="100%" width="270px" fill="white" />
        {yScale.domain().map((band, idx) => {
          const row = getRow(band);
          let yPos =
            yScale(band) +
              (bandwidth - barHeight - 4) * alignmentRatioAlongYBandwidth || 0;
          return (
            <svg key={band} x="0" y="0" transform="translate(0,0)">
              {idx === yScale.domain().length - 1 && (
                <line
                  x1={0}
                  y1={yPos + yScale.bandwidth()}
                  x2="100%"
                  y2={yPos + yScale.bandwidth()}
                  stroke={grayLight6}
                />
              )}
              <svg x="0" y="0" width="240px">
                <g key={band}>
                  {row?.labelSvgIcon && (
                    <g transform={`translate(5, ${yScale(band)})`}>
                      {row.labelSvgIcon}
                    </g>
                  )}

                  <g
                    transform={`translate(${marginLeft - marginRight}, ${
                      yScale(band) + yScale.bandwidth() / 2
                    })`}
                  >
                    <text
                      id={band}
                      style={{
                        ...(row?.styles?.band?.style || {}),
                        cursor:
                          onLabelClick || children || collapsibleRows.has(band)
                            ? "pointer"
                            : "inherit",
                      }}
                      transform={`translate(${-marginLeft + 20})`}
                      textAnchor="start"
                      dominantBaseline="mathematical"
                      fontWeight="bold"
                      onClick={() => {
                        collapsibleRows.has(band) && toggleRow(band);
                        const key = {
                          id: band,
                          label: currRowsMap.get(band),
                        };
                        onLabelClick?.(key);
                      }}
                    >
                      {collapsibleRows.has(band) &&
                        (taskExpanded.get(band) ? "\u25BC" : "\u25BA")}{" "}
                      {currRowsMap.get(band)}
                    </text>
                  </g>
                </g>
              </svg>
              <svg>
                <circle
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    navigator.clipboard.writeText(currRowsMap.get(band))
                  }
                  cx={`${marginLeft - 15}`}
                  cy={`${5 + yScale(band) + yScale.bandwidth() / 2}`}
                  r="5"
                  fill="darkGrey"
                />
              </svg>
              <line x1={0} y1={yPos} x2="100%" y2={yPos} stroke={grayLight6} />
            </svg>
          );
        })}
      </svg>
    </g>
  );
}