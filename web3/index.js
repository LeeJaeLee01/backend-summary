import { Keypair } from '@solana/web3.js';
import { Wallet } from 'ethers';

const main = async () => {
  const keypair = Keypair.generate();

  console.log('Public Key:', keypair.publicKey.toBase58());

  console.log('Private Key:', keypair.secretKey); // Uint8Array

  const base64PrivateKey = Buffer.from(keypair.secretKey).toString('base64');
  console.log('Private Key (Base64):', base64PrivateKey);

  const wallet = Wallet.createRandom();

  console.log('Address:', wallet.address);
  console.log('Private Key:', wallet.privateKey);
};

main();

// 2TZmFJgZHvz9fwUg3YoCeheUwwthvgb8Ved2Tb8gG7qm
// qDCQUNFKhtlTaQ3/uCx5njkhKI6lEW8lb7u557iy/psVqdVDe0ZDG7RxVnASplkw8MfzsgckxWxiDlBpmC4JjA==
