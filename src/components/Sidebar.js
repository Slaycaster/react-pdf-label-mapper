import React from "react";
import "../styles/Sidebar.css";

const Sidebar = (props) => {
  return (
    <div className="sidebar" style={{ width: "20vw" }}>
      <div className="description" style={{ padding: "1rem" }}>
        <h3 style={{ marginBottom: "1rem" }}>react-pdf-label-mapper</h3>

        <p>
          <small>
            To create area highlight, click anywhere on the PDF page and drag or
            resize. <br />
            To delete, hold ⌥/Alt, then click the highlight.
          </small>
        </p>
      </div>

      <ul>
        {props.shapes &&
          props.shapes.map((shape, index) => <li key={index}>{shape.name}</li>)}
      </ul>
    </div>
  );
};

export default Sidebar;
