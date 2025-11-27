import { useState, useRef } from 'react';
import { Upload, X, Star, Image as ImageIcon } from 'lucide-react';
import Button from './Button';
import './ImageUpload.css';

const ImageUpload = ({ images = [], onUpload, onDelete, onSetPrimary, maxImages = 5, disabled = false }) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);

    if (files.length === 0) return;

    if (images.length + files.length > maxImages) {
      alert(`You can only upload up to ${maxImages} images`);
      return;
    }

    const validFiles = files.filter(file => {
      const isValid = file.type.startsWith('image/');
      if (!isValid) {
        alert(`${file.name} is not a valid image file`);
      }
      return isValid;
    });

    if (validFiles.length === 0) return;

    setUploading(true);
    try {
      await onUpload(validFiles);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  const handleDelete = async (imageId) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      await onDelete(imageId);
    }
  };

  const handleSetPrimary = async (imageId) => {
    await onSetPrimary(imageId);
  };

  return (
    <div className="image-upload-container">
      <div className="image-upload-grid">
        {images.map((image) => (
          <div key={image._id} className="image-upload-item">
            <img src={image.url} alt="Product" className="image-upload-preview" />
            <div className="image-upload-overlay">
              <Button
                size="small"
                variant={image.isPrimary ? 'primary' : 'secondary'}
                onClick={() => handleSetPrimary(image._id)}
                disabled={disabled}
                title={image.isPrimary ? 'Primary image' : 'Set as primary'}
              >
                <Star size={16} fill={image.isPrimary ? 'currentColor' : 'none'} />
              </Button>
              <Button
                size="small"
                variant="danger"
                onClick={() => handleDelete(image._id)}
                disabled={disabled}
              >
                <X size={16} />
              </Button>
            </div>
            {image.isPrimary && (
              <div className="image-primary-badge">Primary</div>
            )}
          </div>
        ))}

        {images.length < maxImages && (
          <div className="image-upload-placeholder" onClick={handleClick}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              disabled={disabled || uploading}
            />
            {uploading ? (
              <div className="image-upload-loading">
                <div className="spinner"></div>
                <span>Uploading...</span>
              </div>
            ) : (
              <>
                <Upload size={32} className="image-upload-icon" />
                <span className="image-upload-text">
                  {images.length === 0 ? 'Upload images' : 'Add more'}
                </span>
                <span className="image-upload-hint">
                  {images.length}/{maxImages} images
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {images.length === 0 && (
        <div className="image-upload-empty">
          <ImageIcon size={48} />
          <p>No images uploaded yet</p>
          <p className="text-muted">Click the upload box to add product images</p>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
