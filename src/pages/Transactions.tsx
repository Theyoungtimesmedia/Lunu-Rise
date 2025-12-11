// src/pages/TransactionsFirebase.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/integrations/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpRight, ArrowDownLeft, RefreshCw, Download } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Transaction {
  id: string;
  userEmail: string;
  type: string;
  amount_usd?: number;
  amount?: number; // for withdrawals
  amountCrypto?: number;
  currency?: string;
  createdAt: any; // Firestore Timestamp
  status: string;
  note?: string;
  txHash?: string;
  card?: { last4: string; expiry: string };
  bank?: { name: string; number: string; accountName: string };
}

const TransactionsFirebase = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'deposit' | 'withdrawal' | 'crypto'>('all');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  useEffect(() => {
    if (!user?.email) return;

    setLoading(true);

    const q = query(collection(db, 'transactions'), where('userEmail', '==', user.email));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const txs: Transaction[] = snapshot.docs.map(
          (doc: QueryDocumentSnapshot<DocumentData>) => ({
            id: doc.id,
            ...doc.data()
          })
        ) as Transaction[];

        // Sort by createdAt descending
        txs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

        const filteredTxs =
          filter === 'all' ? txs : txs.filter((tx) => tx.type === filter);

        setTransactions(filteredTxs);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching transactions:', err);
        toast.error('Failed to fetch transactions');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.email, filter]);


  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="h-4 w-4 text-success" />;
      case 'withdrawal':
        return <ArrowUpRight className="h-4 w-4 text-red-600" />;
      default:
        return <RefreshCw className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'confirmed':
        return <Badge variant="secondary">Confirmed</Badge>;
      case 'declined':
        return <Badge variant="destructive">Declined</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const exportToCSV = () => {
    if (transactions.length === 0) {
      toast.error('No transactions to export');
      return;
    }

    const headers = ['Date', 'Type', 'Amount', 'Status', 'Note'];
    const csvContent = [
      headers.join(','),
      ...transactions.map((tx) => [
        new Date(tx.createdAt?.seconds * 1000).toLocaleString(),
        tx.type,
        tx.amount_usd ??
          tx.amount ??
          (tx.amountCrypto ? `${tx.amountCrypto} ${tx.currency}` : '-'),
        tx.status,
        tx.note || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Transactions exported successfully');
  };

const formatUSD = (val?: number) => {
  if (val === undefined || val === null) return '-';
  return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 space-y-6">
	        {/* Header */}
	        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
	          <h1 className="text-2xl font-bold">Transaction History</h1>
	
	        {/* Social Links for Members */}
	        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
	          <p className="text-sm font-medium text-primary-foreground">
	            Join our community to stay updated and get support:
	          </p>
	          <div className="flex gap-3">
	            <a href="[WHATSAPP_GROUP_LINK]" target="_blank" rel="noopener noreferrer">
	              <Button variant="success" className="bg-green-500 hover:bg-green-600 text-white">
	                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2"><path d="M12 2C6.477 2 2 6.477 2 12c0 3.31 1.606 6.27 4.08 8.11l-1.08 3.89 4.08-1.08c1.84 2.474 4.79 4.08 8.11 4.08 5.523 0 10-4.477 10-10S17.523 2 12 2zm3.5 14.5c-.21 0-.42-.08-.58-.24l-2.75-2.75c-.16-.16-.24-.37-.24-.58V9.5c0-.55.45-.5.5-.5h1c.55 0 .5.45.5.5v2.25l2.25 2.25c.16.16.24.37.24.58 0 .21-.08.42-.24.58l-.5.5c-.16.16-.37.24-.58.24z" fill="white" stroke="none"/><path d="M12 2C6.477 2 2 6.477 2 12c0 3.31 1.606 6.27 4.08 8.11l-1.08 3.89 4.08-1.08c1.84 2.474 4.79 4.08 8.11 4.08 5.523 0 10-4.477 10-10S17.523 2 12 2zm3.5 14.5c-.21 0-.42-.08-.58-.24l-2.75-2.75c-.16-.16-.24-.37-.24-.58V9.5c0-.55.45-.5.5-.5h1c.55 0 .5.45.5.5v2.25l2.25 2.25c.16.16.24.37.24.58 0 .21-.08.42-.24.58l-.5.5c-.16.16-.37.24-.58.24z" stroke="white" fill="none"/></svg>
	                WhatsApp Group
	              </Button>
	            </a>
	            <a href="[TELEGRAM_GROUP_LINK]" target="_blank" rel="noopener noreferrer">
	              <Button variant="secondary" className="bg-blue-500 hover:bg-blue-600 text-white">
	                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.75 7.25l-5.5 3.5-2.75-1.75c-.16-.1-.36-.12-.54-.05l-2.25.75c-.18.06-.29.24-.29.43v.01c0 .19.11.37.29.43l3.5 1.17c.18.06.38.04.54-.05l6.5-4.17c.16-.1.24-.28.24-.47 0-.19-.08-.37-.24-.47z" fill="white" stroke="none"/><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.75 7.25l-5.5 3.5-2.75-1.75c-.16-.1-.36-.12-.54-.05l-2.25.75c-.18.06-.29.24-.29.43v.01c0 .19.11.37.29.43l3.5 1.17c.18.06.38.04.54-.05l6.5-4.17c.16-.1.24-.28.24-.47 0-.19-.08-.37-.24-.47z" stroke="white" fill="none"/></svg>
	                Telegram Group
	              </Button>
	            </a>
	          </div>
	        </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No transactions found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx) => (
              <Card
                key={tx.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedTx(tx)}
              >
                <CardContent className="flex justify-between items-center p-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-muted rounded-full">
                      {getTransactionIcon(tx.type)}
                    </div>
                    <div>
                      <div className="font-semibold">
                        {tx.type === 'deposit'
                          ? 'Deposit'
                          : tx.type === 'withdrawal'
                          ? 'Withdrawal'
                          : 'Crypto Payment'}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.createdAt?.seconds * 1000).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      {tx.amount_usd
                          ? formatUSD(tx.amount_usd)
                          : tx.amount
                          ? formatUSD(tx.amount)
                          : tx.amountCrypto
                          ? `${tx.amountCrypto} ${tx.currency}`
                          : '-'}
                    </p>
                    <div className="mt-1">{getStatusBadge(tx.status)}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Transaction Modal */}
        {selectedTx && (
          <Dialog open={true} onOpenChange={() => setSelectedTx(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Transaction Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-2 p-4">
                <p>
                  <strong>Type:</strong>{' '}
                  {selectedTx.type === 'deposit'
                    ? 'Deposit'
                    : selectedTx.type === 'withdrawal'
                    ? 'Withdrawal'
                    : 'Crypto Payment'}
                </p>
                <p>
                  <strong>Date:</strong>{' '}
                  {new Date(selectedTx.createdAt?.seconds * 1000).toLocaleString()}
                </p>
                <p>
                  <strong>Amount:</strong>{' '}
                    {selectedTx.amount_usd
                      ? formatUSD(selectedTx.amount_usd)
                      : selectedTx.amount
                      ? formatUSD(selectedTx.amount)
                      : selectedTx.amountCrypto
                      ? `${selectedTx.amountCrypto} ${selectedTx.currency}`
                      : '-'}
                </p>
                <p>
                  <strong>Status:</strong> {selectedTx.status}
                </p>
                {selectedTx.note && (
                  <p>
                    <strong>Note:</strong> {selectedTx.note}
                  </p>
                )}
                {selectedTx.txHash && (
                  <p>
                    <strong>TxHash:</strong> {selectedTx.txHash}
                  </p>
                )}
                {selectedTx.card && (
                  <p>
                    <strong>Card:</strong> **** **** **** {selectedTx.card.last4}
                  </p>
                )}
                {selectedTx.bank && (
                  <p>
                    <strong>Bank:</strong> {selectedTx.bank.name} - {selectedTx.bank.accountName} (
                    {selectedTx.bank.number})
                  </p>
                )}
                <Button
                  variant="outline"
                  className="mt-4 w-full"
                  onClick={() => setSelectedTx(null)}
                >
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Layout>
  );
};

export default TransactionsFirebase;
