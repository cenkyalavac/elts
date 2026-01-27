import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Eraser, Check } from 'lucide-react';

export default function SignaturePad({ onSave, onCancel }) {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }, []);

    const getCoordinates = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        if (e.touches) {
            return {
                x: (e.touches[0].clientX - rect.left) * scaleX,
                y: (e.touches[0].clientY - rect.top) * scaleY
            };
        }
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    };

    const startDrawing = (e) => {
        e.preventDefault();
        const { x, y } = getCoordinates(e);
        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        e.preventDefault();
        const { x, y } = getCoordinates(e);
        const ctx = canvasRef.current.getContext('2d');
        ctx.lineTo(x, y);
        ctx.stroke();
        setHasSignature(true);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
    };

    const handleSave = () => {
        if (!hasSignature) return;
        const canvas = canvasRef.current;
        const base64 = canvas.toDataURL('image/png');
        onSave(base64);
    };

    return (
        <div className="space-y-3">
            <p className="text-sm text-gray-600">Draw your signature below:</p>
            <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white">
                <canvas
                    ref={canvasRef}
                    width={400}
                    height={150}
                    className="w-full touch-none cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
            </div>
            <div className="flex gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearSignature}
                    className="gap-1"
                >
                    <Eraser className="w-4 h-4" />
                    Clear
                </Button>
                <Button
                    type="button"
                    size="sm"
                    onClick={handleSave}
                    disabled={!hasSignature}
                    className="gap-1 flex-1"
                >
                    <Check className="w-4 h-4" />
                    Sign Document
                </Button>
                {onCancel && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>
                )}
            </div>
        </div>
    );
}