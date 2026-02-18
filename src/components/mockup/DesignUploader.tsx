import React, { useRef } from 'react';
import { Upload } from 'lucide-react';

interface DesignUploaderProps {
    onUpload: (url: string) => void;
    label?: string;
    className?: string;
}

export const DesignUploader: React.FC<DesignUploaderProps> = ({
    onUpload,
    label = "Subir diseño",
    className = ""
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            onUpload(url);
        }
    };

    return (
        <div className={`flex flex-col items-center justify-center w-full ${className}`}>
            <div
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 border-gray-300 hover:bg-gray-100 transition-colors"
                onClick={() => fileInputRef.current?.click()}
            >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click para subir</span></p>
                    <p className="text-xs text-gray-500">PNG, JPG (MAX. 5MB)</p>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                />
            </div>
            {label && <p className="mt-2 text-sm font-medium text-gray-700">{label}</p>}
        </div>
    );
};
