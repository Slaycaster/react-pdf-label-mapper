import React, { Component } from "react";
import HighlightArea from "./HighlightArea";
import Legend from "./Legend";
import Shape from "./Shape";
import Modal from "./Modal";
import { pdfjs, Document, Page } from "react-pdf/dist/entry.webpack";
import PropTypes from "prop-types";
import { v1 as uuid } from "uuid";
import MouseSelection from "./MouseSelection";

import { SliderPicker } from "react-color";

import "./styles/Sidebar.css";
import "./styles/Tooltip.css";

//pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

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
    pageX: 0,
    pageY: 0,
    containerLeft: 0,
    containerTop: 0,
    scrollLeft: 0,
    scrollTop: 0,
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
    scale: 1,
    cursor: "crosshair",
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

  componentDidMount() {
    document.addEventListener("keydown", (event) => {
      //Prevent going the page to go back when pressing backspace.
      if (event.key === "Backspace" || event.key === "8") {
        event.preventDefault();
      }
      if (event.key === " " || event.key === "32") {
        event.preventDefault();
      }
    });
  }

  componentDidUpdate = (prevProps) => {
    if (prevProps.measurementLength !== this.props.measurementLength) {
      this.setState({
        measurementLength: this.props.measurementLength,
      });
    }
    if (prevProps.measurementRawLength !== this.props.measurementRawLength) {
      this.setState({
        measurementRawLength: this.props.measurementRawLength,
      });
    }
    if (prevProps.measurementUnit !== this.props.measurementUnit) {
      this.setState({
        measurementUnit: this.props.measurementUnit,
      });
    }
    if (prevProps.legends !== this.props.legends) {
      this.setState({ legends: this.props.legends }, () => {
        this.filterHighlights();
      });
    }
    if (prevProps.highlights !== this.props.highlights) {
      this.setState({ highlights: this.props.highlights }, () => {
        this.filterHighlights();
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
    const { highlights, pageNumber, scale } = this.state;

    //Copy the highlights in 1x scale, but do not update its reference.
    let scaledHighlights = JSON.parse(JSON.stringify(highlights));
    let filteredHighlights = [];

    for (let s in scaledHighlights) {
      if (scaledHighlights[s].page === pageNumber) {
        if (scaledHighlights[s].legend.shape === "measure") {
          //compute the scale
          scaledHighlights[s].x0 =
            scaledHighlights[s].x0 + scaledHighlights[s].x0 * (scale - 1);
          scaledHighlights[s].y0 =
            scaledHighlights[s].y0 + scaledHighlights[s].y0 * (scale - 1);
          scaledHighlights[s].x1 =
            scaledHighlights[s].x1 + scaledHighlights[s].x1 * (scale - 1);
          scaledHighlights[s].y1 =
            scaledHighlights[s].y1 + scaledHighlights[s].y1 * (scale - 1);
          scaledHighlights[s].geometry = this.getLinePoints(
            scaledHighlights[s]
          );
        }
        if (scaledHighlights[s].legend.shape === "polygon") {
          for (let p in scaledHighlights[s].points) {
            //compute the scale
            scaledHighlights[s].points[p].x0 =
              scaledHighlights[s].points[p].x0 +
              scaledHighlights[s].points[p].x0 * (scale - 1);
            scaledHighlights[s].points[p].y0 =
              scaledHighlights[s].points[p].y0 +
              scaledHighlights[s].points[p].y0 * (scale - 1);
            scaledHighlights[s].points[p].x1 =
              scaledHighlights[s].points[p].x1 +
              scaledHighlights[s].points[p].x1 * (scale - 1);
            scaledHighlights[s].points[p].y1 =
              scaledHighlights[s].points[p].y1 +
              scaledHighlights[s].points[p].y1 * (scale - 1);
            scaledHighlights[s].points[p].geometry = this.getLinePoints(
              scaledHighlights[s].points[p]
            );
          }
          // scaledHighlights[s].points.map((point) => {
          //   point.geometry = this.getLinePoints(point);
          //   // return point;
          // });
        }

        if (
          scaledHighlights[s].legend.shape === "circle" ||
          scaledHighlights[s].legend.shape === "square"
        ) {
          //compute the scale
          scaledHighlights[s].x =
            scaledHighlights[s].x + scaledHighlights[s].x * (scale - 1);
          scaledHighlights[s].y =
            scaledHighlights[s].y + scaledHighlights[s].y * (scale - 1);
          scaledHighlights[s].width =
            scaledHighlights[s].width + scaledHighlights[s].width * (scale - 1);
          scaledHighlights[s].height =
            scaledHighlights[s].height +
            scaledHighlights[s].height * (scale - 1);
        }

        filteredHighlights.push(scaledHighlights[s]);
      }
    }

    // scaledHighlights.map((highlight) => {
    //   if (highlight.page === pageNumber) {
    //     if (highlight.legend.shape === "measure") {
    //       highlight.geometry = this.getLinePoints(highlight);
    //     }
    //     if (highlight.legend.shape === "polygon") {
    //       highlight.points.map((point) => {
    //         point.geometry = this.getLinePoints(point);
    //         // return point;
    //       });
    //     }

    //     console.log(highlight);

    //     //compute the scale
    //     highlight.x = highlight.x + highlight.x * (scale - 1);
    //     highlight.y = highlight.y + highlight.y * (scale - 1);
    //     highlight.width = highlight.width + highlight.width * (scale - 1);
    //     highlight.height = highlight.height + highlight.height * (scale - 1);

    //     console.log(scale);
    //     console.log(highlight);

    //     filteredHighlights.push(highlight);
    //   }
    //   return null;
    // });

    this.setState({ filteredHighlights });
  };

  getLinePoints = (line) => {
    const { scale } = this.state;
    let y0 = line.y0;
    let y1 = line.y1;
    let x0 = line.x0;
    let x1 = line.x1;

    //Get original scale of coordinates for length computation
    let orig_y0 = line.y0 / scale;
    let orig_y1 = line.y1 / scale;
    let orig_x0 = line.x0 / scale;
    let orig_x1 = line.x1 / scale;

    //Compute y and x distance.
    let dy = orig_y1 - orig_y0;
    let dx = orig_x1 - orig_x0;

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
    let newSelectedLegendTally = this.state.selectedLegend;
    legends.map((legend) => {
      legend.tally = highlights.filter((highlight) => {
        return highlight.legend.id === legend.id;
      }).length;

      if (newSelectedLegendTally) {
        if (newSelectedLegendTally.id === legend.id) {
          newSelectedLegendTally = legend;
        }
      }

      return null;
    });

    this.setState({ legends, selectedLegend: newSelectedLegendTally });
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

  zoomIn = () =>
    this.setState(
      (prevState) => ({
        scale: prevState.scale + 0.25,
      }),
      () => {
        this.filterHighlights();
      }
    );

  zoomOut = () =>
    this.setState(
      (prevState) => ({
        scale: prevState.scale - 0.25,
      }),
      () => {
        this.filterHighlights();
      }
    );

  renderHighlight = (highlight) => {
    const { selectedLegend, pageNumber, scale } = this.state;
    const id = uuid();

    //When saving, get the coordinates with the original scale (1.x)
    let coordinates = {};
    if (this.state.selectedLegend.shape === "measure") {
      coordinates = {
        x0: highlight.x0 / scale,
        y0: highlight.y0 / scale,
        x1: highlight.x1 / scale,
        y1: highlight.y1 / scale,
      };
    } else if (
      this.state.selectedLegend.shape === "square" ||
      this.state.selectedLegend.shape === "circle"
    ) {
      coordinates = {
        x: highlight.left / scale,
        y: highlight.top / scale,
        width: highlight.width / scale,
        height: highlight.height / scale,
      };
    } else {
      for (let h in highlight) {
        highlight[h].highlight = id;
        highlight[h].highlight_id = id;
      }
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
        this.props.onHighlightCreate &&
          this.props.onHighlightCreate(newHighlight);
        this.filterHighlights();
        this.legendTallyHighlights();
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
      tally: 0,
    };

    const newLegends = [...this.state.legends, newLegend];

    this.setState(
      {
        legends: newLegends,
        selectedLegend: newLegend,
      },
      () => {
        this.legendTallyHighlights();
        this.props.onLegendCreate && this.props.onLegendCreate(newLegend);
      }
    );
  };

  deleteLegend = () => {
    let { selectedLegend, legends, highlights } = this.state;

    let legendToDelete = selectedLegend;

    let newLegends = legends.filter((legend) => {
      return legend.id !== selectedLegend.id;
    });

    let newHighlights = highlights.filter((highlight) => {
      return highlight.legend.id !== selectedLegend.id;
    });

    this.setState(
      {
        legends: newLegends,
        highlights: newHighlights,
        canCreate: true,
        selectedLegend: null,
      },
      () => {
        this.filterHighlights();
        this.legendTallyHighlights();
        this.props.onLegendDelete &&
          this.props.onLegendDelete(legendToDelete.id);
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
        this.props.onLegendUpdate &&
          this.props.onLegendUpdate(
            this.state.selectedLegend,
            highlightsUpdated
          );
      }
    );
  };

  calibrateMeasurement = () => {
    this.setState(
      {
        measurementLength: this.state.measurementLengthInput,
        measurementUnit: this.state.measurementUnitInput,
        measurementRawLength: this.state.measurementRawInput,
        selectedLegend: null,
      },
      () => {
        this.props.onCalibrateComplete &&
          this.props.onCalibrateComplete(
            this.state.measurementRawLength,
            this.state.measurementLength,
            this.state.measurementUnit
          );
      }
    );

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

  _onMouseMove = (coords) => {
    this.setState({
      x: coords.x,
      y: coords.y,
      pageX: coords.pageX,
      pageY: coords.pageY,
      containerLeft: coords.containerLeft,
      containerTop: coords.containerTop,
      scrollLeft: coords.scrollLeft,
      scrollTop: coords.scrollTop,
    });
  };

  onChange = (e) => this.setState({ [e.target.name]: e.target.value });

  handleChangeComplete = (color) => {
    this.setState({ colorInput: color.hex });
  };

  handleUpdateChangeComplete = (color) => {
    this.setState({ colorUpdateInput: color.hex });
  };

  getPageSize = (page) => {
    console.log(page.originalWidth, page.originalHeight);
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
      measurementRawInput,
      measurementLengthInput,
      measurementUnitInput,
      measurementRawLength,
      measurementLength,
      measurementUnit,
      showTip,
      scale,
      cursor,
    } = this.state;

    return (
      <div style={{ display: "flex" }}>
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
                padding: 5,
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
                padding: 5,
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
                padding: 5,
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
                padding: 5,
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
                    padding: 5,
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
                    padding: 5,
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
            <p style={{ alignSelf: "center", marginRight: 40 }}>=</p>
            <div>
              <label htmlFor="measurementLengthInput">To</label>
              <input
                type="number"
                name="measurementLengthInput"
                onChange={this.onChange}
                value={measurementLengthInput}
                autoComplete="off"
                style={{ margin: 10, padding: 10, width: "90%" }}
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
            width: "400px",
            height: "100%",
            position: "fixed",
            zIndex: 100 /* Stay on top */,
            top: 0 /* Stay at the top */,
            left: 0,
            overflowX: "hidden" /* Disable horizontal scroll */,
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
            <br />

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

            {/* Scaling */}
            <div style={{ display: "flex" }}>
              <button
                type="button"
                disabled={scale <= 0.25}
                onClick={this.zoomOut}
                style={{ height: 32, marginTop: 10 }}
              >
                <img
                  style={{ width: 16 }}
                  src={require("./img/zoomout-32.png")}
                  alt="-"
                />
              </button>
              <p style={{ marginLeft: 10, marginRight: 10 }}>{`${
                scale * 100
              }%`}</p>
              <button
                type="button"
                disabled={scale >= 5}
                onClick={this.zoomIn}
                style={{ height: 32, marginTop: 10 }}
              >
                <img
                  style={{ width: 16 }}
                  src={require("./img/zoomin-32.png")}
                  alt="+"
                />
              </button>
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
          )} = ${measurementLength}${measurementUnit}`}</p>

          <p style={{ paddingLeft: "1rem", paddingRight: "1rem" }}>
            <small>SELECTED</small>
          </p>

          {selectedLegend ? <Legend legend={selectedLegend} /> : <Legend />}
          {selectedLegend && selectedLegend.shape !== "calibrate" && (
            <button
              style={{
                ...buttonStyle,
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
          {selectedLegend && (
            <button
              style={{
                ...buttonStyle,
                backgroundColor: "#DB2828",
                marginLeft: "1em",
                marginRight: "1em",
                marginTop: "1em",
              }}
              onClick={(e) => {
                if (
                  window.confirm(
                    `Are you sure to delete the legend "${selectedLegend.name}" together with its highlights?`
                  )
                ) {
                  this.deleteLegend();
                }
              }}
            >
              Delete
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

          <br />

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
              x: {this.state.x}, y: {this.state.y}
              <br />
              pageX: {this.state.pageX}, pageY: {this.state.pageY}
              <br />
              containerLeft: {this.state.containerLeft}, containerTop:{" "}
              {this.state.containerTop}
              <br />
              scrollLeft: {this.state.scrollLeft}, scrollTop:{" "}
              {this.state.scrollTop}
            </p>
          )}
        </div>

        <Document
          file={this.props.file}
          onLoadSuccess={this.onDocumentLoadSuccess}
          // onMouseMove={this._onMouseMove.bind(this)}
        >
          <div
            style={{
              marginLeft: "400px",
              height: "100vh",
              position: "relative",
              cursor: cursor,
            }}
            onClick={(e) => {
              if (e.key === " " || e.key === 32) {
                console.log("space pressed");
              }
            }}
          >
            <div>
              <Page
                onLoadSuccess={this.getPageSize}
                pageNumber={pageNumber}
                scale={scale}
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
                onPositionMove={(coords) => {
                  this._onMouseMove(coords);
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
                scale={scale}
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
                scale={scale}
                measurementRawLength={measurementRawLength}
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
