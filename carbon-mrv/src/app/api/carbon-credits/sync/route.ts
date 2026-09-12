import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { event, creditId, parcelId, amount, ownerWallet, txHash, blockNumber, reason, vintage } = body;

    console.log(`[ON-CHAIN SYNC] Processing event '${event}' for Credit #${creditId} (Tx: ${txHash})`);

    if (event === 'CreditIssued') {
      // Find or create parcel if parcelId passed
      let targetParcelId = parcelId;
      if (!targetParcelId) {
        const firstParcel = await prisma.landParcel.findFirst();
        targetParcelId = firstParcel?.id || 'default-parcel';
      }

      const credit = await prisma.carbonCredit.upsert({
        where: { onchainCreditId: String(creditId) },
        update: {
          status: 'ISSUED',
          ownerWalletAddress: ownerWallet,
          blockchainTxHash: txHash
        },
        create: {
          onchainCreditId: String(creditId),
          parcelId: targetParcelId,
          amount: Number(amount) || 100,
          vintage: Number(vintage) || new Date().getFullYear(),
          status: 'ISSUED',
          ownerWalletAddress: ownerWallet,
          blockchainTxHash: txHash,
          mintedAt: new Date()
        }
      });

      // Write Transaction record
      await prisma.transaction.create({
        data: {
          type: 'MINT',
          creditId: credit.id,
          parcelId: targetParcelId,
          amount: Number(amount) || 100,
          currency: 'ETH',
          txHash: txHash || `tx-${Date.now()}`,
          blockNumber: blockNumber ? Number(blockNumber) : null,
          status: 'COMPLETED'
        }
      });

      return NextResponse.json({ success: true, event, creditId: credit.id });
    }

    if (event === 'CreditRetired') {
      const credit = await prisma.carbonCredit.findUnique({
        where: { onchainCreditId: String(creditId) }
      });

      if (credit) {
        await prisma.carbonCredit.update({
          where: { id: credit.id },
          data: {
            status: 'RETIRED',
            retiredAt: new Date(),
            retiredReason: reason || 'Corporate ESG Net-Zero Retirement'
          }
        });

        await prisma.transaction.create({
          data: {
            type: 'RETIRE',
            creditId: credit.id,
            parcelId: credit.parcelId,
            amount: credit.amount,
            currency: 'ETH',
            txHash: txHash || `retire-tx-${Date.now()}`,
            blockNumber: blockNumber ? Number(blockNumber) : null,
            status: 'COMPLETED'
          }
        });
      }

      return NextResponse.json({ success: true, event, creditId });
    }

    return NextResponse.json({ success: true, message: 'Event acknowledged', event });
  } catch (error: any) {
    console.error('[ON-CHAIN SYNC ERROR]:', error);
    return NextResponse.json({ error: error.message || 'Sync failed' }, { status: 500 });
  }
}
