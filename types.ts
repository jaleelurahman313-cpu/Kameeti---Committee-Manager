
export enum ShareType {
  FULL = 'Full',
  HALF = 'Half',
}

export interface Committee {
  id: string;
  name: string;
  monthlyAmount: number;
  durationMonths: number;
  startDate: string; // YYYY-MM-DD
  allowHalfShare: boolean;
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  shareType: ShareType;
  committeeId: string;
  pairId?: string; // Links two half-share members
}

export interface Payment {
  id: string;
  committeeId: string;
  monthYear: string; // YYYY-MM
  memberIdOrPairId: string;
  amount: number;
  datePaid: string; // YYYY-MM-DD
  lateDays: number;
  demeritPoints: number;
}

export interface Draw {
  id: string;
  committeeId: string;
  monthYear: string; // YYYY-MM
  winnerIdOrPairId: string;
  payoutDate: string; // YYYY-MM-DD
  amount: number;
}
