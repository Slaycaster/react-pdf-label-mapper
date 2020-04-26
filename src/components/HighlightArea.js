import React, { Component } from "react";
import { Rnd } from "react-rnd";

const style = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "solid 1px #ddd",
  background: "#f0f0f0",
  zindex: 1000,
};

export default class HighlightArea extends Component {
  render() {
    return (
      <Rnd
        position={{
          x: this.props.highlight.x,
          y: this.props.highlight.y,
        }}
        size={{
          width: this.props.highlight.width,
          height: this.props.highlight.height,
        }}
        style={style}
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
        {this.props.highlight.x}, {this.props.highlight.y}
      </Rnd>
    );
  }
}
