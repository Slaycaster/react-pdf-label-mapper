import React, { Component } from "react";
import HighlightArea from "./HighlightArea";

let index = 1;

export default class Highlight extends Component {
  constructor() {
    super();

    this.state = {
      highlights: [],
      text: "Hello!",
      x: 0,
      y: 0,
    };
  }

  renderHighlight() {
    const { x, y } = this.state;
    const id = index;
    const newHighlights = [
      ...this.state.highlights,
      {
        id,
        x,
        y,
        width: 100,
        height: 100,
        color: "blue",
        legendId: 1,
      },
    ];
    index++;
    this.setState({
      highlights: newHighlights,
    });
  }

  deleteHighlight(e, id) {
    const { highlights } = this.state;
    let newHighlights = highlights.filter((highlight) => {
      return highlight.id !== id;
    });

    this.setState({ highlights: newHighlights });
  }

  updateHighlight(highlight) {
    this.setState({
      highlights: this.state.highlights.map((h) => {
        return h.id === highlight.id
          ? {
              ...h,
              x: highlight.x,
              y: highlight.y,
              width: highlight.width,
              height: highlight.height,
            }
          : h;
      }),
    });
  }

  _onMouseMove(e) {
    this.setState({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
  }

  _onDrag(e) {}

  render() {
    const { highlights } = this.state;
    return (
      <div style={this.props.style}>
        {highlights.map((highlight) => (
          <HighlightArea
            key={highlight.id}
            highlight={highlight}
            onChange={(boundingRect) => {
              this.updateHighlight(boundingRect);
              console.log(boundingRect);
            }}
            onClick={(e) => {
              if (e.altKey) return this.deleteHighlight(e, highlight.id);
            }}
          />
        ))}
        <div
          style={{ border: "1px solid red", height: "100vh" }}
          onClick={this.renderHighlight.bind(this)}
          onMouseMove={this._onMouseMove.bind(this)}
        >
          <h4>Click anywhere</h4>
        </div>

        <div />
      </div>
    );
  }
}
