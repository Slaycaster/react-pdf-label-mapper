import React, { Component } from "react";
import { Rnd } from "react-rnd";

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
    return (
      <Rnd
        enableResizing={{
          bottom: this.props.highlight.legend.shape !== "measure",
          bottomLeft: this.props.highlight.legend.shape !== "measure",
          bottomRight: this.props.highlight.legend.shape !== "measure",
          left: true,
          right: true,
          top: this.props.highlight.legend.shape !== "measure",
          topLeft: this.props.highlight.legend.shape !== "measure",
          topRight: this.props.highlight.legend.shape !== "measure",
        }}
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
            this.props.highlight.legend.shape === "circle" ? 100 / 2 : null,
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
