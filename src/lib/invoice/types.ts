export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  company: {
    name: string;
    address: string;
    phone: string;
    email: string;
    gstin: string;
    website: string;
  };
  patient: {
    name: string;
    phone: string;
    email: string;
  };
  appointment: {
    id: string;
    date: string;
    time: string;
    mode: string;
    status: string;
    paymentStatus: string;
  };
  service: {
    name: string;
    duration: number;
    doctor: string;
  };
  location: {
    name: string;
    city: string;
    address: string;
  };
  billing: {
    subtotal: number;
    gst: number;
    total: number;
    currency: string;
    paymentMethod: string;
    transactionId: string | null;
    razorpayOrderId?: string | null;
  };
  notes: string | null;
}
