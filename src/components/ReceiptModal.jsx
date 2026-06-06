import { useRef } from 'react';

const formatRupiah = (number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(number);

export default function ReceiptModal({ order, onClose }) {
  const printRef = useRef();

  const handlePrint = () => {
    const printContent = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
            <html><head><title>Struk - ${order.order_code}</title>
            <style>
                body { font-family: monospace; font-size: 12px; width: 300px; margin: auto; }
                .center { text-align: center; }
                .bold { font-weight: bold; }
                hr { border: 1px dashed #000; }
                table { width: 100%; }
                td { padding: 2px 0; }
            </style>
            </head><body>${printContent}</body></html>
        `);
    win.document.close();
    win.print();
    win.close();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div ref={printRef} className="font-mono text-sm text-black">
          <div className="text-center mb-3">
            <p className="text-lg font-bold text-black">🏢 LARAVEL POS</p>
            <p className="text-xs text-gray-500">Struk Pembelian</p>
            <p className="text-xs text-black">Kasir: {order.user?.name}</p>
          </div>

          <hr className="border-dashed my-2" />

          <div className="text-xs space-y-1 mb-2">
            <div className="flex justify-between">
              <span>No. Order</span>
              <span className="font-bold">{order.order_code}</span>
            </div>
            <div className="flex justify-between">
              <span>Tanggal</span>
              <span>{order.created_at}</span>
            </div>
          </div>

          <hr className="border-dashed my-2" />

          <table className="w-full text-xs mb-2">
            <tbody>
              {order.items?.map((item, idx) => (
                <tr key={idx}>
                  <td colSpan={3} className="font-semibold text-black">
                    {item.produk_name}
                  </td>
                  <tr>
                    <td className="text-black">
                      {item.quantity} x {formatRupiah(item.price)}
                    </td>
                    <td className="text-right font-bold text-black">
                      {formatRupiah(item.subtotal)}
                    </td>
                  </tr>
                </tr>
              ))}
            </tbody>
          </table>

          <hr className="border-dashed my-2" />

          <div className="space-y-1 text-sm">
            <div className="flex justify-between font-bold text-base text-black">
              <span>TOTAL</span>
              <span>{formatRupiah(order.total_price)}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Bayar</span>
              <span>{formatRupiah(order.bayar)}</span>
            </div>
            <div className="flex justify-between font-bold text-green-600">
              <span>Kembalian</span>
              <span>{formatRupiah(order.kembalian)}</span>
            </div>
          </div>

          <hr className="border-dashed my-2" />
          <p className="text-center text-xs text-black">
            Terima kasih sudah berbelanja!
          </p>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={handlePrint}
            className="flex-1 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
          >
            🖨️ Cetak Struk
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 border rounded-xl hover:bg-gray-50 text-black"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
