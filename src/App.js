import React from "react";
import PDFLabelMapper from "./PDFLabelMapper";
import testLegends from "./testLegends";
import testHighlights from "./testHighlights";

function App() {
  return (
    <div>
      <PDFLabelMapper
        highlights={testHighlights}
        legends={testLegends}
        title={"react-pdf-label-mapper"}
        file={require("./sample.pdf")}
        showCoordinates={true}
      />
    </div>
  );
}

export default App;
