import React, { Component } from "react";
import HighlightArea from "./HighlightArea";
import { Line } from "react-lineto";
import Legend from "./Legend";
import Modal from "./Modal";
import { pdfjs, Document, Page } from "react-pdf";
import PropTypes from "prop-types";
import { v1 as uuid } from "uuid";

import "../styles/Sidebar.css";
import "../styles/Tooltip.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const buttonStyle = {
  backgroundColor: "#4CAF50",
  border: "none",
  color: "white",
  padding: "5px 10px",
  textAlign: "center",
  textDecoration: "none",
  display: "inline-block",
  fontSize: "12px",
  cursor: "pointer",
  modalToggle: false,
};

export default class PDFLabelMapper extends Component {
  constructor(props) {
    super(props);

    this.state = {
      highlights: this.props.highlights,
      lines: [],
      filteredHighlights: [],
      legends: this.props.legends,
      x: 0,
      y: 0,
      x2: 0,
      y2: 0,
      canCreate: true,
      numPages: null,
      pageNumber: 1,
      selectedLegend: null,
      selectedTool: "square", //square, circle, measure
    };
  }

  static propTypes = {
    legends: PropTypes.array.isRequired,
    highlights: PropTypes.array.isRequired,
    onLegendCreate: PropTypes.func,
    onLegendDelete: PropTypes.func,
    onHighlightCreate: PropTypes.func,
    onHighlightUpdate: PropTypes.func,
    onHighlightDelete: PropTypes.func,
    title: PropTypes.string.isRequired,
    showDescription: PropTypes.bool,
    file: PropTypes.string.isRequired,
    showCoordinates: PropTypes.bool,
  };

  onDocumentLoadSuccess = ({ numPages }) => {
    this.setState({ numPages }, () => {
      this.filterHighlights();
      this.legendTallyHighlights();
    });
  };

  toggleModal = (e) => {
    e.preventDefault(); //i added this to prevent the default behavior
    this.setState({
      modalToggle: !this.state.modalToggle,
    });
  };

  filterHighlights = () => {
    const { highlights, pageNumber } = this.state;
    let filteredHighlights = [];

    highlights.map((highlight) => {
      if (highlight.page === pageNumber) {
        filteredHighlights.push(highlight);
      }
      return null;
    });

    this.setState({ filteredHighlights });
  };

  legendTallyHighlights = () => {
    const { highlights, legends } = this.state;
    legends.map((legend) => {
      legend.tally = highlights.filter((highlight) => {
        return highlight.legend.id === legend.id;
      }).length;

      return null;
    });

    this.setState({ legends });
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
    const id = uuid();
    const newHighlight = {
      id,
      x,
      y,
      width: 50,
      height: 50,
      legend: selectedLegend,
      page: pageNumber,
    };
    const newHighlights = [...this.state.highlights, newHighlight];

    this.setState(
      {
        highlights: newHighlights,
      },
      () => {
        this.filterHighlights();
        this.legendTallyHighlights();
        this.props.onHighlightCreate &&
          this.props.onHighlightCreate(newHighlight);
      }
    );
  };

  renderLine = () => {
    const { x2, y2, x, y, selectedLegend, pageNumber } = this.state;

    const id = uuid();
    const newLine = {
      id,
      x,
      y,
      x2,
      y2,
      legend: selectedLegend,
      page: pageNumber,
    };

    const newLines = [...this.state.lines, newLine];

    this.setState({ lines: newLines });
  };

