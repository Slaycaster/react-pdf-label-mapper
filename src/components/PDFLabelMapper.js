import React, { Component } from "react";
import HighlightArea from "./HighlightArea";
import { Line } from "react-lineto";
import Legend from "./Legend";
import Shape from "./Shape";
import Modal from "./Modal";
import { pdfjs, Document, Page } from "react-pdf";
import PropTypes from "prop-types";
import { v1 as uuid } from "uuid";
import MouseSelection from "./MouseSelection";
import Spinner from "./Spinner";

import { SliderPicker } from "react-color";

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
  state = {
    highlights: this.props.highlights,
    lines: [],
    filteredHighlights: [],
    legends: this.props.legends,
    legendInput: "",
    shapeInput: "",
    colorInput: "",
    x: 0,
    y: 0,
    canCreate: true,
    numPages: null,
    pageNumber: 1,
    isAreaSelectionInProgress: false,
    selectedLegend: null,
    selectedTool: "square", //square, circle, measure
  };

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

  renderHighlight = (bound) => {
    const { x, y, selectedLegend, pageNumber } = this.state;
    const id = uuid();
    let coordinates = {};
    if (
      this.state.selectedLegend.shape === "measure" ||
      this.state.selectedLegend.shape === "polygon"
    ) {
      coordinates = {
        x0: bound.x0,
        y0: bound.y0,
        x1: bound.x1,
        y1: bound.y1,
      };
    } else {
      coordinates = {
        x: bound.left,
        y: bound.top,
        width: bound.width,
        height: bound.height,
      };
    }

    const newHighlight = {
      id,
      legend: selectedLegend,
      page: pageNumber,
      ...coordinates,
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

  addLegend = () => {
    const { legendInput, shapeInput, colorInput } = this.state;
    const id = uuid();

    let newLegend = {
      id,
      color: colorInput,
      name: legendInput,
      shape: shapeInput,
    };

    const newLegends = [...this.state.legends, newLegend];

    this.setState(
      {
        legends: newLegends,
      },
      () => {
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

  onChange = (e) => this.setState({ [e.target.name]: e.target.value });

  handleChangeComplete = (color) => {
    this.setState({ colorInput: color.hex });
  };

  render() {
    const {
      legends,
      legendInput,
      shapeInput,
      colorInput,
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
          <h3>+ Add Legend</h3>
          <label htmlFor="legendInput">Name</label>
          <input
            type="text"
            name="legendInput"
            onChange={this.onChange}
            value={legendInput}
            autoComplete="off"
            style={{ margin: 10, padding: 10, width: "90%" }}
          />
          <label htmlFor="shapeInput">Shape</label>
          <div style={{ display: "flex", flexDirection: "row", padding: 5 }}>
            <div
              style={{
                backgroundColor: shapeInput === "square" ? "#ccc" : null,
                cursor: "pointer",
              }}
              onClick={() => {
                this.setState({ shapeInput: "square" });
              }}
            >
              <Shape name="square" />
            </div>
            <div
              style={{
                backgroundColor: shapeInput === "circle" ? "#ccc" : null,
                cursor: "pointer",
              }}
              onClick={() => {
                this.setState({ shapeInput: "circle" });
              }}
            >
              <Shape name="circle" />
            </div>
            <div
              style={{
                backgroundColor: shapeInput === "measure" ? "#ccc" : null,
                cursor: "pointer",
              }}
              onClick={() => {
                this.setState({ shapeInput: "measure" });
              }}
            >
              <Shape name="measure" />
            </div>
            <div
              style={{
                backgroundColor: shapeInput === "polygon" ? "#ccc" : null,
                cursor: "pointer",
              }}
              onClick={() => {
                this.setState({ shapeInput: "polygon" });
              }}
            >
              <Shape name="polygon" />
            </div>
          </div>

          <label htmlFor="colorInput">Colour</label>
          <div style={{ margin: 10 }}>
            <SliderPicker
              color={colorInput}
              onChangeComplete={this.handleChangeComplete}
            />
          </div>

          <button
            style={{
              ...buttonStyle,
              width: "100%",
              marginTop: 10,
              padding: 10,
              opacity: !(colorInput && legendInput && shapeInput) ? 0.5 : 1,
              cursor: !(colorInput && legendInput && shapeInput)
                ? "not-allowed"
                : "pointer",
            }}
            disabled={!(colorInput && legendInput && shapeInput)}
            onClick={(e) => {
              this.addLegend();
              this.toggleModal(e);
            }}
          >
            Add
          </button>
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
              <div key={legend.id}>
                <Legend
                  legend={legend}
                  onClick={() => {
                    this.onSelectLegend(legend);
                  }}
                />
              </div>
            ))}

          {this.props.showCoordinates && (
            <p style={{ padding: "1rem" }}>
              x: {x}, y: {y}
            </p>
          )}
        </div>

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
            >
              <Page pageNumber={pageNumber} renderTextLayer={false} />
              <MouseSelection
                selectedLegend={this.state.selectedLegend}
                onDragStart={() => {
                  console.log("onDragStart");
                }}
                onDragEnd={() => {
                  if (!this.state.selectedLegend) {
                    alert("Please select a legend first from the sidebar.");
                  }
                }}
                onChange={(isVisible) =>
                  this.setState({ isAreaSelectionInProgress: isVisible })
                }
                shouldStart={(event) =>
                  event.target instanceof HTMLElement &&
                  this.state.selectedLegend
                }
                onSelection={(startTarget, boundingRect, resetSelection) => {
                  console.log(startTarget, boundingRect, resetSelection);
                  this.renderHighlight(boundingRect);
                  resetSelection();
                }}
              />
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
