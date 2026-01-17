export const productDetail = {
  "mobile-legends": {
    slug: "mobile-legends",
    title: "Mobile Legends",
    category: "Games",
    type: "GAME_TOPUP",

    canvas: "/img/img-2.webp",

    image: "/img/ffcover.webp",

    description:
      "Top up Diamond Mobile Legends resmi Moonton, proses cepat dan aman.",

    inputFields: [
      {
        name: "userId",
        label: "ID",
        required: true,
        dialog: {
          title: "Cara Menemukan User ID",
          content: "Buka game → klik avatar → salin User ID di profile.",
        },
      },
      { name: "serverId", label: "Server", required: true },
    ],

    // items: Array<{
    //   id: string;
    //   name: string;
    //   price: number;
    //   basePrice: number;
    //   skuCode: string;
    // }>;
    items: [
      {
        id: "1",
        name: "Weekly Diamond Pass",
        price: 24422,
        basePrice: 24422,
        skuCode: "1234567890",
      },
    ],

    denominations: [
      {
        id: 1,
        name: "Weekly Diamond Pass",
        price: 24422,
        instant: true,
      },
      {
        id: 2,
        name: "2x Weekly Diamond Pass",
        price: 48844,
        oldPrice: 56000,
        discount: 13,
        fast: true,
      },
      {
        id: 3,
        name: "3x Weekly Diamond Pass",
        price: 73266,
        oldPrice: 84000,
        discount: 13,
        fast: true,
      },
      {
        id: 4,
        name: "4x Weekly Diamond Pass",
        price: 111092,
        instant: true,
      },
      {
        id: 5,
        name: "5x Weekly Diamond Pass",
        price: 138865,
        instant: true,
      },
    ],
  },

  "roblox-via-login": {
    slug: "roblox-via-login",
    title: "Roblox Via Login",
    category: "Roblox",
    type: "ACCOUNT_LOGIN",

    canvas: "/img/ffcover.webp",

    image: "/img/ffcover.webp",

    description: "Top up Roblox via login akun. Estimasi pengerjaan 1-3 hari.",

    inputFields: [
      {
        name: "userId",
        label: "Username Roblox",
        required: true,
        dialog: {
          title: "Cara Menemukan User ID",
          content: "Buka game → klik avatar → salin User ID di profile.",
        },
      },
      { name: "password", label: "Password Roblox", required: true },
    ],

    denominations: [
      {
        id: "rbx-400",
        name: "400 Robux",
        price: 75000,
        isActive: true,
      },
      {
        id: "rbx-800",
        name: "800 Robux",
        price: 145000,
        isActive: true,
      },
    ],
  },
};
