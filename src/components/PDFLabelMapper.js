import React, { Component } from "react";
import Sidebar from "./Sidebar";
import HighlightArea from "./HighlightArea";
import PDFLoader from "./PDFLoader";

import testLegends from "../testLegends";
import testHighlights from "../testHighlights";

let index = testHighlights.length + 1;

export default class PDFLabelMapper extends Component {
  constructor(props) {
    super(props);

    this.state = {
      highlights: testHighlights,
      x: 0,
      y: 0,
      canCreate: true,
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

    this.setState({ highlights: newHighlights, canCreate: true });
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

  render() {
    const { highlights, canCreate } = this.state;
    return (
      <div style={{ display: "flex", height: "100vh" }}>
        <Sidebar shapes={testLegends} />
        <div
          style={{
            height: "100vh",
            width: "80vw",
            overflowY: "scroll",
            position: "relative",
          }}
          onClick={() => {
            if (canCreate) this.renderHighlight();
          }}
          onMouseMove={this._onMouseMove.bind(this)}
        >
          <div
            onPointerEnter={() => this.setState({ canCreate: false })}
            onPointerLeave={() => this.setState({ canCreate: true })}
          >
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
                style={{ zindex: 1000 }}
              />
            ))}
          </div>
          <PDFLoader
            scale={1.0}
            file={
              "http://sbhe-dev.s3.amazonaws.com/Documents/drawing/Tasks/Task2077/0_t1cr_elec_power_sbhe_lt5___em5_sld_01_02_03_a1_kt__07_apr_2020_.pdf"
            }
            page={1}
          />
        </div>
      </div>
    );
  }
}
