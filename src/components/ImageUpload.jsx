import React, { useState } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';

const ImageUpload = ({ onClose }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">上传图片</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver ? 'border-[#f3ae0e] bg-[#fff8ee]' : 'border-gray-300'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {selectedImage ? (
            <div className="space-y-4">
              <img
                src={selectedImage}
                alt="Selected"
                className="mx-auto object-cover rounded-lg max-h-48"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="text-sm text-red-500 hover:text-red-700"
              >
                重新选择
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
              <div>
                <p className="text-gray-600 mb-2">拖拽图片到这里或点击选择</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="inline-flex items-center gap-2 bg-[#f3ae0e] text-white px-4 py-2 rounded-lg hover:bg-[#e6a20d] transition-colors cursor-pointer"
                >
                  <Upload className="h-4 w-4" />
                  选择图片
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => {
              // 处理图片上传逻辑
              onClose();
            }}
            disabled={!selectedImage}
            className="flex-1 py-2 px-4 bg-[#f3ae0e] text-white rounded-lg hover:bg-[#e6a20d] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            确认上传
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;
