import React, { Component } from "react";
import HighlightArea from "./HighlightArea";
import Legend from "./Legend";
import Shape from "./Shape";
import Modal from "./Modal";
import { pdfjs, Document, Page } from "react-pdf";
import PropTypes from "prop-types";
import { v1 as uuid } from "uuid";
import MouseSelection from "./MouseSelection";

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
};

class PDFLabelMapper extends Component {
  state = {
    highlights: this.props.highlights,
    lines: [],
    filteredHighlights: [],
    legends: this.props.legends,
    legendInput: "",
    shapeInput: "",
    colorInput: "",
    legendUpdateInput: "",
    shapeUpdateInput: "",
    colorUpdateInput: "",
    scaleUpdateInput: 0,
    x: 0,
    y: 0,
    defaultHighlight: null,
    canCreate: true,
    numPages: null,
    pageNumber: 1,
    isAreaSelectionInProgress: false,
    selectedLegend: null,
    selectedTool: "square", //square, circle, measure
    modalLegendToggle: false,
    modalLegendUpdateToggle: false,
    modalMeasurementToggle: false,
    measurementCalibrateHighlight: this.props.measurementCalibrateHighlight
      ? this.props.measurementCalibrateHighlight
      : null,
    measurementRawLength: this.props.measurementRawLength,
    measurementRawInput: this.props.measurementRawLength
      ? this.props.measurementRawLength
      : 1,
    measurementLength: this.props.measurementLength
      ? this.props.measurementLength
      : 1,
    measurementLengthInput: this.props.measurementLength
      ? this.props.measurementLength
      : 1,
    measurementUnit: this.props.measurementUnit
      ? this.props.measurementUnit
      : "m",
    measurementUnitInput: this.props.measurementUnit
      ? this.props.measurementUnit
      : "m",
    showTip: null,
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
    measurementLength: PropTypes.number,
    measurementUnit: PropTypes.string,
    showTips: PropTypes.bool,
  };

  componentDidUpdate = (prevProps) => {
    if (prevProps.measurementLength !== this.props.measurementLength) {
      this.setState({
        measurementLength: this.props.measurementLength,
      });
    }
    if (prevProps.measurementUnit !== this.props.measurementUnit) {
      this.setState({
        measurementUnit: this.props.measurementUnit,
      });
    }
  };

  onDocumentLoadSuccess = ({ numPages }) => {
    this.setState({ numPages }, () => {
      this.filterHighlights();
      this.legendTallyHighlights();
    });
  };

  toggleLegendModal = (e) => {
    e.preventDefault(); //i added this to prevent the default behavior
    this.setState({
      modalLegendToggle: !this.state.modalLegendToggle,
    });
  };

  toggleLegendUpdateModal = (e) => {
    e.preventDefault(); //i added this to prevent the default behavior
    this.setState({
      modalLegendUpdateToggle: !this.state.modalLegendUpdateToggle,
    });
  };

  toggleMeasurementModal = (e) => {
    e.preventDefault(); //i added this to prevent the default behavior
    this.setState({
      modalMeasurementToggle: !this.state.modalMeasurementToggle,
    });
  };

  filterHighlights = () => {
    const { highlights, pageNumber } = this.state;
    let filteredHighlights = [];

    highlights.map((highlight) => {
      if (highlight.page === pageNumber) {
        if (highlight.legend.shape === "measure") {
          highlight.geometry = this.getLinePoints(highlight);
        }
        if (highlight.legend.shape === "polygon") {
          highlight.points.map((point) => {
            point.geometry = this.getLinePoints(point);
            // return point;
          });
        }
        filteredHighlights.push(highlight);
      }
      return null;
    });

    this.setState({ filteredHighlights });
  };

