import React, { useRef, useEffect, forwardRef, useImperativeHandle, useState } from 'react';

// Declare the globals loaded from the script tags in index.html
declare var jscad_web: any;
declare var jscad_scad_importer: any;
declare var jscad_io: any;

interface ScadPreviewProps {
  scadCode: string;
}

export interface ScadPreviewHandles {
  downloadStl: () => void;
}

const ScadPreview = forwardRef<ScadPreviewHandles, ScadPreviewProps>(({ scadCode }, ref) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const jscadViewer = useRef<any>(null);
  const resizeObserver = useRef<ResizeObserver | null>(null);
  const [solids, setSolids] = useState<any[]>([]);

  useImperativeHandle(ref, () => ({
    downloadStl: () => {
      if (solids.length === 0) {
        alert("No 3D model data available to export.");
        return;
      }

      try {
        const stlData = jscad_io.stlSerializer.serialize({ binary: true }, solids);
        const blob = new Blob(stlData, { type: 'model/stl' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'generated-model.stl';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (e) {
        console.error("Error generating STL:", e);
        alert("Failed to generate STL file.");
      }
    }
  }));

  useEffect(() => {
    const viewerElement = viewerRef.current;
    if (viewerElement && !jscadViewer.current) {
      if (typeof jscad_web !== 'undefined') {
        jscadViewer.current = new jscad_web.JscadViewer(viewerElement, {
          grid: { show: true, color: [0.6, 0.6, 0.6, 1] },
          axes: { show: true },
          camera: { position: [100, 100, 150] },
          lighting: {
            background: [0.1, 0.13, 0.16, 1.0], // Corresponds to bg-gray-900
          },
          solids: {
            color: [0.4, 0.8, 1, 1]
          }
        });
        
        // Handle resize
        resizeObserver.current = new ResizeObserver(() => {
            jscadViewer.current?.resize();
        });
        resizeObserver.current.observe(viewerElement);

      } else {
        console.error("JSCAD viewer library not loaded.");
      }
    }

    return () => {
      if (resizeObserver.current && viewerElement) {
        resizeObserver.current.unobserve(viewerElement);
      }
      // Note: JSCAD viewer does not have a formal dispose method.
      // Setting to null is sufficient for garbage collection.
      jscadViewer.current = null;
    };
  }, []);

  useEffect(() => {
    if (scadCode && jscadViewer.current) {
      if (typeof jscad_scad_importer !== 'undefined') {
        try {
          const importer = jscad_scad_importer.importer({ zip: false, addMetaData: false });
          // The importer might return one or more solids
          const importedSolids = importer.deserialize(
            { filename: 'model.scad', output: 'solids' },
            scadCode
          );
          setSolids(importedSolids);
          jscadViewer.current.replaceSolids(importedSolids);
        } catch (e) {
          console.error("Error rendering SCAD code:", e);
          setSolids([]);
          jscadViewer.current.replaceSolids([]); // Clear the viewer on error
        }
      } else {
        console.error("JSCAD importer library not loaded.");
      }
    } else if (jscadViewer.current) {
        // Clear viewer if there is no code
        setSolids([]);
        jscadViewer.current.replaceSolids([]);
    }
  }, [scadCode]);

  return (
    <div
      ref={viewerRef}
      className="w-full h-full"
    >
      {!scadCode && (
        <div className="flex items-center justify-center h-full text-gray-500 p-4 text-center">
          <p>Live 3D preview will appear here</p>
        </div>
      )}
    </div>
  );
});

export default ScadPreview;
