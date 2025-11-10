import React, { useState, useCallback, useRef } from 'react';
import { generateScadImageAndSvg, GeneratedData, generateConstructionPlan, ConstructionPartPlan, generateModelFromImage } from './services/apiClient';
import ScadPreview, { ScadPreviewHandles } from './ScadPreview';
import ImageModal from './ImageModal';

// Helper Icon Components
const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const CodeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
);

const ImageIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const PreviewIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 16V8a2 2 0 00-1-1.732l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.732l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
    </svg>
);

const LaserIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.71 4.5l3.59 3.59M3 3l18 18m-9.29-2.59l3.59 3.59M21.5 17.29l-3.59-3.59M12 2a2 2 0 100 4 2 2 0 000-4zM5.5 11.5a2 2 0 100 4 2 2 0 000-4zm13 0a2 2 0 100 4 2 2 0 000-4z" />
  </svg>
);

const CubeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const ConstructionIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

type PartData = GeneratedData & { partName: string; color?: string; };

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [laserWidth, setLaserWidth] = useState<string>('');
  const [laserHeight, setLaserHeight] = useState<string>('');
  const [generatedData, setGeneratedData] = useState<GeneratedData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isConstructionMode, setIsConstructionMode] = useState<boolean>(false);
  const [constructionParts, setConstructionParts] = useState<PartData[]>([]);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [activeScadCode, setActiveScadCode] = useState<string | null>(null);
  const [colors, setColors] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [useImageMode, setUseImageMode] = useState<boolean>(false);

  const scadPreviewRef = useRef<ScadPreviewHandles>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const examples = [
    "a 20mm cube with rounded corners", "a gear with 12 teeth", "a simple phone stand", "a hollow cylinder, 20mm tall", "a chess pawn", "a keychain with the name 'Alex'",
  ];

  const presetColors = ['red', 'blue', 'green', 'yellow', 'black', 'white', 'orange', 'purple', '#CCCCCC'];

  const addColor = (color: string) => {
    const sanitizedColor = color.trim();
    if (sanitizedColor && !colors.includes(sanitizedColor)) {
      setColors([...colors, sanitizedColor]);
    }
  };

  const removeColor = (colorToRemove: string) => {
    setColors(colors.filter(c => c !== colorToRemove));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('Image file size must be less than 10MB');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerate = useCallback(async () => {
    if ((!prompt.trim() && !selectedImage) || isLoading) return;

    setIsLoading(true);
    setError(null);
    setGeneratedData(null);
    setConstructionParts([]);
    setActiveScadCode(null);

    try {
      const dimensions = laserWidth && laserHeight ? { width: parseFloat(laserWidth), height: parseFloat(laserHeight) } : undefined;

      // Image-to-3D mode
      if (selectedImage) {
        setLoadingMessage('Analyzing image and generating 3D model...');
        const result = await generateModelFromImage(selectedImage, prompt || undefined, dimensions, colors);
        setGeneratedData(result);
        setActiveScadCode(result.scadCode);
      }
      // Construction mode
      else if (isConstructionMode) {
        setLoadingMessage('Step 1: Planning construction parts...');
        const plan = await generateConstructionPlan(prompt, colors);

        for (let i = 0; i < plan.length; i++) {
            const part = plan[i];
            setLoadingMessage(`Step 2: Generating part ${i + 1}/${plan.length}: ${part.partName}...`);
            const result = await generateScadImageAndSvg(part.prompt, dimensions, part.color ? [part.color] : []);
            const newPart: PartData = { ...result, partName: part.partName, color: part.color };
            setConstructionParts(prevParts => [...prevParts, newPart]);
            if (i === 0) {
              setActiveScadCode(result.scadCode);
            }
        }
      }
      // Normal text-to-3D mode
      else {
        setLoadingMessage('Generating your model...');
        const result = await generateScadImageAndSvg(prompt, dimensions, colors);
        setGeneratedData(result);
        setActiveScadCode(result.scadCode);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      console.error(err);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [prompt, isLoading, laserWidth, laserHeight, isConstructionMode, colors, selectedImage]);

  const handleDownload = (content: string | Blob, filename: string, mimeType: string) => {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">
            AI OpenSCAD & SVG Generator
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            Transform ideas into 3D models and laser-cuttable designs with AI.
          </p>
        </header>

        <main>
          {/* Image Upload Section */}
          <div className="bg-gray-800 rounded-xl shadow-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-teal-300">📸 Image-to-3D Conversion (Optional)</h2>
              {selectedImage && (
                <button
                  type="button"
                  onClick={clearImage}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Clear Image
                </button>
              )}
            </div>

            {!selectedImage ? (
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-teal-500 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <ImageIcon className="h-16 w-16 mx-auto text-gray-500 mb-4" />
                  <p className="text-lg font-medium text-gray-300 mb-2">
                    Upload an image to convert to 3D
                  </p>
                  <p className="text-sm text-gray-500">
                    Click to select or drag and drop (Max 10MB)
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    Supported: JPG, PNG, GIF, WebP
                  </p>
                </label>
              </div>
            ) : (
              <div className="flex items-center gap-4 p-4 bg-gray-900 rounded-lg border-2 border-teal-500">
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Selected"
                    className="w-32 h-32 object-contain rounded-lg border-2 border-gray-700"
                  />
                )}
                <div className="flex-grow">
                  <p className="text-lg font-medium text-teal-300">
                    {selectedImage.name}
                  </p>
                  <p className="text-sm text-gray-400">
                    {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    ✅ Image ready for conversion. Add optional prompt below for specific instructions.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-800 rounded-xl shadow-2xl p-6 mb-8">
            <div className="flex justify-between items-center mb-3">
                 <h2 className="text-xl font-semibold text-teal-300">
                   {selectedImage ? '💬 Additional Instructions (Optional)' : '1. Enter your prompt'}
                 </h2>
                 {!selectedImage && (
                   <button
                      type="button"
                      onClick={() => setIsConstructionMode(!isConstructionMode)}
                      className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg border-2 transition-colors duration-200 ${isConstructionMode ? 'bg-teal-500 border-teal-400 text-white' : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'}`}
                   >
                      <ConstructionIcon className="h-5 w-5 mr-2" />
                      Construction Kit Mode
                   </button>
                 )}
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                selectedImage
                  ? "e.g., make it 50mm tall, add a base for stability, simplify the design..."
                  : isConstructionMode
                    ? "e.g., a small wooden chair, a toy car"
                    : "e.g., a 20mm cube with a 10mm hole through the center"
              }
              className="w-full h-28 p-3 bg-gray-900 border-2 border-gray-700 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors duration-200 resize-none"
              disabled={isLoading}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { handleGenerate(); }}}
            />
             <div className="mt-4">
                <p className="text-sm text-gray-400 mb-2"> Try an example: </p>
                <div className="flex flex-wrap gap-2">
                  {examples.map((example) => (
                    <button key={example} onClick={() => setPrompt(example)} className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm hover:bg-gray-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-teal-500 transition-colors duration-200">
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            
            <div className="mt-6">
                <h3 className="text-lg font-semibold text-teal-300 mb-3">2. Laser Cutter Area (Optional)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="width" className="block text-sm font-medium text-gray-400 mb-1">Width (mm)</label>
                        <input type="number" id="width" value={laserWidth} onChange={(e) => setLaserWidth(e.target.value)} placeholder="e.g., 200" className="w-full p-2 bg-gray-900 border-2 border-gray-700 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors" disabled={isLoading}/>
                    </div>
                     <div>
                        <label htmlFor="height" className="block text-sm font-medium text-gray-400 mb-1">Height (mm)</label>
                        <input type="number" id="height" value={laserHeight} onChange={(e) => setLaserHeight(e.target.value)} placeholder="e.g., 150" className="w-full p-2 bg-gray-900 border-2 border-gray-700 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors" disabled={isLoading}/>
                    </div>
                </div>
            </div>

            <div className="mt-6">
                <h3 className="text-lg font-semibold text-teal-300 mb-3">3. Choose Your Colors (Optional)</h3>
                <div className="p-4 bg-gray-900 rounded-lg border-2 border-gray-700">
                    <div className="flex flex-wrap gap-2 mb-4">
                        {presetColors.map(pc => (
                            <button key={pc} onClick={() => addColor(pc)} className="px-3 py-1 rounded-full text-sm transition-transform transform hover:scale-105" style={{ backgroundColor: pc, color: pc === 'black' || pc === 'blue' || pc === 'purple' ? 'white' : 'black' }}>
                                {pc}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-2 mb-4">
                        <input 
                            type="text" 
                            value={colorInput} 
                            onChange={e => setColorInput(e.target.value)}
                            placeholder="Add custom color (e.g., #RRGGBB)"
                            className="flex-grow p-2 bg-gray-800 border-2 border-gray-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                        <button onClick={() => { addColor(colorInput); setColorInput(''); }} className="px-4 py-2 bg-teal-600 text-white font-semibold rounded-md hover:bg-teal-500">Add</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {colors.map(c => (
                            <div key={c} className="flex items-center gap-2 bg-gray-700 rounded-full pl-3">
                                <span className="w-4 h-4 rounded-full border border-gray-500" style={{ backgroundColor: c }}></span>
                                <span className="text-sm font-mono">{c}</span>
                                <button onClick={() => removeColor(c)} className="p-1 text-gray-400 hover:text-white">&times;</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button onClick={handleGenerate} disabled={isLoading || !prompt.trim()} className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-teal-500 to-blue-600 text-white font-bold rounded-lg hover:from-teal-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-300 shadow-lg">
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {loadingMessage || 'Generating...'}
                  </div>
                ) : 'Generate'}
              </button>
            </div>
          </div>
          
          {error && ( <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative mb-6" role="alert"> <strong className="font-bold">Error: </strong> <span className="block sm:inline">{error}</span> </div> )}
          
          {generatedData && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
              <div className="bg-gray-800 rounded-xl shadow-2xl p-6 flex flex-col">
                <div className="flex items-center mb-4 shrink-0"> <ImageIcon className="h-6 w-6 mr-3 text-teal-400"/> <h2 className="text-xl font-semibold text-teal-300">Generated Image</h2> </div>
                <div className="aspect-square bg-gray-900 rounded-lg flex items-center justify-center overflow-hidden border-2 border-gray-700 cursor-pointer" onClick={() => setIsModalOpen(true)}> <img src={generatedData.imageUrl} alt="Generated model visualization" className="object-contain w-full h-full"/> </div>
                <button onClick={() => handleDownload(atob(generatedData.imageUrl.split(',')[1]), 'generated-image.png', 'image/png')} className="mt-4 shrink-0 w-full flex items-center justify-center px-6 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors duration-200"> <DownloadIcon className="h-5 w-5 mr-2"/> Download Image (.png) </button>
              </div>
              <div className="bg-gray-800 rounded-xl shadow-2xl p-6 flex flex-col">
                <div className="flex items-center mb-4 shrink-0"> <PreviewIcon className="h-6 w-6 mr-3 text-teal-400"/> <h2 className="text-xl font-semibold text-teal-300">Live 3D Preview</h2> </div>
                <div className="aspect-square bg-gray-900 rounded-lg overflow-hidden border-2 border-gray-700"> <ScadPreview ref={scadPreviewRef} scadCode={activeScadCode || ''} /> </div>
              </div>
              <div className="bg-gray-800 rounded-xl shadow-2xl p-6 flex flex-col">
                 <div className="flex items-center mb-4 shrink-0"> <CodeIcon className="h-6 w-6 mr-3 text-teal-400"/> <h2 className="text-xl font-semibold text-teal-300">OpenSCAD Code</h2> </div>
                <div className="flex-grow min-h-0"> <pre className="bg-gray-900 text-sm p-4 rounded-lg overflow-auto h-full border-2 border-gray-700 font-mono"> <code>{activeScadCode || generatedData.scadCode}</code> </pre> </div>
                <div className="mt-4 space-y-2">
                  <button onClick={() => handleDownload(generatedData.scadCode, 'generated-model.scad', 'text/plain')} className="w-full flex items-center justify-center px-6 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors duration-200"> <DownloadIcon className="h-5 w-5 mr-2"/> Download Code (.scad) </button>
                   <button onClick={() => scadPreviewRef.current?.downloadStl()} className="w-full flex items-center justify-center px-6 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors duration-200"> <CubeIcon className="h-5 w-5 mr-2"/> Download STL (.stl) </button>
                   {generatedData.svgCode && ( <button onClick={() => handleDownload(generatedData.svgCode!, 'generated-laser-design.svg', 'image/svg+xml')} className="w-full flex items-center justify-center px-6 py-2 bg-teal-700 text-white font-semibold rounded-lg hover:bg-teal-600 transition-colors duration-200"> <LaserIcon className="h-5 w-5 mr-2"/> Download SVG for Laser </button> )}
                </div>
              </div>
            </div>
          )}

          {constructionParts.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                {/* Parts List */}
                <div className="lg:col-span-2 bg-gray-800 rounded-xl shadow-2xl p-6">
                    <h2 className="text-2xl font-semibold text-teal-300 mb-4">Construction Kit Parts</h2>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {constructionParts.map((part, index) => (
                           <div key={index} className="bg-gray-900 p-4 rounded-lg flex items-start gap-4 border-2 border-gray-700">
                               <img src={part.imageUrl} alt={part.partName} className="w-24 h-24 object-contain bg-gray-800 rounded-md shrink-0"/>
                               <div className="flex-grow">
                                    <div className="flex items-center gap-3">
                                        {part.color && <span className="w-5 h-5 rounded-full border-2 border-gray-600 shrink-0" style={{backgroundColor: part.color}}></span>}
                                        <h3 className="font-bold text-lg text-gray-100">{part.partName}</h3>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 text-sm">
                                        <button onClick={() => setActiveScadCode(part.scadCode)} className="p-2 bg-blue-600 hover:bg-blue-500 rounded-md flex items-center justify-center"> <PreviewIcon className="w-4 h-4 mr-1"/> Preview </button>
                                        <button onClick={() => handleDownload(atob(part.imageUrl.split(',')[1]), `${part.partName}.png`, 'image/png')} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-md flex items-center justify-center"> <DownloadIcon className="w-4 h-4 mr-1"/> PNG </button>
                                        <button onClick={() => handleDownload(part.scadCode, `${part.partName}.scad`, 'text/plain')} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-md flex items-center justify-center"> <DownloadIcon className="w-4 h-4 mr-1"/> SCAD </button>
                                        <button onClick={() => { setActiveScadCode(part.scadCode); setTimeout(() => scadPreviewRef.current?.downloadStl(), 100); }} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-md flex items-center justify-center"> <DownloadIcon className="w-4 h-4 mr-1"/> STL </button>
                                        {part.svgCode && <button onClick={() => handleDownload(part.svgCode!, `${part.partName}.svg`, 'image/svg+xml')} className="p-2 bg-teal-700 hover:bg-teal-600 rounded-md flex items-center justify-center"> <DownloadIcon className="w-4 h-4 mr-1"/> SVG </button>}
                                    </div>
                               </div>
                           </div>
                        ))}
                    </div>
                </div>
                {/* Live Preview */}
                <div className="bg-gray-800 rounded-xl shadow-2xl p-6 flex flex-col">
                    <div className="flex items-center mb-4 shrink-0">
                        <PreviewIcon className="h-6 w-6 mr-3 text-teal-400"/>
                        <h2 className="text-xl font-semibold text-teal-300">Live 3D Preview</h2>
                    </div>
                    <div className="aspect-square bg-gray-900 rounded-lg overflow-hidden border-2 border-gray-700">
                       <ScadPreview ref={scadPreviewRef} scadCode={activeScadCode || ''} />
                    </div>
                     <div className="mt-4 flex-grow min-h-0"> <pre className="bg-gray-900 text-sm p-4 rounded-lg overflow-auto h-full border-2 border-gray-700 font-mono"> <code>{activeScadCode || '// Click "Preview" on a part to see its code'}</code> </pre> </div>
                </div>
            </div>
          )}

        </main>
      </div>
      {isModalOpen && generatedData?.imageUrl && ( <ImageModal imageUrl={generatedData.imageUrl} onClose={() => setIsModalOpen(false)} /> )}
    </div>
  );
};

export default App;