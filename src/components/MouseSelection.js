import React, { Component } from "react";
import { Line } from "react-lineto";

import "./MouseSelection.css";

class MouseSelection extends Component {
  state = {
    locked: false,
    start: null,
    end: null,
  };

  root = HTMLElement;

  reset = () => {
    const { onDragEnd } = this.props;

    onDragEnd();
    this.setState({ start: null, end: null, locked: false });
  };

  getBoundingRect(start, end) {
    return {
      left: Math.min(end.x, start.x),
      top: Math.min(end.y, start.y),

      width: Math.abs(end.x - start.x),
      height: Math.abs(end.y - start.y),
    };
  }

  componentDidUpdate() {
    const { onChange } = this.props;
    const { start, end } = this.state;

    const isVisible = start && end;

    // onChange(isVisible);
  }

  componentDidMount() {
    if (!this.root) {
      return;
    }

    const that = this;

    const {
      onSelection,
      onDragStart,
      onDragEnd,
      shouldStart,
      selectedLegend,
    } = this.props;

    const container = this.root.parentElement;

    if (!(container instanceof HTMLElement)) {
      return;
    }

    let containerBoundingRect = null;

    const containerCoords = (pageX, pageY) => {
      if (!containerBoundingRect) {
        containerBoundingRect = container.getBoundingClientRect();
      }

      return {
        x: pageX - containerBoundingRect.left + container.scrollLeft,
        y: pageY - containerBoundingRect.top + container.scrollTop,
      };
    };

    container.addEventListener("mousemove", (event) => {
      const { start, locked } = this.state;

      if (!start || locked) {
        return;
      }

      that.setState({
        ...this.state,
        end: containerCoords(event.pageX, event.pageY),
      });
    });

    container.addEventListener("mousedown", (event) => {
      if (!shouldStart(event)) {
        this.reset();
        return;
      }

      const startTarget = event.target;

      if (!(startTarget instanceof HTMLElement)) {
        return;
      }

      onDragStart();

      this.setState({
        start: containerCoords(event.pageX, event.pageY),
        end: null,
        locked: false,
      });

      const onMouseUp = (event) => {
        // emulate listen once
        event.currentTarget.removeEventListener("mouseup", onMouseUp);

        const { start } = this.state;

        if (!start) {
          return;
        }

        const end = containerCoords(event.pageX, event.pageY);

        const boundingRect = that.getBoundingRect(start, end);
        const boundingLine = { x0: start.x, y0: start.y, x1: end.x, y1: end.y };

        if (
          !(event.target instanceof HTMLElement) ||
          !container.contains(event.target) ||
          !that.shouldRender(boundingRect)
        ) {
          that.reset();
          return;
        }

        that.setState(
          {
            end,
            locked: true,
          },
          () => {
            const { start, end } = that.state;

            if (!start || !end) {
              return;
            }

            if (event.target instanceof HTMLElement) {
              if (
                this.props.selectedLegend.shape === "measure" ||
                this.props.selectedLegend.shape === "polygon"
              ) {
                onSelection(startTarget, boundingLine, that.reset);
              } else {
                onSelection(startTarget, boundingRect, that.reset);
              }

              onDragEnd();
            }
          }
        );
      };

      if (document.body) {
        document.body.addEventListener("mouseup", onMouseUp);
      }
    });
  }

  shouldRender(boundingRect) {
    return boundingRect.width >= 1 && boundingRect.height >= 1;
  }

  render() {
    const { start, end } = this.state;

    return (
      <div
        className="MouseSelection-container"
        ref={(node) => (this.root = node)}
      >
        {start && end ? (
          this.props.selectedLegend &&
          this.props.selectedLegend.shape !== "measure" &&
          this.props.selectedLegend.shape !== "polygon" ? (
            <div
              className="MouseSelection"
              style={{
                ...this.getBoundingRect(start, end),
                backgroundColor: this.props.selectedLegend.color,
                borderRadius:
                  this.props.selectedLegend.shape === "circle" ? "100%" : null,
              }}
            />
          ) : (
            <Line
              within={"MouseSelection-container"}
              borderColor={this.props.selectedLegend.color}
              x0={start.x}
              y0={start.y}
              x1={end.x}
              y1={end.y}
            />
          )
        ) : null}
      </div>
    );
  }
}

export default MouseSelection;
