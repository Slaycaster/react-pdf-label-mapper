import React, { Component } from "react";
import Sidebar from "./Sidebar";
import Highlight from "./Highlight";
import PDFLoader from "./PDFLoader";

import testShapes from "../testShapes";

export default class PDFLabelMapper extends Component {
  render() {
    return (
      <div style={{ display: "flex", height: "100vh" }}>
        <Sidebar shapes={testShapes} />
        <div
          style={{
            height: "100vh",
            width: "80vw",
            overflowY: "scroll",
            position: "relative",
          }}
        >
          <Highlight
            style={{
              zIndex: 100,
              position: "absolute",
              width: "80vw",
              overflowY: "scroll",
            }}
          />
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
