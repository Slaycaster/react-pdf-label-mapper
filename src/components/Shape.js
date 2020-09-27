import React from "react";

function Shape(props) {
  const { name } = props;

  switch (name) {
    case "square":
      return (
        <img
          src={require("../img/rectangle-32.png")}
          alt="Square"
          style={{ width: 24, height: 24, padding: 5 }}
        />
      );
    case "circle":
      return (
        <img
          src={require("../img/circle-32.png")}
          alt="Circle"
          style={{ width: 24, height: 24, padding: 5 }}
        />
      );
    case "measure":
      return (
        <img
          src={require("../img/measure-32.png")}
          alt="Square"
          style={{ width: 24, height: 24, padding: 5 }}
        />
      );
    case "polygon":
      return (
        <img
          src={require("../img/polygon-32.png")}
          alt="Polygon"
          style={{ width: 24, height: 24, padding: 5 }}
        />
      );
    default:
      return null;
  }
}

export default Shape;
