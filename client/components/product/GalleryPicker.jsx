// // ===============================
// // FILE: components/products/GalleryPicker.jsx
// // ===============================
// "use client";
// import React from "react";
// import Image from "next/image";
// import { assets } from "@/assets/assets";
// import { X, Plus } from "lucide-react";

// /**
//  * GalleryPicker
//  * - Starts with 1 upload tile by default
//  * - Allows adding up to `max` images (default 10)
//  * - Renders an "+ Add" tile until the limit is reached
//  * - Delegates file storage to parent via onChange(index, event)
//  */
// const GalleryPicker = ({ files = [], onChange, onClearAt, uploadKey, max = 10 }) => {
//   const count = Array.isArray(files) ? files.length : 0;
//   const canAddMore = count < max;
//   const nextIndex = count; // where the next file would go

//   return (
//     <div>
//       <p className="text-sm font-medium">Product Other Images</p>
//       <div className="flex flex-wrap items-center gap-3 mt-2">
//         {files.map((file, index) => (
//           <div key={`g-${index}`} className="relative">
//             <label htmlFor={`img-${index}-${uploadKey}`} className="cursor-pointer block">
//               <input
//                 key={`img-input-${index}-${uploadKey}`}
//                 type="file"
//                 id={`img-${index}-${uploadKey}`}
//                 hidden
//                 accept="image/*"
//                 onChange={(e) => onChange(index, e)}
//               />
//               <Image
//                 className="max-w-24 rounded-lg border"
//                 src={file ? URL.createObjectURL(file) : assets.upload_area}
//                 alt={`gallery-${index + 1}`}
//                 width={100}
//                 height={100}
//               />
//             </label>
//             {file && (
//               <button
//                 type="button"
//                 className="absolute -top-2 -right-2 bg-white border rounded-full p-1 shadow"
//                 onClick={() => onClearAt(index)}
//                 aria-label={`Remove image ${index + 1}`}
//               >
//                 <X size={14} />
//               </button>
//             )}
//           </div>
//         ))}

//         {/* Add tile (only if under max). If 0 files, this is the only tile */}
//         {canAddMore && (
//           <label
//             htmlFor={`img-${nextIndex}-${uploadKey}`}
//             className="w-[100px] h-[100px] border border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50"
//           >
//             <input
//               key={`img-input-${nextIndex}-${uploadKey}`}
//               type="file"
//               id={`img-${nextIndex}-${uploadKey}`}
//               hidden
//               accept="image/*"
//               onChange={(e) => onChange(nextIndex, e)}
//             />
//             <div className="flex flex-col items-center text-xs text-gray-600">
//               <Plus size={16} />
//               <span>Add</span>
//               <span className="opacity-60">
//                 {nextIndex + 1}/{max}
//               </span>
//             </div>
//           </label>
//         )}
//       </div>
//     </div>
//   );
// };

// export default GalleryPicker;

// ===============================
// FILE: components/products/GalleryPicker.jsx
// ===============================
"use client";
import React from "react";
import Image from "next/image";
import { assets } from "@/assets/assets";
import { X, Plus } from "lucide-react";

/**
 * GalleryPicker
 * - Starts with 1 upload tile by default
 * - Allows adding up to `max` images (default 10)
 * - Supports selecting one-by-one OR multiple at once
 * - Delegates file storage to parent via onChange(index, files[])
 */
const GalleryPicker = ({ files = [], onChange, onClearAt, uploadKey, max = 10 }) => {
  const count = Array.isArray(files) ? files.length : 0;
  const canAddMore = count < max;
  const nextIndex = count; // where the next file would go

  const handleFileSelect = (index, e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    // If multiple files chosen, spread them starting from index
    if (selectedFiles.length > 1) {
      selectedFiles.forEach((file, i) => {
        if (index + i < max) {
          onChange(index + i, { target: { files: [file] } });
        }
      });
    } else {
      onChange(index, e);
    }
  };

  return (
    <div>
      <p className="text-sm font-medium">Product Other Images</p>
      <div className="flex flex-wrap items-center gap-3 mt-2">
        {files.map((file, index) => (
          <div key={`g-${index}`} className="relative">
            <label htmlFor={`img-${index}-${uploadKey}`} className="cursor-pointer block">
              <input
                key={`img-input-${index}-${uploadKey}`}
                type="file"
                id={`img-${index}-${uploadKey}`}
                hidden
                accept="image/*"
                onChange={(e) => handleFileSelect(index, e)}
              />
              <Image
                className="max-w-24 rounded-lg border"
                src={file ? URL.createObjectURL(file) : assets.upload_area}
                alt={`gallery-${index + 1}`}
                width={100}
                height={100}
              />
            </label>
            {file && (
              <button
                type="button"
                className="absolute -top-2 -right-2 bg-white border rounded-full p-1 shadow"
                onClick={() => onClearAt(index)}
                aria-label={`Remove image ${index + 1}`}
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}

        {/* Add tile (only if under max). If 0 files, this is the only tile */}
        {canAddMore && (
          <label
            htmlFor={`img-${nextIndex}-${uploadKey}`}
            className="w-[100px] h-[100px] border border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50"
          >
            <input
              key={`img-input-${nextIndex}-${uploadKey}`}
              type="file"
              id={`img-${nextIndex}-${uploadKey}`}
              hidden
              accept="image/*"
              multiple   // 👈 allow selecting multiple images at once
              onChange={(e) => handleFileSelect(nextIndex, e)}
            />
            <div className="flex flex-col items-center text-xs text-gray-600">
              <Plus size={16} />
              <span>Add</span>
              <span className="opacity-60">
                {nextIndex + 1}/{max}
              </span>
            </div>
          </label>
        )}
      </div>
    </div>
  );
};

export default GalleryPicker;
