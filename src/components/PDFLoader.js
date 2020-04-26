import React, { useState, useRef } from "react";
import { usePdf } from "@mikecousins/react-pdf";

const PDFLoader = (props) => {
  const [page, setPage] = useState(1);
  const canvasRef = useRef(null);

  const { pdfDocument } = usePdf({
    file: props.file,
    page,
    canvasRef,
    scale: props.scale,
  });

  return (
    <div>
      {/* Loading bar */}
      {!pdfDocument && <span>Loading...</span>}

      {/* PDF Canvas */}
      <canvas ref={canvasRef} />

      {/* Pagination */}
      {Boolean(pdfDocument && pdfDocument.numPages) && (
        <nav>
          <ul className="pager">
            <li className="previous">
              <button disabled={page === 1} onClick={() => setPage(page - 1)}>
                Previous
              </button>
            </li>
            <li className="next">
              <button
                disabled={page === pdfDocument.numPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
};

export default PDFLoader;

PDFLoader.defaultProps = {
  scale: 1.0,
  page: 1,
  file: null,
};
