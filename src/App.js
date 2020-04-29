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
        title={"custom title"}
        showDescription={false}
        file={`http://sbhe-dev.s3.amazonaws.com/Documents/drawing/Tasks/Task2077/0_t1cr_elec_power_sbhe_lt5___em5_sld_01_02_03_a1_kt__07_apr_2020_.pdf`}
      />
    </div>
  );
}

export default App;
