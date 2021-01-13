import React, { Component } from "react";
import { Line } from "react-lineto";
import { v1 as uuid } from "uuid";

import "./MouseSelection.css";

class MouseSelection extends Component {
  state = {
    locked: false,
    start: null,
    end: null,
    polygons: [], //set of coords (multiple lines)
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

  componentDidMount() {
    if (!this.root) {
      return;
    }

    const that = this;

    const { onSelection, onDragStart, onDragEnd, shouldStart } = this.props;

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
        y: pageY + container.scrollTop,
        pageX: pageX,
        pageY: pageY,
        containerLeft: containerBoundingRect.left,
        containerTop: containerBoundingRect.top,
        scrollLeft: container.scrollLeft,
        scrollTop: container.scrollTop,
      };
    };

    document.body.addEventListener("keyup", (event) => {
      //When Esc key is pressed, multiple codes to support diff browser spec.
      if (event.key === "Escape" || event.key === "Esc" || event.key === 27) {
        //Reset polygon selection
        this.setState({ polygons: [] }, () => {
          this.reset();
        });
      }
    });

    container.addEventListener("mousemove", (event) => {
      const { start, locked } = this.state;

      this.props.onPositionMove &&
        this.props.onPositionMove(containerCoords(event.pageX, event.pageY));

      if (!start || locked) {
        return;
      }

      that.setState({
        ...this.state,
        end: containerCoords(event.pageX, event.pageY),
      });
    });

    container.addEventListener("mousedown", (event) => {
      const { start, end } = this.state;
      if (!shouldStart(event)) {
        this.reset();
        return;
      }

      const startTarget = event.target;

      if (!(startTarget instanceof HTMLElement)) {
        return;
      }

      this.setState(
        {
          start: containerCoords(event.pageX, event.pageY),
          end: null,
          locked: false,
        },
        () => {
          if (
            this.props.selectedLegend.shape !== "polygon" ||
            this.props.selectedLegend.shape !== "measure"
          ) {
            if (this.props.defaultHighlight) {
              //Create object and close this.
              // const boundingRect = that.getBoundingRect(start, end);
              let existBoundingRect = {
                left:
                  this.state.start.x - this.props.defaultHighlight.width / 2,
                top:
                  this.state.start.y - this.props.defaultHighlight.height / 2,
                width: this.props.defaultHighlight.width,
                height: this.props.defaultHighlight.height,
              };
              onSelection(startTarget, existBoundingRect, that.reset);
              onDragEnd();
            } else {
              onDragStart();
            }
          }
        }
      );

      if (this.props.selectedLegend.shape === "polygon") {
        const id = uuid();
        //Handle mousedown for polygon
        if (end) {
          //Add this point to polygons array and start target again.
          const end = containerCoords(event.pageX, event.pageY);

          const boundingLine = {
            id,
            x0: start.x,
            y0: start.y,
            x1: end.x,
            y1: end.y,
          };

          if (
            !(event.target instanceof HTMLElement) ||
            !container.contains(event.target)
          ) {
            that.reset();
            return;
          }

          that.setState(
            {
              end,
              //locked: true,
              polygons: [...this.state.polygons, boundingLine],
            },
            () => {
              const { start, end } = that.state;

              if (!start || !end) {
                return;
              }

              if (event.target instanceof HTMLElement) {
                //onSelection(startTarget, boundingLine, that.reset); TODO: call onSelection on dblclick event!
                //For now, add the line to collection,

                onDragEnd();
              }
            }
          );
        }
      }

      const onDoubleClick = (event) => {
        const { start, end, polygons } = this.state;

        if (!start || !end) {
          return;
        }

        if (event.target instanceof HTMLElement) {
          onSelection(startTarget, polygons, that.reset);
          onDragEnd();
        }
      };

      const onMouseUp = (event) => {
        // emulate listen once
        event.currentTarget.removeEventListener("mouseup", onMouseUp);

        const { start } = this.state;

        if (!start || this.props.selectedLegend.shape === "polygon") {
          return;
        }

        const end = containerCoords(event.pageX, event.pageY);

        const boundingRect = that.getBoundingRect(start, end);
        const boundingLine = { x0: start.x, y0: start.y, x1: end.x, y1: end.y };

        if (
          !(event.target instanceof HTMLElement) ||
          !container.contains(event.target) ||
          !that.shouldRender(boundingRect, this.props.selectedLegend.shape)
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
                this.props.selectedLegend.shape === "calibrate"
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
        //Listener for Circle, Line, and Rectangle
        document.body.addEventListener("mouseup", onMouseUp);
        //Listener for Polygon
        document.body.addEventListener("dblclick", onDoubleClick);
      }
    });
  }

  shouldRender(boundingRect, shape) {
    if (shape === "circle" || shape === "square") {
      return boundingRect.width >= 1 && boundingRect.height >= 1;
    } else {
      //Measure and polygon
      return boundingRect.left >= 1 && boundingRect.top >= 1;
    }
  }

  render() {
    const { start, end } = this.state;

    return (
      <div
        className="MouseSelection-container"
        ref={(node) => (this.root = node)}
      >
        {start && end
          ? this.props.selectedLegend &&
            (this.props.selectedLegend.shape === "circle" ||
            this.props.selectedLegend.shape === "square" ? (
              <div
                className="MouseSelection"
                style={{
                  ...this.getBoundingRect(start, end),
                  backgroundColor: this.props.selectedLegend.color,
                  borderRadius:
                    this.props.selectedLegend.shape === "circle"
                      ? "100%"
                      : null,
                }}
              />
            ) : this.props.selectedLegend.shape === "measure" ||
              this.props.selectedLegend.shape === "calibrate" ? (
              <Line
                within={"MouseSelection-container"}
                borderColor={this.props.selectedLegend.color}
                x0={start.x}
                y0={start.y}
                x1={end.x}
                y1={end.y}
              />
            ) : (
              <div>
                <Line
                  within={"MouseSelection-container"}
                  borderColor={this.props.selectedLegend.color}
                  x0={start.x}
                  y0={start.y}
                  x1={end.x}
                  y1={end.y}
                />
                {this.state.polygons.map((polygon, index) => (
                  <Line
                    key={index}
                    within={"MouseSelection-container"}
                    borderColor={this.props.selectedLegend.color}
                    x0={polygon.x0}
                    y0={polygon.y0}
                    x1={polygon.x1}
                    y1={polygon.y1}
                  />
                ))}
              </div>
            ))
          : null}
      </div>
    );
  }
}

export default MouseSelection;
