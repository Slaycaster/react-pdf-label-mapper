import React, { Component } from "react";

import Square from "./img/rectangle-32.png";
import Circle from "./img/circle-32.png";
import Measure from "./img/measure-32.png";
import Polygon from "./img/polygon-32.png";

function Shape(props) {
  const { name } = props;

  switch (name) {
    case "square":
      return (
        <img
          src={Square}
          alt="Square"
          style={{ width: 28, height: 28, alignSelf: "center", marginTop: 5 }}
        />
      );
    case "circle":
      return (
        <img
          src={Circle}
          alt="Circle"
          style={{ width: 28, height: 28, alignSelf: "center", marginTop: 5 }}
        />
      );
    case "measure":
      return (
        <img
          src={Measure}
          alt="Square"
          style={{ width: 28, height: 28, alignSelf: "center", marginTop: 5 }}
        />
      );
    case "polygon":
      return (
        <img
          src={Polygon}
          alt="Polygon"
          style={{ width: 28, height: 28, alignSelf: "center", marginTop: 5 }}
        />
      );
    default:
      return null;
  }
}

export default Shape;
