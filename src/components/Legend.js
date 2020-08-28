import React from "react";
import Shape from "./Shape";

const legendStyle = {
  display: "flex",
  border: "solid 1px #ddd",
  padding: "1rem",
  marginLeft: "1em",
  marginRight: "1em",
  cursor: "pointer",
};

function Legend(props) {
  const { legend, onClick } = props;

  return legend ? (
    <div>
      <div
        style={{ ...legendStyle, background: legend.color }}
        onClick={onClick}
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
            fontSize: "0.8vw",
            display: "flex",
            flexDirection: "row",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              marginRight: "10px",
            }}
          >
            <Shape name={legend.shape} />
          </div>
          {legend.name}
        </strong>
        <strong
          style={{
            background: "#f2f1ed",
            padding: "1rem",
            float: "right",
            border: "solid 1px #ddd",
            fontSize: "0.8vw",
          }}
        >
          {legend.tally}
        </strong>
      </div>
    </div>
  ) : (
    <div style={legendStyle}>-</div>
  );
}

export default Legend;
