import React, { Component } from "react";
import HighlightArea from "./HighlightArea";
import { pdfjs, Document, Page } from "react-pdf";
// import PDFLoader from "./PDFLoader";

import testLegends from "../testLegends";
import testHighlights from "../testHighlights";

let index = testHighlights.length + 1;

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const legendStyle = {
  display: "flex",
  border: "solid 1px #ddd",
  padding: "1rem",
  marginLeft: "1em",
  marginRight: "1em",
  cursor: "pointer",
};

export default class PDFLabelMapper extends Component {
  constructor(props) {
    super(props);

    this.state = {
      highlights: testHighlights,
      filteredHighlights: [],
      legends: testLegends,
      x: 0,
      y: 0,
      canCreate: true,
      numPages: null,
      pageNumber: 1,
      selectedLegend: null,
    };
  }

  onDocumentLoadSuccess = ({ numPages }) => {
    this.setState({ numPages }, () => {
      this.filterHighlights();
      this.legendTallyHighlights();
    });
  };

  filterHighlights = () => {
    const { highlights, pageNumber } = this.state;
    let filteredHighlights = [];

    highlights.map((highlight) => {
      if (highlight.page === pageNumber) {
        filteredHighlights.push(highlight);
      }
    });

    this.setState({ filteredHighlights });
  };

  legendTallyHighlights = () => {
    const { highlights, legends } = this.state;
    console.log(highlights);

    legends.map((legend) => {
      legend.tally = highlights.filter((highlight) => {
        return highlight.legend_id === legend.id;
      }).length;
    });

    this.setState({ legends });
    console.log(legends);
  };

  changePage = (offset) =>
    this.setState(
      (prevState) => ({
        pageNumber: prevState.pageNumber + offset,
      }),
      () => {
        this.filterHighlights();
      }
    );

  previousPage = () => this.changePage(-1);

  nextPage = () => this.changePage(1);

  renderHighlight = () => {
    const { x, y, selectedLegend, pageNumber } = this.state;
    const id = index;
    const newHighlights = [
      ...this.state.highlights,
      {
        id,
        x,
        y,
        width: 50,
        height: 50,
        color: selectedLegend.color,
        legend_id: selectedLegend.id,
        page: pageNumber,
      },
    ];
    index++;
    this.setState(
      {
        highlights: newHighlights,
      },
      () => {
        this.filterHighlights();
        this.legendTallyHighlights();
      }
    );
  };

  deleteHighlight = (e, id) => {
    const { highlights } = this.state;
    let newHighlights = highlights.filter((highlight) => {
      return highlight.id !== id;
    });

    this.setState({ highlights: newHighlights, canCreate: true }, () => {
      this.filterHighlights();
      this.legendTallyHighlights();
    });
  };

  updateHighlight = (highlight) => {
    this.setState(
      {
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
      },
      () => {
        this.filterHighlights();
      }
    );
  };

  onSelectLegend = (legend) => {
    console.log(legend);
    this.setState({ selectedLegend: legend });
  };

  _onMouseMove = (e) => {
    this.setState({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
  };

  render() {
    const {
      legends,
      filteredHighlights,
      selectedLegend,
      pageNumber,
      numPages,
      x,
      y,
    } = this.state;
    return (
      <div style={{ display: "flex", height: "100vh" }}>
        {/* Sidebar */}
        <div
          className="sidebar"
          style={{
            width: "20vw",
          }}
        >
          <div className="description" style={{ padding: "1rem" }}>
            {/* Name - prop: string */}
            <h3 style={{ marginBottom: "1rem" }}>react-pdf-label-mapper</h3>

            {/* Information - prop: boolean */}
            <div>
              <p>
                <small>
                  To create area highlight, click anywhere on the PDF page and
                  drag or resize.
                </small>
              </p>
              <p>
                <small>To delete, hold ⌥/Alt, then click the highlight.</small>
              </p>
            </div>

            {/* Pagination */}
            <div>
              <p>
                <button
                  type="button"
                  disabled={pageNumber <= 1}
                  onClick={this.previousPage}
                >
                  {"<"}
                </button>{" "}
                Page {pageNumber || (numPages ? 1 : "--")} of {numPages || "--"}{" "}
                <button
                  type="button"
                  disabled={pageNumber >= numPages}
                  onClick={this.nextPage}
                >
                  {">"}
                </button>
              </p>
            </div>
          </div>

          <p style={{ paddingLeft: "1rem", paddingRight: "1rem" }}>
            <small>SELECTED</small>
            <hr />
          </p>
          <div>
            {selectedLegend ? (
              <div
                style={{
                  ...legendStyle,
                  background: selectedLegend.color,
                }}
              >
                <strong
                  style={{
                    color: "black",
                    backgroundColor: "#fcf8ed",
                    width: "100%",
                    padding: "1rem",
                    overflowWrap: "break-word",
                    wordWrap: "break-word",
                    hyphens: "auto",
                    margin: "auto",
                  }}
                >
                  {selectedLegend.name}
                </strong>
              </div>
            ) : (
              <div style={legendStyle}>-</div>
            )}
          </div>

          <p style={{ paddingLeft: "1rem", paddingRight: "1rem" }}>
            <small>LEGENDS</small>
            <hr />
          </p>
          {legends &&
            legends.map((legend) => (
              <div>
                <div
                  key={legend.id}
                  style={{ ...legendStyle, background: legend.color }}
                  onClick={() => {
                    this.onSelectLegend(legend);
                  }}
                >
                  <strong
                    style={{
                      color: "black",
                      backgroundColor: "#fcf8ed",
                      width: "100%",
                      padding: "1rem",
                      overflowWrap: "break-word",
                      wordWrap: "break-word",
                      hyphens: "auto",
                      margin: "auto",
                    }}
                  >
                    {legend.name}
                  </strong>
                  <strong
                    style={{
                      background: "#f2f1ed",
                      padding: "1rem",
                      float: "right",
                      border: "solid 1px #ddd",
                    }}
                  >
                    {legend.tally}
                  </strong>
                </div>
              </div>
            ))}

          <p style={{ padding: "1rem" }}>
            x: {x}, y: {y}
          </p>
        </div>

        {/* Document */}
        <Document
          file="http://sbhe-dev.s3.amazonaws.com/Documents/drawing/Tasks/Task2077/0_t1cr_elec_power_sbhe_lt5___em5_sld_01_02_03_a1_kt__07_apr_2020_.pdf"
          onLoadSuccess={this.onDocumentLoadSuccess}
          onMouseMove={this._onMouseMove.bind(this)}
        >
          <div
            style={{
              height: "100vh",
              width: "80vw",
              position: "relative",
            }}
          >
            <div
              onClick={() => {
                if (selectedLegend) {
                  this.renderHighlight();
                } else {
                  alert("Please select a legend first from the sidebar.");
                }
              }}
            >
              <Page pageNumber={pageNumber} renderTextLayer={false} />
            </div>

            {filteredHighlights.map((highlight) => (
              <HighlightArea
                key={highlight.id}
                highlight={highlight}
                onChange={(boundingRect) => {
                  this.updateHighlight(boundingRect);
                }}
                onClick={(e) => {
                  if (e.altKey) return this.deleteHighlight(e, highlight.id);
                }}
              />
            ))}
          </div>
        </Document>
      </div>
    );
  }
}
