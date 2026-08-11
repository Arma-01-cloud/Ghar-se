import React, { useState, useRef } from 'react';
import { parseGroceryListImage } from '../services/groceryListParser';
import { Upload, Camera, Sparkles, Image as ImageIcon, RefreshCw, Trash2, CheckCircle2 } from 'lucide-react';

export default function UploadGroceryListCard({ onItemsExtracted }) {
  const [imageSrc, setImageSrc] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageSrc(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSampleClick = () => {
    setFileName('sample_handwritten_list.jpg');
    setImageSrc('/images/handwritten_list_sample.jpg');
  };

  const handleAnalyze = async () => {
    if (!imageSrc) return;
    setIsAnalyzing(true);
    setAnalysisStep('Reading your grocery list...');
    setProgressPercent(20);

    const result = await parseGroceryListImage(imageSrc, (status) => {
      setAnalysisStep(status.text || 'Identifying grocery items...');
      setProgressPercent(status.progress || 50);
    });

    setIsAnalyzing(false);
    if (result && result.items) {
      onItemsExtracted(result.items);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
            1
          </span>
          <h3 className="font-display font-extrabold text-xl text-stone-900">
            Upload Grocery List Image
          </h3>
        </div>
        <p className="text-stone-500 text-xs sm:text-sm mb-6 leading-relaxed">
          Upload a photo of your handwritten or printed grocery list
        </p>

        {!imageSrc ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center flex flex-col items-center justify-center transition-all ${
              isDragging
                ? 'border-emerald-600 bg-emerald-50/60'
                : 'border-stone-300 bg-stone-50/50 hover:border-emerald-400 hover:bg-stone-50'
            }`}
          >
            {/* ILLUSTRATION & CAMERA ICON */}
            <div className="relative mb-4">
              <img
                src="/images/grocery_list_illustration.jpg"
                alt="Grocery List"
                className="w-28 h-20 object-cover rounded-xl shadow-xs border border-stone-200"
              />
              <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center shadow-md">
                <Camera className="w-5 h-5 stroke-[2.2]" />
              </div>
            </div>

            <h4 className="font-display font-bold text-stone-900 text-sm sm:text-base">
              📷 Drag & drop your image here
            </h4>
            <p className="text-stone-400 text-xs mt-1 mb-4 font-medium">
              JPG, PNG or WEBP • Max 10MB
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files && handleFile(e.target.files[0])}
              className="hidden"
            />

            <div className="flex flex-col sm:flex-row gap-2.5 w-full max-w-xs">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-3 px-4 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Image</span>
              </button>

              <button
                type="button"
                onClick={handleSampleClick}
                className="py-3 px-3 bg-stone-200/80 hover:bg-stone-300 text-stone-800 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                title="Try demo handwritten paper grocery list photo"
              >
                <ImageIcon className="w-4 h-4 text-emerald-700" />
                <span>Sample List</span>
              </button>
            </div>
          </div>
        ) : (
          /* PREVIEW STATE */
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden border border-stone-200 bg-stone-900 group max-h-60 flex items-center justify-center">
              <img
                src={imageSrc}
                alt="Grocery List Preview"
                className="w-full h-48 object-contain"
              />

              {isAnalyzing && (
                <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4">
                  <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="font-extrabold text-xs text-emerald-300 text-center">{analysisStep}</p>
                  <div className="w-40 bg-emerald-900 h-2 rounded-full overflow-hidden mt-3">
                    <div 
                      className="bg-emerald-400 h-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs font-semibold text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
              <span className="truncate max-w-[180px] font-bold text-stone-900">{fileName}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-emerald-700 hover:underline font-bold"
                >
                  Change
                </button>
                <span className="text-stone-300">•</span>
                <button
                  type="button"
                  onClick={() => {
                    setImageSrc(null);
                    setFileName('');
                  }}
                  className="text-rose-600 hover:underline font-bold"
                >
                  Remove
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full py-3.5 px-6 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>{isAnalyzing ? 'Analyzing List...' : 'Analyze Grocery List'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
