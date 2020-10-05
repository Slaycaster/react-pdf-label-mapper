import React from "react";
import Shape from "./Shape";

const legendStyle = {
  display: "flex",
  border: "solid 1px #ddd",
  marginLeft: "1em",
  marginRight: "1em",
  cursor: "pointer",
};

function Legend(props) {
  const { legend, onClick } = props;

  return legend ? (
    <div>
      <div style={{ ...legendStyle }} onClick={onClick}>
        <div
          style={{
            width: 32,
            marginRight: "10px",
            backgroundColor: `${legend.color}`,
          }}
        >
          <Shape name={legend.shape} />
        </div>
        <div
          style={{
            width: "100%",
          }}
        >
          <strong
            style={{
              width: "100%",
              overflowWrap: "break-word",
              wordWrap: "break-word",
              hyphens: "auto",
              marginTop: "10px",
              marginLeft: "10px",
              fontSize: "0.8em",
              display: "flex",
              flexDirection: "row",
            }}
          >
            {`(${legend.tally ? legend.tally : 0}) ${legend.name}`}
          </strong>
        </div>
      </div>
    </div>
  ) : (
    <div style={legendStyle}>-</div>
  );
}

export default Legend;
