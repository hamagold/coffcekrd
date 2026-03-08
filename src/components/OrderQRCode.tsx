import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import QRCode from 'qrcode';

export interface OrderQRCodeHandle {
  getDataUrl: () => string;
}

interface OrderQRCodeProps {
  orderNumber: string;
  size?: number;
  cafeName?: string;
}

const OrderQRCode = forwardRef<OrderQRCodeHandle, OrderQRCodeProps>(
  ({ orderNumber, size = 160, cafeName = 'PLC' }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useImperativeHandle(ref, () => ({
      getDataUrl: () => canvasRef.current?.toDataURL('image/png') || '',
    }));

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
      <div className="bg-white rounded-2xl p-3 shadow-lg border border-border inline-block mx-auto">
        <canvas ref={canvasRef} className="rounded-lg block" />
        <div className="text-center mt-2">
          <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">
            #{orderNumber}
          </span>
        </div>
      </div>
    );
  }
);

OrderQRCode.displayName = 'OrderQRCode';

export default OrderQRCode;
