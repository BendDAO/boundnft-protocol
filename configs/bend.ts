import { IBendConfiguration, eEthereumNetwork } from '../helpers/types';

import { CommonsConfig } from './commons';

// ----------------
// POOL--SPECIFIC PARAMS
// ----------------

export const BendConfig: IBendConfiguration = {
  ...CommonsConfig,
  NftsAssets: {
    [eEthereumNetwork.hardhat]: {},
    [eEthereumNetwork.coverage]: {},
    [eEthereumNetwork.localhost]: {
      WPUNKS: '0xB4B4ead1A260F1572b88b9D8ABa5A152D166c104',
      BAYC: '0xa05ffF82bcC0C599984b0839218DC6ee9328d1Fb',
      DOODLE: '0x025FE4760c6f14dE878C22cEb09A3235F16dAe53',
      COOL: '0xb2f97A3c2E48cd368901657e31Faaa93035CE390',
      MEEBITS: '0x5a60c5d89A0A0e08ae0CAe73453e3AcC9C335847',
      MAYC: '0x4e07D87De1CF586D51C3665e6a4d36eB9d99a457',
    },
    [eEthereumNetwork.rinkeby]: {
      WPUNKS: '0x74e4418A41169Fb951Ca886976ccd8b36968c4Ab',
      BAYC: '0x588D1a07ccdb224cB28dCd8E3dD46E16B3a72b5e',
      DOODLE: '0x10cACFfBf3Cdcfb365FDdC4795079417768BaA74',
      COOL: '0x1F912E9b691858052196F11Aff9d8B6f89951AbD',
      MEEBITS: '0xA1BaBAB6d6cf1DC9C87Be22D1d5142CF905016a4',
      MAYC: '0x9C235dF4053a415f028b8386ed13ae8162843a6e',
      WOW: '0xdfC14f7A536944467834EF7ce7b05a9a79BCDFaD',
      CLONEX: '0xdd04ba0254972CC736F6966c496B4941f02BD816',
      AZUKI: '0x050Cd8082B86c5F469e0ba72ef4400E5E454886D',
      KONGZ: '0x8fC9F05f7B21346FD5E9Fa3C963d3941eb861940',
    },
    [eEthereumNetwork.main]: {
      WPUNKS: '0xb7F7F6C52F2e2fdb1963Eab30438024864c313F6',
      BAYC: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
      DOODLE: '0x8a90CAb2b38dba80c64b7734e58Ee1dB38B8992e',
      COOL: '0x1A92f7381B9F03921564a437210bB9396471050C',
      MEEBITS: '0x7Bd29408f11D2bFC23c34f18275bBf23bB716Bc7',
      MAYC: '0x60E4d786628Fea6478F785A6d7e704777c86a7c6',
      WOW: '0xe785e82358879f061bc3dcac6f0444462d4b5330',
      CLONEX: '0x49cf6f5d44e70224e2e23fdcdd2c053f30ada28b',
      AZUKI: '0xed5af388653567af2f388e6224dc7c4b3241c544',
      KONGZ: '0x57a204aa1042f6e66dd7730813f4024114d74f37',
    },
  },
};

export default BendConfig;
