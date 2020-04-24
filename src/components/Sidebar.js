import React from "react";
import "../styles/Sidebar.css";

function Sidebar() {
  return (
    <div className="sidebar" style={{ width: "20vw" }}>
      <div className="description" style={{ padding: "1rem" }}>
        <h3 style={{ marginBottom: "1rem" }}>react-pdf-label-mapper</h3>

        <p>
          <small>
            To create area highlight hold ⌥ Option key (Alt), then click and
            drag.
          </small>
        </p>
      </div>
    </div>
  );
}

export default Sidebar;
