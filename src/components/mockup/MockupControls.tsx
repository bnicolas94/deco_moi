import React from 'react';
import { useMockupStore } from '@/stores/mockupStore';

export const MockupControls: React.FC = () => {
    // Asegurarnos de que el hook se llame dentro de un componente que será hidratado
    const { designTransform, updateDesignTransform, designImage } = useMockupStore();

    if (!designImage) return null;

    return (
        <div className="space-y-4 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-700">Ajustes de Diseño</h3>

            <div className="space-y-3">
                <div>
                    <label className="text-sm text-gray-600 block mb-1">Tamaño</label>
                    <input
                        type="range"
                        min="0.1"
                        max="3"
                        step="0.1"
                        value={designTransform.scale}
                        onChange={(e) => updateDesignTransform({ scale: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="text-xs text-right text-gray-500">{Math.round(designTransform.scale * 100)}%</div>
                </div>

                <div>
                    <label className="text-sm text-gray-600 block mb-1">Rotación</label>
                    <input
                        type="range"
                        min="0"
                        max="360"
                        step="1"
                        value={designTransform.rotation}
                        onChange={(e) => updateDesignTransform({ rotation: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="text-xs text-right text-gray-500">{Math.round(designTransform.rotation)}°</div>
                </div>
            </div>

            <div className="pt-2">
                <button
                    onClick={() => updateDesignTransform({ scale: 1, rotation: 0, position: { x: 0, y: 0 } })}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                    Restablecer transformación
                </button>
            </div>
        </div>
    );
};
