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
  render() {
    return this.props.highlight.legend.shape === "measure" ? (
      <div
        onClick={(event) => {
          event.persist();
          this.props.onClick(event);
        }}
      >
        <Line
          within={"MouseSelection-container"}
          x0={this.props.highlight.x0}
          y0={this.props.highlight.y0}
          x1={this.props.highlight.x1}
          y1={this.props.highlight.y1}
        />
      </div>
    ) : (
      <Rnd
        position={{
          x: this.props.highlight.x,
          y: this.props.highlight.y,
        }}
        size={{
          width: this.props.highlight.width,
          height: this.props.highlight.height,
        }}
        style={{
          ...style,
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
