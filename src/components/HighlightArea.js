import React, { Component } from "react";
import { Rnd } from "react-rnd";
import { Line } from "react-lineto";

import Tooltip from "./Tooltip";

const style = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "solid 1px #ddd",
  opacity: 0.75,
};

export default class HighlightArea extends Component {
  getBoundingRect(start, end) {
    return {
      left: Math.min(end.x, start.x),
      top: Math.min(end.y, start.y),

      width: Math.abs(end.x - start.x),
      height: Math.abs(end.y - start.y),
    };
  }

  render() {
    let measure =
      this.props.highlight.legend.shape !== "measure" ||
      this.props.highlight.legend.shape !== "polygon"
        ? this.getBoundingRect(this.props.highlight.x, this.props.highlight.y)
        : null;

    return this.props.highlight.legend.shape === "measure" ? (
      <div
        onClick={(event) => {
          event.persist();
          this.props.onClick(event);
        }}
      >
        <Tooltip message={this.props.highlight.legend.name} position={"left"}>
          　　　　
        </Tooltip>
        <Line
          within={"MouseSelection-container"}
          x0={this.props.highlight.x0}
          y0={this.props.highlight.y0}
          x1={this.props.highlight.x1}
          y1={this.props.highlight.y1}
          borderColor={
            this.props.highlight.legend.color
              ? this.props.highlight.legend.color
              : "red"
          }
        />
        <p
          style={{
            fontSize: "0.8em",
            position: "absolute",
            top: `${this.props.highlight.geometry.center.y}px`,
            left: `${this.props.highlight.geometry.center.x}px`,
            transform: `rotate(${this.props.highlight.geometry.angle}deg)`,
            transformOrigin: "0 0",
            color: "red",
            alignSelf: "center",
          }}
        >
          {`${(
            this.props.highlight.geometry.length /
            (this.props.measurementLength ? this.props.measurementLength : 100)
          ).toFixed(2)}${
            this.props.measurementUnit ? this.props.measurementUnit : "m"
          }`}
        </p>
      </div>
    ) : this.props.highlight.legend.shape === "polygon" ? (
      this.props.highlight.points.map((point, index) => (
        <div
          key={index}
          onClick={(event) => {
            event.persist();
            this.props.onClick(event);
          }}
        >
          <Line
            within={"MouseSelection-container"}
            x0={point.x0}
            y0={point.y0}
            x1={point.x1}
            y1={point.y1}
            borderColor={
              this.props.highlight.legend.color
                ? this.props.highlight.legend.color
                : "red"
            }
          />
          <p
            style={{
              fontSize: "0.8em",
              position: "absolute",
              top: `${point.geometry.center.y}px`,
              left: `${point.geometry.center.x}px`,
              transform: `rotate(${point.geometry.angle}deg)`,
              transformOrigin: "0 0",
              color: "red",
              alignSelf: "center",
            }}
          >
            {point.geometry.length > 0 &&
              `${(
                point.geometry.length /
                (this.props.measurementLength
                  ? this.props.measurementLength
                  : 100)
              ).toFixed(2)}${
                this.props.measurementUnit ? this.props.measurementUnit : "m"
              }`}
          </p>
        </div>
      ))
    ) : (
      <Rnd
        position={{
          x: measure.left,
          y: measure.top,
        }}
        size={{
          width: this.props.highlight.width,
          height: this.props.highlight.height,
        }}
        style={{
          ...style,
          position: "absolute",
          background: this.props.highlight.legend.color
            ? this.props.highlight.legend.color
            : "#f0f0f0",
          borderRadius:
            this.props.highlight.legend.shape === "circle" ? "100%" : null,
        }}
        onClick={(event) => {
          event.persist();
          this.props.onClick(event);
        }}
        onDragStop={(_, data) => {
          const boundingRect = {
            ...this.props.highlight,
            y: data.y,
            x: data.x,
          };
          this.props.onChange(boundingRect);
        }}
        onResizeStop={(_, direction, ref, delta, position) => {
          const boundingRect = {
            ...this.props.highlight,
            width: ref.offsetWidth,
            height: ref.offsetHeight,
            y: position.y,
            x: position.x,
          };

          this.props.onChange(boundingRect);
        }}
      >
        <Tooltip message={this.props.highlight.legend.name} position={"left"}>
          　　　　
        </Tooltip>
      </Rnd>
    );
  }
}
