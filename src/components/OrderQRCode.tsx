import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface OrderQRCodeProps {
  orderNumber: string;
  size?: number;
  cafeName?: string;
}

const OrderQRCode = ({ orderNumber, size = 160, cafeName = 'PLC' }: OrderQRCodeProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !orderNumber) return;

    const qrData = JSON.stringify({
      order: orderNumber,
      cafe: cafeName,
      time: new Date().toISOString(),
    });

    QRCode.toCanvas(canvasRef.current, qrData, {
      width: size,
      margin: 2,
      color: {
        dark: '#1a1a2e',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  }, [orderNumber, size, cafeName]);

  return (
    <div className="bg-white rounded-2xl p-3 shadow-lg border border-border inline-block">
      <canvas ref={canvasRef} className="rounded-lg block" />
      <div className="text-center mt-2">
        <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">
          #{orderNumber}
        </span>
      </div>
    </div>
  );
};

export default OrderQRCode;