  getLinePoints = (line) => {
    let y0 = line.y0;
    let y1 = line.y1;
    let x0 = line.x0;
    let x1 = line.x1;

    //Compute y and x distance.
    let dy = y1 - y0;
    let dx = x1 - x0;

    //Compute angle.
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    //Compute length.
    let length = Math.sqrt(dx * dx + dy * dy);

    //Compute centerline.
    let center = { x: (x1 - x0) / 2 + x0, y: (y1 - y0) / 2 + y0 };

    return {
      dy,
      dx,
      angle,
      length,
      center,
    };
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

  renderHighlight = (highlight) => {
    const { selectedLegend, pageNumber } = this.state;
    const id = uuid();

    let coordinates = {};
    if (this.state.selectedLegend.shape === "measure") {
      coordinates = {
        x0: highlight.x0,
        y0: highlight.y0,
        x1: highlight.x1,
        y1: highlight.y1,
      };
    } else if (
      this.state.selectedLegend.shape === "square" ||
      this.state.selectedLegend.shape === "circle"
    ) {
      coordinates = {
        x: highlight.left,
        y: highlight.top,
        width: highlight.width,
        height: highlight.height,
      };
    } else {
      //Polygon
      coordinates = {
        points: highlight,
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
        defaultHighlight:
          !this.state.defaultHighlight &&
          (this.state.selectedLegend.shape === "square" ||
            this.state.selectedLegend.shape === "circle")
            ? coordinates
            : this.state.defaultHighlight,
      },
      () => {
        this.filterHighlights();
        this.legendTallyHighlights();
        this.props.onHighlightCreate &&
          this.props.onHighlightCreate(newHighlight);
      }
    );
  };

  renderCalibrationHighlight = (highlight) => {
    const { selectedLegend } = this.state;
    let coordinates = {
      x0: highlight.x0,
      y0: highlight.y0,
      x1: highlight.x1,
      y1: highlight.y1,
    };
    let geometry = this.getLinePoints(highlight);

    const measurementCalibrateHighlight = {
      id: 0,
      legend: selectedLegend,
      ...coordinates,
      geometry,
    };

    this.setState({
      modalMeasurementToggle: !this.state.modalMeasurementToggle,
      measurementCalibrateHighlight,
      measurementRawInput: measurementCalibrateHighlight.geometry.length,
      measurementLengthInput: 1,
    });
  };

  editLegend = () => {
    const { selectedLegend, highlights } = this.state;

    let initialScale = 0;

    if (
      selectedLegend.shape === "circle" ||
      selectedLegend.shape === "square"
    ) {
      //Get initial size
      for (let h in highlights) {
        if (highlights[h].legend.id === selectedLegend.id) {
          initialScale = highlights[h].width;
          break;
        }
      }
    }

    this.setState({
      legendUpdateInput: selectedLegend.name,
      shapeUpdateInput: selectedLegend.shape,
      colorUpdateInput: selectedLegend.color,
      scaleUpdateInput: initialScale,
    });
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

  updateLegend = () => {
    let {
      legendUpdateInput,
      shapeUpdateInput,
      colorUpdateInput,
      scaleUpdateInput,
      selectedLegend,
      highlights,
    } = this.state;

    let highlightsUpdated = [];

    for (let h in highlights) {
      if (highlights[h].legend.id === selectedLegend.id) {
        if (
          selectedLegend.shape === "circle" ||
          selectedLegend.shape === "square"
        ) {
          highlights[h].width = scaleUpdateInput;
          highlights[h].height = scaleUpdateInput;
        }
        highlights[h].legend = {
          ...highlights[h].legend,
          name: legendUpdateInput,
          color: colorUpdateInput,
          shape:
            selectedLegend.shape === "circle" ||
            selectedLegend.shape === "square"
              ? shapeUpdateInput
              : highlights[h].legend.shape, //only for circle and square
        };
        highlightsUpdated.push(highlights[h]);
      }
    }

    this.setState(
      {
        highlights,
        legends: this.state.legends.map((l) => {
          return l.id === selectedLegend.id
            ? {
                ...l,

                name: legendUpdateInput,
                color: colorUpdateInput,
                shape:
                  selectedLegend.shape === "circle" ||
                  selectedLegend.shape === "square"
                    ? shapeUpdateInput
                    : l.shape, //only for circle and square,
              }
            : l;
        }),
        selectedLegend: {
          ...selectedLegend,
          name: legendUpdateInput,
          color: colorUpdateInput,
          shape:
            selectedLegend.shape === "circle" ||
            selectedLegend.shape === "square"
              ? shapeUpdateInput
              : selectedLegend.shape, //only for circle and square,
        },
      },
      () => {
        this.filterHighlights();
        console.log(highlightsUpdated);
        this.props.onLegendUpdate &&
          this.props.onLegendUpdate(selectedLegend, highlightsUpdated);
      }
    );
  };

  calibrateMeasurement = () => {
    this.setState({
      measurementLength:
        this.state.measurementRawInput / this.state.measurementLengthInput,
      measurementUnit: this.state.measurementUnitInput,
      measurementRawLength: this.state.measurementRawInput,
      selectedLegend: null,
    });

    alert("Successfully calibrated.");
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
    this.setState({
      selectedLegend: legend,
      defaultHighlight: null,
      showTip: legend.shape,
    });
  };

  onCalibrate = () => {
    let calibrate = {
      id: 0,
      name: "Calibrating. Drag onto the page to start.",
      color: "#ff0000",
      shape: "calibrate",
    };
    this.setState({
      selectedLegend: calibrate,
      defaultHighlight: null,
      showTip: null,
    });
  };

  _onMouseMove = (e) => {
    this.setState({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
  };

  onChange = (e) => this.setState({ [e.target.name]: e.target.value });

  handleChangeComplete = (color) => {
    this.setState({ colorInput: color.hex });
  };

  handleUpdateChangeComplete = (color) => {
    this.setState({ colorUpdateInput: color.hex });
  };

  render() {
    const {
      legends,
      legendInput,
      shapeInput,
      colorInput,
      legendUpdateInput,
      shapeUpdateInput,
      colorUpdateInput,
      scaleUpdateInput,
      filteredHighlights,
      selectedLegend,
      modalLegendToggle,
      modalLegendUpdateToggle,
      modalMeasurementToggle,
      pageNumber,
      numPages,
      x,
      y,
      measurementRawInput,
      measurementLengthInput,
      measurementUnitInput,
      measurementRawLength,
      measurementLength,
      measurementUnit,
      showTip,
    } = this.state;

    return (
      <div style={{ display: "flex", height: "100vh" }}>
        <Modal show={modalLegendToggle} modalClosed={this.toggleLegendModal}>
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
              this.toggleLegendModal(e);
            }}
          >
            Add
          </button>
        </Modal>

        <Modal
          show={modalLegendUpdateToggle}
          modalClosed={this.toggleLegendUpdateModal}
        >
          <h3>Update Legend</h3>
          <label htmlFor="legendUpdateInput">Name</label>
          <input
            type="text"
            name="legendUpdateInput"
            onChange={this.onChange}
            value={legendUpdateInput}
            autoComplete="off"
            style={{ margin: 10, padding: 10, width: "90%" }}
          />

          {selectedLegend &&
          (selectedLegend.shape === "circle" ||
            selectedLegend.shape === "square") ? (
            <div>
              <label htmlFor="shapeUpdateInput">Shape</label>
              <div
                style={{ display: "flex", flexDirection: "row", padding: 5 }}
              >
                <div
                  style={{
                    backgroundColor:
                      shapeUpdateInput === "square" ? "#ccc" : null,
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    this.setState({ shapeUpdateInput: "square" });
                  }}
                >
                  <Shape name="square" />
                </div>
                <div
                  style={{
                    backgroundColor:
                      shapeUpdateInput === "circle" ? "#ccc" : null,
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    this.setState({ shapeUpdateInput: "circle" });
                  }}
                >
                  <Shape name="circle" />
                </div>
              </div>
            </div>
          ) : null}

          <label htmlFor="colorUpdateInput">Colour</label>
          <div style={{ margin: 10 }}>
            <SliderPicker
              color={colorUpdateInput}
              onChangeComplete={this.handleUpdateChangeComplete}
            />
          </div>

          {selectedLegend &&
          (selectedLegend.shape === "circle" ||
            selectedLegend.shape === "square") ? (
            <div>
              <label htmlFor="scaleUpdateInput">Size</label>
              <input
                type="number"
                name="scaleUpdateInput"
                onChange={this.onChange}
                value={scaleUpdateInput}
                autoComplete="off"
                style={{ margin: 10, padding: 10, width: "90%" }}
              />
            </div>
          ) : null}

          <button
            style={{
              ...buttonStyle,
              width: "100%",
              marginTop: 10,
              padding: 10,
              opacity: !(
                colorUpdateInput &&
                legendUpdateInput &&
                shapeUpdateInput
              )
                ? 0.5
                : 1,
              cursor: !(
                colorUpdateInput &&
                legendUpdateInput &&
                shapeUpdateInput
              )
                ? "not-allowed"
                : "pointer",
            }}
            disabled={
              !(colorUpdateInput && legendUpdateInput && shapeUpdateInput)
            }
            onClick={(e) => {
              this.updateLegend();
              this.toggleLegendUpdateModal(e);
            }}
          >
            Update
          </button>
        </Modal>

        <Modal
          show={modalMeasurementToggle}
          modalClosed={this.toggleMeasurementModal}
        >
          <h3>Calibrate Measurement</h3>

          <div style={{ display: "flex", flexDirection: "row" }}>
            <div>
              <label htmlFor="measurementRawInput">Raw Length (px)</label>
              <input
                type="number"
                name="measurementLengthInput"
                onChange={this.onChange}
                value={measurementRawInput}
                autoComplete="off"
                style={{ margin: 10, padding: 10, width: "70%" }}
              />
            </div>
            <p style={{ marginRight: 20 }}>=</p>
            <div>
              <label htmlFor="measurementLengthInput">To</label>
              <input
                type="number"
                name="measurementLengthInput"
                onChange={this.onChange}
                value={measurementLengthInput}
                autoComplete="off"
                style={{ margin: 10, padding: 10, width: "70%" }}
              />
            </div>
          </div>

          <label htmlFor="measurementUnitInput">Unit</label>
          <input
            type="text"
            name="measurementUnitInput"
            onChange={this.onChange}
            value={measurementUnitInput}
            autoComplete="off"
            style={{ margin: 10, padding: 10, width: "90%" }}
          />

          <button
            style={{
              ...buttonStyle,
              width: "100%",
              marginTop: 10,
              padding: 10,
              opacity: !(measurementLengthInput && measurementUnitInput)
                ? 0.5
                : 1,
              cursor: !(measurementLengthInput && measurementUnitInput)
                ? "not-allowed"
                : "pointer",
            }}
            disabled={!(measurementLengthInput && measurementUnitInput)}
            onClick={(e) => {
              this.calibrateMeasurement();
              this.toggleMeasurementModal(e);
            }}
          >
            Calibrate
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
                    To start creating measurements or shapes, add a legend and
                    select it.
                  </small>
                </p>
                <p>
                  <small>
                    To delete, hold ⌥/Alt, then click the measurement/shape.
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
            <small>CALIBRATION</small>
            <button
              style={{ ...buttonStyle, float: "right" }}
              onClick={this.onCalibrate}
            >
              - recalibrate
            </button>
          </p>
          <p
            style={{ paddingLeft: "1rem", paddingRight: "1rem" }}
          >{`${measurementRawLength.toFixed(
            2
          )} = ${measurementLengthInput.toFixed(2)}`}</p>

          <p style={{ paddingLeft: "1rem", paddingRight: "1rem" }}>
            <small>SELECTED</small>
          </p>

          {selectedLegend ? <Legend legend={selectedLegend} /> : <Legend />}
          {selectedLegend && selectedLegend.shape !== "calibrate" && (
            <button
              style={{
                marginLeft: "1em",
                marginRight: "1em",
                marginTop: "1em",
              }}
              onClick={(e) => {
                this.editLegend();
                this.toggleLegendUpdateModal(e);
              }}
            >
              Edit
            </button>
          )}

          <div style={{ paddingLeft: "1rem", paddingRight: "1rem" }}>
            {showTip === "measure" && (
              <div>
                <p>
                  <small>Click and drag on the page to create a line.</small>
                </p>
                <p>
                  <small>Press ESC to cancel while dragging.</small>
                </p>
              </div>
            )}

            {showTip === "polygon" && (
              <div>
                <p>
                  <small>
                    Click to create a point, move the mouse to form a line,
                    double click to finish.
                  </small>
                </p>
                <p>
                  <small>Press ESC to cancel.</small>
                </p>
              </div>
            )}

            {(showTip === "circle" || showTip === "square") && (
              <div>
                <p>
                  <small>Click and drag on the page to create a shape.</small>
                </p>
                <p>
                  <small>Press ESC to cancel while dragging.</small>
                </p>
              </div>
            )}
          </div>

          <p style={{ paddingLeft: "1rem", paddingRight: "1rem" }}>
            <small>LEGENDS</small>
            <button
              style={{ ...buttonStyle, float: "right" }}
              onClick={this.toggleLegendModal}
            >
              + add legend
            </button>
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
            <div>
              <Page
                pageNumber={pageNumber}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
              <MouseSelection
                defaultHighlight={this.state.defaultHighlight}
                selectedLegend={this.state.selectedLegend}
                onDragStart={() => {
                  console.log("onDragStart");
                  //This one does nothing?
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
                onSelection={(startTarget, highlight, resetSelection) => {
                  if (this.state.selectedLegend.shape !== "calibrate") {
                    this.renderHighlight(highlight);
                  } else {
                    this.renderCalibrationHighlight(highlight);
                  }

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
                measurementLength={measurementLength}
                measurementUnit={measurementUnit}
              />
            ))}
          </div>
        </Document>
      </div>
    );
  }
}

PDFLabelMapper.defaultProps = {
  showDescription: true,
  showCoordinates: false,
  measurementLength: 1,
  measurementRawLength: 1,
  measurementUnit: "m",
  title: "react-pdf-label-mapper",
  showTips: true,
};

export default PDFLabelMapper;
