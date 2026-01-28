// lib/data/leaderboard.ts
export interface LeaderItem {
  name: string;
  amount: number;
}

export interface LeaderboardData {
  title: string;
  items: LeaderItem[];
}

export const leaderboard: LeaderboardData[] = [
  {
    title: "Top 10 - Hari Ini",
    items: [
      { name: "Vsk**********", amount: 0 },
      { name: "Shy**********", amount: 0 },
      { name: "ana**********", amount: 0 },
      { name: "MON**********", amount: 0 },
      { name: "Hel**********", amount: 0 },
      { name: "YOG**********", amount: 0 },
      { name: "Kev**********", amount: 0 },
      { name: "wah**********", amount: 0 },
      { name: "Jek**********", amount: 0 },
      { name: "suy**********", amount: 0 }
    ]
  },
  {
    title: "Top 10 - Minggu Ini",
    items: [
      { name: "Vsk**********", amount: 0 },
      { name: "Shy**********", amount: 0 },
      { name: "ana**********", amount: 0 },
      { name: "MON**********", amount: 0 },
      { name: "Hel**********", amount: 0 },
      { name: "YOG**********", amount: 0 },
      { name: "Kev**********", amount: 0 },
      { name: "wah**********", amount: 0 },
      { name: "Jek**********", amount: 0 },
      { name: "suy**********", amount: 0 }
    ]
  },
  {
    title: "Top 10 - Bulan Ini",
    items: [
      { name: "Kev**********", amount: 0 },
      { name: "ana**********", amount: 0 },
      { name: "ari**********", amount: 0 },
      { name: "Ale**********", amount: 0 },
      { name: "MON**********", amount: 0 },
      { name: "Suw**********", amount: 0 },
      { name: "Riz**********", amount: 0 },
      { name: "Jek**********", amount: 0 },
      { name: "@gh**********", amount: 0 },
      { name: "Vsk**********", amount: 0 }
    ]
  }
];