  deleteHighlight = (e, id) => {
    const { highlights } = this.state;
    let newHighlights = highlights.filter((highlight) => {
      return highlight.id !== id;
    });

    this.setState({ highlights: newHighlights, canCreate: true }, () => {
      this.filterHighlights();
      this.legendTallyHighlights();
      this.props.onHighlightDelete && this.props.onHighlightDelete(id);
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
        this.props.onHighlightUpdate && this.props.onHighlightUpdate(highlight);
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
      lines,
      filteredHighlights,
      selectedLegend,
      modalToggle,
      pageNumber,
      numPages,
      x,
      y,
      selectedTool,
    } = this.state;
    return (
      <div style={{ display: "flex", height: "100vh" }}>
        <Modal show={modalToggle} modalClosed={this.toggleModal}>
          <div style={{ color: "black" }}>The Best Has Happened To ME</div>
        </Modal>
        {/* Sidebar */}
        <div
          className="sidebar"
          style={{
            width: "20vw",
          }}
        >
          <div className="description" style={{ padding: "1rem" }}>
            {/* Name - prop: string */}
            <h3 style={{ marginBottom: "1rem" }}>{this.props.title}</h3>

            {/* Information - prop: boolean */}
            {this.props.showDescription && (
              <div>
                <p>
                  <small>
                    To create area highlight, click anywhere on the PDF page and
                    drag or resize.
                  </small>
                </p>
                <p>
                  <small>
                    To delete, hold ⌥/Alt, then click the highlight.
                  </small>
                </p>
              </div>
            )}

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

          {/* Toolbar */}
          <p style={{ paddingLeft: "1rem", paddingRight: "1rem" }}>
            <small>TOOLS</small>
            <hr />
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              backgroundColor: "#f1f1f1",
              paddingLeft: "1rem",
              width: 100,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                cursor: "pointer",
                backgroundColor: selectedTool === "square" ? "#c5c5c5" : null,
              }}
              onClick={() => {
                this.setState({
                  selectedTool: "square",
                });
              }}
            >
              <img
                src={require("../img/rectangle-32.png")}
                alt="Square"
                style={{ width: 24, height: 24, padding: 5 }}
              />
            </div>

            <div
              style={{
                width: 32,
                height: 32,
                cursor: "pointer",
                backgroundColor: selectedTool === "circle" ? "#c5c5c5" : null,
              }}
              onClick={() => {
                this.setState({
                  selectedTool: "circle",
                });
              }}
            >
              <img
                src={require("../img/circle-32.png")}
                alt="Circle"
                style={{ width: 24, height: 24, padding: 5 }}
              />
            </div>

            <div
              style={{
                width: 32,
                height: 32,
                cursor: "pointer",
                backgroundColor: selectedTool === "measure" ? "#c5c5c5" : null,
              }}
              onClick={() => {
                this.setState({
                  selectedTool: "measure",
                });
              }}
            >
              <img
                src={require("../img/measure-32.png")}
                alt="Measure"
                style={{ width: 24, height: 24, padding: 5 }}
              />
            </div>
          </div>

          <p style={{ paddingLeft: "1rem", paddingRight: "1rem" }}>
            <small>SELECTED</small>
            <hr />
          </p>
          <div>
            {selectedLegend ? <Legend legend={selectedLegend} /> : <Legend />}
          </div>

          <p style={{ paddingLeft: "1rem", paddingRight: "1rem" }}>
            <small>LEGENDS</small>
            <button
              style={{ ...buttonStyle, float: "right" }}
              onClick={this.toggleModal}
            >
              + add legend
            </button>
            <hr />
          </p>

          {legends &&
            legends.map((legend) => (
              <Legend
                legend={legend}
                onClick={() => {
                  this.onSelectLegend(legend);
                }}
              />
            ))}

          {this.props.showCoordinates && (
            <p style={{ padding: "1rem" }}>
              x: {x}, y: {y}
            </p>
          )}
        </div>

        {/* Document */}
        <Document
          file={this.props.file}
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
              // onClick={() => {
              //   if (selectedLegend) {
              //     if (selectedLegend.shape !== "measure") {
              //       this.renderHighlight();
              //     } else {
              //       this.renderLine();
              //     }
              //   } else {
              //     alert("Please select a legend first from the sidebar.");
              //   }
              // }}
              onDrag={() => {
                console.log("dragg");
              }}
            >
              <Page pageNumber={pageNumber} renderTextLayer={false} />
            </div>

            {lines.map((line) => (
              <Line
                key={line.id}
                x0={line.x}
                y0={line.y}
                x1={line.x2}
                y1={line.y2}
              />
            ))}

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
