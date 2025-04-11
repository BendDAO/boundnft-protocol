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
      MAYC: '0x4e07D87De1CF586D51C3665e6a4d36eB9d99a457',
    },
    [eEthereumNetwork.sepolia]: {
      WPUNKS: '0x647dc527Bd7dFEE4DD468cE6fC62FC50fa42BD8b',
      BAYC: '0xE15A78992dd4a9d6833eA7C9643650d3b0a2eD2B',
      DOODLE: '0x28cCcd47Aa3FFb42D77e395Fba7cdAcCeA884d5A',
      SDOODLE: '0xd51fC3376F6D7C86D8639d5ec238327ab0EE69e3',
      MAYC: '0xD0ff8ae7E3D9591605505D3db9C33b96c4809CDC',
      CLONEX: '0x3BD0A71D39E67fc49D5A6645550f2bc95F5cb398',
      AZUKI: '0x292F693048208184320C01e0C223D624268e5EE7',
    },
    [eEthereumNetwork.goerli]: {
      WPUNKS: '0xbeD1e8B430FD512b82A18cb121a8442F3889E505',
      BAYC: '0x30d190032A34d6151073a7DB8793c01Aa05987ec',
      DOODLE: '0x317e19Fe3DB508f1A45421379FBbd7564d0259c0',
      SDOODLE: '0x82C348Ef21629f5aaeE5280ef3f4389Ad82F8799',
      MAYC: '0x15596C27900e12A9cfC301248E21888751f61c19',
      CLONEX: '0x578bc56a145A3464Adc44635C23501653138c946',
      AZUKI: '0x708c48AaA4Ea8B9E46Bd8DEb6470986842b9a16d',
    },
    [eEthereumNetwork.rinkeby]: {
      WPUNKS: '0x74e4418A41169Fb951Ca886976ccd8b36968c4Ab',
      BAYC: '0x588D1a07ccdb224cB28dCd8E3dD46E16B3a72b5e',
      DOODLE: '0x10cACFfBf3Cdcfb365FDdC4795079417768BaA74',
      MAYC: '0x9C235dF4053a415f028b8386ed13ae8162843a6e',
      CLONEX: '0xdd04ba0254972CC736F6966c496B4941f02BD816',
      AZUKI: '0x050Cd8082B86c5F469e0ba72ef4400E5E454886D',
    },
    [eEthereumNetwork.main]: {
      WPUNKS: '0xb7F7F6C52F2e2fdb1963Eab30438024864c313F6',
      BAYC: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
      DOODLE: '0x8a90cab2b38dba80c64b7734e58ee1db38b8992e',
      SDOODLE: '0x620b70123fb810f6c653da7644b5dd0b6312e4d8',
      MAYC: '0x60e4d786628fea6478f785a6d7e704777c86a7c6',
      CLONEX: '0x49cf6f5d44e70224e2e23fdcdd2c053f30ada28b',
      AZUKI: '0xed5af388653567af2f388e6224dc7c4b3241c544',
    },
    [eEthereumNetwork.apechain]: {
      WPUNKS: '',
      BAYC: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
      DOODLE: '',
      SDOODLE: '',
      MAYC: '',
      CLONEX: '',
      AZUKI: '',
    },
    [eEthereumNetwork.curtis]: {
      WPUNKS: '',
      BAYC: '0xE15A78992dd4a9d6833eA7C9643650d3b0a2eD2B',
      DOODLE: '',
      SDOODLE: '',
      MAYC: '0x28cCcd47Aa3FFb42D77e395Fba7cdAcCeA884d5A',
      CLONEX: '',
      AZUKI: '',
    },
  },
};

export default BendConfig;
