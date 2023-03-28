import {
  // ARBITRUM,
  // ARBITRUM_TESTNET,
  AVALANCHE,
  AVALANCHE_TESTNET,
  // MAINNET,
  // TESTNET
} from "./chains";

export const XGMT_EXCLUDED_ACCOUNTS = [
  "0x330eef6b9b1ea6edd620c825c9919dc8b611d5d5",
  "0xd9b1c23411adbb984b1c4be515fafc47a12898b2",
  "0xa633158288520807f91ccc98aa58e0ea43acb400",
  "0xffd0a93b4362052a336a7b22494f1b77018dd34b",
];

const CONTRACTS = {
  // [MAINNET]: {
  //   // bsc mainnet
  //   Treasury: "0xa44E7252a0C137748F523F112644042E5987FfC7",
  //   BUSD: "0xe9e7cea3dedca5984780bafc599bd69add087d56",
  //   GMT: "0x99e92123eB77Bc8f999316f622e5222498438784",
  //   Vault: "0xc73A8DcAc88498FD4b4B1b2AaA37b0a2614Ff67B",
  //   Router: "0xD46B23D042E976F8666F554E928e0Dc7478a8E1f",
  //   Reader: "0x087A618fD25c92B61254DBe37b09E5E8065FeaE7",
  //   AmmFactory: "0xBCfCcbde45cE874adCB698cC183deBcF17952812",
  //   AmmFactoryV2: "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73",
  //   OrderBook: "0x1111111111111111111111111111111111111111",
  //   OrderBookReader: "0x1111111111111111111111111111111111111111",
  //   XdxMigrator: "0xDEF2af818514c1Ca1A9bBe2a4D45E28f260063f9",
  //   USDG: "0x85E76cbf4893c1fbcB34dCF1239A91CE2A4CF5a7",
  //   NATIVE_TOKEN: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  //   XGMT: "0xe304ff0983922787Fd84BC9170CD21bF78B16B10",
  //   GMT_USDG_PAIR: "0xa41e57459f09a126F358E118b693789d088eA8A0",
  //   XGMT_USDG_PAIR: "0x0b622208fc0691C2486A3AE6B7C875b4A174b317",
  //   GMT_USDG_FARM: "0x3E8B08876c791dC880ADC8f965A02e53Bb9C0422",
  //   XGMT_USDG_FARM: "0x68D7ee2A16AB7c0Ee1D670BECd144166d2Ae0759",
  //   USDG_YIELD_TRACKER: "0x0EF0Cf825B8e9F89A43FfD392664131cFB4cfA89",
  //   XGMT_YIELD_TRACKER: "0x82A012A9b3003b18B6bCd6052cbbef7Fa4892e80",
  //   GMT_USDG_FARM_TRACKER_XGMT: "0x08FAb024BEfcb6068847726b2eccEAd18b6c23Cd",
  //   GMT_USDG_FARM_TRACKER_NATIVE: "0xd8E26637B34B2487Cad1f91808878a391134C5c2",
  //   XGMT_USDG_FARM_TRACKER_XGMT: "0x026A02F7F26C1AFccb9Cba7C4df3Dc810F4e92e8",
  //   XGMT_USDG_FARM_TRACKER_NATIVE: "0x22458CEbD14a9679b2880147d08CA1ce5aa40E84",
  //   AUTO: "0xa184088a740c695E156F91f5cC086a06bb78b827",
  //   AUTO_USDG_PAIR: "0x0523FD5C53ea5419B4DAF656BC1b157dDFE3ce50",
  //   AUTO_USDG_FARM: "0xE6958298328D02051769282628a3b4178D0F3A47",
  //   AUTO_USDG_FARM_TRACKER_XGMT: "0x093b8be41c1A30704De84a9521632f9a139c08bd",
  //   AUTO_USDG_FARM_TRACKER_NATIVE: "0x23ed48E5dce3acC7704d0ce275B7b9a0e346b63A",
  //   GMT_XDX_IOU: "0x47052469970C2484729875CC9E2dd2683fcE71fb",
  //   XGMT_XDX_IOU: "0xeB3733DFe3b68C9d26898De2493A3Bb59FDb4A7B",
  //   GMT_USDG_XDX_IOU: "0x481312655F81b5e249780A6a49735335BF6Ca7f4",
  //   XGMT_USDG_XDX_IOU: "0x8095F1A92526C304623483018aA28cC6E62EB1e1",
  // },
  // [TESTNET]: {
  //   // bsc testnet
  //   Vault: "0x1B183979a5cd95FAF392c8002dbF0D5A1C687D9a",
  //   Router: "0x10800f683aa564534497a5b67F45bE3556a955AB",
  //   Reader: "0x98D4742F1B6a821bae672Cd8721283b91996E454",
  //   AmmFactory: "0x6725f303b657a9451d8ba641348b6761a6cc7a17",
  //   AmmFactoryV2: "0x1111111111111111111111111111111111111111",
  //   OrderBook: "0x9afD7B4f0b58d65F6b2978D3581383a06b2ac4e9",
  //   OrderBookReader: "0x0713562970D1A802Fa3FeB1D15F9809943982Ea9",
  //   XdxMigrator: "0xDEF2af818514c1Ca1A9bBe2a4D45E28f260063f9",
  //   USDG: "0x2D549bdBf810523fe9cd660cC35fE05f0FcAa028",
  //   GMT: "0xedba0360a44f885ed390fad01aa34d00d2532817",
  //   NATIVE_TOKEN: "0x612777Eea37a44F7a95E3B101C39e1E2695fa6C2",
  //   XGMT: "0x28cba798eca1a3128ffd1b734afb93870f22e613",
  //   GMT_USDG_PAIR: "0xe0b0a315746f51932de033ab27223d85114c6b85",
  //   XGMT_USDG_PAIR: "0x0108de1eea192ce8448080c3d90a1560cf643fa0",
  //   GMT_USDG_FARM: "0xbe3cB06CE03cA692b77902040479572Ba8D01b0B",
  //   XGMT_USDG_FARM: "0x138E92195D4B99CE3618092D3F9FA830d9A69B4b",
  //   USDG_YIELD_TRACKER: "0x62B49Bc3bF252a5DB26D88ccc7E61119e3179B4f",
  //   XGMT_YIELD_TRACKER: "0x5F235A582e0993eE9466FeEb8F7B4682993a57d0",
  //   GMT_USDG_FARM_TRACKER_XGMT: "0x4f8EE3aE1152422cbCaFACd4e3041ba2D859913C",
  //   GMT_USDG_FARM_TRACKER_NATIVE: "0xd691B26E544Fe370f39A776964c991363aF72e56",
  //   XGMT_USDG_FARM_TRACKER_XGMT: "0xfd5617CFB082Ba9bcD62d654603972AE312bC695",
  //   XGMT_USDG_FARM_TRACKER_NATIVE: "0x0354387DD85b7D8aaD1611B3D167A384d6AE0c28",
  //   GMT_XDX_IOU: "0x47052469970C2484729875CC9E2dd2683fcE71fb",
  //   XGMT_XDX_IOU: "0xeB3733DFe3b68C9d26898De2493A3Bb59FDb4A7B",
  //   GMT_USDG_XDX_IOU: "0x481312655F81b5e249780A6a49735335BF6Ca7f4",
  //   XGMT_USDG_XDX_IOU: "0x8095F1A92526C304623483018aA28cC6E62EB1e1",
  // },
  // [ARBITRUM_TESTNET]: {
  //   // arbitrum testnet
  //   Vault: "0xBc9BC47A7aB63db1E0030dC7B60DDcDe29CF4Ffb",
  //   Router: "0xe0d4662cdfa2d71477A7DF367d5541421FAC2547",
  //   VaultReader: "0xFc371E380262536c819D12B9569106bf032cC41c",
  //   Reader: "0x2E093c70E3A7E4919611d2555dFd8D697d2fC0a1",
  //   XlxManager: "0xD875d99E09118d2Be80579b9d23E83469077b498",
  //   RewardRouter: "0x0000000000000000000000000000000000000000",
  //   RewardReader: "0x0000000000000000000000000000000000000000",
  //   NATIVE_TOKEN: "0xB47e6A5f8b33b3F17603C83a0535A9dcD7E32681",
  //   XLX: "0xb4f81Fa74e06b5f762A104e47276BA9b2929cb27",
  //   XDX: "0x0000000000000000000000000000000000000000",
  //   EsXDX: "0x0000000000000000000000000000000000000000",
  //   BN_XDX: "0x0000000000000000000000000000000000000000",
  //   USDG: "0xBCDCaF67193Bf5C57be08623278fCB69f4cA9e68",
  //   ES_XDX_IOU: "0x0000000000000000000000000000000000000000",
  //   StakedXdxTracker: "0x0000000000000000000000000000000000000000",
  //   BonusXdxTracker: "0x0000000000000000000000000000000000000000",
  //   FeeXdxTracker: "0x0000000000000000000000000000000000000000",
  //   StakedXlxTracker: "0x0000000000000000000000000000000000000000",
  //   FeeXlxTracker: "0x0000000000000000000000000000000000000000",

  //   StakedXdxDistributor: "0x0000000000000000000000000000000000000000",
  //   StakedXlxDistributor: "0x0000000000000000000000000000000000000000",

  //   XdxVester: "0x0000000000000000000000000000000000000000",
  //   XlxVester: "0x0000000000000000000000000000000000000000",

  //   OrderBook: "0xebD147E5136879520dDaDf1cA8FBa48050EFf016",
  //   OrderBookReader: "0xC492c8d82DC576Ad870707bb40EDb63E2026111E",

  //   PositionRouter: "0xB4bB78cd12B097603e2b55D2556c09C17a5815F8",
  //   PositionManager: "0x168aDa266c2f10C1F37973B213d6178551030e44",

  //   // UniswapGmxEthPool: "0x80A9ae39310abf666A87C743d6ebBD0E8C42158E",
  //   ReferralStorage: "0x0000000000000000000000000000000000000000",
  //   ReferralReader: "0x0000000000000000000000000000000000000000",
  // },
  // [ARBITRUM]: {
  //   // arbitrum mainnet
  //   Vault: "0x489ee077994B6658eAfA855C308275EAd8097C4A",
  //   Router: "0xaBBc5F99639c9B6bCb58544ddf04EFA6802F4064",
  //   VaultReader: "0xfebB9f4CAC4cD523598fE1C5771181440143F24A",
  //   Reader: "0x2b43c90D1B727cEe1Df34925bcd5Ace52Ec37694",
  //   XlxManager: "0x321F653eED006AD1C29D174e17d96351BDe22649",
  //   RewardRouter: "0xA906F338CB21815cBc4Bc87ace9e68c87eF8d8F1",
  //   RewardReader: "0x8BFb8e82Ee4569aee78D03235ff465Bd436D40E0",
  //   NATIVE_TOKEN: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
  //   XLX: "0x4277f8F2c384827B5273592FF7CeBd9f2C1ac258",
  //   XDX: "0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a",
  //   EsXDX: "0xf42Ae1D54fd613C9bb14810b0588FaAa09a426cA",
  //   BN_XDX: "0x35247165119B69A40edD5304969560D0ef486921",
  //   USDG: "0x45096e7aA921f27590f8F19e457794EB09678141",
  //   ES_XDX_IOU: "0x6260101218eC4cCfFF1b778936C6f2400f95A954",
  //   StakedXdxTracker: "0x908C4D94D34924765f1eDc22A1DD098397c59dD4",
  //   BonusXdxTracker: "0x4d268a7d4C16ceB5a606c173Bd974984343fea13",
  //   FeeXdxTracker: "0xd2D1162512F927a7e282Ef43a362659E4F2a728F",
  //   StakedXlxTracker: "0x1aDDD80E6039594eE970E5872D247bf0414C8903",
  //   FeeXlxTracker: "0x4e971a87900b931fF39d1Aad67697F49835400b6",

  //   StakedXdxDistributor: "0x23208B91A98c7C1CD9FE63085BFf68311494F193",
  //   StakedXlxDistributor: "0x60519b48ec4183a61ca2B8e37869E675FD203b34",

  //   XdxVester: "0x199070DDfd1CFb69173aa2F7e20906F26B363004",
  //   XlxVester: "0xA75287d2f8b217273E7FCD7E86eF07D33972042E",

  //   OrderBook: "0x09f77E8A13De9a35a7231028187e9fD5DB8a2ACB",
  //   OrderExecutor: "0x7257ac5D0a0aaC04AA7bA2AC0A6Eb742E332c3fB",
  //   OrderBookReader: "0xa27C20A7CF0e1C68C0460706bB674f98F362Bc21",

  //   PositionRouter: "0x3D6bA331e3D9702C5e8A8d254e5d8a285F223aba",
  //   PositionManager: "0x87a4088Bd721F83b6c2E5102e2FA47022Cb1c831",

  //   UniswapXdxEthPool: "0x80A9ae39310abf666A87C743d6ebBD0E8C42158E",
  //   ReferralStorage: "0xe6fab3f0c7199b0d34d7fbe83394fc0e0d06e99d",
  //   ReferralReader: "0x8Aa382760BCdCe8644C33e6C2D52f6304A76F5c8",
  // },
  [AVALANCHE]: {
    // avalanche
    Vault: "0x9ab2De34A33fB459b538c43f251eB825645e8595",
    Router: "0x5F719c2F1095F7B9fc68a68e35B51194f4b6abe8",
    VaultReader: "0x66eC8fc33A26feAEAe156afA3Cb46923651F6f0D",
    Reader: "0x2eFEE1950ededC65De687b40Fd30a7B5f4544aBd",
    XlxManager: "0xe1ae4d4b06A5Fe1fc288f6B4CD72f9F8323B107F",
    RewardRouter: "0x82147C5A7E850eA4E28155DF107F2590fD4ba327",
    RewardReader: "0x04Fc11Bd28763872d143637a7c768bD96E44c1b6",
    NATIVE_TOKEN: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
    XLX: "0x01234181085565ed162a948b6a5e88758CD7c7b8",
    XDX: "0x62edc0692BD897D2295872a9FFCac5425011c661",
    EsXDX: "0xFf1489227BbAAC61a9209A08929E4c2a526DdD17",
    BN_XDX: "0x8087a341D32D445d9aC8aCc9c14F5781E04A26d2",
    USDG: "0xc0253c3cC6aa5Ab407b5795a04c28fB063273894",
    ES_XDX_IOU: "0x6260101218eC4cCfFF1b778936C6f2400f95A954", // placeholder address

    StakedXdxTracker: "0x2bD10f8E93B3669b6d42E74eEedC65dd1B0a1342",
    BonusXdxTracker: "0x908C4D94D34924765f1eDc22A1DD098397c59dD4",
    FeeXdxTracker: "0x4d268a7d4C16ceB5a606c173Bd974984343fea13",
    StakedXlxTracker: "0x9e295B5B976a184B14aD8cd72413aD846C299660",
    FeeXlxTracker: "0xd2D1162512F927a7e282Ef43a362659E4F2a728F",

    StakedXdxDistributor: "0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a",
    StakedXlxDistributor: "0xDd593Cf40734199afc9207eBe9ffF23dA4Bf7720",

    XdxVester: "0x472361d3cA5F49c8E633FB50385BfaD1e018b445",
    XlxVester: "0x62331A7Bd1dfB3A7642B7db50B5509E57CA3154A",

    OrderBook: "0x4296e307f108B2f583FF2F7B7270ee7831574Ae5",
    OrderExecutor: "0x4296e307f108B2f583FF2F7B7270ee7831574Ae5",
    OrderBookReader: "0xccFE3E576f8145403d3ce8f3c2f6519Dae40683B",

    PositionRouter: "0x195256074192170d1530527abC9943759c7167d8",
    PositionManager: "0xF2ec2e52c3b5F8b8bd5A3f93945d05628A233216",

    TraderJoeXdxAvaxPool: "0x0c91a070f862666bbcce281346be45766d874d98",
    ReferralStorage: "0x827ed045002ecdabeb6e2b0d1604cf5fc3d322f8",
    ReferralReader: "0x505Ce16D3017be7D76a7C2631C0590E71A975083",
  },
  [AVALANCHE_TESTNET]: {
    // avalanche-test
    TraderJoeXdxAvaxPool: "0x62199d761d672cE4cE88E1307CF5E0D0624E81E5",

    NATIVE_TOKEN: "0x90D2753010931972e7cb30b2fBFD1194E015104e",

    OrderExecutor: "0xcf95E64cdc75629eb375598f6344080265bE62ca",

    BN_XDX: "0xd3736256485EAB55aC10d7B94a4d590d6B5bf5B1",
    BonusXdxTracker: "0x58D0879A47f93E53D59559392eaa34a740ABD8ba",
    EsXDX: "0x88e85DA84Acfe4113472255f0bE7b5bC385369FF",
    ES_XDX_IOU: "0x0CdF1E8B4D833036f5b6a61a75463d1F368a26C8",
    FeeXdxTracker: "0x8CdB7aA0F158C2D171656B8cBbA31a5D5582bf28",
    FeeXlxTracker: "0xe00043B6C5DAE37aaf6Af1dbe531E57FEe5Da8A0",
    OrderBook: "0xE597b33311C419726Ba78594d1B69De043FaEb81",
    OrderBookReader: "0x0c188B2991a1556b4a48A4d746B5BB97baF5c92D",
    PositionManager: "0x4058ED3951770436984723B0C2C9C1DfC37b9017",
    PositionRouter: "0x10be6Df2c1B4228e594dC733515711f1a91344Dc",
    Reader: "0x49291e48e690053e8Ef23aE3e79b14e560E82Ed9",
    ReferralReader: "0x82FC5d4be5bE6aAee85D6bed65bDAEc89C709075",
    ReferralStorage: "0xBBDAFA611d88BB1666565f03b9b3d62A82A2e714",
    RewardReader: "0x794799510461a6fe02f4022b5c07A6fe002Ba18b",
    RewardRouter: "0x85F1D5E0d7b275e765e2D7Ed318DcC0DF40093c2",
    Router: "0xACB2e1a98244eB6e7f0d083E966cF8B3Ec6481DE",
    StakedXdxDistributor: "0xA1D23d14276c0940C8bb783BB66067a154020C2B",
    StakedXdxTracker: "0x20df8ff0Cfc704c2160b925344E8f4eA1585B892",
    StakedXlxDistributor: "0x134b7F32D5a18829280aCa12d7D41c4AFE15bFcc",
    StakedXlxTracker: "0x53c657723852b01ca9FD798A94Dc1749821b8553",
    USDG: "0x2D91f3755E286a1c9d9ddfE33a0974da61D10E2a",
    Vault: "0x67B200de87Dc9B67310417c8B23BeE034F69ba41",
    VaultReader: "0x880e6BF1e71d31984F2c3d65e600d4e90B20B0E4",
    XDX: "0x256A8Af2a328781eC08ebE16949B4AeBA8c90901",
    XdxVester: "0x3215540a491f7a126aA2C4F0b479e610D9FB285a",
    XLX: "0xA288Fb6a088816Eb2E71E99C4c839d422f75297A",
    XlxManager: "0x20F9cabD6f4cda67A89ACD670778b1bC4A2E0513",
    XlxVester: "0x7A8067E45C8d76Bc40D2d8B3237010a9A7b04342",
  },
};

export function getContract(chainId: number, name: string): string {
  if (!CONTRACTS[chainId]) {
    throw new Error(`Unknown chainId ${chainId}`);
  }

  if (!CONTRACTS[chainId][name]) {
    throw new Error(`Unknown contract "${name}" for chainId ${chainId}`);
  }

  return CONTRACTS[chainId][name];
}
