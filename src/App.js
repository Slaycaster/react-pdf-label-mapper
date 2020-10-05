import React from "react";
import PDFLabelMapper from "./components/PDFLabelMapper";
import testLegends from "./testLegends";
import testHighlights from "./testHighlights";

function App() {
  return (
    <div>
      <PDFLabelMapper
        highlights={testHighlights}
        legends={testLegends}
        title={"SBHE Drawing Highlighter"}
        file={`https://sbhe-dev.s3-ap-southeast-1.amazonaws.com/200+Series_interim_RCP-210+(Elect).pdf`}
      />
    </div>
  );
}

export default App;
